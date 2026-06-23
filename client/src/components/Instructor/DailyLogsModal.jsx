// src/components/Instructor/DailyLogsModal.jsx
import { FaCalendarAlt, FaFilePdf, FaClock } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const DailyLogsModal = ({ session }) => {
  if (!session) return null;

  const students = session.students || [];

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    const dateObj = new Date(`1970-01-01T${timeStr}`);
    if (isNaN(dateObj.getTime())) return timeStr;
    return dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) return dateStr;
    return dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case "Present":
        return { text: "text-[#008C45]", bg: "bg-[#008C45]/10", border: "border-[#008C45]/30", dot: "bg-[#008C45]" };
      case "Late":
        return { text: "text-[#A18100]", bg: "bg-[#FDCC0D]/15", border: "border-[#FDCC0D]/40", dot: "bg-[#FDCC0D]" };
      case "Absent":
        return { text: "text-[#950606]", bg: "bg-[#950606]/10", border: "border-[#950606]/20", dot: "bg-[#950606]" };
      default:
        return { text: "text-gray-500", bg: "bg-gray-100", border: "border-gray-200", dot: "bg-gray-400" };
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.addImage("/ccit-logo.png", "PNG", 10, 10, 25, 25);
    doc.addImage("/prmsu.png", "PNG", pageWidth - 35, 10, 25, 25);

    doc.setFont("times", "bold");
    doc.setFontSize(14);
    doc.text("Republic of the Philippines", pageWidth / 2, 18, { align: "center" });
    doc.text("PRESIDENT RAMON MAGSAYSAY STATE UNIVERSITY", pageWidth / 2, 25, { align: "center" });

    doc.setFont("times", "italic");
    doc.setFontSize(11);
    doc.text("(Ramon Magsaysay Technological University)", pageWidth / 2, 32, { align: "center" });
    doc.text("Iba, Zambales", pageWidth / 2, 38, { align: "center" });

    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.text("COLLEGE OF COMMUNICATION AND INFORMATION TECHNOLOGY", pageWidth / 2, 45, { align: "center" });

    doc.setFontSize(14);
    doc.setTextColor(10, 58, 35);
    doc.text("DAILY ATTENDANCE REPORT", pageWidth / 2, 55, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Date: ${formatDate(session.date)}`, 20, 65);
    doc.text(`Subject: ${session.subject_code} – ${session.subject_title}`, 20, 72);
    doc.text(`Class Section: ${session.section}`, 20, 79);
    doc.text(`Semester: ${session.semester || "N/A"}`, 20, 86);
    doc.text(`School Year: ${session.school_year || "N/A"}`, 20, 93);

    autoTable(doc, {
      startY: 105,
      head: [["Student ID", "Name", "Status", "Time"]],
      body: students.map((s) => [
        s.student_id,
        `${s.first_name} ${s.last_name}`,
        s.status || "—",
        s.status === "Absent" || !s.time ? "—" : formatTime(s.time),
      ]),
      headStyles: { fillColor: [10, 58, 35], textColor: 255 },
      styles: { fontSize: 11, halign: "center" },
    });

    doc.save(`attendance_${session.date}.pdf`);
  };

  return (
    <div className="w-full bg-white text-gray-800">
      {/* Header Panel */}
      <div className="mb-6 border-b border-gray-100 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-3 text-[#0A3A23] tracking-tight">
            <FaCalendarAlt className="text-[#008C45] text-3xl" />
            Daily Attendance Logs
          </h2>
          <p className="text-gray-400 text-sm mt-1.5">
            Session Date:{" "}
            <span className="text-[#0A3A23] font-semibold bg-[#008C45]/10 px-3 py-1 rounded-lg border border-[#008C45]/20 ml-1">
              {formatDate(session.date)}
            </span>
          </p>
        </div>

        <button
          onClick={exportToPDF}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#0A3A23] hover:bg-[#008C45] text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2.5 whitespace-nowrap tracking-wide text-sm"
        >
          <FaFilePdf className="text-base" />
          Export Report
        </button>
      </div>

      {/* Meta Specs Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 p-4 rounded-2xl bg-[#F5F3F0] border border-gray-200/60 text-sm">
        <div><span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Subject</span><span className="font-bold text-[#0A3A23] whitespace-nowrap">{session.subject_code}</span></div>
        <div><span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Section</span><span className="font-bold text-[#0A3A23]">{session.section}</span></div>
        <div><span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">Semester</span><span className="font-bold text-[#0A3A23] whitespace-nowrap">{session.semester || "N/A"}</span></div>
        <div><span className="text-gray-400 block text-xs font-bold uppercase tracking-wider mb-1">S.Y.</span><span className="font-bold text-[#0A3A23] whitespace-nowrap">{session.school_year || "N/A"}</span></div>
      </div>

      {/* Desktop Table Container - Max-height fixed to 320px to prevent overflow */}
      <div className="hidden md:block border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
        <div className="max-h-[320px] overflow-y-auto overflow-x-auto custom-modal-scrollbar">
          <table className="min-w-full text-sm text-left border-collapse table-auto">
            <thead className="bg-[#0A3A23] text-white sticky top-0 z-10 shadow-sm">
              <tr className="whitespace-nowrap">
                <th className="px-8 py-3.5 font-semibold tracking-wide w-[25%]">Student ID</th>
                <th className="px-8 py-3.5 font-semibold tracking-wide w-[45%]">Name</th>
                <th className="px-8 py-3.5 font-semibold tracking-wide text-center w-[15%]">Status</th>
                <th className="px-8 py-3.5 font-semibold tracking-wide text-right w-[15%]">Time Logged</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {students.length > 0 ? (
                students.map((s, i) => {
                  const badge = getStatusStyles(s.status);
                  return (
                    <tr
                      key={i}
                      className="hover:bg-[#F5F3F0]/60 transition-colors duration-150 whitespace-nowrap"
                    >
                      <td className="px-8 py-3.5 font-mono text-gray-500 font-medium text-xs tracking-wide">{s.student_id}</td>
                      <td className="px-8 py-3.5 font-bold text-gray-700 pr-6">{`${s.first_name} ${s.last_name}`}</td>
                      <td className="px-8 py-3.5 text-center">
                        <span className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          {s.status || "—"}
                        </span>
                      </td>
                      <td className="px-8 py-3.5 text-right font-semibold text-gray-600">
                        {s.status === "Absent" || !s.time ? (
                          <span className="text-gray-300 font-normal">—</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 justify-end">
                            <FaClock className="text-gray-400 text-xs" />
                            {formatTime(s.time)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-gray-400 italic font-medium">
                    No attendance records logged for this session.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Cards Container - Max-height adjusted */}
      <div className="md:hidden max-h-[320px] overflow-y-auto pr-1 space-y-4 custom-modal-scrollbar">
        {students.length > 0 ? (
          students.map((s, i) => {
            const badge = getStatusStyles(s.status);
            return (
              <div
                key={i}
                className="p-4 rounded-2xl bg-white border border-gray-200/80 shadow-sm flex flex-col gap-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold text-gray-800 text-base tracking-tight break-words">{`${s.first_name} ${s.last_name}`}</p>
                    <p className="text-gray-400 text-xs font-mono mt-1 break-all tracking-wide">{s.student_id}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0 ${badge.bg} ${badge.text} ${badge.border}`}>
                    {s.status || "—"}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-3 mt-1 text-xs text-gray-500">
                  <span className="font-medium">Arrival Time:</span>
                  <span className="font-bold text-gray-700 flex items-center gap-1.5">
                    {s.status === "Absent" || !s.time ? (
                      <span className="text-gray-300 font-normal">—</span>
                    ) : (
                      <>
                        <FaClock className="text-gray-400" />
                        {formatTime(s.time)}
                      </>
                    )}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-center text-gray-400 italic py-8 font-medium">
            No records found.
          </p>
        )}
      </div>

      <style jsx="true">{`
        .custom-modal-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-modal-scrollbar::-webkit-scrollbar-track {
          background: #F5F3F0;
          border-radius: 10px;
        }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(10, 58, 35, 0.15);
          border-radius: 10px;
        }
        .custom-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #008C45;
        }
      `}</style>
    </div>
  );
};

export default DailyLogsModal;