import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { BookOpen, X, Plus, GraduationCap, Calendar } from "lucide-react";

export default function AddSubjectModal({ isOpen, onClose, onAdded }) {
  const [loading, setLoading] = useState(false);
  const [adminProgram, setAdminProgram] = useState("");

  const [form, setForm] = useState({
    subject_code: "",
    subject_title: "",
    year_level: "",
    semester: "",
    curriculum: ""
  });

  const API_URL = "http://127.0.0.1:8080";

  // Auto-fetch ng current admin program/course para hindi na kailangang i-type manu-mano
  useEffect(() => {
    if (isOpen) {
      const fetchAdminProfile = async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get(`${API_URL}/api/admin/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setAdminProgram(res.data.program || "");
        } catch (err) {
          console.error("Failed to fetch admin program context:", err);
        }
      };
      fetchAdminProfile();
    }
  }, [isOpen]);

  const resetForm = () => {
    setForm({
      subject_code: "",
      subject_title: "",
      year_level: "",
      semester: "",
      curriculum: ""
    });
  };

  const handleInputChange = (name, value) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.subject_code || !form.subject_title || !form.year_level || !form.semester || !form.curriculum) {
      return toast.error("Please fill in all required fields");
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const payload = {
        subject_code: form.subject_code.trim().toUpperCase(),
        subject_title: form.subject_title.trim(),
        course: adminProgram, // Galing sa profile ng admin account
        year_level: form.year_level,
        semester: form.semester,
        curriculum: form.curriculum.trim().toUpperCase()
      };

      const res = await axios.post(`${API_URL}/api/admin/subjects`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(res.data.message || "Subject created successfully");
      if (onAdded) onAdded();
      onClose();
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || "Failed to create subject record");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#0A3A23]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
      <div className="bg-[#F5F3F0] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200 min-h-[480px]">
        
        {/* Left Side: Branding and Context Panel */}
        <div className="md:w-5/12 bg-[#0A3A23] p-8 text-white flex flex-col justify-between relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#008C45]/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div>
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Curriculum Setup</h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
              Add distinct course modules to build out student track sequences and assign program syllabi.
            </p>
          </div>

          <div className="mt-8 border-t border-emerald-800/60 pt-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300/90 block mb-1">
              Active Department
            </span>
            <span className="text-sm font-bold text-white tracking-wide">
              {adminProgram || "Loading program context..."}
            </span>
          </div>
        </div>

        {/* Right Side: Fields Input Layout */}
        <div className="flex-1 p-8 relative flex flex-col justify-center bg-white">
          <button
            type="button"
            onClick={() => { onClose(); resetForm(); }}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* Row 1: Code and Curriculum Track */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                label="Subject Code"
                type="text"
                placeholder="e.g. IM 101"
                value={form.subject_code}
                onChange={(val) => handleInputChange("subject_code", val)}
              />
              <FormField
                label="Curriculum Track"
                type="text"
                placeholder="e.g. CY 2026"
                value={form.curriculum}
                onChange={(val) => handleInputChange("curriculum", val)}
              />
            </div>

            {/* Row 2: Subject Full Title */}
            <FormField
              label="Subject Descriptive Title"
              type="text"
              placeholder="e.g. Advanced Database Systems"
              value={form.subject_title}
              onChange={(val) => handleInputChange("subject_title", val)}
            />

            {/* Row 3: Operational Dropdowns (Year Level & Semester) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Year Level Select */}
              <div className="flex flex-col rounded-xl p-3.5 border border-neutral-300 bg-[#F5F3F0]/40 focus-within:bg-white focus-within:border-[#008C45] focus-within:ring-2 focus-within:ring-[#008C45]/10 transition-all">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">
                  Year Level
                </label>
                <div className="relative flex items-center">
                  <GraduationCap className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <select
                    value={form.year_level}
                    onChange={(e) => handleInputChange("year_level", e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-neutral-800 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              {/* Semester Select */}
              <div className="flex flex-col rounded-xl p-3.5 border border-neutral-300 bg-[#F5F3F0]/40 focus-within:bg-white focus-within:border-[#008C45] focus-within:ring-2 focus-within:ring-[#008C45]/10 transition-all">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">
                  Academic Session
                </label>
                <div className="relative flex items-center">
                  <Calendar className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
                  <select
                    value={form.semester}
                    onChange={(e) => handleInputChange("semester", e.target.value)}
                    className="w-full bg-transparent text-sm font-semibold text-neutral-800 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Select Session</option>
                    <option value="1st Semester">1st Semester</option>
                    <option value="2nd Semester">2nd Semester</option>
                    <option value="Mid Year">Mid Year</option>
                  </select>
                </div>
              </div>

            </div>

            {/* Footer Buttons Action Zone */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { onClose(); resetForm(); }}
                className="px-5 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#0A3A23] hover:bg-[#0A3A23]/90 active:scale-[0.99] transition-all text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md shadow-[#0A3A23]/10 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? "Saving Subject..." : "Create Subject"}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}

/* Symmetrical Text Field Input Sub-component */
function FormField({ label, type, placeholder, value, onChange }) {
  return (
    <div className="flex flex-col rounded-xl p-3.5 border border-neutral-300 bg-[#F5F3F0]/40 focus-within:bg-white focus-within:border-[#008C45] focus-within:ring-2 focus-within:ring-[#008C45]/10 transition-all w-full">
      <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-semibold text-neutral-800 outline-none placeholder:text-neutral-400 placeholder:font-normal"
      />
    </div>
  );
}