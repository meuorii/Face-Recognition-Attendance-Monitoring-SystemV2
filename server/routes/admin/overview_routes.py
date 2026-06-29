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

#Attendance By Program
@admin_bp.route("/api/admin/program-attendance", methods=["GET"])
@jwt_required()
def get_program_attendance():
    target_programs = ["BSINFOTECH", "BSCS"]
    chart_data = {}

    attended_statuses = ["Present", "present", "Late", "late", True]

    for program in target_programs:
        attendance_query = {
            "$or": [
                {"course": {"$regex": f"^{program}$", "$options": "i"}},
                {"Course": {"$regex": f"^{program}$", "$options": "i"}},
                {"students.course": {"$regex": f"^{program}$", "$options": "i"}},
                {"students.Course": {"$regex": f"^{program}$", "$options": "i"}}
            ]
        }

        total_expected_students = 0
        attended_count = 0

        for log in attendance_logs_col.find(attendance_query):
            students_list = log.get("students", [])
            student_count = len(students_list)
            total_expected_students += student_count
            attended_count += sum(1 for s in students_list if s.get("status") in attended_statuses)

        attendance_rate = 0.0
        if total_expected_students > 0:
            attendance_rate = round((attended_count / total_expected_students) * 100, 2)

        chart_data[program] = {
            "attendance_rate": attendance_rate,
            "total_records": total_expected_students,
            "attended_count": attended_count  
        }

    return jsonify({
        "success": True,
        "data": chart_data
    }), 200

#Attendance Distribution
@admin_bp.route("/api/admin/attendance-distribution", methods=["GET"])
@jwt_required()
def get_attendance_distribution():
    program = request.args.get("program")  

    # Optional program filter to match your other endpoint patterns
    attendance_query = {}
    if program:
        attendance_query["$or"] = [
            {"course": {"$regex": f"^{program}$", "$options": "i"}},
            {"Course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.Course": {"$regex": f"^{program}$", "$options": "i"}}
        ]

    # Initialize data counters
    distribution = {
        "present": 0,
        "late": 0,
        "absent": 0
    }

    # Aggregate raw status counts
    for log in attendance_logs_col.find(attendance_query):
        students_list = log.get("students", [])
        
        for student in students_list:
            status = str(student.get("status", "")).strip().lower()
            
            if status in ["present", "true"]:
                distribution["present"] += 1
            elif status in ["late"]:
                distribution["late"] += 1
            elif status in ["absent", "false"]:
                distribution["absent"] += 1

    return jsonify(distribution), 200

@admin_bp.route("/api/admin/top-students", methods=["GET"])
@jwt_required()
def get_top_students():
    program = request.args.get("program")  

    # Optional program filter to match your application's architecture
    attendance_query = {}
    if program:
        attendance_query["$or"] = [
            {"course": {"$regex": f"^{program}$", "$options": "i"}},
            {"Course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.course": {"$regex": f"^{program}$", "$options": "i"}},
            {"students.Course": {"$regex": f"^{program}$", "$options": "i"}}
        ]

    student_records = {}
    attended_statuses = ["Present", "present", "Late", "late", True]

    for log in attendance_logs_col.find(attendance_query):
        students_list = log.get("students", [])
        
        for student in students_list:
            # Check for standard field name variations (e.g., student_id, Student_ID)
            s_id = student.get("student_id") or student.get("Student_ID")
            if not s_id:
                continue
                
            status = student.get("status")
            
            if status in attended_statuses:
                if s_id not in student_records:
                    # Concat names gracefully based on your database key styling
                    first = student.get("First_Name") or student.get("first_name") or ""
                    last = student.get("Last_Name") or student.get("last_name") or ""
                    full_name = f"{first} {last}".strip() or "Unknown Student"
                    
                    student_records[s_id] = {
                        "student_id": str(s_id),
                        "name": full_name,
                        "present_count": 0
                    }
                
                student_records[s_id]["present_count"] += 1

    sorted_students = sorted(
        student_records.values(), 
        key=lambda x: x["present_count"], 
        reverse=True
    )

    top_10_students = sorted_students[:10]
    return jsonify(top_10_students), 200

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