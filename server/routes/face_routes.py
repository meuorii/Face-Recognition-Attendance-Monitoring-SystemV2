from flask import Blueprint, jsonify, request, current_app
from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from pymongo import ReturnDocument
import base64
import numpy as np
import requests
import time
import traceback
from bson import ObjectId

from config.db_config import db
from models.face_db_model import (
    save_face_data,
    get_student_by_id,
    save_face_data_for_instructor
)

# CONFIGURATION
face_bp = Blueprint("face_bp", __name__)
executor = ThreadPoolExecutor(max_workers=4)
limiter = Limiter(key_func=get_remote_address, default_limits=[])

# Hugging Face microservice endpoint
HF_AI_URL = "http://127.0.0.1:7860"
students_collection = db["students"]
classes_collection = db["classes"]
attendance_collection = db["attendance_logs"]
instructors_collection = db['instructors']

# Philippine timezone
PH_TZ = timezone(timedelta(hours=8))
CACHE_TTL = 300 

SESSION_INSTRUCTOR_DETECTED = {}
SESSION_LOGGED_STUDENTS = {}
FACES_CACHE = {}
FACES_CACHE_TTL = 120 
CLASS_CACHE = {}
CLASS_CACHE_TTL = 60
STUDENT_CACHE = {}
STUDENT_CACHE_TTL = 300

# Helper: Cache Management
def get_cached_faces(class_id):
    now = time.time()
    entry = FACES_CACHE.get(class_id)
    
    if entry and (now - entry["ts"]) < FACES_CACHE_TTL:
        print(f"Cache hit for class {class_id} ({len(entry['data'])} embeddings)")
        return entry["data"]

    # Cache miss — fetch from DB
    cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    if not cls:
        print("Class not found for embeddings.")
        return []

    registered = []
    student_ids = [s["student_id"] for s in cls.get("students", [])]

    if student_ids:
        students = list(students_collection.find(
            {"student_id": {"$in": student_ids}, "embeddings": {"$exists": True}}
        ))
        for s in students:
            sid = s.get("student_id")
            for angle, vec in s.get("embeddings", {}).items():
                if isinstance(vec, list) and len(vec) == 512:
                    registered.append({
                        "user_id": sid,
                        "embedding": vec,
                        "angle": angle,
                        "is_instructor": False
                    })

    instructor_id = cls.get("instructor_id")
    if instructor_id:
        instructor = instructors_collection.find_one(
            {"instructor_id": instructor_id, "embeddings": {"$exists": True}}
        )
        if instructor:
            for angle, vec in instructor.get("embeddings", {}).items():
                if isinstance(vec, list) and len(vec) == 512:
                    registered.append({
                        "user_id": instructor_id,
                        "embedding": vec,
                        "angle": angle,
                        "is_instructor": True
                    })

    FACES_CACHE[class_id] = {"data": registered, "ts": now}
    print(f"Cache refreshed: {len(registered)} embeddings for class {class_id}")
    return registered

def invalidate_faces_cache(class_id):
    FACES_CACHE.pop(class_id, None)

def get_cached_class(class_id):
    now = time.time()
    entry = CLASS_CACHE.get(class_id)
    if entry and (now - entry["ts"]) < CLASS_CACHE_TTL:
        return entry["data"]
    try:
        cls = classes_collection.find_one({"_id": ObjectId(class_id)})
    except Exception:
        return None
    if cls:
        CLASS_CACHE[class_id] = {"data": cls, "ts": now}
    return cls

def get_student_cached(user_id):
    now = time.time()
    entry = STUDENT_CACHE.get(user_id)
    if entry and (now - entry["ts"]) < STUDENT_CACHE_TTL:
        return entry["data"]
    student = get_student_by_id(user_id)  # your existing imported function
    if student:
        STUDENT_CACHE[user_id] = {"data": student, "ts": now}
    return student

# REGISTER FACE
@face_bp.route("/register-auto", methods=["POST"])
def register_auto():
    start_time = time.time()
    try:
        data = request.get_json(silent=True) or {}
        student_id = data.get("student_id")

        if not student_id or not data.get("image"):
            return jsonify({
                "success": False,
                "error": "Missing student_id or image"
            }), 400

        course = (data.get("Course") or data.get("course") or "").strip().upper() or "UNKNOWN"
        data["course"] = course
        current_app.logger.info(f"Preserved course for {student_id}: {course}")

        hf_start = time.time()
        res = requests.post(f"{HF_AI_URL}/register-auto", json=data, timeout=60)
        hf_elapsed = time.time() - hf_start

        if res.status_code != 200:
            current_app.logger.warning(f"HF service error {res.status_code}: {res.text}")
            return jsonify({
                "success": False,
                "error": "Hugging Face service error"
            }), res.status_code

        hf_result = res.json()

        if not hf_result.get("success"):
            error_msg = hf_result.get("error") or hf_result.get("warning") or "No embeddings returned"
            current_app.logger.warning(f"HF returned failure for {student_id}: {error_msg}")
            return jsonify({
                "success": False,
                "error": error_msg,
                "angle": hf_result.get("angle", "unknown"),
            }), 200

        angle = hf_result.get("angle", "unknown")
        embeddings = hf_result.get("embeddings", {})

        if not embeddings or angle not in embeddings:
            return jsonify({
                "success": False,
                "error": f"No embedding returned for angle: {angle}",
                "angle": angle,
            }), 200

        embedding_for_angle = embeddings[angle]
        students_collection.find_one_and_update(
            {"student_id": student_id},
            {
                "$setOnInsert": {
                    "created_at": datetime.utcnow(),
                },
                "$set": {
                    "student_id": student_id,
                    "First_Name": data.get("First_Name"),
                    "Middle_Name": data.get("Middle_Name"),
                    "Last_Name": data.get("Last_Name"),
                    "Suffix": data.get("Suffix"),
                    "Course": course,
                    "registered": True,
                    f"embeddings.{angle}": embedding_for_angle,  # merge per angle, not full overwrite
                    "updated_at": datetime.utcnow(),
                }
            },
            upsert=True
        )

        total_elapsed = time.time() - start_time
        current_app.logger.info(
            f"/register-auto {student_id} | angle={angle} | done in {total_elapsed:.2f}s (HF={hf_elapsed:.2f}s)"
        )

        return jsonify({
            "success": True,
            "student_id": student_id,
            "Course": course,
            "angle": angle,
            "message": f"Face registered successfully for angle: {angle}",
        }), 200

    except requests.exceptions.Timeout:
        current_app.logger.error(f"/register-auto timeout for student_id={data.get('student_id')}")
        return jsonify({
            "success": False,
            "error": "AI service timeout"
        }), 504

    except Exception as e:
        current_app.logger.error(
            f"/register-auto error: {str(e)}\n{traceback.format_exc()}"
        )
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500

@face_bp.route("/register-instructor", methods=["POST"])
def register_instructor():
    start_time = time.time()
    try:
        # --- 1. Dual-Format Parser (JSON base64 or Form-Data file/text) ---
        if request.is_json:
            data = request.get_json(silent=True) or {}
            instructor_id = data.get("instructor_id")
            base64_image = data.get("image")
            angle = data.get("angle", "front")
        else:
            # Galing sa form-data fields
            data = request.form.to_dict()
            instructor_id = data.get("instructor_id")
            angle = data.get("angle", "front")
            base64_image = None

            # Siyasatin kung may in-upload na file sa ilalim ng 'image' key
            if "image" in request.files:
                file = request.files["image"]
                if file.filename != "":
                    # Basahin ang binary content ng file at i-convert sa base64 string
                    file_bytes = file.read()
                    encoded_string = base64.b64encode(file_bytes).decode("utf-8")
                    
                    # Tukuyin ang tamang mime-type base sa file extension para sa AI microservice split
                    mime_type = "image/jpeg"
                    if file.filename.lower().endswith(".png"):
                        mime_type = "image/png"
                        
                    base64_image = f"data:{mime_type};base64,{encoded_string}"

        # --- 2. Input Integrity Validation ---
        if not instructor_id or not base64_image:
            return jsonify({
                "success": False,
                "error": "Missing instructor_id or image payload"
            }), 400

        # --- NEW UPDATE: Existence Check for Instructor Account ---
        # Hinahanap natin ang record gamit ang instructors_collection na dineclare mo sa taas
        instructor_account = instructors_collection.find_one({"instructor_id": instructor_id})
        
        if not instructor_account:
            current_app.logger.warning(f"❌ Registration rejected: Instructor ID {instructor_id} does not exist.")
            return jsonify({
                "success": False,
                "error": f"Instructor account with ID '{instructor_id}' not found. Registration denied."
            }), 404

        # Kukunin natin ang official names mula sa database account para hindi ma-overwrite ng maling manual form input
        first_name = instructor_account.get("First_Name") or instructor_account.get("first_name")
        middle_name = instructor_account.get("Middle_Name") or instructor_account.get("middle_name")
        last_name = instructor_account.get("Last_Name") or instructor_account.get("last_name")
        suffix = instructor_account.get("Suffix") or instructor_account.get("suffix")

        # --- 3. Forward Payload to AI-Microservice ---
        ai_payload = {
            "instructor_id": instructor_id,
            "image": base64_image,
            "angle": angle
        }

        hf_start = time.time()
        res = requests.post(f"{HF_AI_URL}/register-instructor", json=ai_payload, timeout=60)
        hf_elapsed = time.time() - hf_start

        # --- 4. Catch Face Extraction Failures (HTTP 400/422) ---
        if res.status_code in (400, 422):
            hf_result = res.json()
            return jsonify({
                "success": False,
                "error": hf_result.get("error", "AI microservice validation failed"),
                "angle": hf_result.get("angle", "unknown")
            }), 400

        if res.status_code != 200:
            current_app.logger.warning(f"⚠️ HF service error {res.status_code}: {res.text}")
            return jsonify({
                "success": False,
                "error": "Hugging Face service error"
            }), res.status_code

        hf_result = res.json()
        
        if not hf_result.get("success") or not hf_result.get("embeddings"):
            return jsonify({
                "success": False,
                "error": hf_result.get("error", "No embeddings returned"),
                "angle": hf_result.get("angle", "unknown"),
            }), 400

        # --- 5. Database Field Structuring ---
        update_fields = {
            "instructor_id": instructor_id,
            "First_Name": first_name,
            "Middle_Name": middle_name,
            "Last_Name": last_name,
            "Suffix": suffix,
            "registered": True, 
            "embeddings": hf_result["embeddings"], 
            "updated_at": datetime.utcnow(),
        }

        # Sine-save gamit ang iyong original helper framework configuration
        save_face_data_for_instructor(instructor_id, update_fields)

        total_elapsed = time.time() - start_time
        current_app.logger.info(
            f"✅ /register-instructor {instructor_id} done in {total_elapsed:.2f}s (HF={hf_elapsed:.2f}s)"
        )

        return jsonify({
            "success": True,
            "instructor_id": instructor_id,
            "angle": hf_result.get("angle", "unknown"),
            "message": "Registration successful and structural data synchronized.",
        }), 200

    except requests.exceptions.Timeout:
        return jsonify({
            "success": False,
            "error": "AI service timeout"
        }), 504

    except Exception as e:
        current_app.logger.error(
            f"/register-instructor error: {str(e)}\n{traceback.format_exc()}"
        )
        return jsonify({
            "success": False,
            "error": "Internal server error"
        }), 500
    
# MULTI-FACE ATTENDANCE
@face_bp.route("/multi-recognize", methods=["POST"])
def multi_face_recognize():
    start_time = time.time()

    try:
        faces = []
        class_id = ""

        # Check if the request is multipart/form-data (e.g., File uploads from Postman)
        if request.files or request.form:
            class_id = str(request.form.get("class_id") or "").strip()
            
            # Handle possible key syntax varieties: 'faces' or 'faces[]'
            uploaded_files = request.files.getlist("faces") or request.files.getlist("faces[]")
            
            for file in uploaded_files:
                if file and file.filename != "":
                    # Read binary image stream directly out of system RAM buffers
                    file_bytes = file.read()
                    b64_string = base64.b64encode(file_bytes).decode("utf-8")
                    
                    # Synthesize frontend data URL structure matching your AI microservice expectations
                    mime_type = file.mimetype or "image/jpeg"
                    faces.append(f"data:{mime_type};base64,{b64_string}")
        else:
            # Fallback to default application/json handling (e.g., Live session client stream)
            data = request.get_json(silent=True) or {}
            faces = data.get("faces") or []
            class_id = str(data.get("class_id") or "").strip()

        # Parameter sanity check verification validation
        if not faces or not class_id:
            return jsonify({"error": "Missing faces or class_id"}), 400

        # 1. Kuhanin ang Cached Class Document para sa verification parameters
        cls = get_cached_class(class_id)
        if not cls:
            return jsonify({"error": "Class not found"}), 404

        instructor_id = cls.get("instructor_id")
        log_id_raw = cls.get("active_session_log_id")

        if not log_id_raw:
            return jsonify({"error": "No active attendance log for this class"}), 400

        try:
            log_id = ObjectId(str(log_id_raw))
        except Exception:
            return jsonify({"error": "Invalid log id"}), 500

        # 2. Kuhanin ang mga rehistradong mukha para sa klase na ito
        registered_faces = get_cached_faces(class_id)
        if not registered_faces:
            return jsonify({
                "success": False,
                "message": "No registered faces for this class",
                "recognized": [],
                "instructor_detected": False
            }), 200

        # 3. I-prepare ang Local Target Matrix (NumPy Vectorization Setup)
        embeddings_list = []
        user_meta = []

        for r in registered_faces:
            emb = np.array(r.get("embedding"), dtype=np.float32)
            if emb.shape != (512,):
                continue
            norm = np.linalg.norm(emb)
            if norm < 1e-3:
                continue
            embeddings_list.append(emb / norm)
            user_meta.append({
                "user_id": r.get("user_id"),
                "type": "instructor" if str(r.get("user_id")) == str(instructor_id) else r.get("type", "student")
            })

        # Kung walang maayos na reference embedding sa DB, huwag nang magpatuloy
        if not embeddings_list:
            return jsonify({
                "success": True,
                "logged": [],
                "count": 0,
                "instructor_detected": False
            }), 200

        reg_embs = np.stack(embeddings_list, axis=0)

        # 4. Tumawag sa AI Microservice para sa Pure Feature Extraction & Anti-Spoofing
        try:
            hf_res = requests.post(
                f"{HF_AI_URL}/extract-features",
                json={"faces": faces},
                timeout=30
            )
            if hf_res.status_code != 200:
                return jsonify({"error": "AI service feature extraction failed"}), 500
            ai_result = hf_res.json()
        except Exception:
            return jsonify({"error": "AI service unreachable"}), 500

        features = ai_result.get("features") or []

        # 5. I-verify o Hanapin ang Attendance Log Document
        att_log = attendance_collection.find_one({"_id": log_id})
        if not att_log:
            now = datetime.now(PH_TZ)
            new_log = {
                "date": now.strftime("%Y-%m-%d"),
                "class_id": class_id,
                "course": cls.get("course"),
                "end_time": None,
                "instructor_id": instructor_id,
                "instructor_first_name": cls.get("instructor_first_name"),
                "instructor_last_name": cls.get("instructor_last_name"),
                "school_year": cls.get("school_year"),
                "section": cls.get("section"),
                "semester": cls.get("semester"),
                "start_time": now.strftime("%H:%M:%S"),
                "students": [],
                "subject_code": cls.get("subject_code"),
                "subject_title": cls.get("subject_title"),
                "year_level": cls.get("year_level"),
            }
            try:
                inserted = attendance_collection.insert_one(new_log)
                new_log_id = str(inserted.inserted_id)
            except Exception:
                att_log = attendance_collection.find_one({"_id": log_id})
                if not att_log:
                    return jsonify({"error": "Failed to create attendance log"}), 500
            else:
                classes_collection.update_one(
                    {"_id": ObjectId(class_id)},
                    {"$set": {"active_session_log_id": new_log_id}}
                )
                SESSION_LOGGED_STUDENTS[class_id] = {}
                SESSION_INSTRUCTOR_DETECTED[class_id] = {
                    "log_id": new_log_id,
                    "detected": False
                }
                att_log = new_log
                log_id = ObjectId(new_log_id)

        # 6. Set up state variables at timestamps
        now = datetime.now(PH_TZ)
        now_time = now.strftime("%H:%M:%S")
        now_readable = now.strftime("%I:%M %p")

        if class_id not in SESSION_LOGGED_STUDENTS:
            SESSION_LOGGED_STUDENTS[class_id] = {}

        instr_state = SESSION_INSTRUCTOR_DETECTED.get(class_id)
        if not instr_state or instr_state.get("log_id") != str(log_id):
            SESSION_INSTRUCTOR_DETECTED[class_id] = {
                "log_id": str(log_id),
                "detected": False
            }

        instructor_detected = SESSION_INSTRUCTOR_DETECTED[class_id]["detected"]
        results = []
        seen_user_ids = set()
        latest_face_data = None

        # 7. PROCESO NG LOCAL COSINE MATCHING AT BUSINESS LOGIC LOOP (OPTIMIZED)
        for f_data in features:
            spoof_status = f_data.get("spoof_status")
            spoof_confidence = f_data.get("spoof_confidence")
            real_prob = f_data.get("real_prob")
            spoof_prob = f_data.get("spoof_prob")
            raw_emb = f_data.get("embedding")

            # --- UPDATE: REJECT AND FLAG SPOOF ATTEMPTS ANONYMOUSLY ---
            if spoof_status == "Spoof":
                spoof_payload = {
                    "status": "Spoof Attempt",
                    "time": now_readable,
                    "spoof_status": "Spoof",
                    "spoof_confidence": spoof_confidence,
                    "real_prob": real_prob,
                    "spoof_prob": spoof_prob,
                    "match_score": 0.0
                }
                latest_face_data = spoof_payload
                continue

            if not raw_emb:
                continue

            # I-convert ang embedding mula sa AI Microservice patungong NumPy array
            emb = np.array(raw_emb, dtype=np.float32)
            
            # Kuhanin ang dot product sa pagitan ng nakuhang mukha at ng rehistradong profiles matrix
            sims = np.dot(reg_embs, emb)
            best_idx = int(np.argmax(sims))
            best_score = float(sims[best_idx])

            target = user_meta[best_idx]
            user_id = target["user_id"]
            user_type = target["type"]

            # Strict Authentication Threshold Verification Pass
            threshold = 0.40 if user_type == "instructor" else 0.42
            if best_score < threshold:
                unknown_payload = {
                    "status": "Unknown Face",
                    "time": now_readable,
                    "match_score": round(best_score, 4),
                    "spoof_status": spoof_status,
                    "spoof_confidence": spoof_confidence,
                    "real_prob": real_prob,
                    "spoof_prob": spoof_prob
                }
                latest_face_data = unknown_payload
                continue

            # Anti-Duplicate filtering sa kasalukuyang stream window frame
            if user_id in seen_user_ids:
                continue
            seen_user_ids.add(user_id)

            # --- CASE A: KUNG INSTRUCTOR ANG NAKITA (SHORT-CIRCUIT TIMING PASS) ---
            if user_type == "instructor" or str(user_id) == str(instructor_id):
                instructor_payload = {
                    "user_id": str(user_id),
                    "first_name": cls.get("instructor_first_name"),
                    "last_name": cls.get("instructor_last_name"),
                    "status": "Instructor Present",
                    "time": now_readable,
                    "match_score": round(best_score, 4),
                    "spoof_status": spoof_status,
                    "spoof_confidence": spoof_confidence,
                    "real_prob": real_prob,
                    "spoof_prob": spoof_prob
                }
                latest_face_data = instructor_payload
                
                if not instructor_detected:
                    SESSION_INSTRUCTOR_DETECTED[class_id] = {
                        "log_id": str(log_id),
                        "detected": True
                    }
                    instructor_detected = True

                # 🚀 SPEED BENCHMARK UPGRADE: Kung nahanap na si Instructor, i-bypass na agad ang loop execution
                if len(features) == 1:
                    break
                continue

            # --- CASE B: KUNG ESTUDYANTE ANG NAKITA ---
            student = get_student_cached(user_id)
            if not student:
                continue

            stud_id = str(student.get("student_id"))
            first = student.get("first_name") or student.get("First_Name", "")
            last = student.get("last_name") or student.get("Last_Name", "")
            student_data = {"student_id": stud_id, "first_name": first, "last_name": last}

            # Subukan kung nasa memory cache na ang estudyante para iwas-DB lookup loop
            cache_entry = SESSION_LOGGED_STUDENTS[class_id].get(user_id)
            if cache_entry and cache_entry.get("log_id") == str(log_id):
                cached_payload = {
                    **student_data,
                    "status": cache_entry["status"],
                    "time": now_readable,
                    "match_score": round(best_score, 4),
                    "spoof_status": spoof_status,
                    "spoof_confidence": spoof_confidence,
                    "real_prob": real_prob,
                    "spoof_prob": spoof_prob
                }
                results.append(cached_payload)
                latest_face_data = cached_payload
                continue

            # Kung wala sa cache, silipin sa database kung nakalista na ito kanina
            existing = attendance_collection.find_one(
                {"_id": log_id, "students.student_id": stud_id},
                {"students.$": 1}
            )

            if existing and existing.get("students"):
                status = existing["students"][0]["status"]
                SESSION_LOGGED_STUDENTS[class_id][user_id] = {
                    "status": status, "log_id": str(log_id)
                }
                db_payload = {
                    **student_data, "status": status, "time": now_readable,
                    "match_score": round(best_score, 4),
                    "spoof_status": spoof_status, "spoof_confidence": spoof_confidence,
                    "real_prob": real_prob, "spoof_prob": spoof_prob
                }
                results.append(db_payload)
                latest_face_data = db_payload
                continue

            # Kalkulahin ang status (Late vs Present) kung bago pa lang itatala ang attendance nito
            try:
                class_dt = datetime.strptime(att_log["start_time"], "%H:%M:%S").replace(
                    year=now.year, month=now.month, day=now.day
                )
                status = "Late" if (now - class_dt).total_seconds() / 60 > 15 else "Present"
            except Exception:
                status = "Present"

            # I-commit at itala na ang bagong student node sa MongoDB document cluster
            attendance_collection.update_one(
                {"_id": log_id},
                {
                    "$push": {"students": {
                        "student_id": stud_id, "first_name": first,
                        "last_name": last, "status": status, "time": now_time
                    }},
                    "$set": {"end_time": now_time}
                }
            )

            # I-commit sa cache para sa susunod na scan interval frame loop
            SESSION_LOGGED_STUDENTS[class_id][user_id] = {
                "status": status, "log_id": str(log_id)
            }
            new_record_payload = {
                **student_data, "status": status, "time": now_readable,
                "match_score": round(best_score, 4),
                "spoof_status": spoof_status, "spoof_confidence": spoof_confidence,
                "real_prob": real_prob, "spoof_prob": spoof_prob
            }
            results.append(new_record_payload)
            latest_face_data = new_record_payload

        duration = time.time() - start_time
        current_app.logger.info(
            f"[multi-recognize] logged={len(results)} instructor={instructor_detected} time={duration:.2f}s"
        )

        return jsonify({
            "success": True,
            "logged": results,
            "count": len(results),
            "latest_face": latest_face_data,
            "instructor_detected": instructor_detected,
            "instructor_id": instructor_id,
            "instructor_first_name": cls.get("instructor_first_name"),
            "instructor_last_name": cls.get("instructor_last_name"),
            "subject_code": cls.get("subject_code"),
            "subject_title": cls.get("subject_title"),
        }), 200

    except Exception:
        current_app.logger.error(traceback.format_exc())
        return jsonify({"error": "Internal server error"}), 500