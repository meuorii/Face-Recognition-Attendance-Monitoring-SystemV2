import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { X, UserCheck, IdCard, GraduationCap, FileText, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const EditStudentModal = ({ isOpen, onClose, student, onStudentUpdated }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    first_name: "",
    middle_name: "",
    last_name: "",
    course: "",
  });

  // 🔥 Proper Case Formatter
  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Load student data into form
  useEffect(() => {
    if (student) {
      setFormData({
        first_name: formatName(student.first_name || ""),
        middle_name: formatName(student.middle_name || ""),
        last_name: formatName(student.last_name || ""),
        course: student.course || "",
      });
    }
  }, [student]);

  if (!isOpen || !student) return null;

  // 🔥 auto-format name inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (["first_name", "middle_name", "last_name"].includes(name)) {
      formattedValue = formatName(value);
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  };

  // Submit Update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `http://127.0.0.1:8080/api/admin/students/${student.student_id}`,
        formData
      );

      toast.success("✅ Student updated successfully!");
      onStudentUpdated({ ...student, ...formData });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update student.");
    }
  };

  // Navigate to Face Re-Register
  const handleReregisterFace = () => {
    navigate("/student/register", {
      state: {
        student_id: student.student_id,
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        suffix: student.suffix || "",
        course: formData.course,
      },
    });
    onClose();
  };

  const initials = `${formData.first_name.charAt(0)}${formData.last_name.charAt(0)}`.toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      {/* Expanded Modern Canvas Layout */}
      <div className="bg-white w-full max-w-4xl md:min-h-[540px] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[92vh] flex flex-col md:flex-row">
        
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-8 right-8 z-10 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-red-600 hover:bg-red-50 transition-all active:scale-95"
        >
          <X size={22} />
        </button>

        {/* LEFT DECK: Premium Showcase Branding Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Premium Avatar Container */}
          <div className="w-32 h-32 rounded-[36px] bg-white text-[#0A3A23] flex items-center justify-center text-5xl font-black tracking-tighter shadow-2xl border-4 border-white/20 mb-8">
            {initials || "ST"}
          </div>

          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-10 backdrop-blur-md">
            <UserCheck size={12} className="text-white" /> Modifier Mode
          </span>

          <h3 className="text-2xl font-black text-white tracking-tight leading-tight max-w-[200px] break-words">
            {formData.last_name || "Surname"}
          </h3>
          <p className="text-sm font-medium text-white/70 mt-2 max-w-[200px] break-words">
            {formData.first_name} {formData.middle_name}
          </p>
        </div>

        {/* RIGHT DECK: Spacious & Symmetrical Form Layout */}
        <form onSubmit={handleSubmit} className="flex-1 p-12 md:p-14 space-y-10 overflow-y-auto flex flex-col justify-between">
          
          {/* Simple Headings */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">Update Record</span>
            <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Edit Information</h2>
          </div>

          {/* Main Form Fields Container */}
          <div className="space-y-8 flex-1 mt-4">
            
            {/* Top Row: Student ID & Course Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="rounded-2xl p-5 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 opacity-70">
                <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <IdCard size={16} className="text-[#008C45]" /> Student ID
                </span>
                <span className="text-base font-mono font-bold text-[#008C45] block">{student.student_id}</span>
              </div>

              <div className="flex flex-col rounded-2xl p-5 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-md transition-all duration-300">
                <label className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GraduationCap size={16} className="text-[#008C45]" /> Course
                </label>
                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  className="w-full bg-transparent text-base font-black text-[#0A3A23] outline-none cursor-pointer"
                  required
                >
                  <option value="">Select Course</option>
                  <option value="BSINFOTECH">BSINFOTECH</option>
                  <option value="BSCS">BSCS</option>
                </select>
              </div>
            </div>

            {/* Bottom Section: Left-aligned Symmetrical Grid for Names */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-[#F5F3F0]/50 p-6 rounded-[28px] border border-[#0A3A23]/5">
              <FormField
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
              <FormField
                label="Middle Name"
                name="middle_name"
                value={formData.middle_name}
                onChange={handleChange}
              />
              <FormField
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

          </div>

          {/* Footer Actions Area (Cleaned Up & Palettized) */}
          <div className="pt-6 border-t border-[#0A3A23]/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            {/* Re-Register Button themed using the #0A3A23 Brand Palette */}
            <button
              type="button"
              onClick={handleReregisterFace}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0A3A23]/5 text-[#0A3A23] text-xs font-black uppercase tracking-wider hover:bg-[#0A3A23]/10 active:scale-98 transition-all"
            >
              <Camera size={14} className="text-[#008C45]" />
              Re-Register Face
            </button>

            <div className="w-full sm:w-auto flex justify-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md shadow-[#0A3A23]/20 active:scale-98 transition-all"
              >
                Save Changes
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};

/* ✅ Reusable Sub-Component Form Field */
function FormField({ label, name, value, onChange, required }) {
  return (
    <div className="flex flex-col space-y-1.5 text-left w-full">
      <label className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
        <FileText size={12} className="text-[#008C45]" /> {label}
      </label>
      <input
        type="text"
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={`Enter ${label}`}
        className="w-full bg-transparent text-base font-extrabold text-[#0A3A23] border-b border-[#0A3A23]/10 focus:border-[#008C45] outline-none pb-1 transition-colors placeholder:text-[#0A3A23]/20 placeholder:font-normal"
      />
    </div>
  );
}

export default EditStudentModal;