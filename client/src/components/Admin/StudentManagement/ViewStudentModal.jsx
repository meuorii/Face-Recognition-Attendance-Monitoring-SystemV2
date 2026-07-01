import React from "react";
import { createPortal } from "react-dom";
import { X, IdCard, GraduationCap, FileText, User } from "lucide-react";

const ViewStudentModal = ({ isOpen, onClose, student }) => {
  if (!isOpen || !student) return null;

  // 🔥 Proper Case Formatter
  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const firstName = formatName(student.first_name);
  const middleName = formatName(student.middle_name);
  const lastName = formatName(student.last_name);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      {/* Expanded Modern Canvas Layout */}
      <div className="bg-white w-full max-w-4xl md:min-h-[540px] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-10 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
        >
          <X size={22} />
        </button>

        {/* LEFT DECK: Premium Profile Showcase */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Premium Initials Avatar */}
          <div className="w-32 h-32 rounded-[36px] bg-white text-[#0A3A23] flex items-center justify-center text-5xl font-black tracking-tighter shadow-2xl border-4 border-white/20 mb-8 transform hover:scale-105 transition-transform duration-300">
            {initials}
          </div>

          {/* Student Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-10 backdrop-blur-md">
            <User size={12} className="text-white" /> Student
          </span>

          <h3 className="text-2xl font-black text-white tracking-tight leading-tight max-w-[200px] break-words">
            {lastName}
          </h3>
          <p className="text-sm font-medium text-white/70 mt-2 max-w-[200px] break-words">
            {firstName} {middleName}
          </p>
        </div>

        {/* RIGHT DECK: Clean Modern Fields & Perfect Alignment */}
        <div className="flex-1 p-12 md:p-14 space-y-12 overflow-y-auto flex flex-col justify-between">
          
          {/* Header section with simplified words */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">Profile Details</span>
            <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Student Information</h2>
          </div>

          {/* Grid Layout Container */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 flex-1 mt-4">
            
            <InfoField 
              label="Student ID" 
              value={student.student_id} 
              icon={<IdCard size={16} />} 
              mono 
            />
            
            <InfoField 
              label="Course" 
              value={student.course} 
              icon={<GraduationCap size={16} />} 
              highlight 
            />

            {/* Completely Symmetric Names Area */}
            <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-8 bg-[#F5F3F0]/50 p-8 rounded-[28px] border border-[#0A3A23]/5">
              
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider block flex items-center gap-1.5">
                  <FileText size={12} className="text-[#008C45]" /> First Name
                </span>
                <span className="text-base font-extrabold text-[#0A3A23] block leading-tight">{firstName}</span>
              </div>
              
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider block flex items-center gap-1.5">
                  <FileText size={12} className="text-[#008C45]" /> Middle Name
                </span>
                <span className="text-base font-extrabold text-[#0A3A23] block leading-tight">{middleName || "—"}</span>
              </div>
              
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider block flex items-center gap-1.5">
                  <FileText size={12} className="text-[#008C45]" /> Last Name
                </span>
                <span className="text-base font-extrabold text-[#0A3A23] block leading-tight">{lastName}</span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

/* ✅ Reusable Information Field Wrapper */
function InfoField({ label, value, icon, mono = false, highlight = false }) {
  return (
    <div
      className="rounded-2xl p-5 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 backdrop-blur-sm transition-all duration-300 hover:bg-white hover:border-[#0A3A23]/10 hover:shadow-md"
    >
      <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
        <span className="text-[#008C45]">{icon}</span>
        {label}
      </span>
      <span
        className={`text-base block tracking-tight ${
          mono 
            ? "font-mono text-[#008C45] font-bold" 
            : highlight 
            ? "text-[#0A3A23] font-black" 
            : "text-[#0A3A23]/90 font-extrabold"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

export default ViewStudentModal;