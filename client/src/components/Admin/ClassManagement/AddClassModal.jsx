import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { 
  X, 
  Plus, 
  Trash2, 
  Calendar, 
  Clock, 
  Briefcase, 
  GraduationCap, 
  Search, 
  BookOpen, 
  FileText, 
  UploadCloud, 
  Info 
} from "lucide-react";

const API_URL = "http://127.0.0.1:8080";

const DAYS_OPTIONS = [
  { label: "Mon", value: "Mon" },
  { label: "Tue", value: "Tue" },
  { label: "Wed", value: "Wed" },
  { label: "Thu", value: "Thu" },
  { label: "Fri", value: "Fri" },
  { label: "Sat", value: "Sat" },
  { label: "Sun", value: "Sun" },
];

const AddClassModal = ({ isOpen, onClose, onAdded }) => {
  const [loading, setLoading] = useState(false);
  const [creationMode, setCreationMode] = useState("pdf"); // 'pdf' or 'manual'

  // PDF Mode States
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [progress, setProgress] = useState(0);

  // Manual Mode Form Options States
  const [adminProgram, setAdminProgram] = useState("");
  const [activeSemesterInfo, setActiveSemesterInfo] = useState(null);
  const [subjectsList, setSubjectsList] = useState([]);
  const [filteredSubjects, setFilteredSubjects] = useState([]);
  const [curriculumOptions, setCurriculumOptions] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [availableStudents, setAvailableStudents] = useState([]);
  
  // Roster Search States
  const [studentSearchQuery, setStudentSearchQuery] = useState("");
  const [selectedStudentsList, setSelectedStudentsList] = useState([]); // holds full student objects

  // Schedule Blocks (Max 3 items)
  const [scheduleBlocks, setScheduleBlocks] = useState([
    { days: ["", "", ""], start: "", end: "" }
  ]);

  // Manual Form States
  const [manualForm, setManualForm] = useState({
    curriculum: "",
    selected_subject_id: "",
    subject_code: "",
    subject_title: "",
    year_level: "",
    section: "",
    instructor_id: "",
    selected_student_ids: []
  });

  useEffect(() => {
    if (isOpen && creationMode === "manual") {
      fetchManualData();
    }
  }, [isOpen, creationMode]);

  const fetchManualData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      const profileRes = await axios.get(`${API_URL}/api/admin/profile`, { headers });
      setAdminProgram(profileRes.data.program || "");

      const subjectsRes = await axios.get(`${API_URL}/api/admin/subjects/active`, { headers });
      const activeSubjects = subjectsRes.data.subjects || [];
      setSubjectsList(activeSubjects);
      setActiveSemesterInfo(subjectsRes.data.active_semester || null);

      const uniqueCurriculums = [...new Set(activeSubjects.map(s => s.curriculum).filter(Boolean))];
      setCurriculumOptions(uniqueCurriculums);

      const instRes = await axios.get(`${API_URL}/api/admin/instructors`, { headers });
      setInstructors(instRes.data);

      const studsRes = await axios.get(`${API_URL}/api/admin/students`, { headers });
      setAvailableStudents(studsRes.data);

    } catch (err) {
      toast.error("Failed to fetch curriculum subjects or roster options.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setFilteredSubjects([]);
    setStudentSearchQuery("");
    setSelectedStudentsList([]);
    setScheduleBlocks([{ days: ["", "", ""], start: "", end: "" }]);
    setManualForm({
      curriculum: "",
      selected_subject_id: "",
      subject_code: "",
      subject_title: "",
      year_level: "",
      section: "",
      instructor_id: "",
      selected_student_ids: []
    });
  };

  // ----------------------------------------------------
  // ROSTER SEARCH ENGINE LOGIC
  // ----------------------------------------------------
  const filteredAvailableStudents = useMemo(() => {
    const currentStudentIds = new Set(selectedStudentsList.map(s => s.student_id));
    const query = studentSearchQuery.toLowerCase().trim();

    return availableStudents.filter(student => {
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
  }, [availableStudents, selectedStudentsList, studentSearchQuery]);

  const handleAddStudentToRoster = (student) => {
    setSelectedStudentsList(prev => [...prev, student]);
    setStudentSearchQuery("");
  };

  const handleRemoveStudentFromRoster = (studentId) => {
    setSelectedStudentsList(prev => prev.filter(s => s.student_id !== studentId));
  };

  // Keep manual form state IDs aligned with the selected list objects
  useEffect(() => {
    setManualForm(prev => ({
      ...prev,
      selected_student_ids: selectedStudentsList.map(s => s.student_id)
    }));
  }, [selectedStudentsList]);

  // ----------------------------------------------------
  // SCHEDULE BLOCK CONFIGURATIONS (MAX 3)
  // ----------------------------------------------------
  const handleTimeChange = (index, field, value) => {
    setScheduleBlocks(prev => prev.map((block, i) => i === index ? { ...block, [field]: value } : block));
  };

  const handleDaySelectChange = (blockIndex, selectPositionIndex, value) => {
    setScheduleBlocks(prev => prev.map((block, i) => {
      if (i !== blockIndex) return block;
      const updatedDays = [...block.days];
      updatedDays[selectPositionIndex] = value;
      return { ...block, days: updatedDays };
    }));
  };

  const addScheduleBlock = () => {
    if (scheduleBlocks.length >= 3) {
      return toast.warning("Maximum of 3 schedule blocks allowed.");
    }
    setScheduleBlocks(prev => [...prev, { days: ["", "", ""], start: "", end: "" }]);
  };

  const removeScheduleBlock = (index) => {
    if (scheduleBlocks.length === 1) return;
    setScheduleBlocks(prev => prev.filter((_, i) => i !== index));
  };

  const getCleanedScheduleBlocks = () => {
    return scheduleBlocks.map(block => ({
      ...block,
      days: [...new Set(block.days.filter(d => d !== ""))]
    }));
  };

  const validateScheduleBlocks = (cleanedBlocks) => {
    for (let block of cleanedBlocks) {
      if (block.days.length === 0) {
        toast.error("Please pick at least one day per schedule block.");
        return false;
      }
      if (!block.start || !block.end) {
        toast.error("Please assign clear Start and End times.");
        return false;
      }
    }
    return true;
  };

  // ----------------------------------------------------
  // SELECT HANDLERS
  // ----------------------------------------------------
  const handleCurriculumChange = (e) => {
    const selectedCurriculum = e.target.value;
    setManualForm(prev => ({
      ...prev,
      curriculum: selectedCurriculum,
      selected_subject_id: "",
      subject_code: "",
      subject_title: "",
      year_level: ""
    }));

    if (!selectedCurriculum) {
      setFilteredSubjects([]);
      return;
    }
    const filtered = subjectsList.filter(s => s.curriculum === selectedCurriculum);
    setFilteredSubjects(filtered);
  };

  const handleSubjectChange = (e) => {
    const subjectId = e.target.value;
    if (!subjectId) {
      setManualForm(prev => ({
        ...prev,
        selected_subject_id: "",
        subject_code: "",
        subject_title: "",
        year_level: ""
      }));
      return;
    }

    const targetSubj = filteredSubjects.find(s => s._id === subjectId);
    if (targetSubj) {
      setManualForm(prev => ({
        ...prev,
        selected_subject_id: subjectId,
        subject_code: targetSubj.subject_code,
        subject_title: targetSubj.subject_title,
        year_level: targetSubj.year_level ? String(targetSubj.year_level) : "1"
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  // ----------------------------------------------------
  // PDF FLOW HANDLERS
  // ----------------------------------------------------
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreview(null);
    setProgress(0);

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const res = await axios.post(`${API_URL}/api/admin/class/preview-pdf`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (event) => {
          if (event.total) {
            const percent = Math.round((event.loaded * 100) / event.total);
            setProgress(percent);
          }
        }
      });

      setPreview(res.data);
      toast.success("Preview generated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to preview PDF");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfConfirm = async () => {
    if (!preview || !selectedFile || !preview.instructor_id) {
      return toast.error("Incomplete PDF structure or preview details missing.");
    }
    
    const cleanedBlocks = getCleanedScheduleBlocks();
    if (!validateScheduleBlocks(cleanedBlocks)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const classPayload = {
        subject_code: preview.subject_code,
        subject_title: preview.subject_title,
        course: preview.course,
        year_level: preview.year_level,
        section: preview.section,
        instructor_id: preview.instructor_id,
        schedule_blocks: cleanedBlocks
      };

      const createRes = await axios.post(`${API_URL}/api/admin/create-class`, classPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const classId = createRes.data.created_class?._id;
      if (!classId) throw new Error("Class ID was not returned by the server.");

      const formData = new FormData();
      formData.append("file", selectedFile);

      await axios.post(`${API_URL}/api/admin/${classId}/upload-students`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Class created via PDF successfully!");
      onAdded();
      onClose();
      resetModal();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create class via PDF");
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------
  // MANUAL SUBMIT
  // ----------------------------------------------------
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualForm.subject_code || !manualForm.subject_title || !manualForm.section || !manualForm.instructor_id || !manualForm.year_level) {
      return toast.error("Please fill in all required fields.");
    }
    
    const cleanedBlocks = getCleanedScheduleBlocks();
    if (!validateScheduleBlocks(cleanedBlocks)) return;

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      const manualPayload = {
        subject_code: manualForm.subject_code,
        subject_title: manualForm.subject_title,
        course: adminProgram,
        year_level: manualForm.year_level,
        section: manualForm.section,
        instructor_id: manualForm.instructor_id,
        schedule_blocks: cleanedBlocks,
        students: manualForm.selected_student_ids.map(id => ({ student_id: id }))
      };

      await axios.post(`${API_URL}/api/admin/create-class-manual`, manualPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success("Class created manually!");
      onAdded();
      onClose();
      resetModal();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save manual class record.");
    } finally {
      setLoading(false);
    }
  };

  const formatName = (first, last) => {
    if (!first || !last) return "";
    const raw = `${first} ${last}`;
    return raw.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  if (!isOpen) return null;

  // ----------------------------------------------------
  // REUSABLE SCHEDULE BLOCK COMPONENT (SAME AS EDIT CLASS)
  // ----------------------------------------------------
  const renderScheduleBlockSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar size={14} className="text-[#008C45]" /> Schedule blocks
        </span>
        {scheduleBlocks.length < 3 && (
          <button
            type="button"
            onClick={addScheduleBlock}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23] hover:text-white text-[9px] font-black uppercase tracking-wide transition-all"
          >
            <Plus size={10} /> Add Block
          </button>
        )}
      </div>

      {scheduleBlocks.map((block, idx) => (
        <div key={idx} className="p-4 border border-[#0A3A23]/5 rounded-2xl bg-[#F5F3F0]/40 space-y-3 relative">
          
          {scheduleBlocks.length > 1 && (
            <button
              type="button"
              onClick={() => removeScheduleBlock(idx)}
              className="absolute top-3 right-3 text-[#0A3A23]/30 hover:text-[#0A3A23]"
            >
              <X size={14} />
            </button>
          )}

          <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
            
            {/* Day Select Dropdowns */}
            <div className="flex items-center gap-1.5 bg-white border border-[#0A3A23]/5 rounded-xl p-1.5 w-full lg:w-auto flex-1">
              {["Day 1", "Day 2", "Day 3"].map((label, i) => (
                <div key={i} className="flex-1 bg-[#F5F3F0]/60 rounded-lg px-2 py-1 text-left">
                  <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase block">{label}</span>
                  <select
                    value={block.days[i] || ""}
                    onChange={(e) => handleDaySelectChange(idx, i, e.target.value)}
                    className="w-full bg-transparent text-[11px] font-extrabold text-[#0A3A23] outline-none cursor-pointer"
                  >
                    <option value="">None</option>
                    {DAYS_OPTIONS.map((day) => (
                      <option key={day.value} value={day.value}>
                        {day.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Timers Container With Explicit Width */}
            <div className="flex items-center justify-between gap-2 bg-white border border-[#0A3A23]/5 rounded-xl p-2 w-full lg:w-auto flex-1">
              <div className="text-left flex-1 min-w-[115px]">
                <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase flex items-center gap-0.5">
                  <Clock size={8} /> Start
                </span>
                <input
                  type="time"
                  value={block.start}
                  onChange={(e) => handleTimeChange(idx, "start", e.target.value)}
                  className="bg-transparent text-xs font-black text-[#0A3A23] outline-none w-full px-0.5 tracking-tight"
                />
              </div>
              <span className="text-[9px] text-[#0A3A23]/30 font-black uppercase self-end pb-1 px-1">to</span>
              <div className="text-left flex-1 min-w-[115px]">
                <span className="text-[7px] font-black text-[#0A3A23]/30 uppercase flex items-center gap-0.5">
                  <Clock size={8} /> End
                </span>
                <input
                  type="time"
                  value={block.end}
                  onChange={(e) => handleTimeChange(idx, "end", e.target.value)}
                  className="bg-transparent text-xs font-black text-[#0A3A23] outline-none w-full px-0.5 tracking-tight"
                />
              </div>
            </div>

          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A3A23]/40 backdrop-blur-md animate-fadeIn px-6">
      
      {/* Premium Two-Split Frame Frame Container */}
      <div className="bg-white w-full max-w-5xl h-[88vh] rounded-[44px] shadow-[0_50px_110px_rgba(10,58,35,0.28)] border border-[#0A3A23]/10 overflow-hidden relative transform transition-all scale-100 flex flex-col md:flex-row animate-scaleIn">
        
        {/* Floating Top Close Button */}
        <button
          onClick={() => { onClose(); resetModal(); }}
          className="absolute top-6 right-6 z-30 p-2 rounded-full text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-[#F5F3F0] transition-all active:scale-95"
        >
          <X size={20} />
        </button>

        {/* LEFT DECK: Sidebar & Creation Route Selector */}
        <div className="md:w-1/3 bg-gradient-to-b from-[#0A3A23] to-[#005c2d] p-10 flex flex-col items-center justify-center text-center relative overflow-hidden shrink-0">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/5 rounded-full pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-44 h-44 bg-white/5 rounded-full pointer-events-none" />

          {/* Mode Icon Badge */}
          <div className="w-24 h-24 rounded-[28px] bg-white text-[#0A3A23] flex items-center justify-center shadow-2xl border-4 border-white/20 mb-6">
            {creationMode === "pdf" ? (
              <FileText size={40} className="text-[#0A3A23]" />
            ) : (
              <BookOpen size={40} className="text-[#0A3A23]" />
            )}
          </div>

          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest border border-white/20 mb-8 backdrop-blur-md">
            Class Creator
          </span>

          {/* Tab Route Buttons */}
          <div className="w-full space-y-3 px-2 z-10">
            <button
              type="button"
              onClick={() => { setCreationMode("pdf"); resetModal(); }}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                creationMode === "pdf" 
                  ? "bg-white text-[#0A3A23] border-white shadow-lg" 
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              Upload PDF
            </button>
            <button
              type="button"
              onClick={() => { setCreationMode("manual"); resetModal(); }}
              className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                creationMode === "manual" 
                  ? "bg-white text-[#0A3A23] border-white shadow-lg" 
                  : "bg-white/10 text-white border-white/20 hover:bg-white/20"
              }`}
            >
              Create Manually
            </button>
          </div>
        </div>

        {/* RIGHT DECK: Scrollable Content Form Area */}
        <div className="flex-1 flex flex-col h-full relative bg-white overflow-hidden">
          
          <div className="p-10 md:p-12 space-y-8 overflow-y-auto flex-1 text-left custom-scrollbar">
            
            {/* Header Identity */}
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black text-[#008C45] uppercase tracking-widest block">
                  Class Module Setup
                </span>
                <h2 className="text-2xl font-black text-[#0A3A23] tracking-tight">
                  {creationMode === "pdf" ? "Upload Class List" : "Create Class Manually"}
                </h2>
              </div>
              
              {creationMode === "manual" && activeSemesterInfo && (
                <span className="text-[9px] bg-[#F5F3F0] text-[#0A3A23] font-black uppercase tracking-wider px-3 py-1.5 rounded-full border border-[#0A3A23]/10">
                  {activeSemesterInfo.semester_name} — {activeSemesterInfo.school_year}
                </span>
              )}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* PDF UPLOAD MODE CONTENT AREA */}
            {/* ------------------------------------------------------------- */}
            {creationMode === "pdf" && (
              <div className="space-y-6">
                {!preview && (
                  <div className="space-y-4">
                    <p className="text-xs text-[#0A3A23]/60 font-medium">
                      Select your class schedule PDF. Extracted details and student rosters will render below.
                    </p>
                    
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-[#0A3A23]/10 hover:border-[#008C45] transition rounded-2xl cursor-pointer bg-[#F5F3F0]/40 hover:bg-white p-6">
                      <div className="flex flex-col items-center justify-center space-y-2 text-center">
                        <UploadCloud className="text-[#008C45]" size={40} />
                        <p className="text-sm font-black text-[#0A3A23]">Drag & drop PDF here</p>
                        <p className="text-xs text-[#0A3A23]/40 font-bold">or click to browse local files</p>
                      </div>
                      <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                    </label>

                    {loading && (
                      <div className="w-full mt-2 space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] font-black text-[#0A3A23]">
                          <span>Scanning Document...</span>
                          <span>{progress}%</span>
                        </div>
                        <div className="w-full bg-[#F5F3F0] rounded-full h-2 overflow-hidden">
                          <div className="bg-[#008C45] h-full rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {preview && (
                  <div className="space-y-6 animate-fadeIn">
                    <div className="p-5 rounded-2xl border border-[#0A3A23]/5 bg-[#F5F3F0]/40 space-y-4">
                      <h3 className="text-sm font-black text-[#0A3A23] uppercase tracking-wider border-b border-[#0A3A23]/5 pb-2">Extracted Details</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-[#0A3A23]/80">
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] text-[#0A3A23]/40 uppercase block">Subject Code</span>
                            <span className="text-sm font-black text-[#0A3A23]">{preview.subject_code}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#0A3A23]/40 uppercase block">Course & Section</span>
                            <span>{preview.course} {preview.section}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <span className="text-[9px] text-[#0A3A23]/40 uppercase block">Subject Title</span>
                            <span>{preview.subject_title}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-[#0A3A23]/40 uppercase block">Assigned Instructor</span>
                            <span>{preview.instructor_first_name} {preview.instructor_last_name}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {renderScheduleBlockSection()}

                    <div className="space-y-3">
                      <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider block">
                        Roster Students ({preview.valid_students?.length || 0})
                      </span>
                      <div className="max-h-48 overflow-y-auto bg-[#F5F3F0]/30 border border-[#0A3A23]/5 rounded-2xl p-3 space-y-2 custom-scrollbar">
                        {preview.valid_students?.map((stu, i) => (
                          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]">
                            <span>{stu.student_id}</span>
                            <span className="text-[#0A3A23]/60">{formatName(stu.first_name, stu.last_name)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* MANUAL CREATION MODE AREA */}
            {/* ------------------------------------------------------------- */}
            {creationMode === "manual" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Program Profile */}
                  <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60">
                    <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">Course Program</span>
                    <input 
                      type="text" 
                      value={adminProgram || "Loading program..."} 
                      disabled 
                      className="bg-transparent text-sm font-black text-[#0A3A23]/60 outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Curriculum */}
                  <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all">
                    <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">Choose Curriculum</span>
                    <select
                      value={manualForm.curriculum}
                      onChange={handleCurriculumChange}
                      required
                      className="bg-transparent text-sm font-black text-[#0A3A23] outline-none cursor-pointer"
                    >
                      <option value="">Select Curriculum</option>
                      {curriculumOptions.map((curr, idx) => (
                        <option key={idx} value={curr}>{curr}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Subject Selection */}
                <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">Choose Subject</span>
                  <select
                    value={manualForm.selected_subject_id}
                    onChange={handleSubjectChange}
                    disabled={!manualForm.curriculum}
                    required
                    className="bg-transparent text-sm font-black text-[#0A3A23] outline-none cursor-pointer disabled:opacity-40"
                  >
                    <option value="">
                      {!manualForm.curriculum ? "Please select a curriculum first" : "Choose Subject"}
                    </option>
                    {filteredSubjects.map(subj => (
                      <option key={subj._id} value={subj._id}>
                        {subj.subject_code} - {subj.subject_title}
                      </option>
                    ))}
                  </select>
                </div>

                {manualForm.subject_code && (
                  <div className="p-4 rounded-xl border border-[#0A3A23]/5 bg-[#F5F3F0]/30 grid grid-cols-2 gap-4 text-xs font-bold text-[#0A3A23]/80">
                    <div>
                      <span className="text-[8px] text-[#0A3A23]/40 uppercase block mb-0.5">Subject Code</span>
                      <span className="font-mono text-sm text-[#008C45] font-black">{manualForm.subject_code}</span>
                    </div>
                    <div>
                      <span className="text-[8px] text-[#0A3A23]/40 uppercase block mb-0.5">Subject Title</span>
                      <span className="text-[#0A3A23]">{manualForm.subject_title}</span>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Year level */}
                  <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60">
                    <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">Year Level</span>
                    <input
                      type="text"
                      value={
                        manualForm.year_level 
                          ? `${manualForm.year_level}${manualForm.year_level === "1" ? "st" : manualForm.year_level === "2" ? "nd" : manualForm.year_level === "3" ? "rd" : "th"} Year`
                          : "Automatic"
                      }
                      disabled
                      className="bg-transparent text-sm font-black text-[#0A3A23]/60 outline-none cursor-not-allowed"
                    />
                  </div>

                  {/* Section */}
                  <FormField
                    label="Section"
                    type="text"
                    name="section"
                    value={manualForm.section}
                    placeholder="e.g. 3C"
                    onChange={(val) => setManualForm(prev => ({ ...prev, section: val }))}
                  />

                  {/* Instructor */}
                  <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all">
                    <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">Instructor</span>
                    <select
                      name="instructor_id" 
                      value={manualForm.instructor_id} 
                      onChange={handleInputChange} 
                      required
                      className="bg-transparent text-sm font-black text-[#0A3A23] outline-none cursor-pointer"
                    >
                      <option value="">Select Instructor</option>
                      {instructors.map(ins => (
                        <option key={ins.instructor_id} value={ins.instructor_id}>
                          {ins.last_name}, {ins.first_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {renderScheduleBlockSection()}

                {/* 🔍 UPGRADED MANUALLY ADD ROSTER: SEARCH AND ADD ENGINE */}
                <div className="space-y-4 text-left relative">
                  <span className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap size={14} className="text-[#008C45]" /> Select Students ({selectedStudentsList.length})
                  </span>

                  {/* Interactive Search Engine Field */}
                  <div className="relative bg-[#F5F3F0]/60 border border-[#0A3A23]/5 rounded-xl px-3 py-0.5 flex items-center focus-within:bg-white focus-within:border-[#008C45] transition-all">
                    <Search className="text-[#0A3A23]/40 w-3.5 h-3.5 mr-2" />
                    <input
                      type="text"
                      disabled={loading}
                      placeholder="Type Student ID or Name to search..."
                      value={studentSearchQuery}
                      onChange={(e) => setStudentSearchQuery(e.target.value)}
                      className="w-full bg-transparent outline-none text-[#0A3A23] text-xs py-2 placeholder:text-[#0A3A23]/30 font-bold"
                    />
                  </div>

                  {/* Search Results Dropdown Option List */}
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
                              <p className="font-extrabold truncate">{formatName(student.first_name, student.last_name)}</p>
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

                  {/* Selected Class Student Active List view */}
                  <div className="bg-[#F5F3F0]/30 border border-[#0A3A23]/5 rounded-[20px] overflow-y-auto h-48 p-2.5 space-y-1.5 custom-scrollbar">
                    {selectedStudentsList.length > 0 ? (
                      selectedStudentsList.map((student) => (
                        <div 
                          key={student.student_id}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#0A3A23]/5 hover:shadow-sm transition-all"
                        >
                          <div className="min-w-0 flex-1 pr-2 text-left">
                            <p className="text-xs font-black text-[#0A3A23] truncate">
                              {formatName(student.first_name, student.last_name)}
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

              </div>
            )}

            {/* SPACER CLEARANCE FOOTER ZONE: keeps scroll content completely visible */}
            <div className="h-28 pointer-events-none" />

          </div>

          {/* FIXED BOTTOM CONTROL PANEL FOOTER */}
          <div className="absolute bottom-0 right-0 left-0 z-20 bg-gradient-to-t from-white via-white to-white/80 border-t border-[#0A3A23]/10 px-10 md:px-12 py-5 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => { onClose(); resetModal(); }}
              className="px-6 py-2.5 rounded-lg bg-[#F5F3F0] text-[#0A3A23]/70 text-xs font-black uppercase tracking-wider hover:bg-[#eae7e2] transition-all"
            >
              Cancel
            </button>
            
            {creationMode === "pdf" ? (
              <button
                type="button"
                onClick={handlePdfConfirm}
                disabled={loading || !preview}
                className="px-6 py-2.5 rounded-lg bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md transition-all disabled:opacity-40"
              >
                {loading ? "Processing..." : "Create Class"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleManualSubmit}
                disabled={loading}
                className="px-6 py-2.5 rounded-lg bg-[#0A3A23] text-white text-xs font-black uppercase tracking-wider hover:bg-[#005c2d] shadow-md transition-all disabled:opacity-40"
              >
                {loading ? "Saving Record..." : "Create Class"}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>,
    document.body
  );
};

/* Symmetrical FormField input component */
function FormField({ label, type = "text", name, value, placeholder, onChange }) {
  return (
    <div className="flex flex-col rounded-xl p-4 border border-[#0A3A23]/5 bg-[#F5F3F0]/60 focus-within:bg-white focus-within:border-[#0A3A23]/20 focus-within:shadow-sm transition-all w-full text-left">
      <label className="text-[9px] font-black text-[#0A3A23]/40 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm font-black text-[#0A3A23] outline-none"
      />
    </div>
  );
}

export default AddClassModal;