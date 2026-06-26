from flask import jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from config.db_config import db
from . import instructor_bp

classes_collection = db["classes"]
attendance_collection = db["attendance_logs"]

@instructor_bp.route("/<string:instructor_id>/overview/attendance-by-subject", methods=["GET"])
@jwt_required()
def get_attendance_percentage_per_subject(instructor_id):
    try:
        active = db["semesters"].find_one({"is_active": True})
        if not active:
            return jsonify({"error": "No active semester configured"}), 500
        sem_name = active["semester_name"]
        sy = active["school_year"]
        
        pipeline = [
            {
                "$match": {
                    "instructor_id": instructor_id,
                    "semester": sem_name,
                    "school_year": sy
                }
            },
            {
                "$unwind": "$students"
            },
            {
                "$group": {
                    "_id": "$year_level",
                    "total_records": {"$sum": 1},
                    "present_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]
                        }
                    },
                    "late_count": {
                        "$sum": {
                            "$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]
                        }
                    }
                }
            }
        ]

        aggregated_data = list(attendance_collection.aggregate(pipeline))

        # 1. 🟢 GAWING TEMPLATE: Siguraduhin na laging may base dictionary para sa 1st hanggang 4th Year
        master_years = {
            "1st Year": {"year_level": "1st Year", "display_label": "1st Year", "attendance_rate": 0, "total_logs": 0},
            "2nd Year": {"year_level": "2nd Year", "display_label": "2nd Year", "attendance_rate": 0, "total_logs": 0},
            "3rd Year": {"year_level": "3rd Year", "display_label": "3rd Year", "attendance_rate": 0, "total_logs": 0},
            "4th Year": {"year_level": "4th Year", "display_label": "4th Year", "attendance_rate": 0, "total_logs": 0}
        }

        # Helper map para sa magkakaibang posibleng raw entries sa DB
        year_mapping = {
            "1": "1st Year", "2": "2nd Year", "3": "3rd Year", "4": "4th Year",
            "1st": "1st Year", "2nd": "2nd Year", "3rd": "3rd Year", "4th": "4th Year",
            "1st Year": "1st Year", "2nd Year": "2nd Year", "3rd Year": "3rd Year", "4th Year": "4th Year"
        }

        # 2. 🟢 I-OVERWRITE ANG TEMPLATE KUNG MAY DATA GALING MONGODB
        for item in aggregated_data:
            if not item["_id"]:
                continue
                
            raw_year = str(item["_id"]).strip()
            standard_year = year_mapping.get(raw_year, f"{raw_year} Year")

            total = item["total_records"]
            successful_attendance = item["present_count"] + item["late_count"]
            
            attendance_percentage = (
                round((successful_attendance / total) * 100, 2) if total > 0 else 0
            )

            # Kung ang standard year ay kasama sa 1st-4th, i-update ang real computed values nito
            if standard_year in master_years:
                master_years[standard_year]["attendance_rate"] = attendance_percentage
                master_years[standard_year]["total_logs"] = total

        # 3. 🟢 GEOMETRIC ORDERING: I-convert ang dictionary pabalik sa sorted list (1st hanggang 4th)
        ordered_keys = ["1st Year", "2nd Year", "3rd Year", "4th Year"]
        formatted_chart_data = [master_years[key] for key in ordered_keys]

        return jsonify(formatted_chart_data), 200

    except Exception as e:
        print(f"❌ Error in attendance-by-year data optimization pipeline: {e}")
        return jsonify({"error": str(e)}), 500
    
@instructor_bp.route("/<string:instructor_id>/overview", methods=["GET"])
@jwt_required()
def instructor_overview(instructor_id):
    try:
        active = db["semesters"].find_one({"is_active": True})
        if not active:
            return jsonify({"error": "No active semester"}), 500

        sem_name = active["semester_name"]
        sy = active["school_year"]

        # Kumuha ng base array profiles para sa stats calculations
        classes = list(classes_collection.find({
            "instructor_id": instructor_id,
            "semester": sem_name,
            "school_year": sy
        }))

        # Pag-compute sa numeric totals (Tile 1, Tile 2, Tile 3 at Tile 4)
        unique_subject_codes = list(set(cls.get("subject_code") for cls in classes if cls.get("subject_code")))
        total_subjects = len(unique_subject_codes)
        total_sections = len(classes)
        
        # 🟢 BINAGO: Pagkuha ng mga unique students gamit ang Set ng student_id
        enrolled_student_ids = set()
        for cls in classes:
            for student in cls.get("students", []):
                s_id = student.get("student_id")
                if s_id:
                    enrolled_student_ids.add(s_id)
        
        total_students = len(enrolled_student_ids) # Tunay na unique count ng estudyante mo
        
        active_scanner_status = any(cls.get("is_attendance_active", False) for cls in classes)

        # Pag-compute para sa global overall donut visualization gauge (Tile 5)
        class_ids = [str(cls["_id"]) for cls in classes]
        pipeline = [
            {"$match": {"class_id": {"$in": class_ids}}},
            {"$unwind": "$students"},
            {"$group": {
                "_id": None,
                "total_records": {"$sum": 1},
                "present": {"$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}},
                "late": {"$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}},
                "absent": {"$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}}
            }}
        ]

        agg = list(attendance_collection.aggregate(pipeline))
        if agg:
            total_records = agg[0]["total_records"]
            present_count = agg[0]["present"]
            late_count = agg[0]["late"]
            absent_count = agg[0]["absent"]
        else:
            total_records = present_count = late_count = absent_count = 0

        global_yield_rate = (
            round(((present_count + late_count) / total_records) * 100, 2)
            if total_records else 0
        )

        return jsonify({
            "assignedSubjectsCount": total_subjects,
            "totalHandledSections": total_sections,
            "totalEnrolledStudents": total_students, 
            "isLiveScannerActive": active_scanner_status,
            "globalYieldRate": global_yield_rate,
            "donutBreakdown": {
                "present": present_count,
                "late": late_count,
                "absent": absent_count,
                "totalLogs": total_records
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@instructor_bp.route("/<string:instructor_id>/overview/attendance-trend", methods=["GET"])
@jwt_required()
def instructor_attendance_trend(instructor_id):
    try:
        pipeline = [
            {"$match": {"instructor_id": instructor_id}},
            {"$unwind": "$students"},
            {"$group": {
                "_id": "$date",
                "present": {"$sum": {"$cond": [{"$eq": ["$students.status", "Present"]}, 1, 0]}},
                "late": {"$sum": {"$cond": [{"$eq": ["$students.status", "Late"]}, 1, 0]}},
                "absent": {"$sum": {"$cond": [{"$eq": ["$students.status", "Absent"]}, 1, 0]}}
            }},
            {"$sort": {"_id": 1}}
        ]

        trend = list(attendance_collection.aggregate(pipeline))
        formatted = [
            {
                "date": t["_id"],
                "present": t.get("present", 0),
                "late": t.get("late", 0),
                "absent": t.get("absent", 0)
            }
            for t in trend
        ]
        return jsonify(formatted), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@instructor_bp.route("/<string:instructor_id>/classes-matrix", methods=["GET"])
@jwt_required()
def get_instructor_classes_matrix(instructor_id):
    try:
        active = db["semesters"].find_one({"is_active": True})
        if not active:
            return jsonify({"error": "No active semester configured"}), 500

        sem_name = active["semester_name"]
        sy = active["school_year"]

        classes = list(classes_collection.find({
            "instructor_id": instructor_id,
            "semester": sem_name,
            "school_year": sy
        }))

        formatted_matrix = []
        for cls in classes:
            
            schedule_list = []
            blocks = cls.get("schedule_blocks", [])
            
            if blocks:
                for block in blocks:
                    days = ", ".join(block.get("days", []))
                    start = block.get("start", "")
                    end = block.get("end", "")
                    if days and start and end:
                        schedule_list.append(f"{days} ({start} - {end})")
            
            schedule_display = " | ".join(schedule_list) if schedule_list else "No Schedule Provided"

            formatted_matrix.append({
                "class_id": str(cls["_id"]),
                "class_code": cls.get("class_code", "N/A"),
                "subject_code": cls.get("subject_code", "N/A"),
                "subject_title": cls.get("subject_title", "N/A"),
                "course": cls.get("course", "N/A"),
                "section": cls.get("section", "N/A"),
                "year_level": cls.get("year_level", "N/A"),
                "schedule": schedule_display,
                "total_students": len(cls.get("students", [])),
                "is_attendance_active": cls.get("is_attendance_active", False),
                "active_session_log_id": cls.get("active_session_log_id")
            })

        formatted_matrix.sort(key=lambda x: x["subject_code"])

        return jsonify(formatted_matrix), 200

    except Exception as e:
        print(f"❌ Error in classes-matrix data processing pipeline: {e}")
        return jsonify({"error": str(e)}), 500