import React from "react";
import { createPortal } from "react-dom";
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  BookOpen, 
  User, 
  Calendar 
} from "lucide-react";

const DeleteClassModal = ({ isOpen, deleteClass, onClose, onConfirm }) => {
  if (!isOpen || !deleteClass) return null;

  // Extract the first two letters of the subject code for the left profile badge
  const subjectInitials = deleteClass.subject_code 
    ? deleteClass.subject_code.substring(0, 2).toUpperCase() 
    : "CL";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      
      {/* Container Box matching the premium Edit Class layout proportions */}
      <div className="bg-white w-full max-w-3xl rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 flex flex-col md:flex-row animate-scaleIn">
        
        {/* Floating Top-Right Close Trigger */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={20} />
        </button>

        {/* LEFT DECK: Profile Warning Side Panel (Deep Emerald theme) */}
        <div className="md:w-5/12 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Subject Circle Badge */}
          <div className="w-24 h-24 rounded-[28px] bg-white text-[#0A3A23] flex items-center justify-center text-3xl font-black tracking-tighter shadow-2xl border-4 border-[#0A3A23]/10 mb-6">
            {subjectInitials}
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 mb-6 backdrop-blur-md">
            <AlertTriangle size={10} className="text-white" /> Warning Zone
          </span>

          <h3 className="text-lg font-black text-white tracking-tight leading-tight max-w-[180px] break-words">
            {deleteClass.subject_code}
          </h3>
          <p className="text-xs font-medium text-white/70 mt-1 max-w-[180px] break-words">
            {deleteClass.subject_title}
          </p>
        </div>

        {/* RIGHT DECK: Content Warning & Actions Pane */}
        <div className="flex-1 flex flex-col justify-between p-10 md:p-12 relative bg-white min-h-[360px]">
          
          {/* Main Warning Text Zone */}
          <div className="space-y-6 text-left">
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">
                Removal Module
              </span>
              <h2 className="text-2xl font-black text-[#0A3A23] tracking-tight flex items-center gap-2">
                Delete Class
              </h2>
            </div>

            {/* Structured Card Informing Details to be lost */}
            <div className="p-4 rounded-2xl bg-[#F5F3F0]/60 border border-[#0A3A23]/5 space-y-3">
              <p className="text-xs font-bold text-[#0A3A23]/80 leading-relaxed">
                Are you sure you want to permanently delete this class? All linked information will be removed:
              </p>
              
              <div className="space-y-2 pt-1 border-t border-[#0A3A23]/5">
                <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#0A3A23]/70">
                  <BookOpen size={13} className="text-[#008C45]" />
                  <span>Subject: <strong className="text-[#0A3A23]">{deleteClass.subject_title}</strong></span>
                </div>
                {deleteClass.instructor_last_name && (
                  <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#0A3A23]/70">
                    <User size={13} className="text-[#008C45]" />
                    <span>Instructor: <strong className="text-[#0A3A23]">{deleteClass.instructor_first_name} {deleteClass.instructor_last_name}</strong></span>
                  </div>
                )}
                {deleteClass.section && (
                  <div className="flex items-center gap-2 text-[11px] font-extrabold text-[#0A3A23]/70">
                    <Calendar size={13} className="text-[#008C45]" />
                    <span>Section Slot: <strong className="text-[#0A3A23]">{deleteClass.section}</strong></span>
                  </div>
                )}
              </div>
            </div>

            {/* Permanent Warning Subtext */}
            <div className="flex items-start gap-2.5 px-1.5 text-xs text-[#0A3A23]/70 font-bold leading-tight">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p>This action cannot be undone. This schedule and roster will be erased from the system completely.</p>
            </div>
          </div>

          {/* Action Footer Controls */}
          <div className="pt-6 border-t border-[#0A3A23]/10 flex items-center justify-end gap-3 mt-8">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#F5F3F0] text-[#0A3A23]/70 text-xs font-black uppercase tracking-wider hover:bg-[#eae7e2] transition-all active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md shadow-[#0A3A23]/10 transition-all active:scale-95"
            >
              <Trash2 size={13} /> Delete Class
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

export default DeleteClassModal;