// src/components/Instructor/Attendance/AttendanceReportContent.jsx
import { useState, useEffect } from "react";
import { Eye, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { FaBookOpen, FaLayerGroup, FaCalendarAlt, FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { useModal } from "../ModalManager";
import DailyLogsModal from "../DailyLogsModal";

const AttendanceReportContent = ({ filteredSessions = [], loading, semesterMap }) => {
  const { openModal } = useModal();

  // Pagination State Tracks (Kaparehong-kapareho ng sa StudentsTableView)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // I-reset ang page sa 1 kapag nagbago ang dataset ng sessions
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredSessions.length]);

  const formatLongDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="text-center py-24 text-xs font-black text-[#0A3A23]/40 uppercase tracking-widest animate-pulse">
        Processing logs datasets...
      </div>
    );
  }

  // Enhanced Elegant Empty State Style
  if (filteredSessions.length === 0) {
    return (
      <div className="bg-[#F5F3F0] py-16 px-8 text-center rounded-[32px] border border-[#0A3A23]/5 max-w-xl mx-auto my-12 shadow-[0_16px_45px_rgba(10,58,35,0.02)]">
        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto text-[#0A3A23]/30 shadow-sm border border-[#0A3A23]/5 mb-4">
          <Inbox size={22} strokeWidth={2} />
        </div>
        <h3 className="text-base font-black text-[#0A3A23] tracking-tight">No Attendance Found</h3>
        <p className="text-[11px] text-[#0A3A23]/40 font-medium mt-1 max-w-[280px] leading-relaxed mx-auto">
          We couldn't find any matching attendance logs parameters inside this configuration framework.
        </p>
      </div>
    );
  }

  // Pagination Logic Framework (Eksaktong kopya mula sa StudentsTableView)
  const totalPages = Math.max(Math.ceil(filteredSessions.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSessions.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      
      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaBookOpen size={12} />
                  </div>
                  Subject
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaLayerGroup size={12} />
                  </div>
                  Term
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
              <th className="px-8 py-6 rounded-tr-[32px] text-center">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {currentItems.map((session, i) => (
              <tr key={session._id || i} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                
                {/* Subject Cell */}
                <td className="px-8 py-6">
                  <span className="block font-black text-[#0A3A23] group-hover:text-[#008C45] text-base tracking-tight transition-colors">
                    {session.subject_code} — {session.subject_title || "Systems Administration and Maintenance"}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#0A3A23]/50 font-bold mt-1.5">
                    <span className="inline-block px-2.5 py-0.5 text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] rounded-lg border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm uppercase">
                      {session.course}
                    </span>
                    <span>Section {session.section}</span>
                  </div>
                </td>

                {/* Academic Terms Cell */}
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
                    onClick={() => openModal(<DailyLogsModal session={session} />)}
                    className="p-2.5 rounded-xl border border-[#0A3A23]/10 bg-white text-[#0A3A23]/50 hover:text-[#008C45] hover:border-[#008C45]/30 hover:shadow-sm transition-all active:scale-95"
                  >
                    <Eye size={14} strokeWidth={2.5} />
                  </button>
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-4">
        {currentItems.map((session, i) => (
          <div key={`${session._id}-mobile-${i}`} className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-3 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
            <div className="flex justify-between items-start gap-2">
              <div>
                <span className="font-black text-base text-[#0A3A23] tracking-tight block">
                  {session.subject_code}
                </span>
                <span className="text-xs font-medium text-[#0A3A23]/70">{session.subject_title}</span>
              </div>
              <span className="text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5 whitespace-nowrap">
                {session.section}
              </span>
            </div>
            
            <div className="text-xs text-[#0A3A23]/70 font-semibold space-y-2 pt-2 border-t border-[#0A3A23]/5">
              <p className="text-[11px] text-[#0A3A23]/50">Date: <span className="text-[#0A3A23] font-bold">{formatLongDate(session.date)}</span></p>
              
              {/* Counters Flex Row for Mobile Layout View */}
              <div className="flex items-center gap-2 pt-1">
                <span className="bg-[#008C45]/5 text-[#008C45] px-2 py-1 rounded-md text-[10px] font-black border border-[#008C45]/10">
                  P: {(session.students || []).filter((s) => s.status === "Present").length}
                </span>
                <span className="bg-[#FDCC0D]/10 text-[#Cda100] px-2 py-1 rounded-md text-[10px] font-black border border-[#FDCC0D]/20">
                  L: {(session.students || []).filter((s) => s.status === "Late").length}
                </span>
                <span className="bg-[#950606]/5 text-[#950606] px-2 py-1 rounded-md text-[10px] font-black border border-[#950606]/10">
                  A: {(session.students || []).filter((s) => s.status === "Absent").length}
                </span>
                <button
                  onClick={() => openModal(<DailyLogsModal session={session} />)}
                  className="ml-auto p-1.5 rounded-lg border border-[#0A3A23]/10 bg-white text-[#0A3A23]/50"
                >
                  <Eye size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION TOOLBAR CONTROLS */}
      {filteredSessions.length > 0 && (
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
              disabled={currentPage === 1 || filteredSessions.length === 0}
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
                  disabled={filteredSessions.length === 0}
                  className={`w-9 h-9 text-xs font-black rounded-xl transition-all shadow-sm ${
                    currentPage === index + 1
                      ? "bg-[#0A3A23] text-white"
                      : "bg-white border border-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23]/5 disabled:opacity-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || filteredSessions.length === 0}
              className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceReportContent;