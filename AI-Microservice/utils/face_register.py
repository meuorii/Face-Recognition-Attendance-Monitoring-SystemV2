import logging
import cv2
import base64
import numpy as np
import mediapipe as mp
from datetime import datetime
from utils.model_loader import get_face_model

face_model = get_face_model()

mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(max_num_faces=1, refine_landmarks=True)

def get_face_angle(landmarks, w, h):
    try:
        nose = landmarks[1]
        left_eye = landmarks[33]
        right_eye = landmarks[263]
        mouth = landmarks[13]
        nose_y = nose.y * h
        eye_mid_y = ((left_eye.y + right_eye.y) / 2) * h
        mouth_y = mouth.y * h

        eye_dist = right_eye.x - left_eye.x
        nose_pos = (nose.x - left_eye.x) / (eye_dist + 1e-6)
        up_down_ratio = abs(nose_y - eye_mid_y) / (abs(mouth_y - nose_y) + 1e-6)

        if nose_pos > 0.65: 
            return "right"
        elif nose_pos < 0.35:
            return "left"
        elif up_down_ratio > 1.6:
            return "down"
        elif up_down_ratio < 0.55:
            return "up"
        return "front"
    except Exception as e:
        logging.warning(f"Angle detection failed: {str(e)}")
        return "front"

def register_face_auto(data):
    try:
        student_id = data.get("student_id")
        base64_image = data.get("image")
        
        # Kukunin ang anggulo mula sa frontend payload (default sa 'front' kung walang pinasa)
        angle = str(data.get("angle", "front")).lower()

        # --- 1. Payload Input Validation ---
        if not student_id or not base64_image:
            logging.warning(f"Student registration failed: Missing student_id or image payload.")
            return {"success": False, "error": "Missing student_id or image", "angle": angle}

        if not base64_image.startswith("data:image"):
            logging.warning(f"[{student_id}] Registration failed: Invalid image string format.")
            return {"success": False, "error": "Invalid image string format", "angle": angle}

        # --- 2. Base64 Image Decoding ---
        try:
            img_bytes = base64.b64decode(base64_image.split(",")[1])
            img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Image decoding failed", "angle": angle}
        except Exception as e:
            logging.error(f"[{student_id}] Base64 decoding crash: {str(e)}")
            return {"success": False, "error": "Invalid image format or corrupted data", "angle": angle}

        logging.info(f"[{student_id}] Extracting embedding for student angle: '{angle}'")

        # --- 3. Core Model Safety Check ---
        if face_model is None:
            logging.error("ArcFace/iResNet model loader returned None.")
            return {"success": False, "error": "Face model not initialized on AI service", "angle": angle}

        # --- 4. ArcFace Embedding Extraction ---
        faces = face_model.get(img)
        
        if not faces:
            logging.warning(f"[{student_id}] ArcFace model failed to locate any faces for angle: {angle}.")
            return {
                "success": False, 
                "error": f"No face detected by AI model for angle: {angle}", 
                "angle": angle
            }

        if not hasattr(faces[0], "embedding"):
            logging.warning(f"[{student_id}] Extracted face metadata contains no numerical vector arrays.")
            return {
                "success": False, 
                "error": f"Could not extract face embedding grid for angle: {angle}", 
                "angle": angle
            }

        # --- 5. Embedding Isolation & Vector Normalization ---
        embedding = np.array(faces[0].embedding, dtype=np.float32)
        norm = np.linalg.norm(embedding)
        
        if norm == 0:
            logging.warning(f"[{student_id}] Mathematical anomaly: Zero-norm vector output.")
            return {
                "success": False, 
                "error": f"Invalid face embedding (zero norm) for angle: {angle}", 
                "angle": angle
            }

        # Safe unit-vector scaling (Normalization)
        embedding = embedding / norm
        logging.info(f"[{student_id}] Successfully extracted student vector embedding for angle: {angle}")

        # --- 6. Standardized Payload Output ---
        return {
            "success": True,
            "student_id": student_id,
            "angle": angle,
            "embeddings": {
                angle: embedding.tolist()
            },
            "created_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logging.error(f"register_face_auto Critical Crash Exception: {str(e)}")
        return {"success": False, "error": "Internal AI server error processing frame"}


def register_instructor_face(data):
    try:
        instructor_id = data.get("instructor_id")
        base64_image = data.get("image")
        angle = str(data.get("angle", "front")).lower()

        # --- 1. Payload Input Validation ---
        if not instructor_id or not base64_image:
            logging.warning(f"Registration failed: Missing instructor_id or image payload.")
            return {"success": False, "error": "Missing instructor_id or image", "angle": angle}

        if not base64_image.startswith("data:image"):
            logging.warning(f"[{instructor_id}] Registration failed: Invalid image string format.")
            return {"success": False, "error": "Invalid image string format", "angle": angle}

        # --- 2. Base64 Image Decoding ---
        try:
            img_bytes = base64.b64decode(base64_image.split(",")[1])
            img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                return {"success": False, "error": "Image decoding failed", "angle": angle}
        except Exception as e:
            logging.error(f"[{instructor_id}] Base64 decoding crash: {str(e)}")
            return {"success": False, "error": "Invalid image format or corrupted data", "angle": angle}

        logging.info(f"[{instructor_id}] Extracting embedding for angle: '{angle}'")

        # --- 3. Core Model Safety Check ---
        if face_model is None:
            logging.error("ArcFace/iResNet model loader returned None.")
            return {"success": False, "error": "Face model not initialized on AI service", "angle": angle}

        # --- 4. ArcFace Embedding Extraction ---
        faces = face_model.get(img)
        
        if not faces:
            logging.warning(f"[{instructor_id}] ArcFace model failed to locate any faces for angle: {angle}.")
            return {
                "success": False, 
                "error": f"No face detected by AI model for angle: {angle}", 
                "angle": angle
            }

        if not hasattr(faces[0], "embedding"):
            logging.warning(f"[{instructor_id}] Extracted face metadata contains no numerical vector arrays.")
            return {
                "success": False, 
                "error": f"Could not extract face embedding grid for angle: {angle}", 
                "angle": angle
            }

        # --- 5. Embedding Isolation & Vector Normalization ---
        embedding = np.array(faces[0].embedding, dtype=np.float32)
        norm = np.linalg.norm(embedding)
        
        if norm == 0:
            logging.warning(f"[{instructor_id}] Mathematical anomaly: Zero-norm vector output.")
            return {
                "success": False, 
                "error": f"Invalid face embedding (zero norm) for angle: {angle}", 
                "angle": angle
            }

        # Safe unit-vector scaling
        embedding = embedding / norm
        logging.info(f"[{instructor_id}] Successfully extracted vector embedding for angle: {angle}")

        # --- 6. Standardized Payload Output ---
        return {
            "success": True,
            "instructor_id": instructor_id,
            "angle": angle,
            "embeddings": {
                angle: embedding.tolist()
            },
            "created_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logging.error(f"register_instructor_face Critical Crash Exception: {str(e)}")
        return {"success": False, "error": "Internal AI server error processing frame"}