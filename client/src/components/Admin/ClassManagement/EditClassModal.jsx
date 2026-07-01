import { createPortal } from "react-dom";
import { useEffect, useState, useMemo } from "react";
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
  Info 
} from "lucide-react";

const API_BASE = "http://127.0.0.1:8080/api";

const EditClassModal = ({ isOpen, editClass, setEditClass, onClose, onSave }) => {
  const [instructors, setInstructors] = useState([]);
  const [allStudentsPool, setAllStudentsPool] = useState([]);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [loadingFreshData, setLoadingFreshData] = useState(false);

  // Storage block to cross-reference the original state from the database
  const [originalClassData, setOriginalClassData] = useState({ instructor: null, students: [] });

  // Helper utility to convert ANY messy capitalization layout into clean Title Case
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

      // Normalize incoming class roster items to ensure strict lowercase key support
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

  // Compute live change indicators (Diff logic for Added/Removed logs)
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
      // Rule out matches already enrolled in the local state array
      if (currentStudentIds.has(student.student_id)) return false;
      if (!query) return false;
      
      // Match incoming payload structure keys safely
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
    
    // Explicit reference extraction to avoid field absence dropouts
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

  if (!isOpen || !editClass) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
      <div
        className="bg-gradient-to-br from-neutral-900/95 to-neutral-950/95 backdrop-blur-xl 
                   w-full max-w-sm sm:max-w-lg md:max-w-3xl lg:max-w-5xl 
                   rounded-2xl shadow-2xl border border-white/10 
                   p-4 sm:p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
      >
        {/* Header Block */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 border-b border-white/10 pb-2 sm:pb-3">
          <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold flex items-center gap-2">
            <Pencil className="text-yellow-400 w-5 h-5 sm:w-6 sm:h-6" />
            <span className="bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
              Edit Class Config
            </span>
            {loadingFreshData && (
              <span className="text-xs font-normal text-neutral-400 animate-pulse ml-2">
                (Updating configuration metrics...)
              </span>
            )}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-neutral-800/60 hover:bg-rose-600/60 
                       text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Content Structure Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* LEFT COLUMN: Class Context Meta Fields */}
          <div className="space-y-6">
            <div>
              <label className="text-neutral-400 text-xs sm:text-sm mb-1 flex items-center gap-2">
                <Briefcase className="text-yellow-400 w-4 h-4" /> Instructor Selection
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
                className="w-full px-3 py-2 rounded-lg bg-neutral-800 border border-neutral-700 
                           text-white focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 
                           transition text-sm disabled:opacity-50"
              >
                <option value="">Select Instructor</option>
                {instructors.map((inst) => (
                  <option key={inst.instructor_id} value={inst.instructor_id}>
                    {inst.first_name} {inst.last_name} ({inst.instructor_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <FormField
                label="Target Section Assignment"
                type="text"
                value={editClass.section || ""}
                onChange={(val) => setEditClass({ ...editClass, section: val })}
              />
            </div>

            {/* Timetable Configuration Sub-grids */}
            <div>
              <h4 className="text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
                <Calendar className="text-yellow-400 w-4 h-4" /> Schedule Blocks
              </h4>

              {(Array.isArray(editClass.schedule_blocks) && editClass.schedule_blocks.length > 0
                ? editClass.schedule_blocks
                : [{ days: ["", "", ""], start: "", end: "" }])
                .map((block, idx) => (
                  <div key={idx} className="mb-4 p-3 border border-neutral-700/60 rounded-xl bg-neutral-800/40">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                      {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                        <div key={i}>
                          <select
                            value={block.days?.[i] || ""}
                            onChange={(e) => {
                              const newBlocks = [...(editClass.schedule_blocks || [])];
                              const newDays = [...(block.days || ["", "", ""])];
                              newDays[i] = e.target.value;
                              newBlocks[idx] = { ...block, days: newDays };
                              setEditClass({ ...editClass, schedule_blocks: newBlocks });
                            }}
                            className="w-full px-2 py-1.5 rounded-lg bg-neutral-700 border border-neutral-600 
                                       text-white focus:border-yellow-400 transition text-xs"
                          >
                            <option value="">{label}</option>
                            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        label="Start Time"
                        type="time"
                        value={block.start || ""}
                        onChange={(val) => {
                          const newBlocks = [...(editClass.schedule_blocks || [])];
                          newBlocks[idx] = { ...block, start: val };
                          setEditClass({ ...editClass, schedule_blocks: newBlocks });
                        }}
                      />
                      <FormField
                        label="End Time"
                        type="time"
                        value={block.end || ""}
                        onChange={(val) => {
                          const newBlocks = [...(editClass.schedule_blocks || [])];
                          newBlocks[idx] = { ...block, end: val };
                          setEditClass({ ...editClass, schedule_blocks: newBlocks });
                        }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* RIGHT COLUMN: Roster Search & Dynamic Active Listings */}
          <div className="border-t md:border-t-0 md:border-l border-neutral-800 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between relative">
            <div>
              <h4 className="text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
                <GraduationCap className="text-yellow-400 w-4 h-4" /> Live Student Roster ({editClass.students?.length || 0})
              </h4>

              {/* Live Filter Lookup Input Bar */}
              <div className="relative mb-3 bg-neutral-800 border border-neutral-700 rounded-xl px-3 flex items-center focus-within:border-yellow-400 transition">
                <Search className="text-neutral-500 w-3.5 h-3.5 mr-2" />
                <input
                  type="text"
                  disabled={loadingFreshData}
                  placeholder="Type Student ID or Name to enroll..."
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-white text-xs py-2 placeholder:text-neutral-500 disabled:opacity-50"
                />
              </div>

              {/* DYNAMIC DROPDOWN MENU - FIXED WITH EXACT API KEYS */}
              {studentSearchQuery && (
                <div className="absolute left-6 right-0 z-50 bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto divide-y divide-neutral-800/80">
                  {filteredAvailableStudents.length === 0 ? (
                    <div className="p-3 text-xs text-neutral-400 text-center">No matches found</div>
                  ) : (
                    filteredAvailableStudents.map((student) => {
                      // FIXED: Directly mapped using lowercase `first_name` and `last_name` based on your API response payload
                      const formattedName = `${toTitleCase(student.first_name)} ${toTitleCase(student.last_name)}`;

                      return (
                        <div 
                          key={student.student_id}
                          onClick={() => handleAddStudentToRoster(student)}
                          className="p-3 flex items-center justify-between text-xs hover:bg-neutral-800 cursor-pointer text-white transition"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            {/* Display clean title case name cleanly above the monospace key string */}
                            <p className="font-bold text-neutral-100 text-sm truncate">{formattedName}</p>
                            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{student.student_id}</p>
                          </div>
                          <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0 hover:bg-emerald-500 hover:text-white transition">
                            <Plus className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Current Active Roster List Mapping Grid */}
              <div className="bg-neutral-900/50 border border-neutral-800 rounded-xl overflow-y-auto h-48 p-2 space-y-1 mb-4">
                {editClass.students?.map((student) => (
                  <div 
                    key={student.student_id}
                    className="flex items-center justify-between p-2 rounded-lg bg-neutral-800/40 border border-neutral-800 text-white"
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <p className="text-xs font-bold truncate">
                        {toTitleCase(student.first_name)} {toTitleCase(student.last_name)}
                      </p>
                      <p className="text-[10px] text-neutral-400 font-mono">{student.student_id}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveStudentFromRoster(student.student_id)}
                      className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Changes Footprint Summary Panel */}
            {(auditLogs.added.length > 0 || auditLogs.removed.length > 0) && (
              <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-xl text-[11px] space-y-2">
                <div className="flex items-center gap-1.5 text-neutral-400 font-bold uppercase tracking-wider text-[10px]">
                  <Info className="text-amber-400 w-3.5 h-3.5" /> Pending Changes Summary:
                </div>
                {auditLogs.added.length > 0 && (
                  <div className="text-emerald-400 font-medium leading-relaxed">
                    ➕ <span className="font-bold">Adding:</span>{" "}
                    {auditLogs.added.map(s => `${toTitleCase(s.first_name)} ${toTitleCase(s.last_name)} (${s.student_id})`).join(", ")}
                  </div>
                )}
                {auditLogs.removed.length > 0 && (
                  <div className="text-rose-400 font-medium leading-relaxed">
                    ➖ <span className="font-bold">Removing:</span>{" "}
                    {auditLogs.removed.map(s => `${toTitleCase(s.first_name)} ${toTitleCase(s.last_name)} (${s.student_id})`).join(", ")}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Global Modal CTA Controls Footer */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8 border-t border-neutral-700 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm text-white transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={loadingFreshData}
            onClick={onSave}
            className="w-full sm:w-auto px-5 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 rounded-lg text-sm text-white font-semibold shadow transition disabled:opacity-50"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

function FormField({ label, type = "text", value, onChange }) {
  return (
    <div>
      <label className="block text-neutral-400 text-xs sm:text-sm mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-1.5 rounded-lg bg-neutral-800 border border-neutral-700 
                   focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400 
                   text-white text-sm transition"
      />
    </div>
  );
}

export default EditClassModal;