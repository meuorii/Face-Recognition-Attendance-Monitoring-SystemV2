// src/components/Admin/AttendanceMonitoring.jsx
import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";

import { toast } from "react-toastify";
import { FaListUl, FaFilePdf, FaExclamationTriangle, FaSlidersH, FaBookOpen, FaUserTie, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";

import DailyLogsModalAdmin from "../Admin/DailyLogsModalAdmin";
import AttendanceFilterModal from "./AttendanceMonitoring/AttendanceFilterModal";

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
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Reset pagination page kapag nagbago ang filter parameters
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedInstructor, selectedSemester, selectedSchoolYear, selectedMonth, weekStart]);

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

  // Gagamitin pa rin ang grouped structure para sa PDF generation para bawat class ay hiwalay na page pa rin ang output grid matrix nito
  const groupedByClassForPDF = filteredSessions.reduce((acc, s) => {
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

    Object.keys(groupedByClassForPDF).forEach((classId) => {
      const group = groupedByClassForPDF[classId];
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

  // Pagination Logic Computing
  const totalPages = Math.max(Math.ceil(filteredSessions.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-12 px-4">
      
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
          <button
            onClick={() => setShowFilterModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-[#0A3A23]/10 hover:border-[#008C45]/30 text-[#0A3A23] font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            <FaSlidersH size={13} className="text-[#008C45]" /> 
            <span className="hidden sm:inline ml-1">Filters</span>
          </button>

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

      {/* 2. RAW LOGS FLAT TABLE LAYOUT */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-6">
          
          <div className="overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
            <table className="w-full text-sm border-collapse text-left">
              <thead>
                <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
                  <th className="px-8 py-6 rounded-tl-[32px]">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaBookOpen size={12} />
                      </div>
                      Subject Details
                    </div>
                  </th>
                  <th className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaUserTie size={12} />
                      </div>
                      Academic Term
                    </div>
                  </th>
                  <th className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaCalendarAlt size={12} />
                      </div>
                      Date
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaCheckCircle size={12} />
                      </div>
                      Present
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaClock size={12} />
                      </div>
                      Late
                    </div>
                  </th>
                  <th className="px-6 py-6 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                        <FaTimesCircle size={12} />
                      </div>
                      Absent
                    </div>
                  </th>
                  <th className="px-8 py-6 rounded-tr-[32px] text-center w-24">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#0A3A23]/5 bg-white text-[#0A3A23]/90">
                {currentItems.map((session, index) => (
                  <tr key={session._id || index} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                    
                    {/* Subject Details with Instructor underneath */}
                    <td className="px-8 py-6">
                      <span className="block font-black text-[#0A3A23] group-hover:text-[#008C45] text-base tracking-tight transition-colors">
                        {session.subject_code} — {session.subject_title || "Systems Administration and Maintenance"}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#0A3A23]/50 font-bold mt-1.5">
                        <span className="inline-block px-2.5 py-0.5 text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] rounded-lg border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm uppercase">
                          {session.course}
                        </span>
                        <span>Section {session.section}</span>
                        <span className="text-[#008C45] font-extrabold">• Instructor: {session.instructor_first_name} {session.instructor_last_name}</span>
                      </div>
                    </td>

                    {/* Academic Term Cell */}
                    <td className="px-8 py-6 text-sm font-black text-[#0A3A23]/80 uppercase tracking-wide whitespace-nowrap">
                      <div>{semesterMap[session.semester] || session.semester}</div>
                      <div className="text-[10px] text-[#0A3A23]/40 font-medium mt-0.5">SY {session.school_year}</div>
                    </td>

                    {/* Date Cell */}
                    <td className="px-8 py-6 font-black text-[#0A3A23] text-sm whitespace-nowrap tracking-tight">
                      {formatLongDate(session.date)}
                    </td>

                    {/* Present Badge */}
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-black bg-[#008C45]/5 text-[#008C45] rounded-xl border border-[#008C45]/10 shadow-sm min-w-[45px]">
                        {(session.students || []).filter((s) => s.status === "Present").length}
                      </span>
                    </td>

                    {/* Late Badge */}
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-black bg-[#FDCC0D]/10 text-[#Cda100] rounded-xl border border-[#FDCC0D]/20 shadow-sm min-w-[45px]">
                        {(session.students || []).filter((s) => s.status === "Late").length}
                      </span>
                    </td>

                    {/* Absent Badge */}
                    <td className="px-6 py-6 text-center">
                      <span className="inline-flex items-center justify-center px-4 py-2 text-xs font-black bg-[#950606]/5 text-[#950606] rounded-xl border border-[#950606]/10 shadow-sm min-w-[45px]">
                        {(session.students || []).filter((s) => s.status === "Absent").length}
                      </span>
                    </td>

                    {/* Action Row Button */}
                    <td className="px-8 py-6 text-center">
                      <button
                        onClick={() => setActiveSession(session)}
                        className="p-2.5 rounded-xl border border-[#0A3A23]/10 bg-white text-[#0A3A23]/50 hover:text-[#008C45] hover:border-[#008C45]/30 hover:shadow-sm transition-all active:scale-95"
                      >
                        <FaListUl size={12} />
                      </button>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS CONTROLLER */}
          <div className="flex items-center justify-between border-t border-[#0A3A23]/5 pt-6 px-4">
            <span className="text-xs font-bold text-[#0A3A23]/50 tracking-wide">
              Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
              <span className="text-[#0A3A23] font-black">
                {Math.min(indexOfLastItem, filteredSessions.length)}
              </span>{" "}
              of <span className="text-[#0A3A23] font-black">{filteredSessions.length}</span> entries
            </span>

            <div className="flex items-center gap-3">
              {/* Previous Page Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              
              {/* Page Number Sequence Tracks */}
              <div className="flex items-center gap-1">
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentPage(index + 1)}
                    className={`w-9 h-9 text-xs font-black rounded-xl transition-all shadow-sm ${
                      currentPage === index + 1
                        ? "bg-[#0A3A23] text-white"
                        : "bg-white border border-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23]/5"
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
              
              {/* Next Page Button */}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

        </div>
      ) : (
        /* Empty Data State Banner */
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