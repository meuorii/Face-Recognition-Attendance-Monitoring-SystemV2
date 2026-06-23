// src/components/Instructor/Attendance/AttendanceReports.jsx
import { useEffect, useState } from "react";
import "react-datepicker/dist/react-datepicker.css";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { SlidersHorizontal, FileSpreadsheet, X, Calendar, Layers, GraduationCap } from "lucide-react";
import { toast } from "react-toastify";

import {
  getAllClassesByInstructor,
  getInstructorSessions,
  getAllInstructorSessions,
} from "../../services/api";

import AttendanceReportContent from "./Reports/AttendanceReportContent";
import FilterConfigModal from "./Reports/FilterConfigModal";
import { useModal } from "./ModalManager";

const semesterMap = {
  "1st Sem": "1st Semester",
  "2nd Sem": "2nd Semester",
  "Summer": "Mid Year",
};

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const AttendanceReports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(""); // State para sa course filtration
  const [selectedSemester, setSelectedSemester] = useState("");
  const [selectedSchoolYear, setSelectedSchoolYear] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [weekStart, setWeekStart] = useState(null);

  const [sessions, setSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);

  const { openModal, closeModal } = useModal();
  const instructor = JSON.parse(localStorage.getItem("userData"));

  const weekEnd = weekStart
    ? new Date(new Date(weekStart).setDate(new Date(weekStart).getDate() + 6))
    : null;

  const formatName = (value = "") => {
    return value.trim().split(" ").map((w) => w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : "").join(" ");
  };

  useEffect(() => {
    if (!instructor?.instructor_id) {
      toast.error("Instructor data missing.");
      return;
    }
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getAllClassesByInstructor(instructor.instructor_id);
      setClasses(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load classes.");
    }
  };

  const fetchSessions = async () => {
    setLoading(true);
    try {
      let data = [];
      if (!selectedClass) {
        data = await getAllInstructorSessions(instructor.instructor_id);
      } else {
        data = await getInstructorSessions(selectedClass);
      }

      const rawSessions = Array.isArray(data) ? data : [];

      const classMap = {};
      classes.forEach((cls) => {
        if (cls && cls._id) {
          classMap[cls._id.toString()] = cls;
        }
      });

      const normalizedData = rawSessions.map((s) => {
        const targetClassId = s.class_id && typeof s.class_id === "object" 
          ? s.class_id._id?.toString() 
          : s.class_id?.toString();

        const cls = classMap[targetClassId];

        return {
          ...s,
          subject_code: s.subject_code || cls?.subject_code || "Unknown",
          subject_title: s.subject_title || cls?.subject_title || "Unknown",
          // Unahin ang course field mula sa log, kung wala ay gamitin ang nasa class settings bilang fallback
          course: s.course || cls?.course || "",
          section: s.section || cls?.section || "",
          semester: s.semester || cls?.semester || "",
          school_year: s.school_year || cls?.school_year || "",
        };
      });

      setSessions(normalizedData.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      console.error("❌ Error loading sessions:", error);
      toast.error("Failed to load sessions.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classes.length > 0) fetchSessions();
  }, [selectedClass, classes]);

  // Integrated Multi-parameter filtering loop logic
  useEffect(() => {
    let filtered = [...sessions];
    if (selectedCourse) filtered = filtered.filter((s) => s.course === selectedCourse);
    if (selectedSemester) filtered = filtered.filter((s) => s.semester === selectedSemester);
    if (selectedSchoolYear) filtered = filtered.filter((s) => s.school_year === selectedSchoolYear);
    if (selectedMonth) {
      filtered = filtered.filter((s) => new Date(s.date).getMonth() + 1 === Number(selectedMonth));
    }
    if (weekStart) {
      const start = new Date(weekStart);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      filtered = filtered.filter((s) => {
        const d = new Date(s.date);
        return d >= start && d <= end;
      });
    }
    setFilteredSessions(filtered);
  }, [sessions, selectedCourse, selectedSemester, selectedSchoolYear, selectedMonth, weekStart]);

  const exportToPDF = () => {
    if (filteredSessions.length === 0) {
      toast.warn("No attendance to export.");
      return;
    }

    const grouped = {};
    filteredSessions.forEach((s) => {
      if (!grouped[s.class_id]) grouped[s.class_id] = [];
      grouped[s.class_id].push(s);
    });

    const doc = new jsPDF("l", "mm", "a3");
    const width = doc.internal.pageSize.getWidth();
    let isFirstPage = true;

    Object.keys(grouped).forEach((classId) => {
      const classSessions = grouped[classId].sort((a, b) => new Date(a.date) - new Date(b.date));
      const meta = classes.find((c) => c._id === classId) || {
        subject_code: classSessions[0]?.subject_code || "",
        subject_title: classSessions[0]?.subject_title || "",
        course: classSessions[0]?.course || "",
        section: classSessions[0]?.section || "",
        semester: classSessions[0]?.semester || "",
        school_year: classSessions[0]?.school_year || "",
      };

      if (!isFirstPage) doc.addPage();
      isFirstPage = false;

      const studentMap = {};
      classSessions.forEach((session) => {
        (session.students || []).forEach((stud) => {
          const fullName = stud.student_name || `${formatName(stud.last_name || "")}, ${formatName(stud.first_name || "")}` || "Unknown";
          const key = stud.student_id || fullName;
          if (!studentMap[key]) {
            studentMap[key] = { id: stud.student_id, name: fullName, logs: {} };
          }
          studentMap[key].logs[session.date] = stud.status;
        });
      });

      const dateColumns = classSessions.map((s) => s.date);
      const allStudents = Object.values(studentMap).sort((a, b) => {
        return a.name.split(",")[0].trim().toLowerCase().localeCompare(b.name.split(",")[0].trim().toLowerCase());
      });

      const tableHead = [["Student Name", ...dateColumns]];
      const tableBody = allStudents.map((student) => {
        const row = [student.name];
        dateColumns.forEach((date) => {
          const status = student.logs[date] || "";
          row.push(status === "Present" ? "P" : status === "Late" ? "L" : status === "Absent" ? "A" : "");
        });
        return row;
      });

      doc.addImage("/prmsu.png", "PNG", 15, 8, 25, 25);
      doc.addImage("/ccit-logo.png", "PNG", width - 40, 8, 25, 25);
      doc.setFont("times", "bold").setFontSize(14);
      doc.text("PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY", width / 2, 20, { align: "center" });
      doc.setFontSize(12).text("College of Communication and Information Technology", width / 2, 28, { align: "center" });
      doc.setFont("times", "italic").setFontSize(11).text("(Ramon Magsaysay Technological University)", width / 2, 32, { align: "center" });
      doc.text("Iba, Zambales", width / 2, 38, { align: "center" });
      doc.setFontSize(16).setTextColor(34, 197, 94).text("ATTENDANCE REPORT", width / 2, 48, { align: "center" });
      doc.setTextColor(0, 0, 0);

      const instructorName = `${formatName(instructor.first_name)} ${formatName(instructor.last_name)}`;
      doc.setFontSize(11).text(`Instructor: ${instructorName}`, 15, 55);
      doc.text(`Subject: ${meta.subject_code} — ${meta.subject_title}`, 15, 62);
      doc.text(`Course & Section: ${meta.course} — ${meta.section}`, 15, 69);
      doc.text(`Semester: ${meta.semester}`, 15, 76);
      doc.text(`School Year: ${meta.school_year}`, 15, 83);

      if (selectedMonth) doc.text(`Month: ${monthNames[selectedMonth - 1]}`, width - 80, 55);
      if (weekStart) doc.text(`Week: ${weekStart.toISOString().split("T")[0]} to ${weekEnd.toISOString().split("T")[0]}`, width - 120, 62);

      autoTable(doc, {
        startY: 95,
        head: tableHead,
        body: tableBody,
        styles: { fontSize: 9, halign: "center" },
        headStyles: { fillColor: [10, 58, 35], textColor: 255 },
        columnStyles: { 0: { halign: "left" } },
        didParseCell: (data) => {
          if (data.section === "body" && data.column.index > 0) {
            const val = data.cell.raw;
            if (val === "A") data.cell.styles.textColor = [220, 38, 38];
            if (val === "L") data.cell.styles.textColor = [217, 119, 6];
            if (val === "P") data.cell.styles.textColor = [22, 163, 74];
          }
        },
      });
    });

    doc.save("Attendance_Report.pdf");
  };

  const getSelectedClassLabel = () => {
    const target = classes.find(c => c._id === selectedClass);
    return target ? `${target.subject_code} (${target.section})` : null;
  };

  const handleOpenFilterModal = () => {
    openModal(
      <FilterConfigModal 
        classes={classes}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        selectedSemester={selectedSemester}
        setSelectedSemester={setSelectedSemester}
        selectedSchoolYear={selectedSchoolYear}
        setSelectedSchoolYear={setSelectedSchoolYear}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        weekStart={weekStart}
        setWeekStart={setWeekStart}
        monthNames={monthNames}
        onClose={closeModal}
      />
    );
  };

  const hasActiveFilters = selectedClass || selectedCourse || selectedSemester || selectedSchoolYear || selectedMonth || weekStart;

  return (
    <div className="space-y-8 px-4">
      {/* HEADER BLOCK */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#0A3A23]/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Attendance Reports</h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Review, organize, and download attendance parameters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenFilterModal}
            className="flex items-center gap-2 px-3 py-3 rounded-2xl bg-[#F5F3F0] text-[#0A3A23] border border-[#0A3A23]/5 font-black text-xs uppercase tracking-wider hover:bg-[#0A3A23]/5 transition-all shadow-sm"
          >
            <SlidersHorizontal size={14} strokeWidth={2.5} /> 
          </button>

          {filteredSessions.length > 0 && (
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white font-black text-xs uppercase tracking-wider hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-[#008C45]/10"
            >
              <FileSpreadsheet size={14} strokeWidth={2.5} /> Export PDF
            </button>
          )}
        </div>
      </div>

      {/* FILTER ACTIVE CARDS / BADGES */}
      {hasActiveFilters && (
        <div className="bg-white border border-[#0A3A23]/10 p-6 rounded-[24px] shadow-[0_16px_40px_rgba(10,58,35,0.03)] space-y-4">
          
          {/* Header Action Section ng Active Filters */}
          <div className="flex items-center justify-between border-b border-[#0A3A23]/5 pb-3">
            <p className="text-[10px] font-black tracking-widest text-[#0A3A23]/40 uppercase">
              Active Filter Summary
            </p>
            <button 
              onClick={() => {
                setSelectedCourse("");
                setSelectedClass("");
                setSelectedSemester("");
                setSelectedSchoolYear("");
                setSelectedMonth("");
                setWeekStart(null);
              }}
              className="text-[10px] font-black uppercase text-red-600 tracking-wider hover:underline transition-all"
            >
              Clear All
            </button>
          </div>
          
          {/* Premium Filter Badges Container */}
          <div className="flex flex-wrap gap-3">
            
            {/* Course Premium Badge */}
            {selectedCourse && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <Layers size={13} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">Course</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{selectedCourse}</span>
                </div>
                <button
                  onClick={() => setSelectedCourse("")}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
            {/* Class Premium Badge */}
            {selectedClass && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <Layers size={13} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">Class</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{getSelectedClassLabel()}</span>
                </div>
                <button
                  onClick={() => setSelectedClass("")}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
            {/* Semester Premium Badge */}
            {selectedSemester && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <GraduationCap size={14} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">Term</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{semesterMap[selectedSemester] || selectedSemester}</span>
                </div>
                <button
                  onClick={() => setSelectedSemester("")}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
            {/* School Year Premium Badge */}
            {selectedSchoolYear && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">School Year</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{selectedSchoolYear}</span>
                </div>
                <button
                  onClick={() => setSelectedSchoolYear("")}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
            {/* Month Premium Badge */}
            {selectedMonth && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">Month</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{monthNames[selectedMonth - 1]}</span>
                </div>
                <button
                  onClick={() => setSelectedMonth("")}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
            {/* Week Premium Badge */}
            {weekStart && (
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F5F3F0] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
                <div className="flex flex-col text-left leading-tight ml-0.5">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider">Week</span>
                  <span className="text-[#0A3A23] font-extrabold mt-0.5">{weekStart.toISOString().split("T")[0]}</span>
                </div>
                <button
                  onClick={() => setWeekStart(null)}
                  className="p-1 rounded-md hover:bg-red-50 text-[#0A3A23]/30 hover:text-red-500 transition-all ml-2"
                >
                  <X size={13} strokeWidth={2.5} />
                </button>
              </span>
            )}
            
          </div>
        </div>
      )}

      {/* CONTENT ELEMENT LOGS DISPLAY LAYER */}
      <AttendanceReportContent 
        filteredSessions={filteredSessions} 
        loading={loading} 
        semesterMap={semesterMap} 
      />
    </div>
  );
};

export default AttendanceReports;