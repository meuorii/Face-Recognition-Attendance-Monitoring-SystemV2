// src/components/Admin/AttendanceFilterModal.jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { 
  FaGraduationCap, 
  FaUserTie, 
  FaBookmark, 
  FaHistory, 
  FaCalendarAlt, 
  FaCalendarWeek,
  FaSlidersH
} from "react-icons/fa";
import { HiX } from "react-icons/hi";

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AttendanceFilterModal({
  isOpen,
  onClose,
  sessions,
  selectedClass,
  setSelectedClass,
  selectedInstructor,
  setSelectedInstructor,
  selectedSemester,
  setSelectedSemester,
  selectedSchoolYear,
  setSelectedSchoolYear,
  selectedMonth,
  setSelectedMonth,
  weekStart,
  setWeekStart,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0A3A23]/50 backdrop-blur-md flex justify-center items-center p-4 transition-all duration-300">
      <div className="bg-white p-10 rounded-[32px] w-full max-w-2xl shadow-[0_30px_70px_rgba(10,58,35,0.2)] border border-[#0A3A23]/10 space-y-8 relative transform scale-100 transition-transform">
        
        {/* Close Button Header (X) */}
        <button 
          onClick={onClose}
          className="absolute top-8 right-8 text-[#0A3A23]/40 hover:text-[#22c55e] transition-colors p-1.5 hover:bg-[#F5F3F0] rounded-full"
        >
          <HiX size={20} />
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#0A3A23]/10 pb-5 flex items-center gap-4">
          <div className="p-3 bg-[#0A3A23]/5 rounded-2xl text-[#0A3A23]">
            <FaSlidersH size={20} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-[#0A3A23] tracking-tight">Filter Attendance</h3>
            <p className="text-xs font-bold text-[#008C45] uppercase tracking-wider mt-0.5">Refine your dashboard view logs</p>
          </div>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          
          {/* Class Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaGraduationCap size={12} className="text-[#008C45]" /> Class
            </label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all group">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer appearance-none pr-6 z-10"
              >
                <option value="">All Classes</option>
                {[...new Map(sessions.map(s => [s.class_id, { class_id: s.class_id, subject_code: s.subject_code, course: s.course, section: s.section }])).values()].map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>{cls.subject_code} — {cls.course} {cls.section}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px] group-focus-within:text-[#008C45] transition-colors">▼</div>
            </div>
          </div>

          {/* Instructor Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaUserTie size={11} className="text-[#008C45]" /> Instructor
            </label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all group">
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer appearance-none pr-6 z-10"
              >
                <option value="">All Instructors</option>
                {[...new Map(sessions.map(s => [`${s.instructor_first_name} ${s.instructor_last_name}`, { name: `${s.instructor_first_name} ${s.instructor_last_name}`, id: s.instructor_id }])).values()].map(ins => (
                  <option key={ins.id} value={ins.name}>{ins.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px] group-focus-within:text-[#008C45] transition-colors">▼</div>
            </div>
          </div>

          {/* Semester Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaBookmark size={11} className="text-[#008C45]" /> Semester
            </label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all group">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer appearance-none pr-6 z-10"
              >
                <option value="">All Semesters</option>
                <option value="1st Sem">1st Semester</option>
                <option value="2nd Sem">2nd Semester</option>
                <option value="Summer">Mid Year</option>
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px] group-focus-within:text-[#008C45] transition-colors">▼</div>
            </div>
          </div>

          {/* School Year Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaHistory size={11} className="text-[#008C45]" /> School Year
            </label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all group">
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer appearance-none pr-6 z-10"
              >
                <option value="">All School Years</option>
                {[...new Set(sessions.map(s => s.school_year))].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px] group-focus-within:text-[#008C45] transition-colors">▼</div>
            </div>
          </div>

          {/* Month Filter */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaCalendarAlt size={11} className="text-[#008C45]" /> Month
            </label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all group">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer appearance-none pr-6 z-10"
              >
                <option value="">All Months</option>
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px] group-focus-within:text-[#008C45] transition-colors">▼</div>
            </div>
          </div>

          {/* Week Start Picker */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1 flex items-center gap-1.5">
              <FaCalendarWeek size={11} className="text-[#008C45]" /> Week Start
            </label>
            <div className="flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#008C45]/5 transition-all">
              <DatePicker
                selected={weekStart}
                onChange={(d) => setWeekStart(d)}
                placeholderText="Select start date"
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-12 cursor-pointer placeholder-[#0A3A23]/30"
              />
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-6 border-t border-[#0A3A23]/10">
          <button
            onClick={onClose}
            className="px-6 py-3.5 bg-white border border-[#0A3A23]/10 hover:bg-[#F5F3F0] text-[#0A3A23] font-black text-xs uppercase tracking-widest rounded-xl transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3.5 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-[0_10px_20px_rgba(10,58,35,0.15)] hover:shadow-[0_10px_25px_rgba(0,140,69,0.25)] transition-all duration-300 hover:-translate-y-0.5"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
}