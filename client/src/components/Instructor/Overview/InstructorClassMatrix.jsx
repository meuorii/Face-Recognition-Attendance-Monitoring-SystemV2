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
      {/* Header Toolbar Card */}
      <div className="bg-[#F5F3F0] p-8 rounded-[24px] border border-[#0A3A23]/5 shadow-[0_12px_40px_rgba(10,58,35,0.04)] flex items-center justify-between">
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

      {/* Desktop Table View Framework */}
      <div className="hidden md:block overflow-hidden bg-[#F5F3F0] rounded-[24px] border border-[#0A3A23]/5 shadow-[0_16px_45px_rgba(10,58,35,0.06)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-[#0A3A23]/10 text-[#0A3A23] text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white">
                    <BookOpen size={12} strokeWidth={2.5} />
                  </div>
                  Academic Subject
                </div>
              </th>
              <th className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white">
                    <Layers size={12} strokeWidth={2.5} />
                  </div>
                  Section
                </div>
              </th>
              <th className="px-8 py-5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white">
                    <Clock size={12} strokeWidth={2.5} />
                  </div>
                  Schedule
                </div>
              </th>
              <th className="px-8 py-5 text-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white">
                    <Radio size={12} strokeWidth={2.5} />
                  </div>
                  Status
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-12 text-center text-xs font-bold text-[#0A3A23]/40 uppercase tracking-wider">
                  No active academic blocks deployed.
                </td>
              </tr>
            ) : (
              currentItems.map((c, idx) => (
                <tr
                  key={idx}
                  onClick={() => setActiveTab("subject")}
                  className="hover:bg-[#0A3A23]/5 transition-colors cursor-pointer group"
                >
                  {/* Combined Subject Code and Title for a ultra-clean presentation layout */}
                  <td className="px-8 py-6 max-w-[320px]">
                    <div className="space-y-0.5">
                      <span className="block font-black text-[#0A3A23] group-hover:text-[#008C45] text-base transition-colors duration-300">
                        {c.subject_code}
                      </span>
                      <span className="block text-xs font-semibold text-[#0A3A23]/60 truncate">
                        {c.subject_title}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 vertical-middle">
                    <span className="px-3.5 py-1.5 text-xs font-black bg-white text-[#0A3A23] rounded-xl border border-[#0A3A23]/10 shadow-sm">
                      {c.section}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-[#0A3A23]/70 font-semibold text-xs">
                    <div className="flex items-center gap-2 bg-white/60 px-3 py-2 rounded-xl border border-[#0A3A23]/5 w-fit">
                      <CalendarDays size={14} className="text-[#0A3A23]/50" />
                      <span>
                        {c.schedule_blocks?.map((b) => `${b.days.join(", ")} • ${b.start}–${b.end}`).join(" | ") || "No Schedule"}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-sm
                      ${c.is_attendance_active ? "bg-[#008C45] text-white" : "bg-[#0A3A23]/10 text-[#0A3A23]/40"}`}
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

      {/* Mobile View Framework */}
      <div className="md:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-[#F5F3F0] p-8 text-center rounded-[24px] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]/40 uppercase tracking-wider">
            No active academic blocks deployed.
          </div>
        ) : (
          currentItems.map((c, idx) => (
            <div 
              key={idx}
              onClick={() => setActiveTab("subject")}
              className="bg-[#F5F3F0] p-6 rounded-[24px] border border-[#0A3A23]/5 space-y-4 active:scale-[0.98] transition-all shadow-md"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-black text-lg text-[#0A3A23]">{c.subject_code}</h4>
                  <p className="text-xs text-[#0A3A23]/70 font-bold mt-0.5 truncate max-w-[200px]">{c.subject_title}</p>
                </div>
                <span className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-full uppercase ${c.is_attendance_active ? "bg-[#008C45] text-white" : "bg-[#0A3A23]/10 text-[#0A3A23]/40"}`}>
                  {c.is_attendance_active ? "Live" : "Off"}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs pt-4 border-t border-[#0A3A23]/5">
                <span className="text-[#0A3A23]/60 font-bold">Section: <strong className="text-[#0A3A23] font-black">{c.section}</strong></span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Always Visible Premium Minimalist Pagination Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#F5F3F0] px-8 py-5 rounded-[24px] border border-[#0A3A23]/5 shadow-sm">
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