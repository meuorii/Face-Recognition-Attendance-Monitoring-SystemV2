import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FileText, User, Calendar, CornerDownRight, CheckCircle2 } from "lucide-react";

const ExcuseModal = ({
  student,
  classId,
  instructorId,
  onExcuseMarked,
  onClose,
}) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  if (!student) return null;

  const handleConfirm = async () => {
    if (!reason.trim()) {
      toast.error("Please type a reason."); // 👈 Simplified
      return;
    }

    try {
      setLoading(true);
      const payload = {
        student_id: student.student_id || student.id,
        class_id: classId,
        date: new Date().toISOString().split("T")[0],
        reason,
        instructor_id: instructorId,
      };

      const res = await axios.post(
        "http://127.0.0.1:8080/api/attendance/mark-excused",
        payload
      );

      if (res.data.success) {
        toast.success(`${student.first_name || "Student"} is now excused`); // 👈 Simplified
        onExcuseMarked((student.student_id || student.id), reason);
        onClose();
      } else {
        toast.error(res.data.error || "Could not save changes."); // 👈 Simplified
      }
    } catch (err) {
      console.error("❌ Error marking as excused:", err);
      toast.error("Something went wrong. Please try again."); // 👈 Simplified
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* 1. Header Section */}
      <div className="flex items-center gap-4 border-b border-[#0A3A23]/5 pb-5">
        <div className="p-3.5 rounded-2xl bg-[#0A3A23]/5 text-[#0A3A23] border border-[#0A3A23]/5">
          <FileText size={24} strokeWidth={2.2} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#0A3A23] tracking-tight">
            Excuse Student
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-0.5">
            Skip attendance penalty for this session
          </p>
        </div>
      </div>

      {/* 2. Metadata Information Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-[#F5F3F0]/60 border border-[#0A3A23]/5 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white text-[#0A3A23]/70 shadow-sm border border-[#0A3A23]/5">
            <User size={16} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#0A3A23]/40 uppercase">Student Info</p>
            <p className="text-sm font-black text-[#0A3A23] mt-0.5">
              {student.first_name} {student.last_name}
            </p>
            <p className="text-[11px] font-mono font-medium text-[#0A3A23]/60">
              ID: {student.student_id || student.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t md:border-t-0 md:border-l border-[#0A3A23]/10 pt-3 md:pt-0 md:pl-5">
          <div className="p-2 rounded-xl bg-white text-[#0A3A23]/70 shadow-sm border border-[#0A3A23]/5">
            <Calendar size={16} strokeWidth={2.5} />
          </div>
          <div>
            <p className="text-[10px] font-black tracking-widest text-[#0A3A23]/40 uppercase">Date</p>
            <p className="text-sm font-black text-[#0A3A23] mt-0.5">
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-[11px] font-medium text-[#008C45] flex items-center gap-1">
              <CornerDownRight size={10} strokeWidth={3} /> Today's class only
            </p>
          </div>
        </div>
      </div>

      {/* 3. Input Textarea Area */}
      <div className="space-y-2">
        <label className="text-xs font-black text-[#0A3A23] uppercase tracking-wider block">
          Reason for Absence
        </label>
        <textarea
          className="w-full p-4 rounded-2xl bg-white border border-[#0A3A23]/15 text-[#0A3A23] text-sm font-medium placeholder-[#0A3A23]/30 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all duration-200 resize-none leading-relaxed"
          rows={4}
          placeholder="e.g., Sick leave with medical note, school event, or family emergency." // 👈 Simplified placeholder
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {/* 4. Action Controls */}
      <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#0A3A23]/5">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-6 py-3 text-xs font-black uppercase tracking-wider text-[#0A3A23]/60 hover:text-[#950606] bg-[#F5F3F0] hover:bg-[#950606]/5 border border-[#0A3A23]/5 rounded-xl transition-all duration-200 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 text-xs font-black uppercase tracking-wider text-white bg-[#0A3A23] hover:bg-[#008C45] rounded-xl shadow-md shadow-[#0A3A23]/10 hover:shadow-lg hover:shadow-[#008C45]/20 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 size={14} strokeWidth={2.5} />
          )}
          {loading ? "Saving..." : "Confirm Excuse"} 
        </button>
      </div>
    </div>
  );
};

export default ExcuseModal;