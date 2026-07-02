import React, { useState, useEffect } from "react";
import axios from "axios";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { AiOutlineCloudUpload } from "react-icons/ai";

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
  
  // Schedule Blocks (Max 3 items, days array format matches payload)
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

  if (!isOpen) return null;

  const resetModal = () => {
    setSelectedFile(null);
    setPreview(null);
    setProgress(0);
    setFilteredSubjects([]);
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

  // Helper utility to clean data arrays right before submission or validation
  const getCleanedScheduleBlocks = () => {
    return scheduleBlocks.map(block => ({
      ...block,
      // Filter out empty strings to form valid unique day arrays like ["Tue", "Thu"]
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
      toast.success("📄 Preview generated!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to preview PDF");
    } finally {
      setLoading(false);
    }
  };

  const handlePdfConfirm = async () => {
    if (!preview || !selectedFile || !preview.instructor_id) {
      return toast.error("Incomplete PDF structure or preview state missing.");
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

      toast.success("🎉 Class created via PDF successfully!");
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
  // MANUAL FLOW HANDLERS
  // ----------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setManualForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentCheckboxChange = (studentId) => {
    setManualForm(prev => {
      const current = prev.selected_student_ids;
      if (current.includes(studentId)) {
        return { ...prev, selected_student_ids: current.filter(id => id !== studentId) };
      } else {
        return { ...prev, selected_student_ids: [...current, studentId] };
      }
    });
  };

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

      toast.success("🎉 Class created manually!");
      onAdded();
      onClose();
      resetModal();
    } catch (err) {
      toast.error(err.response?.data?.error || "Manual creation runtime failure.");
    } finally {
      setLoading(false);
    }
  };

  const formatName = (first, last) => {
    if (!first || !last) return "";
    const raw = `${first} ${last}`;
    return raw.toLowerCase().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  // ----------------------------------------------------
  // REUSABLE DAY MULTI-SELECT TIMING MATRIX SECTION
  // ----------------------------------------------------
  const renderScheduleBlockSection = () => (
    <div className="bg-neutral-950/60 p-4 rounded-xl border border-neutral-800 space-y-3">
      <div className="flex justify-between items-center">
        <div>
          <label className="text-sm font-semibold text-emerald-400 block">Class Schedule Blocks</label>
          <span className="text-[10px] text-neutral-500">Maximum of 3 schedule slots</span>
        </div>
        {scheduleBlocks.length < 3 && (
          <button
            type="button"
            onClick={addScheduleBlock}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded-md transition"
          >
            + Add Block
          </button>
        )}
      </div>

      {scheduleBlocks.map((block, idx) => (
        <div key={idx} className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 relative space-y-3">
          {/* Day selection select input rows */}
          <div>
            <label className="block text-[10px] font-semibold text-gray-400 mb-1.5">CHOOSE DAYS FOR THIS BLOCK (MAX 3)</label>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((selectIdx) => (
                <select
                  key={selectIdx}
                  value={block.days[selectIdx] || ""}
                  onChange={(e) => handleDaySelectChange(idx, selectIdx, e.target.value)}
                  className="w-full p-1.5 text-xs rounded bg-neutral-800 border border-neutral-700 text-white outline-none focus:border-emerald-500"
                >
                  <option value="">-- Select Day --</option>
                  {DAYS_OPTIONS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              ))}
            </div>
          </div>

          {/* Time pickers row */}
          <div className="grid grid-cols-2 gap-3 relative pr-6">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">START TIME</label>
              <input
                type="time"
                value={block.start}
                onChange={(e) => handleTimeChange(idx, "start", e.target.value)}
                required
                className="w-full p-1.5 text-xs rounded bg-neutral-800 border border-neutral-700 text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 mb-0.5">END TIME</label>
              <input
                type="time"
                value={block.end}
                onChange={(e) => handleTimeChange(idx, "end", e.target.value)}
                required
                className="w-full p-1.5 text-xs rounded bg-neutral-800 border border-neutral-700 text-white outline-none"
              />
            </div>

            {scheduleBlocks.length > 1 && (
              <button
                type="button"
                onClick={() => removeScheduleBlock(idx)}
                className="absolute right-0 top-5 text-red-400 hover:text-red-500 text-sm font-bold"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-50">
      <div className="bg-neutral-900 p-6 rounded-2xl shadow-2xl w-[750px] max-h-[90vh] overflow-y-auto relative border border-neutral-800">
        
        {/* TAB CONTROL HEADERS */}
        <div className="flex space-x-2 border-b border-neutral-800 pb-3 mb-5">
          <button
            type="button"
            onClick={() => { setCreationMode("pdf"); resetModal(); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              creationMode === "pdf" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white bg-neutral-800"
            }`}
          >
            <span>Upload PDF Route</span>
          </button>
          <button
            type="button"
            onClick={() => { setCreationMode("manual"); resetModal(); }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              creationMode === "manual" ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white bg-neutral-800"
            }`}
          >
            <span>Manual Create Layout</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* MODE A: PDF RUNTIME                                           */}
        {/* ------------------------------------------------------------- */}
        {creationMode === "pdf" && (
          <div>
            <h2 className="text-xl font-bold text-emerald-400 mb-4">Upload Class List (PDF)</h2>
            {!preview && (
              <div className="space-y-4">
                <p className="text-gray-300 text-sm text-center">
                  Upload your class list PDF. Preview will load automatically.
                </p>
                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-neutral-600 hover:border-emerald-500 transition rounded-xl cursor-pointer bg-neutral-800 hover:bg-neutral-700/50 text-gray-300">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <AiOutlineCloudUpload className="text-emerald-400" size={48} />
                    <p className="font-medium text-gray-200">Drag & drop PDF here</p>
                    <p className="text-xs text-gray-400">or click to browse files</p>
                  </div>
                  <input type="file" accept="application/pdf" onChange={handleFileChange} className="hidden" />
                </label>

                {loading && (
                  <div className="w-full mt-2">
                    <div className="flex justify-between mb-1">
                      <span className="text-xs text-gray-300">Reading PDF…</span>
                      <span className="text-xs text-gray-400">{progress}%</span>
                    </div>
                    <div className="w-full bg-neutral-700 rounded-full h-2">
                      <div className="bg-emerald-500 h-2 rounded-full transition-all duration-200" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {preview && (
              <div className="text-gray-200 space-y-5">
                <div className="bg-neutral-900 border border-neutral-700 p-5 rounded-xl space-y-4">
                  <h3 className="text-xl font-semibold text-emerald-400">Extracted Class Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                    <div className="space-y-3">
                      <div><p className="font-semibold text-gray-200">Subject Code:</p><p className="text-xs text-gray-400">{preview.subject_code}</p></div>
                      <div><p className="font-semibold text-gray-200">Course & Section:</p><p className="text-xs text-gray-400">{preview.course} {preview.section}</p></div>
                      <div><p className="font-semibold text-gray-200">Semester:</p><p className="text-xs text-gray-400">{preview.semester}</p></div>
                    </div>
                    <div className="space-y-3">
                      <div><p className="font-semibold text-gray-200">Subject Title:</p><p className="text-xs text-gray-400">{preview.subject_title}</p></div>
                      <div><p className="font-semibold text-gray-200">Year Level:</p><p className="text-xs text-gray-400">{preview.year_level}</p></div>
                      <div><p className="font-semibold text-gray-200">Instructor:</p><p className="text-xs text-gray-400">{preview.instructor_first_name} {preview.instructor_last_name}</p></div>
                    </div>
                  </div>
                </div>

                {renderScheduleBlockSection()}

                <div>
                  <p className="text-lg font-semibold text-emerald-400 mb-2">Valid Students ({preview.valid_students?.length || 0})</p>
                  <div className="max-h-52 overflow-y-auto bg-neutral-950 p-3 rounded-lg text-sm border border-neutral-800 shadow-inner">
                    {preview.valid_students?.map((stu, i) => (
                      <div key={i} className="text-emerald-300 py-1">
                        {stu.student_id} — {formatName(stu.first_name, stu.last_name)}
                      </div>
                    ))}
                  </div>
                </div>

                <button onClick={handlePdfConfirm} disabled={loading} className="w-full mt-4 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-all">
                  {loading ? "Processing..." : "Confirm & Create Class"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* MODE B: MANUAL RUNTIME                                        */}
        {/* ------------------------------------------------------------- */}
        {creationMode === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-4 text-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-emerald-400">Create Class Manually</h2>
              {activeSemesterInfo && (
                <span className="text-xs bg-emerald-950 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/60 font-medium">
                  {activeSemesterInfo.semester_name} | {activeSemesterInfo.school_year}
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">PROGRAM / COURSE (LOCKED)</label>
                <input 
                  type="text" 
                  value={adminProgram || "Loading program profile..."} 
                  disabled 
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-gray-400 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">SELECT CURRICULUM *</label>
                <select
                  value={manualForm.curriculum}
                  onChange={handleCurriculumChange}
                  required
                  className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Choose Curriculum --</option>
                  {curriculumOptions.map((curr, idx) => (
                    <option key={idx} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">SELECT SUBJECT *</label>
              <select
                value={manualForm.selected_subject_id}
                onChange={handleSubjectChange}
                disabled={!manualForm.curriculum}
                required
                className={`w-full p-2.5 rounded-lg border outline-none transition-all ${
                  !manualForm.curriculum 
                    ? "bg-neutral-950 border-neutral-800 text-gray-600 cursor-not-allowed" 
                    : "bg-neutral-800 border-neutral-700 text-white focus:border-emerald-500"
                }`}
              >
                <option value="">
                  {!manualForm.curriculum ? "-- Please Select a Curriculum First --" : "-- Choose Subject --"}
                </option>
                {filteredSubjects.map(subj => (
                  <option key={subj._id} value={subj._id}>
                    {subj.subject_code} - {subj.subject_title}
                  </option>
                ))}
              </select>
            </div>

            {manualForm.subject_code && (
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-neutral-500 text-xs block">Subject Code:</span>
                  <span className="font-mono text-emerald-400 font-bold">{manualForm.subject_code}</span>
                </div>
                <div>
                  <span className="text-neutral-500 text-xs block">Subject Title:</span>
                  <span className="text-gray-300 font-medium">{manualForm.subject_title}</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">YEAR LEVEL (AUTOMATIC)</label>
                <input
                  type="text"
                  value={
                    manualForm.year_level 
                      ? `${manualForm.year_level}${manualForm.year_level === "1" ? "st" : manualForm.year_level === "2" ? "nd" : manualForm.year_level === "3" ? "rd" : "th"} Year`
                      : "No Subject Chosen"
                  }
                  disabled
                  className="w-full p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-emerald-400 font-bold cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">SECTION *</label>
                <input 
                  type="text" name="section" placeholder="e.g. 3C"
                  value={manualForm.section} onChange={handleInputChange} required
                  className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1">INSTRUCTOR *</label>
                <select
                  name="instructor_id" value={manualForm.instructor_id} onChange={handleInputChange} required
                  className="w-full p-2.5 rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:border-emerald-500 outline-none"
                >
                  <option value="">-- Select Instructor --</option>
                  {instructors.map(ins => (
                    <option key={ins.instructor_id} value={ins.instructor_id}>
                      {ins.last_name}, {ins.first_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {renderScheduleBlockSection()}

            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">
                SELECT STUDENTS FOR THIS ROSTER ({manualForm.selected_student_ids.length} selected)
              </label>
              <div className="max-h-44 overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2 shadow-inner">
                {availableStudents.length === 0 ? (
                  <p className="text-xs text-gray-500 p-2 italic">No roster data available matching your program filter.</p>
                ) : (
                  availableStudents.map(student => (
                    <label key={student.student_id} className="flex items-center space-x-3 p-1.5 hover:bg-neutral-800/40 rounded cursor-pointer transition">
                      <input 
                        type="checkbox"
                        checked={manualForm.selected_student_ids.includes(student.student_id)}
                        onChange={() => handleStudentCheckboxChange(student.student_id)}
                        className="w-4 h-4 rounded text-emerald-600 bg-neutral-700 border-neutral-600 focus:ring-emerald-500 focus:ring-2"
                      />
                      <span className="text-sm">
                        <strong className="text-neutral-400">{student.student_id}</strong> — {formatName(student.first_name, student.last_name)} 
                        <span className="text-xs text-neutral-500 ml-2">({student.section || "No Sec"})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white font-medium transition-all">
              {loading ? "Writing Class Record..." : "Save & Generate Manual Class"}
            </button>
          </form>
        )}

        {/* CLOSE CONTROL */}
        <button onClick={() => { onClose(); resetModal(); }} className="absolute top-3 right-4 text-gray-400 hover:text-white text-lg">✕</button>

      </div>
    </div>,
    document.body
  );
};

export default AddClassModal;