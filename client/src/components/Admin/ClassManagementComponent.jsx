// ✅ src/components/Admin/ClassManagement/ClassManagementComponent.jsx
import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaPlus,
} from "react-icons/fa";

import StudentsModal from "./ClassManagement/StudentsModal";
import EditClassModal from "./ClassManagement/EditClassModal";
import DeleteClassModal from "./ClassManagement/DeleteClassModal";
import AddClassModal from "./ClassManagement/AddClassModal";

const API_URL = "http://127.0.0.1:8080";

const ClassManagementComponent = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedClass, setSelectedClass] = useState(null);
  const [editClass, setEditClass] = useState(null);
  const [deleteClass, setDeleteClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  // ─────────────────────────────────────────────────────
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setClasses(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────
  // FORMATTERS
  const formatDays = (blocks) => {
    if (!blocks?.length) return "No schedule";
    return blocks[0].days.join(" • ");
  };

  const formatTime = (blocks) => {
    if (!blocks?.length) return "";
    const b = blocks[0];
    const toAMPM = (t) => {
      if (!t) return "";
      let [h, m] = t.split(":");
      h = parseInt(h);
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h}:${m} ${ampm}`;
    };
    return `${toAMPM(b.start)} – ${toAMPM(b.end)}`;
  };

  // ─────────────────────────────────────────────────────
  // CURRENT SEM & YEAR
  const currentSemester = classes[0]?.semester || "No Semester";
  const currentSchoolYear = classes[0]?.school_year || "No School Year";

  // ─────────────────────────────────────────────────────
  // FILTERED LIST (SEARCH)
  const filteredClasses = useMemo(() => {
    if (!searchQuery.trim()) return classes;
    const q = searchQuery.toLowerCase();
    return classes.filter((cls) => {
      return (
        cls.subject_code?.toLowerCase().includes(q) ||
        cls.subject_title?.toLowerCase().includes(q) ||
        `${cls.instructor_first_name} ${cls.instructor_last_name}`
          .toLowerCase()
          .includes(q) ||
        cls.section?.toLowerCase().includes(q)
      );
    });
  }, [classes, searchQuery]);

  // ─────────────────────────────────────────────────────
  // GROUP BY YEAR (WITH SEARCH APPLIED)
  const groupedByYear = useMemo(() => {
    const groups = {
      "1st Year": [],
      "2nd Year": [],
      "3rd Year": [],
      "4th Year": [],
    };

    filteredClasses.forEach((cls) => {
      if (groups[cls.year_level]) {
        groups[cls.year_level].push(cls);
      }
    });

    Object.keys(groups).forEach((year) => {
      groups[year].sort((a, b) => (a.section > b.section ? 1 : -1));
    });

    return groups;
  }, [filteredClasses]);

  const formatSemester = (sem) => {
    if (!sem) return "No Semester";
    const clean = sem.toLowerCase().trim();
    if (clean.includes("summer")) return "Mid Year";
    return sem
      .replace(/1st\s*Sem/i, "1st Semester")
      .replace(/2nd\s*Sem/i, "2nd Semester");
  };

  // ─────────────────────────────────────────────────────
  // HANDLERS
  const handleDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/api/admin/delete-class/${deleteClass._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("✅ Class deleted");
      setDeleteClass(null);
      fetchClasses();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to delete class");
    }
  };

  const handleEdit = async () => {
    try {
      const token = localStorage.getItem("token");
      const cleanedScheduleBlocks = (editClass.schedule_blocks || [])
        .map((block) => ({
          ...block,
          days: (block.days || []).filter((d) => d && d.trim() !== ""),
        }))
        .filter((block) => block.days?.length || block.start || block.end);

      await axios.put(
        `${API_URL}/api/admin/update-class/${editClass._id}`,
        {
          section: editClass.section,
          semester: editClass.semester,
          schedule_blocks: cleanedScheduleBlocks,
          instructor_id: editClass.instructor_id || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Class updated");
      setEditClass(null);
      fetchClasses();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update class");
    }
  };

  return (
    <div className="space-y-8 px-4 bg-[#F5F3F0] min-h-screen py-8">
      
      {/* 1. TYPOGRAPHY HEADER & CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Class Management
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            {formatSemester(currentSemester)} • S.Y. {currentSchoolYear}
          </p>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-xl justify-end">
          {/* SEARCH BAR */}
          <div className="relative flex-1 flex items-center bg-white border border-[#0A3A23]/10 rounded-xl px-4 shadow-sm focus-within:border-[#008C45] transition-all">
            <FaSearch className="text-[#0A3A23]/30 text-xs mr-2" />
            <input
              type="text"
              placeholder="Search subject, instructor, or section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-10 placeholder:text-[#0A3A23]/30"
            />
          </div>

          {/* ADD CLASS BUTTON */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            <FaPlus /> Add Class
          </button>
        </div>
      </div>

      {/* 2. DATA TABLES CONTAINER PER YEAR LEVEL */}
      <div className="space-y-10">
        {Object.entries(groupedByYear).map(([year, list]) => {
          if (!loading && list.length === 0) return null;

          return (
            <div key={year} className="space-y-3">
              {/* YEAR SECTION TITLE */}
              <h3 className="text-sm font-black text-[#0A3A23] uppercase tracking-wider pl-1">
                {year}
              </h3>

              {/* SYSTEM DATA GRID VIEW */}
              <div className="overflow-hidden bg-white rounded-[24px] border border-[#0A3A23]/10 shadow-[0_16px_45px_rgba(10,58,35,0.03)]">
                <table className="w-full table-fixed text-sm border-collapse">
                  <colgroup>
                    <col className="w-[12%]" />
                    <col className="w-[24%]" />
                    <col className="w-[20%]" />
                    <col className="w-[10%]" />
                    <col className="w-[10%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead>
                    <tr className="bg-[#0A3A23] text-white text-[10px] font-black tracking-widest uppercase">
                      <th className="px-6 py-4 text-left">Code</th>
                      <th className="px-6 py-4 text-left">Title</th>
                      <th className="px-6 py-4 text-left">Instructor</th>
                      <th className="px-6 py-4 text-left">Section</th>
                      <th className="px-6 py-4 text-center">Students</th>
                      <th className="px-6 py-4 text-left">Schedule</th>
                      <th className="px-6 py-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#0A3A23]/5 bg-white text-[#0A3A23]/90">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                          Loading classes data...
                        </td>
                      </tr>
                    ) : (
                      list.map((cls, idx) => (
                        <tr key={idx} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                          {/* Code */}
                          <td className="px-6 py-4 font-mono font-black text-xs text-[#008C45]">
                            {cls.subject_code}
                          </td>
                          {/* Title */}
                          <td className="px-6 py-4 font-bold text-xs truncate text-[#0A3A23]" title={cls.subject_title}>
                            {cls.subject_title}
                          </td>
                          {/* Instructor */}
                          <td className="px-6 py-4 text-xs font-semibold truncate text-[#0A3A23]/80" title={`${cls.instructor_first_name} ${cls.instructor_last_name}`}>
                            {cls.instructor_first_name} {cls.instructor_last_name}
                          </td>
                          {/* Section */}
                          <td className="px-6 py-4 font-black text-xs uppercase text-[#0A3A23]">
                            {cls.section}
                          </td>
                          {/* Students Count Badge */}
                          <td className="px-6 py-4 text-center">
                            <span className="inline-block px-3 py-1 text-[10px] font-black bg-[#008C45]/10 text-[#008C45] rounded-xl uppercase tracking-wider">
                              {cls.students?.length || 0}
                            </span>
                          </td>
                          {/* Schedule Cards */}
                          <td className="px-6 py-4">
                            {!cls.schedule_blocks || cls.schedule_blocks.length === 0 ? (
                              <span className="text-[10px] font-black text-[#0A3A23]/30 uppercase tracking-wide">
                                Unscheduled
                              </span>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-black text-[#008C45] uppercase tracking-wide">
                                  {formatDays(cls.schedule_blocks)}
                                </span>
                                <span className="text-[10px] font-bold text-[#0A3A23]/60">
                                  {formatTime(cls.schedule_blocks)}
                                </span>
                              </div>
                            )}
                          </td>
                          {/* System Control Interface Action Handles */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View Action Button */}
                              <button
                                onClick={() => setSelectedClass(cls)}
                                title="View Students Registered"
                                className="p-2.5 rounded-xl border border-[#008C45]/10 bg-[#008C45]/5 text-[#008C45] transition-all hover:bg-[#008C45] hover:text-white"
                              >
                                <FaEye size={11} />
                              </button>
                              {/* Edit Action Button */}
                              <button
                                onClick={() => setEditClass(cls)}
                                title="Modify parameters"
                                className="p-2.5 rounded-xl border border-[#0A3A23]/10 bg-[#0A3A23]/5 text-[#0A3A23] transition-all hover:bg-[#0A3A23] hover:text-white"
                              >
                                <FaEdit size={11} />
                              </button>
                              {/* Delete Action Button */}
                              <button
                                onClick={() => setDeleteClass(cls)}
                                title="Remove configuration record"
                                className="p-2.5 rounded-xl border border-red-600/10 bg-red-600/5 text-red-600 transition-all hover:bg-red-600 hover:text-white"
                              >
                                <FaTrash size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODALS */}
      {selectedClass && (
        <StudentsModal
          isOpen={!!selectedClass}
          onClose={() => setSelectedClass(null)}
          selectedClass={selectedClass}
        />
      )}

      {editClass && (
        <EditClassModal
          isOpen={!!editClass}
          editClass={editClass}
          setEditClass={setEditClass}
          onClose={() => setEditClass(null)}
          onSave={handleEdit}
        />
      )}

      <DeleteClassModal
        isOpen={!!deleteClass}
        deleteClass={deleteClass}
        onClose={() => setDeleteClass(null)}
        onConfirm={handleDelete}
      />

      {showAddModal && (
        <AddClassModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdded={fetchClasses}
        />
      )}

    </div>
  );
};

export default ClassManagementComponent;