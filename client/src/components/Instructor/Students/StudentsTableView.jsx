// src/components/Instructor/Students/StudentsTableView.jsx
import { FaUserGraduate, FaRegIdCard, FaBookOpen, FaLayerGroup } from "react-icons/fa";

const formatName = (value = "") => {
  return value
    .trim()
    .split(" ")
    .map((w) => (w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
};

const StudentsTableView = ({ 
  selectedClass, 
  filteredStudents, 
  loadingStudents 
}) => {
  return (
    <div className="space-y-6">
      
      {/* DESKTOP DATA TABLE ENGINE */}
      <div className="hidden md:block overflow-hidden bg-white rounded-[32px] border border-[#0A3A23]/10 shadow-[0_20px_50px_rgba(10,58,35,0.04)]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-[#0A3A23] text-white text-[11px] font-black tracking-widest uppercase">
              <th className="px-8 py-6 rounded-tl-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaRegIdCard size={12} />
                  </div>
                  Student Identification ID
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaUserGraduate size={12} />
                  </div>
                  Complete Full Name
                </div>
              </th>
              <th className="px-8 py-6">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaBookOpen size={12} />
                  </div>
                  Course Program
                </div>
              </th>
              <th className="px-8 py-6 rounded-tr-[32px]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-white backdrop-blur-md">
                    <FaLayerGroup size={12} />
                  </div>
                  Section Block
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A3A23]/5 bg-white">
            {loadingStudents ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/40 uppercase tracking-widest animate-pulse bg-[#F5F3F0]/20">
                  Accessing records database...
                </td>
              </tr>
            ) : !selectedClass ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  Select a class track to view the active roster.
                </td>
              </tr>
            ) : filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest bg-[#F5F3F0]/20">
                  No match found within this academic track.
                </td>
              </tr>
            ) : (
              filteredStudents.map((s, i) => {
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

      {/* MOBILE LIST FRAMEWORK VIEW */}
      <div className="md:hidden space-y-4">
        {loadingStudents ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/40 uppercase tracking-widest animate-pulse">
            Accessing database rows...
          </div>
        ) : !selectedClass ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            Select a class track to pull roster.
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-[32px] border border-[#0A3A23]/10 text-xs font-black text-[#0A3A23]/30 uppercase tracking-widest">
            No entries found.
          </div>
        ) : (
          filteredStudents.map((s, i) => {
            const fullName = `${formatName(s.first_name)} ${formatName(s.last_name)}`.trim();
            return (
              <div key={`${s.student_id}-mobile-${i}`} className="bg-white p-6 rounded-[28px] border border-[#0A3A23]/10 space-y-3 shadow-[0_10px_30px_rgba(10,58,35,0.02)]">
                <div className="flex justify-between items-center">
                  <span className="font-black text-base text-[#0A3A23] tracking-tight">{s.student_id}</span>
                  <span className="text-[10px] font-black bg-[#F5F3F0] text-[#0A3A23] px-2.5 py-1 rounded-lg border border-[#0A3A23]/5">{s.section}</span>
                </div>
                <div className="text-xs text-[#0A3A23]/70 font-semibold space-y-1 pt-1 border-t border-[#0A3A23]/5">
                  <p className="font-black text-[#0A3A23] uppercase tracking-wide">{fullName}</p>
                  <p className="text-[11px] text-[#0A3A23]/50">Course Program: <span className="text-[#0A3A23] font-bold">{s.course}</span></p>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default StudentsTableView;