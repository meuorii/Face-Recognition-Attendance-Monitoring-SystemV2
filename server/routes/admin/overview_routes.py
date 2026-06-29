from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from datetime import datetime
from config.db_config import db
from . import admin_bp

students_col = db["students"]
instructors_col = db["instructors"]
classes_col = db["classes"]
attendance_logs_col = db["attendance_logs"]

#Stat Cards
@admin_bp.route("/api/admin/overview/stats", methods=["GET"])
def get_stats():
    program = request.args.get("program")  

    # 1. Filters Setup
    student_filter = {"$or": [
        {"course": {"$regex": f"^{program}$", "$options": "i"}},
        {"Course": {"$regex": f"^{program}$", "$options": "i"}}
    ]} if program else {}

    class_filter = {"$or": [
        {"course": {"$regex": f"^{program}$", "$options": "i"}},
        {"Course": {"$regex": f"^{program}$", "$options": "i"}}
    ]} if program else {}

    # Base query for attendance logs
    attendance_query = {}
    if program:
        attendance_query["$or"] = [
            {"course": {"$regex": f"^{program}$", "$options": "i"}},
            {"Course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.Course": {"$regex": f"^{program}$", "$options": "i"}}
        ]

    # 2. Fetch Attendance Metrics
    total_attendance_records = 0
    total_expected_students = 0
    present_count = 0

    # Define all valid attended statuses (including late)
    attended_statuses = ["Present", "present", "Late", "late", True]

    for log in attendance_logs_col.find(attendance_query):
        students_list = log.get("students", [])
        student_count = len(students_list)
        
        # Accumulate total historical records
        total_attendance_records += student_count
        total_expected_students += student_count
        
        # Count actual present and late statuses to determine the rate
        present_count += sum(1 for s in students_list if s.get("status") in attended_statuses)

    # 3. Calculate Attendance Rate
    attendance_rate = 0.0
    if total_expected_students > 0:
        attendance_rate = round((present_count / total_expected_students) * 100, 2)

    # 4. Core Counts
    total_students = students_col.count_documents(student_filter)
    total_instructors = instructors_col.count_documents({}) 
    total_classes = classes_col.count_documents(class_filter)

    return jsonify(
        {
            "total_students": total_students,
            "total_instructors": total_instructors,
            "total_classes": total_classes,
            "total_attendance_records": total_attendance_records,
            "attendance_rate": f"{attendance_rate}%"
        }
    ), 200

#Recent Attendance Logs
@admin_bp.route("/api/admin/overview/recent-logs", methods=["GET"])
def recent_logs():
    program = request.args.get("program")
    limit = int(request.args.get("limit", 5))

    query = {}
    if program:
        query["$or"] = [
            {"course": {"$regex": f"^{program}$", "$options": "i"}},
            {"Course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.Course": {"$regex": f"^{program}$", "$options": "i"}},
        ]

    docs = list(attendance_logs_col.find(query).sort("date", -1).limit(20))
    flattened = []

    for log in docs:
        subject_title = log.get("subject_title")
        subject_code = log.get("subject_code")
        if subject_code and subject_title:
            subject = f"{subject_code} - {subject_title}"
        else:
            subject = subject_title or subject_code or "N/A"

        for stu in log.get("students", []):
            flattened.append(
                {
                    "student": {
                        "first_name": stu.get("first_name") or stu.get("First_Name"),
                        "last_name": stu.get("last_name") or stu.get("Last_Name"),
                        "student_id": stu.get("student_id"),
                    },
                    "subject": subject,
                    "status": stu.get("status"),
                    "timestamp": stu.get("time_logged") or log.get("date"),
                }
            )

    flattened.sort(key=lambda x: str(x.get("timestamp") or ""), reverse=True)
    return jsonify(flattened[:limit]), 200

#Last Student Registered
@admin_bp.route("/api/admin/overview/last-student", methods=["GET"])
def last_student():
    program = request.args.get("program")
    query = {"$or": [
        {"course": {"$regex": f"^{program}$", "$options": "i"}},
        {"Course": {"$regex": f"^{program}$", "$options": "i"}}
    ]} if program else {}

    student = students_col.find_one(query, sort=[("created_at", -1)])
    if not student:
        return jsonify(None)
    
    return jsonify(
        {
            "student_id": student.get("student_id"),
            "first_name": student.get("First_Name") or student.get("first_name"),
            "last_name": student.get("Last_Name") or student.get("last_name"),
            "created_at": student.get("created_at"),
        }
    ), 200