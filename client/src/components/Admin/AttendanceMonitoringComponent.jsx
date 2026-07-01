// src/components/Admin/AttendanceMonitoring.jsx
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

import { toast } from "react-toastify";
import { FaListUl, FaFilePdf, FaExclamationTriangle, FaSlidersH } from "react-icons/fa";

import DailyLogsModalAdmin from "../Admin/DailyLogsModalAdmin";
import AttendanceFilterModal from "./AttendanceMonitoring/AttendanceFilterModal"; // Inimport ang bagong modal file

const API = "http://127.0.0.1:8080";

const semesterMap = {
  "1st Sem": "1st Semester",
  "2nd Sem": "2nd Semester",
  "Summer": "Mid Year",
};

export default function AttendanceMonitoring() {
  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false); // Modal control track

  // ADMIN MODAL STYLE
  const [activeSession, setActiveSession] = useState(null);

  // FILTERS
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [weekStart, setWeekStart] = useState(null);

  const weekEnd = weekStart
    ? new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6))
    : null;

  const formatName = (value = "") =>
    value
      .trim()
      .split(" ")
      .map((w) =>
        w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");

  const formatLongDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/api/admin/attendance/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      let allSessions = res.data.attendance_logs || [];
      allSessions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setSessions(allSessions);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Failed to load attendance sessions.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    let filtered = [...sessions];

    if (selectedClass) filtered = filtered.filter((s) => s.class_id === selectedClass);
    if (selectedSemester) filtered = filtered.filter((s) => s.semester === selectedSemester);
    if (selectedInstructor) {
      filtered = filtered.filter(
        (s) => `${s.instructor_first_name} ${s.instructor_last_name}` === selectedInstructor
      );
    }
    if (selectedSchoolYear) filtered = filtered.filter((s) => s.school_year === selectedSchoolYear);
    if (selectedMonth) filtered = filtered.filter((s) => new Date(s.date).getMonth() + 1 === Number(selectedMonth));
    if (weekStart) {
      const start = new Date(weekStart);
      const end = weekEnd;
      filtered = filtered.filter((s) => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      });
    }

    setFilteredSessions(filtered);
  }, [sessions, selectedClass, selectedInstructor, selectedSemester, selectedSchoolYear, selectedMonth, weekStart]);

  const groupedByClass = filteredSessions.reduce((acc, s) => {
    if (!acc[s.class_id]) {
      acc[s.class_id] = {
        meta: {
          subject_code: s.subject_code,
          subject_title: s.subject_title,
          course: s.course,
          section: s.section,
          semester: s.semester,
          school_year: s.school_year,
          instructor_first_name: s.instructor_first_name,
          instructor_last_name: s.instructor_last_name,
        },
        rows: [],
      };
    }
    acc[s.class_id].rows.push(s);
    return acc;
  }, {});

  const exportToPDF = () => {
    if (filteredSessions.length === 0) {
      toast.warn("No attendance to export.");
      return;
    }

    const doc = new jsPDF("l", "mm", "a3");
    const width = doc.internal.pageSize.getWidth();
    let isFirstPage = true;

    Object.keys(groupedByClass).forEach((classId) => {
      const group = groupedByClass[classId];
      const sessions = group.rows.sort((a, b) => new Date(a.date) - new Date(b.date));

      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const studentMap = {};
      sessions.forEach((session) => {
        (session.students || []).forEach((stud) => {
          const fullName = stud.student_name || `${formatName(stud.last_name || "")}, ${formatName(stud.first_name || "")}`;
          if (!studentMap[stud.student_id]) {
            studentMap[stud.student_id] = { id: stud.student_id, name: fullName, logs: {} };
          }
          studentMap[stud.student_id].logs[session.date] = stud.status;
        });
      });

      const dateColumns = sessions.map((s) => s.date);
      const tableHead = [["Student Name", ...dateColumns]];
      const tableBody = Object.values(studentMap).map((stud) => {
        const row = [stud.name];
        dateColumns.forEach((date) => {
          const status = stud.logs[date] || "";
          row.push(status === "Present" ? "P" : status === "Late" ? "L" : status === "Absent" ? "A" : "");
        });
        return row;
      });

      doc.addImage("/prmsu.png", "PNG", 15, 8, 20, 20);
      doc.addImage("/ccit-logo.png", "PNG", width - 35, 8, 20, 20);

      doc.setFont("times", "bold"); doc.setFontSize(14);
      doc.text("PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY", width / 2, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text("College of Communication and Information Technology", width / 2, 28, { align: "center" });
      doc.setFont("times", "italic"); doc.setFontSize(11);
      doc.text("(Ramon Magsaysay Technological University)", width / 2, 33, { align: "center" });
      doc.text("Iba, Zambales", width / 2, 38, { align: "center" });

      doc.setFontSize(16); doc.setTextColor(10, 58, 35);
      doc.text("ATTENDANCE REPORT", width / 2, 48, { align: "center" });
      doc.setTextColor(0, 0, 0);

      const meta = group.meta;
      doc.setFont("times", "normal"); doc.setFontSize(11);
      doc.text(`Instructor: ${meta.instructor_first_name} ${meta.instructor_last_name}`, 15, 55);
      doc.text(`Subject: ${meta.subject_code} — ${meta.subject_title}`, 15, 62);
      doc.text(`Course & Section: ${meta.course} — ${meta.section}`, 15, 69);
      doc.text(`Semester: ${meta.semester}`, 15, 76);
      doc.text(`School Year: ${meta.school_year}`, 15, 83);

      autoTable(doc, {
        startY: 95, head: tableHead, body: tableBody,
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [10, 58, 35], textColor: 255 },
        columnStyles: { 0: { halign: "left" } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const val = data.cell.raw;
            if (val === "A") data.cell.styles.textColor = [220, 38, 38];
            if (val === "L") data.cell.styles.textColor = [245, 158, 11];
            if (val === "P") data.cell.styles.textColor = [0, 140, 69];
          }
        },
      });
    });

    doc.save("Admin_Attendance_Report.pdf");
  };

  return (
    <div className="space-y-12 px-4 bg-[#F5F3F0] min-h-screen py-10">
      
      {/* 1. COMPACT PREMIUM HEADER WITH ALIGNED CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-4 border-b border-[#0A3A23]/5">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Attendance Monitoring
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Real-time Academic Logs & Analytics
          </p>
        </div>

        {/* Action Controls Toolbar on Right Side */}
        <div className="flex items-center gap-3">
          {/* Trigger Button to Show Filter Modal */}
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center justify-center gap-2 px-3 py-3 bg-white border border-[#0A3A23]/10 hover:border-[#008C45]/30 text-[#0A3A23] font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            <FaSlidersH size={13} className="text-[#008C45]" /> 
          </button>

          {/* Export PDF Actions */}
          {filteredSessions.length > 0 && (
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5"
            >
              <FaFilePdf size={13} /> Export PDF
            </button>
          )}
        </div>
      </div>

      {/* 2. GROUPED TABLES DATA CONTAINER */}
      {Object.keys(groupedByClass).length > 0 ? (
        <div className="space-y-12">
          {Object.entries(groupedByClass).map(([classId, group]) => (
            <div key={classId} className="space-y-4">
              
              {/* Table Metadata Banner */}
              <div className="pl-2 space-y-1">
                <h3 className="text-base font-black text-[#0A3A23] tracking-tight">
                  {group.meta.subject_code} — {group.meta.subject_title}
                </h3>
                <p className="text-[11px] font-bold text-[#0A3A23]/60 uppercase tracking-wider">
                  {group.meta.course} {group.meta.section} • {semesterMap[group.meta.semester]} • {group.meta.school_year}
                </p>
                <p className="text-[11px] font-bold text-[#008C45] uppercase tracking-wide">
                  Instructor: {group.meta.instructor_first_name} {group.meta.instructor_last_name}
                </p>
              </div>

              {/* Data Grid Table */}
              <div className="overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
                      <th className="px-8 py-5 text-left">Date</th>
                      <th className="px-6 py-5 text-center">Present</th>
                      <th className="px-6 py-5 text-center">Late</th>
                      <th className="px-6 py-5 text-center">Absent</th>
                      <th className="px-8 py-5 text-center w-24">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A3A23]/5 bg-white text-[#0A3A23]/90">
                    {group.rows.map((session) => (
                      <tr key={session._id} className="hover:bg-[#F5F3F0]/40 transition-all duration-200">
                        <td className="px-8 py-5 font-bold text-xs">{formatLongDate(session.date)}</td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-[#008C45]/10 text-[#008C45]">
                            {session.students.filter((s) => s.status === "Present").length}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-amber-100 text-amber-700">
                            {session.students.filter((s) => s.status === "Late").length}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-black bg-red-100 text-red-700">
                            {session.students.filter((s) => s.status === "Absent").length}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <button
                            onClick={() => setActiveSession(session)}
                            className="p-2.5 text-[#0A3A23] hover:text-white hover:bg-[#0A3A23] rounded-xl transition-all duration-200 shadow-sm border border-[#0A3A23]/10"
                          >
                            <FaListUl size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty Data State State Banner */
        <div className="text-center bg-white border border-[#0A3A23]/5 rounded-[32px] py-16 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest shadow-[0_20px_50px_rgba(10,58,35,0.02)]">
          <div className="flex flex-col items-center gap-2 justify-center">
            <FaExclamationTriangle size={16} className="text-[#0A3A23]/30" />
            <span>{loading ? "Loading attendance logs..." : "No attendance logs found."}</span>
          </div>
        </div>
      )}

      {/* 3. DEDICATED ATTENDANCE FILTER MODAL ROUTER */}
      <AttendanceFilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        sessions={sessions}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedInstructor={selectedInstructor}
        setSelectedInstructor={setSelectedInstructor}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        selectedSchoolYear={selectedSchoolYear}
        setSelectedSchoolYear={setSelectedSchoolYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        weekStart={weekStart}
        setWeekStart={setWeekStart}
      />

      {/* Admin Info Log Modal */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-[#0A3A23]/40 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white p-8 rounded-[28px] w-full max-w-3xl shadow-[0_25px_60px_rgba(10,58,35,0.15)] border border-[#0A3A23]/10">  
            <DailyLogsModalAdmin session={activeSession} onClose={() => setActiveSession(null)} />
          </div>
        </div>
      )}

    </div>
  );
}