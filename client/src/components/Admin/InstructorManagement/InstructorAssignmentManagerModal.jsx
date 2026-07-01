import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  User, 
  X, 
  Layers, 
  Trash2, 
  BookOpen, 
  Plus, 
  ChevronDown, 
  Loader2,
  IdCard
} from "lucide-react";
import UnassignConfirmationModal from "./UnassignConfirmationModal";

const API_URL = "http://127.0.0.1:8080";

const InstructorAssignmentManagerModal = ({ instructor, onClose }) => {
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [freeClasses, setFreeClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [classToUnassign, setClassToUnassign] = useState(null);
  
  const fetchAssignedClasses = useCallback(async () => {
    if (!instructor?.instructor_id) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API_URL}/api/admin/instructors/${instructor.instructor_id}/classes`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssignedClasses(res.data.assigned_class || []);
    } catch (err) {
      toast.error("Failed to load assigned classes.");
    }
  }, [instructor?.instructor_id]);

  const fetchFreeClasses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/classes/free`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFreeClasses(res.data || []);
    } catch (err) {
      toast.error("Failed to load available classes.");
    }
  }, []); 

  useEffect(() => {
    if (instructor) {
      fetchAssignedClasses();
      fetchFreeClasses();
    }
  }, [instructor, fetchAssignedClasses, fetchFreeClasses]);

  const assignClass = async () => {
    if (!selectedClass) return toast.warn("Please select a class first.");
    setIsActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/admin/classes/${selectedClass}/assign-instructor`,
        { instructor_id: instructor.instructor_id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Class assigned successfully!");
      setSelectedClass("");
      fetchAssignedClasses();
      fetchFreeClasses();
    } catch (err) {
      toast.error("Assignment failed.");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleInitiateRemove = (cls) => {
    setClassToUnassign(cls);
    setIsConfirmOpen(true);
  };

  const handleFinalUnassign = async () => {
    if (!classToUnassign) return;

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_URL}/api/admin/classes/${classToUnassign._id}/remove-instructor`, 
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Class unassigned successfully.");
      fetchAssignedClasses();
      fetchFreeClasses();
    } catch (err) {
      toast.error("Failed to remove class.");
    } finally {
      setIsConfirmOpen(false);
      setClassToUnassign(null);
    }
  };

  // Proper Case Name Formatter
  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const firstName = formatName(instructor?.first_name);
  const lastName = formatName(instructor?.last_name);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
        {/* Expanded Canvas Grid Layout Frame */}
        <div className="bg-white w-full max-w-4xl min-h-[580px] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 max-h-[92vh] flex flex-col md:flex-row">
          
          {/* Top Floating Close Trigger */}
          <button
            onClick={onClose}
            className="absolute top-8 right-8 z-10 p-2.5 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
          >
            <X size={22} />
          </button>

          {/* LEFT DECK: Premium Profile Identity Display */}
          <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-12 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
            <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

            {/* Premium Branding Badge Avatar */}
            <div className="w-32 h-32 rounded-[36px] bg-white text-[#0A3A23] flex items-center justify-center text-5xl font-black tracking-tighter shadow-2xl border-4 border-white/20 mb-8">
              {initials || "IN"}
            </div>

            {/* Simple Workspace Role Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-10 backdrop-blur-md">
              <User size={12} className="text-white" /> Instructor
            </span>

            <h3 className="text-2xl font-black text-white tracking-tight leading-tight max-w-[200px] break-words">
              {lastName}
            </h3>
            <p className="text-sm font-medium text-white/70 mt-2 max-w-[200px] break-words">
              {firstName}
            </p>
          </div>

          {/* RIGHT DECK: Dual Section Operational Dashboard */}
          <div className="flex-1 p-12 md:p-14 space-y-10 overflow-y-auto flex flex-col justify-between">
            
            {/* Header Content Titles */}
            <div className="space-y-1">
              <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest flex items-center gap-1.5">
                <IdCard size={12} /> ID #{instructor?.instructor_id}
              </span>
              <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">Manage Classes</h2>
            </div>

            {/* Interactive Inner Sections Block */}
            <div className="space-y-8 flex-1 mt-2">
              
              {/* SECTION A: Current Active Workload */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#0A3A23]/5 pb-2">
                  <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers size={14} className="text-[#008C45]" /> Active Assignments
                  </span>
                  <span className="bg-[#0A3A23]/5 text-[#008C45] text-[10px] font-black px-3 py-1 rounded-full border border-[#0A3A23]/5">
                    {assignedClasses.length} Total
                  </span>
                </div>

                <div className="grid gap-3 max-h-[220px] overflow-y-auto pr-1">
                  {assignedClasses.length > 0 ? (
                    assignedClasses.map((cls) => (
                      <div
                        key={cls._id}
                        className="group relative flex justify-between items-center bg-[#F5F3F0]/60 border border-[#0A3A23]/5 p-5 rounded-2xl hover:bg-white hover:border-[#0A3A23]/20 hover:shadow-sm transition-all duration-300"
                      >
                        <div className="flex flex-col gap-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[#008C45] font-black text-sm tracking-wide">
                              {cls.subject_code}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-[#0A3A23]/20"></span>
                            <span className="text-[10px] text-[#0A3A23]/50 font-extrabold uppercase">
                              {cls.course} {cls.year_level}{cls.section}
                            </span>
                          </div>
                          <span className="text-[#0A3A23] text-xs font-bold uppercase tracking-tight">
                            {cls.subject_title}
                          </span>
                        </div>

                        {/* Monochromatic Premium Clean Trash Trigger */}
                        <button
                          type="button"
                          onClick={() => handleInitiateRemove(cls)}
                          className="p-2.5 bg-[#0A3A23]/5 text-[#0A3A23]/60 hover:text-white hover:bg-[#0A3A23] rounded-xl transition-all duration-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 bg-[#F5F3F0]/30 rounded-2xl border border-dashed border-[#0A3A23]/10">
                      <BookOpen className="text-[#0A3A23]/20 mb-2" size={24} />
                      <p className="text-[#0A3A23]/40 text-[10px] font-black uppercase tracking-wider">No assigned subjects</p>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: Quick Assign Interactive Dropdown Card */}
              <div className="bg-[#F5F3F0]/50 p-6 rounded-[28px] border border-[#0A3A23]/5 space-y-4 text-left">
                <span className="text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus size={12} className="text-[#008C45]" /> Assign Class
                </span>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Styled Input Dropdown Frame */}
                  <div className="relative flex-1 w-full">
                    <select
                      value={selectedClass}
                      onChange={(e) => setSelectedClass(e.target.value)}
                      className="w-full bg-white border border-[#0A3A23]/10 px-5 py-3.5 rounded-xl text-xs font-bold text-[#0A3A23] appearance-none outline-none focus:border-[#008C45] focus:shadow-sm transition-all cursor-pointer pr-12"
                    >
                      <option value="">Select an available subject...</option>
                      {freeClasses.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.subject_code} — {cls.subject_title} ({cls.course} {cls.year_level}{cls.section})
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#0A3A23]/40" size={16} />
                  </div>

                  {/* Operational Action Button */}
                  <button
                    type="button"
                    disabled={!selectedClass || isActionLoading}
                    onClick={assignClass}
                    className={`w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300 ${
                      !selectedClass 
                        ? "bg-[#0A3A23]/5 text-[#0A3A23]/30 cursor-not-allowed border border-[#0A3A23]/5" 
                        : "bg-[#0A3A23] text-white hover:bg-[#005c2d] shadow-md shadow-[#0A3A23]/10 active:scale-98"
                    }`}
                  >
                    {isActionLoading ? (
                      <Loader2 className="animate-spin" size={14} />
                    ) : (
                      "Add Load"
                    )}
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      <UnassignConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleFinalUnassign}
        classData={classToUnassign}
      />
    </>
  );
};

export default InstructorAssignmentManagerModal;