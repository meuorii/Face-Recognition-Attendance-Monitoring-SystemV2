// src/components/Instructor/StudentsInClass.jsx
import { useEffect, useMemo, useState } from "react";
import { getClassesByInstructor, getAssignedStudents } from "../../services/api";
import { toast } from "react-toastify";
import { FaRegIdCard, FaLayerGroup, FaSearch } from "react-icons/fa";
import StudentsTableView from "./Students/StudentsTableView";

// Pinadaling converter para sa Semester
const formatSemester = (sem) => {
  if (!sem) return "Not set";
  const t = sem.toLowerCase().replace("_", " ");
  if (t.includes("1st")) return "1st Semester";
  if (t.includes("2nd")) return "2nd Semester";
  return t.charAt(0).toUpperCase() + t.slice(1);
};

const StudentsInClass = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [students, setStudents] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [query, setQuery] = useState("");

  const instructor = JSON.parse(localStorage.getItem("userData") || "{}");

  useEffect(() => {
    if (instructor?.instructor_id) fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const data = await getClassesByInstructor(instructor.instructor_id);
      setClasses(data || []);

      if (data?.length && !selectedClass) {
        setSelectedClass(data[0]._id);
        fetchStudents(data[0]._id);
      }
    } catch (err) {
      console.error("Failed to load classes:", err);
      toast.error("Failed to load classes.");
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchStudents = async (classId) => {
    if (!classId) return;
    setLoadingStudents(true);
    try {
      const data = await getAssignedStudents(classId);
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const lastA = a.last_name?.toLowerCase() || "";
            const lastB = b.last_name?.toLowerCase() || "";
            if (lastA < lastB) return -1;
            if (lastA > lastB) return 1;
            const firstA = a.first_name?.toLowerCase() || "";
            const firstB = b.first_name?.toLowerCase() || "";
            return firstA.localeCompare(firstB);
          })
        : [];
      setStudents(sorted);
    } catch (err) {
      console.error("Failed to fetch students:", err);
      toast.error("Failed to fetch students.");
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleSelectClass = (classId) => {
    setSelectedClass(classId);
    setQuery("");
    setStudents([]);
    if (classId) fetchStudents(classId);
  };

  const filteredStudents = useMemo(() => {
    if (!query.trim()) return students;
    const q = query.toLowerCase();
    return students.filter((s) => {
      const id = (s.student_id || "").toLowerCase();
      const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
      const course = (s.course || "").toLowerCase();
      const section = (s.section || "").toLowerCase();
      return (
        id.includes(q) ||
        name.includes(q) ||
        course.includes(q) ||
        section.includes(q)
      );
    });
  }, [students, query]);

  const selectedClassObj = classes.find((c) => c._id === selectedClass);

  return (
    <div className="space-y-12 px-4">
      
      {/* 1. SIMPLE TYPOGRAPHY HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        
        {/* Mas simpleng pamagat at deskripsyon */}
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Students List
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            View and search students in your classes
          </p>
        </div>

        {/* Mga control sa kanan */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-3xl justify-end">
          
          {/* Dropdown Selector */}
          <div className="relative flex-1 max-w-[240px]">
            <select
              className="w-full bg-white border border-[#0A3A23]/10 text-[#0A3A23] text-xs font-bold uppercase tracking-wide
                px-4 py-3 rounded-xl shadow-sm focus:outline-none focus:border-[#008C45] transition-all"
              onChange={(e) => handleSelectClass(e.target.value)}
              value={selectedClass}
              disabled={loadingClasses}
            >
              <option value="">— Select Class —</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.subject_code} • {c.section}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-[240px] flex items-center bg-white border border-[#0A3A23]/10 rounded-xl px-4 shadow-sm focus-within:border-[#008C45] transition-all">
            <FaSearch className="text-[#0A3A23]/30 text-xs mr-2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID or Name..."
              className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-10 placeholder:text-[#0A3A23]/30"
            />
          </div>

          {/* Counter Badge */}
          <span className="inline-flex items-center justify-center text-center px-4 py-2.5 rounded-xl bg-[#0A3A23] text-white font-black text-xs uppercase tracking-widest shadow-sm min-w-[120px]">
            {filteredStudents.length} {filteredStudents.length === 1 ? "Student" : "Students"}
          </span>

        </div>
      </div>

      {/* 2. SIMPLE INFO CARDS */}
      {selectedClassObj && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-[#0A3A23]/10 shadow-[0_12px_40px_rgba(10,58,35,0.04)] flex items-center gap-4">
            <div className="p-3 bg-[#F5F3F0] rounded-xl text-[#0A3A23]">
              <FaRegIdCard size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-widest">School Year</span>
              <h4 className="text-base font-black text-[#0A3A23] tracking-tight mt-0.5">{selectedClassObj.school_year || "Not set"}</h4>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#0A3A23]/10 shadow-[0_12px_40px_rgba(10,58,35,0.04)] flex items-center gap-4">
            <div className="p-3 bg-[#F5F3F0] rounded-xl text-[#0A3A23]">
              <FaLayerGroup size={18} />
            </div>
            <div>
              <span className="block text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-widest">Semester</span>
              <h4 className="text-base font-black text-[#0A3A23] tracking-tight mt-0.5">{formatSemester(selectedClassObj.semester)}</h4>
            </div>
          </div>
        </div>
      )}

      {/* Table Area */}
      <div>
        <StudentsTableView
          selectedClass={selectedClass}
          filteredStudents={filteredStudents}
          loadingStudents={loadingStudents}
        />
      </div>

    </div>
  );
};

export default StudentsInClass;