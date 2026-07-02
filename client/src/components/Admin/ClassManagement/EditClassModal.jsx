import React, { useEffect, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { 
  Pencil, 
  Calendar, 
  X, 
  Briefcase, 
  GraduationCap, 
  Search, 
  Plus, 
  Trash2, 
  Info,
  Clock
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8080/api";

const EditClassModal = ({ isOpen, editClass, setEditClass, onClose, onSave }) => {
  const [instructors, setInstructors] = useState([]);
  const [allStudentsPool, setAllStudentsPool] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [loadingFreshData, setLoadingFreshData] = useState(false);

  // Storage block to cross-reference the original state from the database
  const [originalClassData, setOriginalClassData] = useState({ instructor: null, students: [] });

  // Helper utility to convert capitalization layout into clean Title Case
  const toTitleCase = (str) => {
    if (!str) return "";
    return str
      .toLowerCase()
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Sync core collections upon initialization
  useEffect(() => {
    if (isOpen && editClass?._id) {
      fetchDropdownOptions();
      fetchFreshClassDetails(editClass._id);
    }
  }, [isOpen, editClass?._id]);

  const fetchDropdownOptions = async () => {
    try {
      const token = localStorage.getItem("token");
      const [instRes, stuPoolRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/instructors`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/students`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setInstructors(instRes.data || []);
      setAllStudentsPool(stuPoolRes.data || []);
    } catch (err) {
      console.error("Failed to load options dropdown pools:", err);
    }
  };

  const fetchFreshClassDetails = async (classId) => {
    setLoadingFreshData(true);
    try {
      const token = localStorage.getItem("token");
      
      const [instructorRes, studentsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/classes/${classId}/instructor`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/admin/classes/${classId}/students`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const freshInstructor = instructorRes.data;
      const freshStudents = studentsRes.data || [];

      const normalizedFreshStudents = freshStudents.map(s => ({
        student_id: s.student_id,
        first_name: s.first_name || s.First_Name || "",
        last_name: s.last_name || s.Last_Name || "",
        course: s.course || s.Course || "",
        section: s.section || s.Section || ""
      }));

      setOriginalClassData({
        instructor: freshInstructor,
        students: normalizedFreshStudents
      });

      setEditClass(prev => ({
        ...prev,
        instructor_id: freshInstructor.instructor_id || null,
        instructor_first_name: freshInstructor.first_name || "",
        instructor_last_name: freshInstructor.last_name || "",
        students: normalizedFreshStudents
      }));

    } catch (err) {
      console.error("Failed to sync fresh source of truth data records:", err);
    } finally {
      setLoadingFreshData(false);
    }
  };

  // Compute live change indicators
  const auditLogs = useMemo(() => {
    if (!editClass?.students) return { added: [], removed: [] };
    
    const pristineIds = originalClassData.students.map(s => s.student_id);
    const activeIds = editClass.students.map(s => s.student_id);

    const added = editClass.students.filter(s => !pristineIds.includes(s.student_id));
    const removed = originalClassData.students.filter(s => !activeIds.includes(s.student_id));

    return { added, removed };
  }, [editClass?.students, originalClassData.students]);

  // Filter global student database pool using target search strings
  const filteredAvailableStudents = useMemo(() => {
    const currentStudentIds = new Set((editClass?.students || []).map(s => s.student_id));
    const query = studentSearchQuery.toLowerCase().trim();

    return allStudentsPool.filter(student => {
      if (currentStudentIds.has(student.student_id)) return false;
      if (!query) return false;
      
      const fName = student.first_name || "";
      const lName = student.last_name || "";
      const fullName = `${fName} ${lName}`.toLowerCase();

      return (
        student.student_id?.toLowerCase().includes(query) ||
        fullName.includes(query)
      );
    });
  }, [allStudentsPool, editClass?.students, studentSearchQuery]);

  const handleAddStudentToRoster = (student) => {
    const updatedRoster = [...(editClass.students || [])];
    
    const rawFirstName = student.first_name || "";
    const rawLastName = student.last_name || "";

    updatedRoster.push({
      student_id: student.student_id,
      first_name: rawFirstName,
      last_name: rawLastName,
      course: student.course || editClass.course || "BSINFOTECH",
      section: student.section || editClass.section || ""
    });

    setEditClass({ ...editClass, students: updatedRoster });
    setStudentSearchQuery("");
  };

  const handleRemoveStudentFromRoster = (studentId) => {
    const updatedRoster = (editClass.students || []).filter(s => s.student_id !== studentId);
    setEditClass({ ...editClass, students: updatedRoster });
  };

  const handleAddNewScheduleBlock = () => {
    const currentBlocks = Array.isArray(editClass.schedule_blocks) ? editClass.schedule_blocks : [];
    setEditClass({
      ...editClass,
      schedule_blocks: [...currentBlocks, { days: ["", "", ""], start: "", end: "" }]
    });
  };

  const handleRemoveScheduleBlock = (targetIdx) => {
    const currentBlocks = Array.isArray(editClass.schedule_blocks) ? editClass.schedule_blocks : [];
    const updatedBlocks = currentBlocks.filter((_, idx) => idx !== targetIdx);
    setEditClass({ ...editClass, schedule_blocks: updatedBlocks });
  };

  if (!isOpen || !editClass) return null;

  const subjectInitials = editClass.subject_code ? editClass.subject_code.substring(0, 2).toUpperCase() : "CL";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 flex flex-col md:flex-row animate-scaleIn">
        
        {/* Top Floating Close Trigger */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-30 p-2 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={20} />
        </button>

        {/* LEFT DECK: Profile Side Panel */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          <div className="w-28 h-28 rounded-[32px] bg-white text-[#0A3A23] flex items-center justify-center text-4xl font-black tracking-tighter shadow-2xl border-4 border-white/20 mb-6">
            {subjectInitials}
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 mb-8 backdrop-blur-md">
            <Pencil size={10} className="text-white" /> Class Settings
          </span>

          <h3 className="text-xl font-black text-white tracking-tight leading-tight max-w-[200px] break-words">
            {editClass.subject_code}
          </h3>
          <p className="text-xs font-medium text-white/70 mt-2 max-w-[200px] break-words">
            {editClass.subject_title}
          </p>
        </div>

        {/* RIGHT DECK: Main Panel */}
        <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden">
          
          {/* Main Scrollable Canvas Zone */}
          <div className="p-10 md:p-12 space-y-8 overflow-y-auto flex-1 text-left custom-scrollbar">
            
            <div className="space-y-0.5">
              <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">
                Configuration Module {loadingFreshData && <span className="animate-pulse font-normal text-[#008C45]/70 ml-1">(Syncing...)</span>}
              </span>
              <h2 className="text-2xl font-black text-[#0A3A23] tracking-tight">Modify Class</h2>
            </div>

            {/* Instructor & Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all">
                <label className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[#008C45]" /> Instructor
                </label>
                <select
                  disabled={loadingFreshData}
                  value={editClass.instructor_id || ""}
                  onChange={(e) => {
                    const inst = instructors.find((i) => i.instructor_id === e.target.value);
                    if (inst) {
                      setEditClass({
                        ...editClass,
                        instructor_id: inst.instructor_id,
                        instructor_first_name: inst.first_name,
                        instructor_last_name: inst.last_name,
                      });
                    } else {
                      setEditClass({ ...editClass, instructor_id: null, instructor_first_name: "", instructor_last_name: "" });
                    }
                  }}
                  className="w-full bg-transparent text-sm font-black text-[#0A3A23] outline-none cursor-pointer"
                >
                  <option value="">Select Instructor</option>
                  {instructors.map((inst) => (
                    <option key={inst.instructor_id} value={inst.instructor_id}>
                      {inst.first_name} {inst.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <FormField
                label="Section"
                type="text"
                value={editClass.section || ""}
                onChange={(val) => setEditClass({ ...editClass, section: val })}
              />
            </div>

            {/* Schedule Blocks Area */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#008C45]" /> Schedule blocks
                </span>
                <button
                  type="button"
                  onClick={handleAddNewScheduleBlock}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23] hover:text-white text-[9px] font-black uppercase tracking-wide transition-all"
                >
                  <Plus size={10} /> Add Block
                </button>
              </div>

              {(Array.isArray(editClass.schedule_blocks) && editClass.schedule_blocks.length > 0
                ? editClass.schedule_blocks
                : [{ days: ["", "", ""], start: "", end: "" }])
                .map((block, idx) => (
                  <div key={idx} className="p-4 border border-[#0A3A23]/5 rounded-2xl bg-[#F5F3F0]/40 space-y-3 relative">
                    
                    {editClass.schedule_blocks?.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveScheduleBlock(idx)}
                        className="absolute top-3 right-3 text-[#0A3A23]/30 hover:text-[#0A3A23]"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {/* Flexible Flex Row Area */}
                    <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
                      
                      {/* Day Drops Selection */}
                      <div className="flex items-center gap-1.5 bg-white border border-[#0A3A23]/5 rounded-xl p-1.5 w-full lg:w-auto flex-1">
                        {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                          <div key={i} className="flex-1 bg-[#F5F3F0]/60 rounded-lg px-2 py-1 text-left">
                            <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase block">{label}</span>
                            <select
                              value={block.days?.[i] || ""}
                              onChange={(e) => {
                                const newBlocks = [...(editClass.schedule_blocks || [])];
                                const newDays = [...(block.days || ["", "", ""])];
                                newDays[i] = e.target.value;
                                newBlocks[idx] = { ...block, days: newDays };
                                setEditClass({ ...editClass, schedule_blocks: newBlocks });
                              }}
                              className="w-full bg-transparent text-[11px] font-extrabold text-[#0A3A23] outline-none cursor-pointer"
                            >
                              <option value="">None</option>
                              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                                <option key={d} value={d}>{d}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>

                      {/* 🛠️ FIXED TIME INPUT CONTAINERS: Pinalawak gamit ang strict explicit spacing para iwas-bawas sa AM/PM */}
                      <div className="flex items-center justify-between gap-2 bg-white border border-[#0A3A23]/5 rounded-xl p-2 w-full lg:w-auto flex-1">
                        <div className="text-left flex-1 min-w-[115px]">
                          <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase block flex items-center gap-0.5">
                            <Clock size={8} /> Start
                          </span>
                          <input
                            type="time"
                            value={block.start || ""}
                            onChange={(e) => {
                              const newBlocks = [...(editClass.schedule_blocks || [])];
                              newBlocks[idx] = { ...block, start: e.target.value };
                              setEditClass({ ...editClass, schedule_blocks: newBlocks });
                            }}
                            className="bg-transparent text-xs font-black text-[#0A3A23] outline-none w-full px-0.5 tracking-tight"
                          />
                        </div>
                        <span className="text-[9px] text-[#0A3A23]/30 font-black uppercase self-end pb-1 px-1">to</span>
                        <div className="text-left flex-1 min-w-[115px]">
                          <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase block flex items-center gap-0.5">
                            <Clock size={8} /> End
                          </span>
                          <input
                            type="time"
                            value={block.end || ""}
                            onChange={(e) => {
                              const newBlocks = [...(editClass.schedule_blocks || [])];
                              newBlocks[idx] = { ...block, end: e.target.value };
                              setEditClass({ ...editClass, schedule_blocks: newBlocks });
                            }}
                            className="bg-transparent text-xs font-black text-[#0A3A23] outline-none w-full px-0.5 tracking-tight"
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
            </div>

            {/* Student Roster Area */}
            <div className="space-y-3 relative">
              <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap size={14} className="text-[#008C45]" /> Student Roster ({editClass.students?.length || 0})
              </span>

              {/* Search input engine */}
              <div className="relative bg-[#F5F3F0]/60 border border-[#0A3A23]/5 rounded-xl px-3 py-0.5 flex items-center focus-within:bg-white focus-within:border-[#008C45] transition-all">
                <Search className="text-[#0A3A23]/40 w-3.5 h-3.5 mr-2" />
                <input
                  type="text"
                  disabled={loadingFreshData}
                  placeholder="Type Student ID or Name..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#0A3A23] text-xs py-2 placeholder:text-[#0A3A23]/30 font-bold"
                />
              </div>

              {/* Search dropdown floating menu */}
              {studentSearchQuery && (
                <div className="absolute left-0 right-0 z-50 bg-white border border-[#0A3A23]/10 rounded-xl shadow-xl max-h-40 overflow-y-auto divide-y divide-[#0A3A23]/5 mt-1">
                  {filteredAvailableStudents.length === 0 ? (
                    <div className="p-3 text-xs text-[#0A3A23]/50 text-center font-bold">No students found</div>
                  ) : (
                    filteredAvailableStudents.map((student) => (
                      <div 
                        key={student.student_id}
                        onClick={() => handleAddStudentToRoster(student)}
                        className="p-2.5 flex items-center justify-between text-xs hover:bg-[#F5F3F0]/80 cursor-pointer text-[#0A3A23] transition-colors"
                      >
                        <div className="min-w-0 flex-1 pr-2 text-left">
                          <p className="font-extrabold truncate">{toTitleCase(student.first_name)} {toTitleCase(student.last_name)}</p>
                          <p className="text-[9px] text-[#0A3A23]/50 font-mono">{student.student_id}</p>
                        </div>
                        <span className="p-1 rounded bg-[#0A3A23]/5 text-[#008C45] flex-shrink-0">
                          <Plus className="w-3 h-3" />
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Active Enrolled Student Account Roster Card Window */}
              <div className="bg-[#F5F3F0]/30 border border-[#0A3A23]/5 rounded-[20px] overflow-y-auto h-60 p-2.5 space-y-1.5 custom-scrollbar">
                {editClass.students?.length > 0 ? (
                  editClass.students.map((student) => (
                    <div 
                      key={student.student_id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#0A3A23]/5 hover:shadow-sm transition-all"
                    >
                      <div className="min-w-0 flex-1 pr-2 text-left">
                        <p className="text-xs font-black text-[#0A3A23] truncate">
                          {toTitleCase(student.first_name)} {toTitleCase(student.last_name)}
                        </p>
                        <p className="text-[9px] text-[#0A3A23]/40 font-mono">{student.student_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudentFromRoster(student.student_id)}
                        className="p-1.5 text-[#0A3A23]/50 hover:text-[#0A3A23] hover:bg-[#F5F3F0] rounded-md transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 h-full">
                    <GraduationCap className="text-[#0A3A23]/20 mb-1" size={20} />
                    <p className="text-[#0A3A23]/40 text-[9px] font-black uppercase tracking-wider">Empty Roster</p>
                  </div>
                )}
              </div>
            </div>

            {/* Audit Logs Log Engine */}
            {(auditLogs.added.length > 0 || auditLogs.removed.length > 0) && (
              <div className="p-3.5 bg-[#0A3A23]/5 border border-[#0A3A23]/5 rounded-xl text-[11px] space-y-1 text-left w-full">
                <div className="flex items-center gap-1 text-[#008C45] font-black uppercase tracking-wider text-[9px]">
                  <Info size={12} /> Pending Changes:
                </div>
                {auditLogs.added.length > 0 && (
                  <div className="text-[#0A3A23]/70 font-bold leading-relaxed">
                    Enrolling:{" "}
                    <span className="font-extrabold text-[#0A3A23]">
                      {auditLogs.added.map(s => `${toTitleCase(s.first_name)} ${toTitleCase(s.last_name)}`).join(", ")}
                    </span>
                  </div>
                )}
                {auditLogs.removed.length > 0 && (
                  <div className="text-[#0A3A23]/50 font-bold leading-relaxed">
                    Removing:{" "}
                    <span className="font-extrabold text-[#0A3A23]/70">
                      {auditLogs.removed.map(s => `${toTitleCase(s.first_name)} ${toTitleCase(s.last_name)}`).join(", ")}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* 🛠️ THE CRITICAL FIXED CLEARANCE SPACER: Pinipigilan nito na takpan ng CTA buttons ang dulo ng student roster cards at pending changelog */}
            <div className="h-10 pointer-events-none" />

          </div>

          {/* FIXED BOTTOM CONTROL PANEL FOOTER BAR */}
          <div className="absolute bottom-0 right-0 left-0 z-20 bg-gradient-to-t from-white via-white to-white/80 border-t border-[#0A3A23]/10 px-10 md:px-12 py-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-[#F5F3F0] text-[#0A3A23]/70 text-xs font-black uppercase tracking-wider hover:bg-[#eae7e2] transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loadingFreshData}
              onClick={onSave}
              className="px-6 py-2.5 rounded-lg bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md transition-all"
            >
              Save Changes
            </button>
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

/* Symmetrical Input Form Field Component */
function FormField({ label, type = "text", value, onChange }) {
  return (
    <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all w-full text-left">
      <label className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 flex items-center gap-1.5">
        <Pencil size={12} className="text-[#008C45]" /> {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-black text-[#0A3A23] outline-none"
        placeholder={`Enter ${label}`}
      />
    </div>
  );
}

export default EditClassModal;