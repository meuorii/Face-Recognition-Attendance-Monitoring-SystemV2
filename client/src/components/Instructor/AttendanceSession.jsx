// src/components/Instructor/AttendanceSession.jsx
import React, { useEffect, useState } from "react";
import { getAttendanceLogs } from "../../services/api";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcuseModal from "./ExcuseModal";
import { useModal } from "./ModalManager"; // 👈 Import your global modal custom hook
import { 
  FileSpreadsheet, 
  Download, 
  Users, 
  UserCheck, 
  UserX, 
  UserMinus, 
  Calendar, 
  Clock, 
  Search,
  ExternalLink 
} from "lucide-react";

const AttendanceSession = () => {
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [lastClass, setLastClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionStart, setSessionStart] = useState(null);
  const [sessionEnd, setSessionEnd] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { openModal, closeModal } = useModal(); // 👈 Destructure open/close methods

  const formatName = (value = "") => {
    return value
      .trim()
      .split(" ")
      .map((w) =>
        w.length > 0
          ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
          : ""
      )
      .join(" ");
  };

  const convertTimeTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    try {
      const [hours, minutes] = timeStr.split(":");
      let h = parseInt(hours, 10);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12;
      h = h ? h : 12;
      const formattedHours = h < 10 ? `0${h}` : h;
      return `${formattedHours}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  useEffect(() => {
    const fetchLatestAttendance = async () => {
      try {
        const classId = localStorage.getItem("lastClassId");
        if (!classId) {
          setRecognizedStudents([]);
          setLastClass(null);
          setLoading(false);
          return;
        }

        const res = await getAttendanceLogs(classId);
        const dateGroups = res?.logs || [];

        if (dateGroups.length === 0) {
          setRecognizedStudents([]);
          setLastClass(null);
          setLoading(false);
          return;
        }

        dateGroups.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latestDate = dateGroups[0];
        const sessions = latestDate.logs || [];
        const filteredSessions = sessions.filter((s) => s.class_id === classId);

        if (filteredSessions.length === 0) {
          setRecognizedStudents([]);
          setLastClass(null);
          setLoading(false);
          return;
        }

        filteredSessions.sort((a, b) => b.start_time.localeCompare(a.start_time));
        const latestSession = filteredSessions[0];

        setLastClass(latestSession);
        setSessionStart(latestSession.start_time);
        setSessionEnd(latestSession.end_time);

        const students = (latestSession.students || []).map((s) => {
          let logTime = "N/A";
          
          if (s.status === "Absent") {
            logTime = "—";
          } else if (s.time && s.time !== "") {
            logTime = convertTimeTo12Hour(s.time);
          } else if (s.time_logged) {
            logTime = new Date(s.time_logged).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            });
          }

          return {
            ...s,
            first_name: formatName(s.first_name || ""),
            last_name: formatName(s.last_name || ""),
            time: logTime,
          };
        });

        students.sort((a, b) =>
          `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
        );

        setRecognizedStudents(students);
      } catch (err) {
        console.error("❌ Error in AttendanceSession:", err);
        toast.error("Failed to load attendance summary");
      } finally {
        loading && setLoading(false);
      }
    };

    fetchLatestAttendance();
    const handleFocus = () => fetchLatestAttendance();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const formatDate = (dateStr) =>
    dateStr
      ? new Date(dateStr).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "";

  const handleExcuseMarked = (studentId, reason) => {
    setRecognizedStudents((prev) =>
      prev.map((s) =>
        s.student_id === studentId
          ? { ...s, status: "Excused", excuse_reason: reason }
          : s
      )
    );
  };

  // 👈 Trigger global context modal instead of local flags
  const handleOpenExcuseModal = (student) => {
    openModal(
      <ExcuseModal
        student={student}
        classId={lastClass?.class_id || localStorage.getItem("lastClassId")}
        instructorId={localStorage.getItem("instructorId")}
        onExcuseMarked={handleExcuseMarked}
        onClose={closeModal}
      />
    );
  };

  const formatSemester = (sem) => {
    if (!sem) return "";
    const s = sem.toLowerCase();
    if (s.includes("1st")) return "1st Semester";
    if (s.includes("2nd")) return "2nd Semester";
    if (s.includes("mid") || s.includes("sum")) return "Summer";
    return sem;
  };

  const exportToPDF = () => {
    if (recognizedStudents.length === 0) {
      toast.info("No attendance records to export.");
      return;
    }

    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addImage("/ccit-logo.png", "PNG", 15, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 40, 10, 25, 25);

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Republic of the Philippines", pageWidth / 2, 18, { align: "center" });
    doc.text("President Ramon Magsaysay State University", pageWidth / 2, 25, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("(Ramon Magsaysay Technological University)", pageWidth / 2, 32, { align: "center" });
    doc.text("Iba, Zambales", pageWidth / 2, 38, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("COLLEGE OF COMMUNICATION AND INFORMATION TECHNOLOGY", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(0, 140, 69);
    doc.text("ATTENDANCE SUMMARY REPORT", pageWidth / 2, 55, { align: "center" });

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    if (lastClass) {
      doc.text(`Subject: ${lastClass.subject_code} – ${lastClass.subject_title}`, 20, 65);
      doc.text(`Instructor: ${formatName(lastClass.instructor_first_name)} ${formatName(lastClass.instructor_last_name)}`, 20, 72);
      doc.text(`Course & Section: ${lastClass.course} ${lastClass.section}`, 20, 79);
      doc.text(`Academic Year: ${lastClass.school_year || "N/A"} | ${formatSemester(lastClass.semester)}`, 20, 86);
    }

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Date: ${formatDate(new Date().toISOString())}`, 20, 94);

    if (sessionStart && sessionEnd) {
      doc.text(`Class Schedule: ${convertTimeTo12Hour(sessionStart)} - ${convertTimeTo12Hour(sessionEnd)}`, 20, 101);
    }

    const presentCount = recognizedStudents.filter((s) => s.status === "Present").length;
    const absentCount = recognizedStudents.filter((s) => s.status === "Absent").length;
    const lateCount = recognizedStudents.filter((s) => s.status === "Late").length;

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text(`Summary: Present: ${presentCount} | Absent: ${absentCount} | Late: ${lateCount}`, 20, 111);

    autoTable(doc, {
      startY: 118,
      head: [["Student ID", "Name", "Status", "Time"]],
      body: recognizedStudents.map((s) => [
        s.student_id,
        `${formatName(s.first_name)} ${formatName(s.last_name)}`,
        s.status,
        s.time,
      ]),
    });

    doc.save("attendance_summary_report.pdf");
  };

  const presentCount = recognizedStudents.filter((s) => s.status === "Present").length;
  const lateCount = recognizedStudents.filter((s) => s.status === "Late").length;
  const absentCount = recognizedStudents.filter((s) => s.status === "Absent").length;
  const excusedCount = recognizedStudents.filter((s) => s.status === "Excused").length;

  const filteredStudents = recognizedStudents.filter((student) =>
    `${student.first_name} ${student.last_name} ${student.student_id}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full text-[#0A3A23] font-sans antialiased box-border p-0 m-0">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 border-b border-[#0A3A23]/5 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-[#0A3A23]">
              Attendance Summary
            </h2>
          </div>
          <p className="text-[11px] text-[#0A3A23]/50 font-bold uppercase tracking-widest mt-1.5">
            View student attendance and logs for this session
          </p>
        </div>

        {recognizedStudents.length > 0 && (
          <button
            onClick={exportToPDF}
            className="inline-flex items-center justify-center gap-2 bg-[#0A3A23] hover:bg-[#0A3A23]/95 text-white text-xs font-extrabold uppercase tracking-widest px-6 py-4 rounded-xl transition-all duration-150 shadow-xs active:scale-[0.98]"
          >
            <Download size={15} strokeWidth={2.5} />
            Export PDF Report
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs font-bold text-[#0A3A23]/40 uppercase tracking-widest animate-pulse">
          Loading attendance records...
        </div>
      ) : recognizedStudents.length === 0 ? (
        <div className="bg-[#F5F3F0] p-14 text-center rounded-[28px] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]/40 uppercase tracking-widest">
          No attendance logs found for this session.
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* 📊 Section A: Enhanced Dashboard / Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-5">
            
            {/* Meta Stats Panel (Made wider to display the full subject title cleanly) */}
            <div className="col-span-2 bg-[#0A3A23] text-white p-6 rounded-2xl flex flex-col justify-between shadow-sm min-h-[150px]">
              <div className="flex items-center justify-between text-white/60">
                <span className="text-[10px] font-black uppercase tracking-wider">Class Info</span>
                <Clock size={18} />
              </div>
              <div className="mt-4 space-y-1">
                <div className="flex items-baseline gap-2">
                  <p className="text-base font-black tracking-wide shrink-0">{lastClass?.subject_code}</p>
                  <span className="text-white/40 text-xs">—</span>
                  <p className="text-xs text-white/90 font-bold truncate tracking-wide">{lastClass?.subject_title}</p>
                </div>
                <p className="text-xs text-white/95 font-semibold truncate">
                  {lastClass ? `${lastClass.course} ${lastClass.section}` : ""}
                </p>
                <p className="text-[11px] text-white/70 font-medium truncate">
                  S.Y {lastClass?.school_year} | {formatSemester(lastClass?.semester)}
                </p>
                {sessionStart && sessionEnd && (
                  <p className="text-[10px] text-white/90 font-bold mt-2 bg-white/10 px-2 py-0.5 rounded inline-block tracking-wide">
                    {convertTimeTo12Hour(sessionStart)} - {convertTimeTo12Hour(sessionEnd)}
                  </p>
                )}
              </div>
            </div>

            {/* Total Students */}
            <div className="bg-white border border-[#0A3A23]/10 p-6 md:p-7 rounded-2xl flex items-center gap-5 shadow-xs">
              <div className="p-4 bg-[#F5F3F0] text-[#0A3A23] rounded-xl shrink-0">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Total Students</p>
                <p className="text-2xl md:text-3xl font-black text-[#0A3A23] mt-1 tracking-tight">{recognizedStudents.length}</p>
              </div>
            </div>

            {/* Present Count */}
            <div className="bg-white border border-[#0A3A23]/10 p-6 md:p-7 rounded-2xl flex items-center gap-5 shadow-xs">
              <div className="p-4 bg-emerald-50 text-[#008C45] rounded-xl shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Present</p>
                <p className="text-2xl md:text-3xl font-black text-[#008C45] mt-1 tracking-tight">{presentCount}</p>
              </div>
            </div>

            {/* Late Count */}
            <div className="bg-white border border-[#0A3A23]/10 p-6 md:p-7 rounded-2xl flex items-center gap-5 shadow-xs">
              <div className="p-4 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <Clock size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Late</p>
                <p className="text-2xl md:text-3xl font-black text-amber-600 mt-1 tracking-tight">{lateCount}</p>
              </div>
            </div>

            {/* Absent Count */}
            <div className="bg-white border border-[#0A3A23]/10 p-6 md:p-7 rounded-2xl flex items-center gap-5 shadow-xs">
              <div className="p-4 bg-red-50 text-[#950606] rounded-xl shrink-0">
                <UserX size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-wider">Absent</p>
                <p className="text-2xl md:text-3xl font-black text-[#950606] mt-1 tracking-tight">{absentCount}</p>
              </div>
            </div>

          </div>

          {/* 📋 Section B: Enhanced Student List View */}
          <div className="bg-white border border-[#0A3A23]/5 rounded-[24px] shadow-sm overflow-hidden">
            
            {/* Search and Header Filters */}
            <div className="p-6 px-7 border-b border-[#0A3A23]/5 bg-[#F5F3F0]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-80">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-neutral-400 pointer-events-none">
                    <Search size={15} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search student name or ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-xs font-semibold bg-white border border-[#0A3A23]/10 rounded-xl focus:outline-none focus:border-[#0A3A23] text-[#0A3A23] transition-all placeholder:text-neutral-400"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-[11px] font-black text-neutral-400 uppercase tracking-wider">
                <Calendar size={14} className="text-[#0A3A23]" />
                <span>Date: {formatDate(new Date().toISOString())}</span>
              </div>
            </div>

            {/* Enhanced Student Roster Rows */}
            <div className="max-h-[520px] overflow-y-auto divide-y divide-[#0A3A23]/5 custom-scrollbar">
              {filteredStudents.length === 0 ? (
                <div className="p-16 text-center text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  No student records found.
                </div>
              ) : (
                filteredStudents.map((student, idx) => {
                  let badgeColors = "bg-[#008C45] text-white";
                  if (student.status === "Late") badgeColors = "bg-amber-500 text-white";
                  if (student.status === "Absent") badgeColors = "bg-[#950606] text-white";
                  if (student.status === "Excused") badgeColors = "bg-blue-600 text-white";

                  return (
                    <div 
                      key={`${student.student_id}-${idx}`}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-5 px-7 hover:bg-[#F5F3F0]/25 transition-all duration-150 gap-5"
                    >
                      {/* Identity Column */}
                      <div className="flex items-center gap-4 sm:w-2/5 min-w-0">
                        <div className="h-10 w-10 bg-[#F5F3F0] rounded-xl border border-[#0A3A23]/5 flex items-center justify-center font-black text-xs text-[#0A3A23] shrink-0 shadow-2xs">
                          {student.last_name.charAt(0)}
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-black text-[#0A3A23] uppercase tracking-wide truncate">
                            {student.last_name}, {student.first_name}
                          </h4>
                          <p className="text-[11px] font-bold text-neutral-400 mt-0.5 tracking-wide">
                            ID: {student.student_id}
                          </p>
                        </div>
                      </div>

                      {/* Log Timestamp Column */}
                      <div className="sm:w-1/4 flex flex-row sm:flex-col items-center sm:items-start justify-between sm:justify-center gap-2">
                        <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest sm:hidden">Time:</span>
                        <div className="flex items-center gap-2 text-xs font-bold text-[#0A3A23]/80 tracking-wide">
                          <Clock size={14} className="text-neutral-400" />
                          <span>{student.time}</span>
                        </div>
                      </div>

                      {/* Action & Badge Column */}
                      <div className="flex items-center justify-between sm:justify-end gap-3.5 sm:w-1/3 shrink-0">
                        <span className={`text-[10px] font-black tracking-widest uppercase px-3.5 py-2 rounded-lg text-center min-w-[95px] shadow-2xs ${badgeColors}`}>
                          {student.status}
                        </span>

                        {(student.status === "Absent" || student.status === "Late") && (
                          <button
                            onClick={() => handleOpenExcuseModal(student)} // 👈 Updated click handler
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider bg-white hover:bg-[#0A3A23] text-[#0A3A23] hover:text-white border border-[#0A3A23]/10 rounded-lg transition-all shadow-2xs"
                          >
                            Excuse
                            <ExternalLink size={12} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceSession;