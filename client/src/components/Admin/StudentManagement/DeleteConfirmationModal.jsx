import React from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Trash2, IdCard, UserX } from "lucide-react";

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, student }) => {
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
  const lastName = formatName(student.last_name);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      
      {/* Expanded Premium Layout Framework */}
      <div className="bg-white w-full max-w-4xl md:min-h-[460px] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 z-10 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={22} />
        </button>

        {/* LEFT DECK: Minimal Brand Status Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Initials Showcase */}
          <div className="w-28 h-28 rounded-[32px] bg-white text-[#0A3A23] flex items-center justify-center text-4xl font-black tracking-tighter shadow-2xl border-4 border-white/20 mb-6">
            {initials || "ST"}
          </div>

          {/* Action Tag */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-6 backdrop-blur-md">
            <UserX size={12} className="text-white" /> Removal Mode
          </span>

          <h3 className="text-xl font-black text-white tracking-tight leading-tight max-w-[180px] break-words">
            {lastName}
          </h3>
          <p className="text-xs font-medium text-white/70 mt-1 max-w-[180px] break-words">
            {firstName}
          </p>
        </div>

        {/* RIGHT DECK: Spacious Content & System Spacing */}
        <div className="flex-1 p-12 md:p-14 space-y-10 overflow-y-auto flex flex-col justify-between">
          
          {/* Plain Copywriting Headings */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest flex items-center gap-1.5">
              <AlertTriangle size={12} /> System Warning
            </span>
            <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Remove Record</h2>
          </div>

          {/* Enhanced Content Body */}
          <div className="space-y-6 flex-1 mt-4">
            <p className="text-base font-extrabold text-[#0A3A23]/80 tracking-tight leading-relaxed">
              Are you sure you want to permanently delete this student account from the institution server?
            </p>

            {/* Target Identity Detail Badge */}
            <div className="bg-[#F5F3F0]/80 border border-[#0A3A23]/5 p-6 rounded-[24px] space-y-3">
              <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider block">Selected Student</span>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-lg font-black text-[#0A3A23]">{firstName} {lastName}</span>
                <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-[#008C45] bg-[#0A3A23]/5 px-3 py-1 rounded-lg border border-[#0A3A23]/5 self-start sm:self-auto">
                  <IdCard size={14} /> {student.student_id}
                </div>
              </div>
            </div>

            {/* Permanent Warning Note */}
            <p className="text-[11px] font-black text-[#008C45] uppercase tracking-wider bg-[#0A3A23]/5 px-4 py-3 rounded-xl inline-block">
              Notice: This action is absolute and cannot be undone
            </p>
          </div>

          {/* Clean Interactive Alignment Bar */}
          <div className="pt-6 border-t border-[#0A3A23]/10 flex flex-col sm:flex-row justify-end items-center gap-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto order-2 sm:order-1 px-8 py-3.5 rounded-xl bg-[#F5F3F0] text-[#0A3A23]/70 text-xs font-black uppercase tracking-wider hover:bg-[#eae7e2] active:scale-98 transition-all"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onConfirm}
              className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md shadow-[#0A3A23]/20 active:scale-98 transition-all"
            >
              <Trash2 size={14} />
              Confirm Delete
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

export default DeleteConfirmationModal;