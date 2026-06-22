// src/components/Instructor/Attendance/FilterConfigModal.jsx
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { CheckCircle2, Layers, Calendar, GraduationCap, SlidersHorizontal } from "lucide-react";

const FilterConfigModal = ({
  classes,
  selectedClass,
  setSelectedClass,
  selectedCourse,
  setSelectedCourse,
  selectedSemester,
  setSelectedSemester,
  selectedSchoolYear,
  setSelectedSchoolYear,
  selectedMonth,
  setSelectedMonth,
  weekStart,
  setWeekStart,
  monthNames,
  onClose, 
}) => {
  return (
    <div className="w-full text-left bg-white space-y-8 p-2">
      {/* Header Layout */}
      <div className="flex items-start gap-4 border-b border-[#0A3A23]/5 pb-6">
        <div className="p-3.5 bg-[#F5F3F0] border border-[#0A3A23]/5 rounded-2xl text-[#0A3A23]">
          <SlidersHorizontal size={22} strokeWidth={2.5} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-[#0A3A23] tracking-tight">
            Filter Attendance
          </h3>
          <p className="text-xs text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Select parameters to filter records
          </p>
        </div>
      </div>

      {/* Main Input Controls Grid */}
      <div className="space-y-6">
        
        {/* Course & Class Group Matrix Selection */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* New Course Filter Input */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5">
            <div className="flex items-center gap-2 px-1">
              <Layers size={13} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                Course
              </label>
            </div>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
            >
              <option value="">All Courses</option>
              <option value="BSINFOTECH">BSINFOTECH</option>
              <option value="BSCS">BSCS</option>
            </select>
          </div>

          {/* Select Class Filter (Takes up remaining grid spaces) */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5 sm:col-span-2">
            <div className="flex items-center gap-2 px-1">
              <Layers size={13} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                Select Class
              </label>
            </div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
            >
              <option value="">All Classes</option>
              {classes
                .filter((c) => {
                  if (selectedSchoolYear && c.school_year !== selectedSchoolYear) return false;
                  if (selectedSemester && c.semester !== selectedSemester) return false;
                  if (selectedCourse && c.course !== selectedCourse) return false;
                  return true;
                })
                .map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.subject_code} • {c.course} {c.section}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Semester & Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Semester Container */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5">
            <div className="flex items-center gap-2 px-1">
              <GraduationCap size={14} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                Semester
              </label>
            </div>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
            >
              <option value="">All Semesters</option>
              <option value="1st Sem">1st Semester</option>
              <option value="2nd Sem">2nd Semester</option>
              <option value="Summer">Mid Year</option>
            </select>
          </div>

          {/* School Year Container */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5">
            <div className="flex items-center gap-2 px-1">
              <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                School Year
              </label>
            </div>
            <select
              value={selectedSchoolYear}
              onChange={(e) => setSelectedSchoolYear(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
            >
              <option value="">All School Years</option>
              {[...new Set(classes.map((c) => c.school_year))].map((year) => (
                <option key={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Month & Week */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Month Block */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5">
            <div className="flex items-center gap-2 px-1">
              <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                Month
              </label>
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
            >
              <option value="">All Months</option>
              {monthNames.map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>

          {/* Week Date Picker Block */}
          <div className="space-y-2 bg-[#F5F3F0]/40 p-4 rounded-2xl border border-[#0A3A23]/5 flex flex-col">
            <div className="flex items-center gap-2 px-1">
              <Calendar size={13} className="text-[#008C45]" strokeWidth={2.5} />
              <label className="text-[10px] font-black text-[#0A3A23]/60 uppercase tracking-widest">
                Start Week
              </label>
            </div>
            <div className="w-full relative">
              <DatePicker
                selected={weekStart}
                onChange={(d) => setWeekStart(d)}
                placeholderText="Select start date..."
                className="w-full px-4 py-3.5 bg-white border border-[#0A3A23]/10 text-[#0A3A23] font-black text-sm rounded-xl focus:outline-none focus:border-[#008C45] focus:ring-2 focus:ring-[#008C45]/10 shadow-sm transition-all"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Submission Action Control */}
      <div className="pt-4 border-t border-[#0A3A23]/5">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-[#008C45]/20 active:scale-[0.99] transition-all duration-200"
        >
          <CheckCircle2 size={15} strokeWidth={2.5} /> Apply Filters
        </button>
      </div>
    </div>
  );
};

export default FilterConfigModal;