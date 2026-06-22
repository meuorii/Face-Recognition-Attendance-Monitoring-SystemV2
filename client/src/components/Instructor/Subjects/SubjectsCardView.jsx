// src/components/Instructor/Subjects/SubjectsCardView.jsx
import { useState } from "react";
import { CalendarDays, Users, AlertTriangle, PlayCircle, StopCircle, ChevronLeft, ChevronRight } from "lucide-react";

const SubjectsCardView = ({ classes = [], isWithinSchedule, handleActivate, handleStop, loadingId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 cards per page

  // Layout for Card Pagination
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
    return `${Array.from(days).join(", ")} • ${times.join(", ")}`;
  };

  return (
    <div className="space-y-8">
      
      {/* Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
                className="bg-white rounded-[24px] p-6 border border-[#0A3A23]/10 shadow-[0_12px_40px_rgba(10,58,35,0.04)]
                  hover:shadow-[0_20px_50px_rgba(10,58,35,0.09)] transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group"
              >
                <div className="space-y-5">
                  {/* Top Row: Subject Code & Status */}
                  <div className="flex items-center justify-between gap-4">
                    <span className="block font-black text-[#0A3A23] text-2xl group-hover:text-[#008C45] transition-colors tracking-tighter">
                      {c.subject_code}
                    </span>
                    
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black tracking-widest uppercase transition-all
                      ${c.is_attendance_active 
                        ? "bg-[#008C45] text-white animate-pulse" 
                        : "bg-[#0A3A23]/5 text-[#0A3A23]/40"}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${c.is_attendance_active ? "bg-white" : "bg-[#0A3A23]/30"}`} />
                      {c.is_attendance_active ? "Live" : "Off"}
                    </span>
                  </div>

                  {/* Subject Title */}
                  <div>
                    <h4 className="text-xs font-black text-[#0A3A23]/80 uppercase tracking-wide truncate">
                      {c.subject_title}
                    </h4>
                  </div>

                  {/* Metadata Columns (Simplified Labels) */}
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#0A3A23]/5 text-[11px]">
                    <div className="space-y-1">
                      <span className="block text-[#0A3A23]/40 font-bold uppercase tracking-wider">Section</span>
                      <div className="flex items-center gap-1.5 text-[#0A3A23] font-black">
                        <Users size={12} className="text-[#008C45]" />
                        <span className="truncate">{c.course} • {c.section}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[#0A3A23]/40 font-bold uppercase tracking-wider">Schedule</span>
                      <div className="flex items-center gap-1.5 text-[#0A3A23] font-black">
                        <CalendarDays size={12} className="text-[#008C45]" />
                        <span className="truncate uppercase">{hasSchedule ? formatScheduleBlocks(c.schedule_blocks) : "No Schedule"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Differentiated Warning Alerts */}
                  {!c.is_attendance_active && (!hasSchedule || !withinSchedule) && (
                    <div className="pt-1">
                      {!hasSchedule ? (
                        /* Missing Schedule - Secondary Green */
                        <div className="flex items-center gap-2 text-[#950606] font-black text-[10px] uppercase tracking-wider">
                          <AlertTriangle size={12} className="shrink-0" /> Missing Schedule
                        </div>
                      ) : (
                        /* Not current time - Warning Accent Gold/Amber */
                        <div className="flex items-center gap-2 text-[#FDCC0D] font-black text-[10px] uppercase tracking-wider">
                          <AlertTriangle size={12} className="shrink-0" /> Not Your Schedule
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Simplified Action Buttons */}
                <div className="mt-6 pt-4 border-t border-[#0A3A23]/5">
                  {c.is_attendance_active ? (
                    <button
                      onClick={() => handleStop(c._id)}
                      disabled={loadingId === c._id}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-white font-black text-xs uppercase tracking-widest
                        bg-gradient-to-br from-red-500 to-red-700 hover:opacity-90 transition-all active:scale-95 shadow-sm"
                    >
                      <StopCircle size={14} strokeWidth={2.5} />
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(c._id)}
                      disabled={loadingId === c._id || !hasSchedule || !withinSchedule}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95
                        ${hasSchedule && withinSchedule
                          ? "bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white cursor-pointer hover:opacity-95 shadow-sm"
                          : "bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none opacity-50"
                        }`}
                    >
                      <PlayCircle size={14} strokeWidth={2.5} />
                      Start
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Panel */}
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