// src/components/Admin/AttendanceFilterModal.jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    <div className="fixed inset-0 z-50 bg-[#0A3A23]/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white p-8 rounded-[28px] w-full max-w-xl shadow-[0_25px_60px_rgba(10,58,35,0.15)] border border-[#0A3A23]/10 space-y-6">
        
        {/* Modal Header */}
        <div className="border-b border-[#0A3A23]/10 pb-4">
          <h3 className="text-xl font-black text-[#0A3A23] tracking-tight">Filter Attendance</h3>
          <p className="text-xs font-bold text-[#008C45] uppercase tracking-wider mt-0.5">Refine your view logs</p>
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Class Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">Class</label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                <option value="">All Classes</option>
                {[...new Map(sessions.map(s => [s.class_id, { class_id: s.class_id, subject_code: s.subject_code, course: s.course, section: s.section }])).values()].map(cls => (
                  <option key={cls.class_id} value={cls.class_id}>{cls.subject_code} — {cls.course} {cls.section}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px]">▼</div>
            </div>
          </div>

          {/* Instructor Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">Instructor</label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <select
                value={selectedInstructor}
                onChange={(e) => setSelectedInstructor(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                <option value="">All Instructors</option>
                {[...new Map(sessions.map(s => [`${s.instructor_first_name} ${s.instructor_last_name}`, { name: `${s.instructor_first_name} ${s.instructor_last_name}`, id: s.instructor_id }])).values()].map(ins => (
                  <option key={ins.id} value={ins.name}>{ins.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px]">▼</div>
            </div>
          </div>

          {/* Semester Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">Semester</label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                <option value="">All Semesters</option>
                <option value="1st Sem">1st Semester</option>
                <option value="2nd Sem">2nd Semester</option>
                <option value="Summer">Mid Year</option>
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px]">▼</div>
            </div>
          </div>

          {/* School Year Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">School Year</label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <select
                value={selectedSchoolYear}
                onChange={(e) => setSelectedSchoolYear(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                <option value="">All School Years</option>
                {[...new Set(sessions.map(s => s.school_year))].map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px]">▼</div>
            </div>
          </div>

          {/* Month Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">Month</label>
            <div className="relative flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer appearance-none pr-4"
              >
                <option value="">All Months</option>
                {monthNames.map((m, i) => (
                  <option key={i} value={i + 1}>{m}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 text-[#0A3A23]/40 text-[10px]">▼</div>
            </div>
          </div>

          {/* Week Start Picker */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-wider pl-1">Week Start</label>
            <div className="flex items-center bg-[#F5F3F0] border border-[#0A3A23]/10 rounded-xl px-4 focus-within:border-[#008C45] transition-all">
              <DatePicker
                selected={weekStart}
                onChange={(d) => setWeekStart(d)}
                placeholderText="Select date"
                className="w-full bg-transparent outline-none text-[#0A3A23] font-bold text-xs h-11 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Modal Actions */}
        <div className="flex justify-end pt-4 border-t border-[#0A3A23]/10">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-[#0A3A23] hover:bg-[#008C45] text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-sm transition-all duration-300"
          >
            Apply Filters
          </button>
        </div>

      </div>
    </div>
  );
}