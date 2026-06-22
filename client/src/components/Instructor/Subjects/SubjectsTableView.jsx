// src/components/Instructor/Subjects/SubjectsTableView_2.jsx
import { useState } from "react";
import { CalendarDays, BookOpen, Layers, Clock, Radio, PlayCircle, StopCircle, AlertTriangle, ChevronLeft, ChevronRight, Lock } from "lucide-react";

const SubjectsTableView = ({ classes = [], isWithinSchedule, handleActivate, handleStop, loadingId }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.max(Math.ceil(classes.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = classes.slice(indexOfFirstItem, indexOfLastItem);

  const formatScheduleBlocks = (blocks) => {
    if (!Array.isArray(blocks) || blocks.length === 0) return "No schedule";
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
      
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <BookOpen size={12} strokeWidth={2.5} />
                  </div>
                  Subject
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
                  Action
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/30">
                  No classes found.
                </td>
              </tr>
            ) : (
              currentItems.map((c) => {
                const withinSchedule = isWithinSchedule(c.schedule_blocks);
                const hasSchedule = Array.isArray(c.schedule_blocks) && c.schedule_blocks.length > 0;
                const canActivate = hasSchedule && withinSchedule;

                return (
                  <tr 
                    key={c._id} 
                    className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group"
                  >
                    {/* Subject Code & Title */}
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

                    {/* Section Badge */}
                    <td className="px-8 py-6">
                      <span className="inline-block px-4 py-2 text-xs font-black bg-[#F5F3F0] text-[#0A3A23] rounded-xl border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm">
                        {c.course} – {c.section}
                      </span>
                    </td>

                    {/* Schedule info & Alerts */}
                    <td className="px-8 py-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2.5 bg-[#F5F3F0]/60 group-hover:bg-white px-3.5 py-2 rounded-xl border border-[#0A3A23]/5 w-fit shadow-inner transition-all">
                          <CalendarDays size={14} className="text-[#008C45]" />
                          <span className="text-[#0A3A23]/80 font-black text-xs uppercase tracking-wide">
                            {hasSchedule ? formatScheduleBlocks(c.schedule_blocks) : "No schedule"}
                          </span>
                        </div>
                        
                        {!c.is_attendance_active && (
                          <>
                            {!hasSchedule && (
                              <p className="flex items-center gap-1.5 text-[#950606] text-[10px] font-black uppercase tracking-wider pl-1 animate-pulse">
                                <AlertTriangle size={12} /> Missing Schedule
                              </p>
                            )}
                            {hasSchedule && !withinSchedule && (
                              <p className="flex items-center gap-1.5 text-[#FDCC0D] text-[10px] font-black uppercase tracking-wider pl-1">
                                <AlertTriangle size={12} /> Not your schedule
                              </p>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    {/* Status & Buttons */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-4">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase shadow-sm border transition-all
                          ${c.is_attendance_active 
                            ? "bg-[#008C45] text-white border-[#008C45]" 
                            : "bg-white text-[#0A3A23]/40 border-[#0A3A23]/5 group-hover:border-[#0A3A23]/10"}`}
                        >
                          <span className={`w-2 h-2 rounded-full ${c.is_attendance_active ? "bg-white animate-pulse" : "bg-[#0A3A23]/30"}`} />
                          {c.is_attendance_active ? "Live" : "Off"}
                        </span>

                        {c.is_attendance_active ? (
                          <button
                            onClick={() => handleStop(c._id)}
                            disabled={loadingId === c._id}
                            className="p-3 rounded-xl text-white bg-gradient-to-br from-red-500 to-red-700 hover:scale-105 active:scale-95 transition-all shadow-md shadow-red-500/10"
                          >
                            <StopCircle size={16} strokeWidth={2.5} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(c._id)}
                            disabled={loadingId === c._id || !canActivate}
                            className={`p-3 rounded-xl transition-all shadow-md
                              ${canActivate 
                                ? "bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white hover:scale-105 active:scale-95 cursor-pointer shadow-[#008C45]/10" 
                                : "bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"}`}
                          >
                            {canActivate ? <PlayCircle size={16} strokeWidth={2.5} /> : <Lock size={16} strokeWidth={2.5} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-bold text-[#0A3A23]/30 uppercase tracking-widest">
            No classes found.
          </div>
        ) : (
          currentItems.map((c) => {
            const withinSchedule = isWithinSchedule(c.schedule_blocks);
            const hasSchedule = Array.isArray(c.schedule_blocks) && c.schedule_blocks.length > 0;
            const canActivate = hasSchedule && withinSchedule;

            return (
              <div 
                key={c._id} 
                className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-4 shadow-[0_10px_30px_rgba(10,58,35,0.02)]"
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

                <div className="text-xs text-[#0A3A23]/70 font-semibold space-y-2.5 pt-2">
                  <p className="flex items-center gap-2">Section: <span className="text-[#0A3A23] font-black bg-[#F5F3F0] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5">{c.course} – {c.section}</span></p>
                  <p className="truncate text-[#0A3A23]/50">Schedule: <span className="text-[#0A3A23] font-bold">{hasSchedule ? formatScheduleBlocks(c.schedule_blocks) : "No schedule"}</span></p>
                </div>

                <div className="flex justify-end pt-4 border-t border-[#0A3A23]/5">
                  {c.is_attendance_active ? (
                    <button
                      onClick={() => handleStop(c._id)}
                      disabled={loadingId === c._id}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-gradient-to-br from-red-500 to-red-700 active:scale-95 transition-all shadow-sm"
                    >
                      <StopCircle size={14} strokeWidth={2.5} /> Stop
                    </button>
                  ) : (
                    <button
                      onClick={() => handleActivate(c._id)}
                      disabled={loadingId === c._id || !canActivate}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm
                        ${canActivate 
                          ? "bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white active:scale-95 cursor-pointer" 
                          : "bg-neutral-50 text-neutral-400 border border-neutral-200 cursor-not-allowed"}`}
                    >
                      {canActivate ? <PlayCircle size={14} strokeWidth={2.5} /> : <Lock size={14} strokeWidth={2.5} />}
                      {canActivate ? "Start" : "Locked"}
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

export default SubjectsTableView;