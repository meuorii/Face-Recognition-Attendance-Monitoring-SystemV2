import { useState } from "react";
import { CalendarDays, Users, AlertTriangle, PlayCircle, StopCircle, ChevronLeft, ChevronRight } from "lucide-react";

const SubjectsCardView = ({ classes = [], isWithinSchedule, handleActivate, handleStop, loadingId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 cards per page

  // Layout Framework for Card Pagination
  const totalPages = Math.max(Math.ceil(classes.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = classes.slice(indexOfFirstItem, indexOfLastItem);

  const formatScheduleBlocks = (blocks) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return "No Schedule Found";
    const days = new Set();
    const times = [];
    blocks.forEach((b) => {
      if (Array.isArray(b.days)) b.days.forEach((d) => days.add(d));
      if (b.start && b.end) times.push(`${b.start}–${b.end}`);
    });
    return `${Array.from(days).join(", ")} \n ${times.join(", ")}`;
  };

  return (
    <div className="space-y-8">
      
      {/* Modern Premium Card Grid Layer */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {currentItems.length === 0 ? (
          <div className="col-span-full bg-white p-16 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest shadow-[0_20px_50px_rgba(10,58,35,0.02)]">
            No classes found.
          </div>
        ) : (
          currentItems.map((c) => {
            const withinSchedule = isWithinSchedule(c.schedule_blocks);
            const hasSchedule = Array.isArray(c.schedule_blocks) && c.schedule_blocks.length > 0;

            return (
              <div
                key={c._id}
                className="bg-white rounded-[32px] p-7 border border-[#0A3A23]/10 shadow-[0_16px_45px_rgba(10,58,35,0.03)]
                  hover:shadow-[0_24px_60px_rgba(10,58,35,0.08)] transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between group"
              >
                <div>
                  {/* Premium Header Block */}
                  <div className="flex justify-between items-start gap-4 border-b border-[#0A3A23]/5 pb-5 mb-6">
                    <div>
                      <span className="block font-black text-[#0A3A23] text-2xl group-hover:text-[#008C45] transition-colors tracking-tight">
                        {c.subject_code}
                      </span>
                      <span className="block text-xs font-bold text-[#0A3A23]/50 truncate max-w-[190px] uppercase tracking-wide mt-1">
                        {c.subject_title}
                      </span>
                    </div>
                    
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm border transition-all
                      ${c.is_attendance_active 
                        ? "bg-[#008C45] text-white border-[#008C45] animate-pulse" 
                        : "bg-[#F5F3F0] text-[#0A3A23]/40 border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10"}`}
                    >
                      {c.is_attendance_active ? "Live" : "Off"}
                    </span>
                  </div>

                  {/* High-Contrast Info Stack */}
                  <div className="space-y-4 text-xs font-bold text-[#0A3A23]/70">
                    <div className="flex items-start gap-3.5 bg-[#F5F3F0]/60 group-hover:bg-[#F5F3F0]/30 p-4 rounded-xl border border-[#0A3A23]/5 transition-colors">
                      <div className="p-2 bg-[#0A3A23] group-hover:bg-[#008C45] text-white rounded-lg shrink-0 shadow-sm transition-colors">
                        <CalendarDays size={14} strokeWidth={2.5} />
                      </div>
                      <p className="whitespace-pre-line uppercase tracking-wide leading-relaxed text-[#0A3A23] font-black">
                        {formatScheduleBlocks(c.schedule_blocks)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3.5 bg-[#F5F3F0]/60 group-hover:bg-[#F5F3F0]/30 p-4 rounded-xl border border-[#0A3A23]/5 transition-colors">
                      <div className="p-2 bg-[#0A3A23] group-hover:bg-[#008C45] text-white rounded-lg shrink-0 shadow-sm transition-colors">
                        <Users size={14} strokeWidth={2.5} />
                      </div>
                      <span className="uppercase tracking-wider text-[#0A3A23] font-black">
                        {c.course} • Section {c.section}
                      </span>
                    </div>

                    {/* Operational Guardrails & Warnings (Simplified) */}
                    {!c.is_attendance_active && (
                      <div className="pt-2">
                        {!hasSchedule && (
                          <div className="flex items-center gap-2.5 text-red-600 bg-red-50/50 border border-red-200/40 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider animate-pulse">
                            <AlertTriangle size={14} /> Missing Schedule
                          </div>
                        )}
                        {hasSchedule && !withinSchedule && (
                          <div className="flex items-center gap-2.5 text-[#A37000] bg-amber-50/50 border border-amber-200/40 p-3 rounded-xl text-[10px] font-black uppercase tracking-wider">
                            <AlertTriangle size={14} /> Time Inactive
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Premium Interactive Actions Layout (Simplified) */}
                <div className="mt-8 pt-5 border-t border-[#0A3A23]/5">
                  {c.is_attendance_active ? (
                    <button
                      onClick={() => handleStop(c._id)}
                      disabled={loadingId === c._id}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-white font-black text-xs uppercase tracking-widest
                        bg-gradient-to-br from-red-500 to-red-700 hover:scale-[1.02] transition-all shadow-md active:scale-95 shadow-red-500/10"
                    >
                      <StopCircle size={15} strokeWidth={2.5} />
                      Stop Attendance
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(c._id)}
                      disabled={loadingId === c._id || !hasSchedule || !withinSchedule}
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95
                        ${hasSchedule && withinSchedule
                          ? "bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white cursor-pointer hover:scale-[1.02] hover:shadow-lg hover:shadow-[#008C45]/10"
                          : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none opacity-50"
                        }`}
                    >
                      <PlayCircle size={15} strokeWidth={2.5} />
                      Start Attendance
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Premium Minimalist Pagination Panel */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white px-8 py-5 rounded-[24px] border border-[#0A3A23]/10 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
        <p className="text-xs text-[#0A3A23]/50 font-bold uppercase tracking-wider text-center sm:text-left">
          {classes.length === 0 ? (
            "No entries"
          ) : (
            <>
              Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
              <span className="text-[#0A3A23] font-black">{Math.min(indexOfLastItem, classes.length)}</span> of{" "}
              <span className="text-[#0A3A23] font-black">{classes.length}</span> entries
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
                disabled={classes.length === 0}
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
            disabled={currentPage === totalPages || classes.length === 0}
            className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
          >
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

    </div>
  );
};

export default SubjectsCardView;