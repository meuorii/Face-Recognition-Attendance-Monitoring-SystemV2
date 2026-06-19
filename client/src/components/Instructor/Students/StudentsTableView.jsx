// src/components/Instructor/Students/StudentsTableView.jsx
import { useState, useEffect } from "react";
import { FaUserGraduate, FaRegIdCard, FaBookOpen, FaLayerGroup } from "react-icons/fa";
import { ChevronLeft, ChevronRight } from "lucide-react";

const formatName = (value = "") => {
  return value
    .trim()
    .split(" ")
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

const StudentsTableView = ({ 
  selectedClass, 
  filteredStudents = [], 
  loadingStudents 
}) => {
  // Pagination State Tracks
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // I-reset ang page sa 1 kapag nagpalit ng class o nag-search ang user
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, filteredStudents.length]);

  // Pagination Logic (Kapareho ng sa SubjectsTableView)
  const totalPages = Math.max(Math.ceil(filteredStudents.length / itemsPerPage), 1);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredStudents.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      
      {/* DESKTOP TABLE VIEW */}
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
                  Name
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
              <th className="px-8 py-6 rounded-tr-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaLayerGroup size={12} />
                  </div>
                  Section
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {loadingStudents ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/40 uppercase tracking-widest animate-pulse bg-[#F5F3F0]/20">
                  Loading list...
                </td>
              </tr>
            ) : !selectedClass ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  Please select a class to view the list.
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  No students found.
                </td>
              </tr>
            ) : (
              currentItems.map((s, i) => {
                const fullName = `${formatName(s.first_name)} ${formatName(s.last_name)}`.trim();
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
                        {s.course}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className="inline-block px-4 py-2 text-xs font-black bg-[#F5F3F0] text-[#0A3A23] rounded-xl border border-[#0A3A23]/5 group-hover:bg-white group-hover:border-[#0A3A23]/10 transition-all shadow-sm">
                        {s.section}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-4">
        {loadingStudents ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/40 uppercase tracking-widest animate-pulse">
            Loading...
          </div>
        ) : !selectedClass ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            Please select a class.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            No students found.
          </div>
        ) : (
          currentItems.map((s, i) => {
            const fullName = `${formatName(s.first_name)} ${formatName(s.last_name)}`.trim();
            return (
              <div key={`${s.student_id}-mobile-${i}`} className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-3 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#0A3A23] tracking-tight">{s.student_id}</span>
                  <span className="text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5">{s.section}</span>
                </div>
                <div className="text-xs text-[#0A3A23]/70 font-semibold space-y-1 pt-1 border-t border-[#0A3A23]/5">
                  <p className="font-black text-[#0A3A23] uppercase tracking-wide">{fullName}</p>
                  <p className="text-[11px] text-[#0A3A23]/50">Course: <span className="text-[#0A3A23] font-bold">{s.course}</span></p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION TOOLBAR CONTROLS (Kapareho ng sa SubjectsTableView) */}
      {selectedClass && filteredStudents.length > 0 && (
        <div className="flex items-center justify-between border-t border-[#0A3A23]/5 pt-6 px-4">
          <span className="text-xs font-bold text-[#0A3A23]/50 tracking-wide">
            Showing <span className="text-[#0A3A23] font-black">{indexOfFirstItem + 1}</span> to{" "}
            <span className="text-[#0A3A23] font-black">
              {Math.min(indexOfLastItem, filteredStudents.length)}
            </span>{" "}
            of <span className="text-[#0A3A23] font-black">{filteredStudents.length}</span> entries
          </span>

          <div className="flex items-center gap-3">
            {/* Previous Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || filteredStudents.length === 0}
              className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            
            {/* Page Number Sequence Tracks */}
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index + 1)}
                  disabled={filteredStudents.length === 0}
                  className={`w-9 h-9 text-xs font-black rounded-xl transition-all shadow-sm ${
                    currentPage === index + 1
                      ? "bg-[#0A3A23] text-white"
                      : "bg-white border border-[#0A3A23]/5 text-[#0A3A23] hover:bg-[#0A3A23]/5 disabled:opacity-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            {/* Next Page Button */}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || filteredStudents.length === 0}
              className="p-2.5 rounded-xl border border-[#0A3A23]/5 bg-white text-[#0A3A23] transition-all disabled:opacity-20 disabled:pointer-events-none hover:bg-[#0A3A23] hover:text-white shadow-sm"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentsTableView;