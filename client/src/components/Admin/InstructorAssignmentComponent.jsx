// ✅ src/components/Admin/InstructorAssignmentComponent.jsx
import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { FaSearch, FaChalkboardTeacher, FaRegIdCard, FaUserTie, FaToggleOn, FaSlidersH, FaExclamationTriangle } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";
import InstructorAssignmentManagerModal from "./InstructorManagement/InstructorAssignmentManagerModal";

const API_URL = "http://127.0.0.1:8080";

const InstructorAssignmentComponent = () => {
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Pagination Tracks
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatName = (name) => {
    if (!name) return "";
    return name
      .toLowerCase()
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/admin/instructors`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInstructors(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to load instructors");
    } finally {
      setLoading(false);
    }
  };

  // Reset pagination index kapag nag-type sa search box
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredInstructors = instructors.filter(
    (inst) =>
      (inst.first_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.last_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inst.email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split-metric counters para sa premium stat cards
  const registeredCount = useMemo(() => instructors.filter(i => i.registered).length, [instructors]);
  const unregisteredCount = useMemo(() => instructors.filter(i => !i.registered).length, [instructors]);

  // Slicing Metrics Calculations para sa Pagination
  const totalPages = Math.max(Math.ceil(filteredInstructors.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = useMemo(() => {
    return filteredInstructors.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredInstructors, indexOfFirstItem, indexOfLastItem]);

  const handleOpenManager = (inst) => {
    setSelectedInstructor(inst);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-12 px-4">
      
      {/* 1. TYPOGRAPHY HEADER & CONTROLS TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Instructor Assignments
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Allocate courses, subjects, and sections to faculty members
          </p>
        </div>

        {/* Toolbar Container Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 lg:max-w-md justify-end">
          {/* Search Box Input */}
          <div className="relative flex-1 w-full flex items-center bg-white border border-[#0A3A23]/10 rounded-xl px-4 shadow-sm focus-within:border-[#008C45] transition-all">
            <FaSearch className="text-[#0A3A23]/30 text-xs mr-2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Instructor or Email..."
              className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-10 placeholder:text-[#0A3A23]/30"
            />
          </div>
        </div>
      </div>

      {/* 2. DUAL PREMIUM METRICS PANEL CARDS */}
{/* 2. DUAL PREMIUM METRICS PANEL CARDS */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-10 my-12">
  
  {/* Card A: Registered Instructors */}
  <div className="relative overflow-hidden bg-white p-10 rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.02)] flex flex-col justify-between min-h-[190px] group transition-all duration-500 hover:border-[#008C45]/30 hover:shadow-[0_30px_70px_rgba(10,58,35,0.06)] hover:-translate-y-1.5">
    {/* Ambient Glow Accent */}
    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#008C45]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="flex justify-between items-start gap-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#008C45]/5 text-[9px] font-black tracking-widest uppercase text-[#008C45]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#008C45] animate-pulse" /> Done
        </span>
        <h3 className="block text-[11px] font-black text-[#0A3A23]/50 uppercase tracking-[0.15em] pt-1">
          Registered Instructors
        </h3>
      </div>
      <div className="p-4 bg-[#F5F3F0] rounded-2xl text-[#0A3A23] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#008C45] group-hover:text-white group-hover:shadow-[0_12px_24px_rgba(0,140,69,0.2)]">
        <FaChalkboardTeacher size={24} />
      </div>
    </div>

    <div className="flex items-baseline gap-2 mt-6">
      <h4 className="text-4xl font-black text-[#0A3A23] tracking-tight transition-colors duration-300 group-hover:text-[#008C45]">
        {registeredCount}
      </h4>
      <span className="text-[10px] font-extrabold text-[#0A3A23]/40 uppercase tracking-wider">
        Total Accounts
      </span>
    </div>
  </div>

  {/* Card B: Unregistered Instructors */}
  <div className="relative overflow-hidden bg-white p-10 rounded-[32px] border border-[#950606]/10 shadow-[0_20px_50px_rgba(149,6,6,0.01)] flex flex-col justify-between min-h-[190px] group transition-all duration-500 hover:border-[#950606]/30 hover:shadow-[0_30px_70px_rgba(149,6,6,0.05)] hover:-translate-y-1.5">
    {/* Ambient Glow Accent */}
    <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-[#950606]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
    
    <div className="flex justify-between items-start gap-6">
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#950606]/5 text-[9px] font-black tracking-widest uppercase text-[#950606]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#950606] animate-ping" /> Alert
        </span>
        <h3 className="block text-[11px] font-black text-[#950606]/60 uppercase tracking-[0.15em] pt-1">
          Unregistered Instructors
        </h3>
      </div>
      <div className="p-4 bg-[#950606]/5 rounded-2xl text-[#950606] transition-all duration-500 group-hover:scale-110 group-hover:bg-[#950606] group-hover:text-white group-hover:shadow-[0_12px_24px_rgba(149,6,6,0.2)]">
        <FaExclamationTriangle size={22} />
      </div>
    </div>

    <div className="flex items-baseline gap-2 mt-6">
      <h4 className="text-4xl font-black text-[#950606] tracking-tight">
        {unregisteredCount}
      </h4>
      <span className="text-[10px] font-extrabold text-[#950606]/50 uppercase tracking-wider">
        No Face Data
      </span>
    </div>
  </div>

</div>

      {/* 3. DESKTOP SYSTEM DATA GRID VIEW */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaRegIdCard size={12} />
                  </div>
                  Instructor ID
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaUserTie size={12} />
                  </div>
                  Instructor Name
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaToggleOn size={12} />
                  </div>
                  Status
                </div>
              </th>
              <th className="px-8 py-6 text-center rounded-tr-[32px] w-[140px]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  Loading instructors data...
                </td>
              </tr>
            ) : currentItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  No instructor records matching search criteria.
                </td>
              </tr>
            ) : (
              currentItems.map((inst, index) => {
                const fullName = `${formatName(inst.first_name)} ${formatName(inst.last_name)}`.trim();
                return (
                  <tr key={`${inst.instructor_id}-${index}`} className="hover:bg-[#F5F3F0]/40 transition-all duration-200 group">
                    
                    {/* Consistent Dark Forest Green Text for ID */}
                    <td className="px-8 py-6">
                      <span className="block font-black text-base tracking-tight text-[#0A3A23] group-hover:text-[#008C45] transition-colors">
                        {inst.instructor_id}
                      </span>
                    </td>
                    
                    {/* Consistent Dark Forest Green Text for Name */}
                    <td className="px-8 py-6 text-sm font-black uppercase tracking-wide text-[#0A3A23]/80">
                      {fullName}
                    </td>
                    
                    {/* Dynamic Status Badge (Dito lang magbabago ang kulay) */}
                    <td className="px-8 py-6">
                      {inst.registered ? (
                        <span className="inline-block px-4 py-1.5 text-[10px] font-black bg-[#008C45]/10 text-[#008C45] rounded-xl uppercase tracking-wider">
                          Registered
                        </span>
                      ) : (
                        <span className="inline-block px-4 py-1.5 text-[10px] font-black bg-[#950606]/10 text-[#950606] rounded-xl uppercase tracking-wider">
                          Not Registered
                        </span>
                      )}
                    </td>
                    
                    {/* Consistent Action Button Color Alignment */}
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleOpenManager(inst)}
                          title="Manage Class Assignment Mapping"
                          className="p-3 rounded-xl border border-[#008C45]/10 bg-[#008C45]/5 text-[#008C45] transition-all hover:bg-[#008C45] hover:text-white hover:shadow-sm"
                        >
                          <FaSlidersH size={13} />
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

      {/* 4. RESPONSIVE COMPACT CARD SUB-LAYOUTS (MOBILE ADAPTIVE VIEW) */}
      <div className="md:hidden space-y-4">
        {loading ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            Loading data metrics...
          </div>
        ) : currentItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            No instructors records configured.
          </div>
        ) : (
          currentItems.map((inst, index) => {
            const fullName = `${formatName(inst.first_name)} ${formatName(inst.last_name)}`.trim();
            return (
              <div 
                key={`${inst.instructor_id}-mobile-${index}`} 
                className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-4 shadow-[0_10px_30px_rgba(10,58,35,0.02)]"
              >
                <div className="flex justify-between items-center">
                  <span className="font-black text-base tracking-tight text-[#0A3A23]">{inst.instructor_id}</span>
                  {inst.registered ? (
                    <span className="text-[9px] font-black bg-[#008C45]/10 text-[#008C45] px-2.5 py-1 rounded-lg uppercase tracking-wide">Registered</span>
                  ) : (
                    <span className="text-[9px] font-black bg-[#950606]/10 text-[#950606] px-2.5 py-1 rounded-lg uppercase tracking-wide">Unregistered</span>
                  )}
                </div>
                <div className="text-xs font-semibold pt-1 border-t border-[#0A3A23]/5">
                  <p className="font-black uppercase tracking-wide text-sm text-[#0A3A23]">{fullName}</p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => handleOpenManager(inst)}
                    className="w-full py-3 rounded-xl border border-[#008C45]/10 bg-[#008C45]/5 text-[#008C45] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:bg-[#008C45] active:text-white"
                  >
                    <FaSlidersH size={12} /> Manage Parameters
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 5. DYNAMIC PAGINATION MANAGEMENT BAR CONTROLLER */}
      {!loading && filteredInstructors.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#0A3A23]/5 pt-6 px-4">
          <span className="text-xs font-bold text-[#0A3A23]/50 tracking-wide text-center sm:text-left">
            Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-[#0A3A23] font-black">
              {Math.min(indexOfLastItem, filteredInstructors.length)}
            </span>{" "}
            of <span className="text-[#0A3A23] font-black">{filteredInstructors.length}</span> records
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

      {/* Configuration Assignment Modals Frame Container */}
      {isModalOpen && selectedInstructor && (
        <InstructorAssignmentManagerModal
          instructor={selectedInstructor}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default InstructorAssignmentComponent;