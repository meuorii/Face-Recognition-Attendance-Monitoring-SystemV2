import React from "react";
import { createPortal } from "react-dom";
import { X, Unlink, AlertTriangle, Layers } from "lucide-react";

const UnassignConfirmationModal = ({ isOpen, onClose, onConfirm, classData }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      
      {/* Premium Compact Canvas Box Layout */}
      <div className="bg-white w-full max-w-xl rounded-[40px] shadow-[0_50px_110px_rgba(10,58,35,0.25)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[90vh] flex flex-col p-10 md:p-12 space-y-10">
        
        {/* Top Floating Close Trigger */}
        <button
          onClick={onClose}
          className="absolute top-8 right-8 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={20} />
        </button>

        {/* Header Branding Area */}
        <div className="space-y-1 text-left">
          <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest flex items-center gap-1.5">
            <AlertTriangle size={12} /> Workload Change
          </span>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Remove Instructor</h2>
        </div>

        {/* Elegant Notice Canvas Card */}
        <div className="bg-[#F5F3F0]/60 border border-[#0A3A23]/5 rounded-[28px] p-8 text-center space-y-6">
          <p className="text-sm font-bold text-[#0A3A23]/60 tracking-tight">
            Are you sure you want to remove the assigned instructor from this subject load?
          </p>

          {/* Ticket Style Target Info */}
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-[#0A3A23] tracking-tight px-4 break-words">
              {classData?.subject_title}
            </h3>
            
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#0A3A23]/5 rounded-xl border border-[#0A3A23]/5 text-xs font-mono font-bold text-[#008C45] uppercase tracking-wide">
                <Layers size={14} /> {classData?.subject_code}
              </div>
              <span className="text-xs font-bold text-[#0A3A23]/50 uppercase tracking-tight">
                • {classData?.course} {classData?.section}
              </span>
            </div>
          </div>

          {/* Institutional Alert Strip */}
          <p className="text-[10px] font-black text-[#008C45] bg-[#0A3A23]/5 py-2.5 px-4 rounded-xl inline-block tracking-wide uppercase">
            Notice: This change applies to the deployment records immediately
          </p>
        </div>

        {/* Clean Interactive Alignment Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-4 w-full">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1 px-8 py-3.5 rounded-xl bg-[#F5F3F0] text-[#0A3A23]/70 text-xs font-black uppercase tracking-wider hover:bg-[#eae7e2] active:scale-98 transition-all"
          >
            Keep Assignment
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md shadow-[#0A3A23]/10 active:scale-98 transition-all"
          >
            Confirm Unassign
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default UnassignConfirmationModal;