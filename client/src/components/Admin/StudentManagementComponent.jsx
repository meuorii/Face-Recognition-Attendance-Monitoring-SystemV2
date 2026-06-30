// ✅ src/components/Admin/StudentManagementComponent.jsx
import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import ViewStudentModal from "./StudentManagement/ViewStudentModal";
import EditStudentModal from "./StudentManagement/EditStudentModal";
import DeleteConfirmationModal from "./StudentManagement/DeleteConfirmationModal";

import { FaUsers, FaPlus, FaSearch, FaRegIdCard, FaUserGraduate, FaBookOpen, FaEye, FaPen, FaTrashAlt } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = "http://127.0.0.1:8080";

const StudentManagementComponent = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Secure axios
  const api = axios.create({ baseURL: API_URL });
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  // Fetch Students
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get("/api/admin/students");
        const data = Array.isArray(res.data) ? res.data : [];

        const formatted = data.map((s) => ({
          ...s,
          first_name: formatName(s.first_name),
          last_name: formatName(s.last_name),
        }));

        setStudents(formatted);
        setFilteredStudents(formatted);
      } catch {
        toast.error("Failed to load students.");
      }
    };

    fetchStudents();
  }, []);

  // Search filter and page index reset
  useEffect(() => {
    let filtered = students;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          (s.first_name || "").toLowerCase().includes(q) ||
          (s.last_name || "").toLowerCase().includes(q) ||
          (s.student_id || "").toLowerCase().includes(q)
      );
    }

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [searchQuery, students]);

  // Pagination slicing metrics
  const totalPages = Math.max(Math.ceil(filteredStudents.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    return filteredStudents.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredStudents, indexOfFirstItem, indexOfLastItem]);

  // Action handlers
  const handleView = (student) => {
    setSelectedStudent(student);
    setIsViewModalOpen(true);
  };

  const handleEdit = (student) => {
    setSelectedStudent(student);
    setIsEditModalOpen(true);
  };

  const handleDeleteRequest = (student) => {
    setSelectedStudent(student);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/api/admin/students/${selectedStudent.student_id}`);

      setStudents((p) => p.filter((s) => s.student_id !== selectedStudent.student_id));
      setFilteredStudents((p) =>
        p.filter((s) => s.student_id !== selectedStudent.student_id)
      );

      toast.success("Student deleted successfully");
    } catch {
      toast.error("Failed to delete student");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleStudentUpdated = (updated) => {
    const formatted = {
      ...updated,
      first_name: formatName(updated.first_name),
      last_name: formatName(updated.last_name),
    };
    setStudents((prev) =>
      prev.map((s) => (s.student_id === formatted.student_id ? formatted : s))
    );
    setFilteredStudents((prev) =>
      prev.map((s) => (s.student_id === formatted.student_id ? formatted : s))
    );
  };

  return (
    <div className="space-y-12 px-4">
      
      {/* 1. TYPOGRAPHY HEADER & CONTROLS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Student Management
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Maintain, search, and manage registered students
          </p>
        </div>

        {/* Action Controls Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-3xl justify-end">
          
          {/* Search Input Box */}
          <div className="relative flex-1 max-w-[280px] flex items-center bg-white border border-[#0A3A23]/10 rounded-xl px-4 shadow-sm focus-within:border-[#008C45] transition-all">
            <FaSearch className="text-[#0A3A23]/30 text-xs mr-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID or Name..."
              className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-10 placeholder:text-[#0A3A23]/30"
            />
          </div>

          {/* Register Action Button */}
          <button
            onClick={() => navigate("/student/register")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-200"
          >
            <FaPlus size={10} /> Register Student
          </button>

        </div>
      </div>

      {/* 2. PREMIUM METRIC SUMMARY CARD */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 my-10">
        <div className="bg-white p-8 rounded-[24px] border border-[#0A3A23]/10 shadow-[0_16px_45px_rgba(10,58,35,0.03)] flex items-center gap-5 group transition-all duration-300 hover:border-[#008C45]/20 hover:shadow-[0_16px_45px_rgba(10,58,35,0.06)]">
          <div className="p-4 bg-[#F5F3F0] rounded-xl text-[#0A3A23] group-hover:scale-105 transition-transform group-hover:bg-[#008C45]/10 group-hover:text-[#008C45]">
            <FaUsers size={22} />
          </div>
          <div>
            <span className="block text-[10px] font-black text-[#0A3A23]/40 uppercase tracking-widest">
              Total Managed
            </span>
            <h4 className="text-2xl font-black text-[#0A3A23] tracking-tight mt-1">
              {filteredStudents.length}
            </h4>
          </div>
        </div>
      </div>

      {/* 3. DESKTOP SYSTEM VIEW GRID PANEL */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaRegIdCard size={12} />
                  </div>
                  Student ID
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaUserGraduate size={12} />
                  </div>
                  Full Name
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaBookOpen size={12} />
                  </div>
                  Course
                </div>
              </th>
              <th className="px-8 py-6 text-center rounded-tr-[32px] w-[180px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  No records matching search found.
                </td>
              </tr>
            ) : (
              currentItems.map((s, i) => {
                const fullName = `${s.first_name} ${s.last_name}`.trim();
                return (
                  <tr key={`${s.student_id}-${i}`} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                    <td className="px-8 py-6">
                      <span className="block font-black text-[#0A3A23] group-hover:text-[#008C45] text-base tracking-tight transition-colors">
                        {s.student_id}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-[#0A3A23]/80 uppercase tracking-wide">
                      {fullName}
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-4 py-2 text-xs font-black bg-[#F5F3F0] text-[#0A3A23] rounded-xl border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm">
                        {s.course || "N/A"}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* View Button using Deep Forest Green (#0A3A23) with subtle opacity shifts */}
                        <button
                          onClick={() => handleView(s)}
                          title="View Profile"
                          className="p-2.5 rounded-xl border border-[#0A3A23]/10 bg-[#0A3A23]/5 text-[#0A3A23] transition-all hover:bg-[#0A3A23] hover:text-white hover:shadow-sm"
                        >
                          <FaEye size={14} />
                        </button>
                        {/* Edit Button using Brand Green (#008C45) */}
                        <button
                          onClick={() => handleEdit(s)}
                          title="Edit Details"
                          className="p-2.5 rounded-xl border border-[#008C45]/10 bg-[#008C45]/5 text-[#008C45] transition-all hover:bg-[#008C45] hover:text-white hover:shadow-sm"
                        >
                          <FaPen size={12} />
                        </button>
                        {/* Delete Button styled as a clean soft tone contrast out of the palette background bounds */}
                        <button
                          onClick={() => handleDeleteRequest(s)}
                          title="Remove Entry"
                          className="p-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-600 transition-all hover:bg-rose-600 hover:text-white hover:shadow-sm"
                        >
                          <FaTrashAlt size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 4. RESPONSIVE MOBILE COMPACT CARDS */}
      <div className="md:hidden space-y-4">
        {currentItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            No records found.
          </div>
        ) : (
          currentItems.map((s, i) => {
            const fullName = `${s.first_name} ${s.last_name}`.trim();
            return (
              <div key={`${s.student_id}-mobile-${i}`} className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-4 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#0A3A23] tracking-tight">{s.student_id}</span>
                  <span className="text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5 uppercase">{s.course || "N/A"}</span>
                </div>
                <div className="text-xs text-[#0A3A23]/70 font-semibold pt-1 border-t border-[#0A3A23]/5">
                  <p className="font-black text-[#0A3A23] uppercase tracking-wide text-sm">{fullName}</p>
                </div>
                <div className="flex items-center gap-2 justify-end pt-2">
                  <button
                    onClick={() => handleView(s)}
                    className="p-2.5 rounded-xl border border-[#0A3A23]/10 bg-[#0A3A23]/5 text-[#0A3A23] flex-1 flex justify-center"
                  >
                    <FaEye size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(s)}
                    className="p-2.5 rounded-xl border border-[#008C45]/10 bg-[#008C45]/5 text-[#008C45] flex-1 flex justify-center"
                  >
                    <FaPen size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(s)}
                    className="p-2.5 rounded-xl border border-rose-500/10 bg-rose-500/5 text-rose-600 flex-1 flex justify-center"
                  >
                    <FaTrashAlt size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DYNAMIC PAGINATION CONTROLS BAR */}
      {filteredStudents.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#0A3A23]/5 pt-6 px-4">
          <span className="text-xs font-bold text-[#0A3A23]/50 tracking-wide text-center sm:text-left">
            Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-[#0A3A23] font-black">
              {Math.min(indexOfLastItem, filteredStudents.length)}
            </span>{" "}
            of <span className="text-[#0A3A23] font-black">{filteredStudents.length}</span> entries
          </span>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            
            <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none py-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  className={`w-9 h-9 text-xs font-black rounded-xl transition-all shadow-sm flex-shrink-0 ${
                    currentPage === index + 1
                      ? "bg-[#0A3A23] text-white"
                      : "bg-white border border-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23]/5"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

      {/* Modals Containers */}
      <ViewStudentModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        student={selectedStudent}
      />

      <EditStudentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        student={selectedStudent}
        onStudentUpdated={handleStudentUpdated}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        student={selectedStudent}
      />
    </div>
  );
};

export default StudentManagementComponent;