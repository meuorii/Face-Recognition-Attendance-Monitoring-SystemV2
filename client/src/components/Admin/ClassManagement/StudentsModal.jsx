import React from "react";
import { createPortal } from "react-dom";
import { X, Users, IdCard, BookOpen } from "lucide-react";

const StudentsModal = ({ isOpen, onClose, selectedClass }) => {
  if (!isOpen || !selectedClass) return null;

  // 🔥 Proper Case Name Formatter
  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // 🔥 Sort students alphabetically by LAST NAME
  const sortedStudents = [...(selectedClass.students || [])].sort((a, b) => {
    const lastA = (a.last_name || "").toLowerCase();
    const lastB = (b.last_name || "").toLowerCase();
    return lastA.localeCompare(lastB);
  });

  // 📐 Expanded Circular Progress Dimensions
  const attendanceRate = selectedClass.attendance_rate ?? 0;
  const radius = 68; // Lumaki mula 50 para mas maluwag ang text sa loob
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (attendanceRate / 100) * circumference;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      {/* Premium Split-Layout Modal Container */}
      <div className="bg-white w-full max-w-4xl md:min-h-[540px] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[92vh] flex flex-col md:flex-row animate-scaleIn">
        
        {/* Top Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-10 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={22} />
        </button>

        {/* LEFT DECK: Expanded Circular Attendance Progress Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Upgraded & Spacious Circular Progress Gauge */}
          <div className="relative w-44 h-44 flex items-center justify-center mb-8">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
              {/* Background Track Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white/10"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Active Progress Circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-white transition-all duration-1000 ease-out"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            {/* Perfectly Spaced Inner Text Centerpiece */}
            <div className="absolute flex flex-col items-center justify-center px-4">
              <span className="text-3xl font-black text-white tracking-tight">
                {attendanceRate}%
              </span>
              <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest mt-1">
                Attendance
              </span>
            </div>
          </div>

          {/* Left Metadata Tagging Section */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-6 backdrop-blur-md">
            <Users size={12} className="text-white" /> Class Roster
          </span>

          <h3 className="text-2xl font-black text-white tracking-tight leading-tight max-w-[200px] break-words">
            {selectedClass.subject_code}
          </h3>
          <p className="text-xs font-medium text-white/70 mt-2 max-w-[200px] break-words">
            {selectedClass.subject_title}
          </p>
        </div>

        {/* RIGHT DECK: Modern Maximized Student List */}
        <div className="flex-1 p-12 md:p-14 space-y-8 overflow-y-auto flex flex-col">
          
          {/* Header Typography Elements */}
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">Active Enrollees</span>
            <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Student List</h2>
          </div>

          {/* Student Interactive Grid Container */}
          <div className="flex-1">
            {sortedStudents.length > 0 ? (
              <div className="max-h-[440px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="space-y-3">
                  {sortedStudents.map((st, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-[#F5F3F0]/60 border border-[#0A3A23]/5 p-5 rounded-2xl hover:bg-white hover:border-[#0A3A23]/20 hover:shadow-sm transition-all duration-200"
                    >
                      <div className="text-left">
                        <span className="text-base font-extrabold text-[#0A3A23] block leading-snug">
                          {formatName(st.first_name)} {formatName(st.last_name)}
                        </span>
                      </div>

                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#008C45] bg-[#0A3A23]/5 px-3 py-1.5 rounded-xl border border-[#0A3A23]/5">
                        <IdCard size={14} /> {st.student_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-24 bg-[#F5F3F0]/30 rounded-3xl border border-dashed border-[#0A3A23]/10">
                <BookOpen className="text-[#0A3A23]/20 mb-3" size={32} />
                <p className="text-[#0A3A23]/40 text-sm font-bold tracking-tight">No students enrolled yet</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

export default StudentsModal;