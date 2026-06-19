import { useState } from "react";
import { CalendarDays, BookOpen, Layers, Clock, Radio, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

const InstructorClassMatrix = ({ classSummary = [], setActiveTab }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Laging mag-render ang kahit 1 page frame para sa UI layout consistency kahit walang data
  const totalPages = Math.max(Math.ceil(classSummary.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = classSummary.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-8">
      {/* Header Toolbar (Removed card background/border to match desired look) */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-4">
          {/* Accent and Secondary Gradient exclusively reserved for the icon container */}
          <div className="p-3 rounded-2xl bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white shadow-md">
            <LayoutGrid size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="text-xl font-black text-[#0A3A23] tracking-tight uppercase">Class Matrix</h3>
            <p className="text-xs text-[#0A3A23]/50 font-medium mt-0.5">Real-time schedule and room tracking</p>
          </div>
        </div>
        <button 
          onClick={() => setActiveTab("subject")}
          className="text-xs font-black uppercase tracking-widest text-[#0A3A23]/70 hover:text-[#008C45] bg-white border border-[#0A3A23]/5 px-5 py-3 rounded-xl shadow-sm transition-all hover:-translate-y-0.5 active:translate-y-0"
        >
          View All →
        </button>
      </div>

      {/* Desktop Table View Framework (Copied style from SubjectsTableView) */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            {/* Premium Dark Accent Header Row */}
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <BookOpen size={12} strokeWidth={2.5} />
                  </div>
                  Academic Subject
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <Layers size={12} strokeWidth={2.5} />
                  </div>
                  Section
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <Clock size={12} strokeWidth={2.5} />
                  </div>
                  Schedule
                </div>
              </th>
              <th className="px-8 py-6 text-center rounded-tr-[32px]">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <Radio size={12} strokeWidth={2.5} />
                  </div>
                  Status
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/30">
                  No active academic blocks deployed.
                </td>
              </tr>
            ) : (
              currentItems.map((c, idx) => (
                <tr
                  key={idx}
                  onClick={() => setActiveTab("subject")}
                  className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group cursor-pointer"
                >
                  {/* Combined Subject Code and Title */}
                  <td className="px-8 py-6 max-w-[320px]">
                    <div className="space-y-1">
                      <span className="block font-black text-[#0A3A23] group-hover:text-[#008C45] text-base tracking-tight transition-colors duration-300">
                        {c.subject_code}
                      </span>
                      <span className="block text-xs font-bold text-[#0A3A23]/50 truncate uppercase tracking-wide">
                        {c.subject_title}
                      </span>
                    </div>
                  </td>
                  
                  {/* Premium White Badge Section column */}
                  <td className="px-8 py-6">
                    <span className="inline-block px-4 py-2 text-xs font-black bg-[#F5F3F0] text-[#0A3A23] rounded-xl border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm">
                      {c.section}
                    </span>
                  </td>

                  {/* Schedule Container Layer */}
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2.5 bg-[#F5F3F0]/60 group-hover:bg-white px-3.5 py-2 rounded-xl border border-[#0A3A23]/5 w-fit shadow-inner transition-all">
                      <CalendarDays size={14} className="text-[#008C45]" />
                      <span className="text-[#0A3A23]/80 font-black text-xs uppercase tracking-wide">
                        {c.schedule_blocks?.map((b) => `${b.days.join(", ")} • ${b.start}–${b.end}`).join(" | ") || "No Schedule"}
                      </span>
                    </div>
                  </td>

                  {/* Status Indicator Layer */}
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm border transition-all
                      ${c.is_attendance_active 
                        ? "bg-[#008C45] text-white border-[#008C45]" 
                        : "bg-white text-[#0A3A23]/40 border-[#0A3A23]/5 group-hover:border-[#0A3A23]/10"}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${c.is_attendance_active ? "bg-white animate-pulse" : "bg-[#0A3A23]/30"}`} />
                      {c.is_attendance_active ? "Live" : "Off"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View Framework (Updated to clean White Theme) */}
      <div className="md:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-bold text-[#0A3A23]/30 uppercase tracking-widest">
            No active academic blocks deployed.
          </div>
        ) : (
          currentItems.map((c, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveTab("subject")}
              className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-4 shadow-[0_10px_30px_rgba(10,58,35,0.02)] active:scale-[0.98] transition-all"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-lg text-[#0A3A23] tracking-tight">{c.subject_code}</h4>
                  <p className="text-xs text-[#0A3A23]/50 font-bold mt-0.5 truncate max-w-[200px] uppercase tracking-wide">{c.subject_title}</p>
                </div>
                <span className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-xl uppercase ${c.is_attendance_active ? "bg-[#008C45] text-white animate-pulse" : "bg-[#0A3A23]/5 text-[#0A3A23]/40 border border-[#0A3A23]/5"}`}>
                  {c.is_attendance_active ? "Live" : "Off"}
                </span>
              </div>
              <div className="text-xs text-[#0A3A23]/70 font-semibold space-y-2.5 pt-2 border-t border-[#0A3A23]/5">
                <p className="flex items-center gap-2">Section: <span className="text-[#0A3A23] font-black bg-[#F5F3F0] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5">{c.section}</span></p>
                <p className="truncate text-[#0A3A23]/50">Schedule: <span className="text-[#0A3A23] font-bold">{c.schedule_blocks?.map((b) => `${b.days.join(", ")} • ${b.start}–${b.end}`).join(" | ") || "No Schedule"}</span></p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination Panel (Updated to white theme with custom border matching standard tables) */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white px-8 py-5 rounded-[24px] border border-[#0A3A23]/10 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
        <p className="text-xs text-[#0A3A23]/50 font-bold uppercase tracking-wider text-center sm:text-left">
          {classSummary.length === 0 ? (
            "No entries to compute"
          ) : (
            <>
              Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
              <span className="text-[#0A3A23] font-black">{Math.min(indexOfLastItem, classSummary.length)}</span> of{" "}
              <span className="text-[#0A3A23] font-black">{classSummary.length}</span> entries
            </>
          )}
        </p>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
          >
            <ChevronLeft size={16} strokeWidth={2.5} />
          </button>
          
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentPage(index + 1)}
                disabled={classSummary.length === 0}
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
          
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || classSummary.length === 0}
            className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstructorClassMatrix;