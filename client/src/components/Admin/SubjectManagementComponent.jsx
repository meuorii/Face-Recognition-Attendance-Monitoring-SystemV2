// ✅ src/components/Admin/ClassManagement/SubjectManagementComponent.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { 
  FaSlidersH, 
  FaCalendarCheck, 
  FaExclamationTriangle 
} from "react-icons/fa";
import SemesterManagementModal from "./SubjectManagement/SemesterManagementModal";

export default function SubjectManagementComponent() {
  const [subjects, setSubjects] = useState([]);
  const [activeSemester, setActiveSemester] = useState(null);
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [curriculums, setCurriculums] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState("");

  const API_BASE = "http://127.0.0.1:8080/api/admin";

  // ================================
  // FETCH CURRICULUM LIST
  // ================================
  const fetchCurriculums = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/curriculum`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const list = res.data.curriculums || [];
      setCurriculums(list);

      if (list.length > 0) setSelectedCurriculum(list[0]);
    } catch (err) {
      console.error("Error fetching curriculum list:", err);
      toast.error("Failed to load curriculum list.");
    }
  };

  const formatSemester = (sem) => {
    if (!sem) return "No Semester";

    const clean = sem.toLowerCase().trim();

    // Special rename
    if (clean.includes("summer")) return "Mid Year";

    return sem
      .replace(/1st\s*sem/i, "1st Semester")
      .replace(/2nd\s*sem/i, "2nd Semester")
      .replace(/3rd\s*sem/i, "3rd Semester")
      .replace(/4th\s*sem/i, "4th Semester");
  };

  // ================================
  // FETCH SUBJECTS FOR ACTIVE SEMESTER
  // ================================
  const fetchActiveSemesterSubjects = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("No authorization token. Please log in again.");
        return;
      }

      const res = await axios.get(`${API_BASE}/subjects/active`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setActiveSemester(res.data.active_semester);
      setSubjects(res.data.subjects || []);
    } catch (err) {
      console.error("Error fetching subjects:", err);
      toast.error("Failed to fetch subjects for the active semester.");
    }
  };

  useEffect(() => {
    fetchCurriculums();
    fetchActiveSemesterSubjects();
  }, []);

  // FILTER SUBJECTS
  const filteredSubjects = subjects.filter(
    (s) =>
      s.semester === activeSemester?.semester_name &&
      (!selectedCurriculum || s.curriculum === selectedCurriculum)
  );

  const yearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  return (
    <div className="space-y-12 px-4">
      
      {/* 1. TYPOGRAPHY HEADER & CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Subject Management
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Curriculum Configuration Environment
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 flex-1 lg:max-w-xl justify-end">
          
          {/* CURRICULUM DROPDOWN SELECTOR */}
          {curriculums.length > 0 && (
            <div className="relative flex-1 flex items-center bg-white border border-[#0A3A23]/10 rounded-xl px-4 shadow-sm focus-within:border-[#008C45] transition-all">
              <select
                value={selectedCurriculum}
                onChange={(e) => setSelectedCurriculum(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                {curriculums.map((c) => (
                  <option key={c} value={c} className="text-[#0A3A23] font-bold">
                    Curriculum {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#0A3A23]/40 text-xs">
                ▼
              </div>
            </div>
          )}

          {/* MANAGE SEMESTERS TRIGGER BUTTON */}
          <button
            onClick={() => setShowSemesterModal(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            <FaSlidersH /> Manage Semesters
          </button>
        </div>
      </div>

      {/* 2. STANDALONE ACTIVE SEMESTER INFORMATION CARD */}
      <div className="w-full">
        {activeSemester ? (
          <div className="bg-white p-8 rounded-[28px] border border-[#0A3A23]/10 shadow-[0_25px_60px_rgba(10,58,35,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-all hover:border-[#008C45]/20">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-gradient-to-br from-[#008C45]/10 to-[#0A3A23]/5 rounded-2xl text-[#008C45] shrink-0">
                <FaCalendarCheck size={24} />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-[#008C45]/10 text-[#008C45] uppercase tracking-widest">
                  Current Active Term
                </span>
                <h3 className="text-xl font-black text-[#0A3A23] tracking-tight">
                  {formatSemester(activeSemester.semester_name)}
                </h3>
              </div>
            </div>
            
            {/* School Year Info on the Right Side */}
            <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-[#0A3A23]/10 pt-4 sm:pt-0 sm:pl-8 flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#0A3A23]/40 uppercase tracking-widest">School Year</span>
              <span className="text-base font-mono font-black text-[#0A3A23]">
                S.Y. {activeSemester.school_year}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[28px] border border-red-100 shadow-[0_25px_60px_rgba(220,38,38,0.03)] flex flex-col sm:flex-row sm:items-center gap-5 transition-all">
            <div className="p-4 bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl text-red-600 shrink-0 w-max">
              <FaExclamationTriangle size={24} />
            </div>
            <div className="space-y-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 uppercase tracking-widest">
                Warning
              </span>
              <h3 className="text-lg font-black text-red-950 tracking-tight">
                No Active Semester Found
              </h3>
              <p className="text-xs font-medium text-red-600/80">
                Please set the active semester inside "Manage Semesters" to show the subjects.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. DATA TABLES CONTAINER PER YEAR LEVEL */}
      <div className="space-y-12">
        {yearLevels.map((year) => {
          const subjectsByYear = filteredSubjects.filter(
            (s) => s.year_level === year
          );

          if (subjectsByYear.length === 0) return null;

          return (
            <div key={year} className="space-y-4">
              
              {/* YEAR SECTION TITLE */}
              <h3 className="text-xs font-black text-[#0A3A23]/60 uppercase tracking-[0.15em] pl-2">
                {year}
              </h3>

              {/* SYSTEM DATA GRID VIEW */}
              <div className="overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
                <table className="w-full table-fixed text-sm border-collapse">
                  <colgroup>
                    <col className="w-full" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
                      <th className="px-8 py-6 text-left">Subject Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A3A23]/5 bg-white text-[#0A3A23]/90">
                    {subjectsByYear.map((s) => (
                      <tr key={s._id} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                        
                        {/* Compact Combined Subject Column - Fully expanded width */}
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-0.5 max-w-full">
                            <span className="font-mono font-black text-sm text-[#008C45]">
                              {s.subject_code}
                            </span>
                            <span className="font-bold text-xs text-[#0A3A23] truncate tracking-wide" title={s.subject_title}>
                              {s.subject_title}
                            </span>
                          </div>
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          );
        })}
      </div>

      {/* EMPTY DATA STATE BANNER */}
      {filteredSubjects.length === 0 && (
        <div className="text-center bg-white border border-[#0A3A23]/5 rounded-[32px] py-16 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest shadow-[0_20px_50px_rgba(10,58,35,0.02)]">
          <div className="flex flex-col items-center gap-2 justify-center">
            <FaExclamationTriangle size={16} className="text-[#0A3A23]/30" />
            <span>No subjects found for the active semester and curriculum.</span>
          </div>
        </div>
      )}

      {/* SEMESTER CONTROLLER MODAL */}
      <SemesterManagementModal
        isOpen={showSemesterModal}
        onClose={() => setShowSemesterModal(false)}
        onRefresh={fetchActiveSemesterSubjects}
      />

    </div>
  );
}