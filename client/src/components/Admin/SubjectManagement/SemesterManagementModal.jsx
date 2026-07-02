import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { createPortal } from "react-dom";
import { Calendar, Layers, X, Save, CheckCircle2 } from "lucide-react";

export default function SemesterManagementModal({ isOpen, onClose, onRefresh }) {
  const [semester, setSemester] = useState(null);
  const [semesterName, setSemesterName] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const API_BASE = "http://127.0.0.1:8080/api/admin";

  const computeSchoolYear = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (month >= 6) {
      return `${year}–${year + 1}`;
    } else {
      return `${year - 1}–${year}`;
    }
  };

  useEffect(() => {
    if (startDate) {
      setSchoolYear(computeSchoolYear(startDate));
    }
  }, [startDate]);

  const fetchSemester = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_BASE}/semester/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const sem = res.data;
      setSemester(sem);
      setSemesterName(sem.semester_name || "");
      setStartDate(sem.start_date || "");
      setEndDate(sem.end_date || "");
      setSchoolYear(sem.school_year || computeSchoolYear(sem.start_date));
    } catch (err) {
      console.error(err);
      toast.error("Failed to load term settings.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!semesterName || !schoolYear || !startDate || !endDate)
      return toast.error("Please fill in all details");

    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/semester`,
        {
          semester_name: semesterName,
          school_year: schoolYear,
          start_date: startDate,
          end_date: endDate,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Settings updated successfully");
      fetchSemester();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update schedule settings.");
    }
  };

  const handleActivate = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API_BASE}/semester/activate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Term is now active");
      fetchSemester();
      onRefresh();
    } catch (err) {
      console.error(err);
      toast.error("Failed to activate term configuration.");
    }
  };

  useEffect(() => {
    if (isOpen) fetchSemester();
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-[#0A3A23]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity duration-200">
      <div className="bg-[#F5F3F0] w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col md:flex-row border border-neutral-200 min-h-[460px]">
        
        {/* Left Informative Panel */}
        <div className="md:w-5/12 bg-[#0A3A23] p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#008C45]/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
          
          <div>
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
              <Layers className="w-6 h-6 text-emerald-300" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight mb-2">Term Configuration</h2>
            <p className="text-sm text-emerald-100/80 leading-relaxed font-light">
              Manage operational schedules, school cycles, and establish dates for the current registration term.
            </p>
          </div>

          <div className="mt-8 border-t border-emerald-800/60 pt-6">
            <span className="text-xs uppercase tracking-wider font-semibold text-emerald-300/90 block mb-3">
              Status Overview
            </span>
            {semester ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{semester.semester_name}</span>
                  <span className="text-xs px-2 py-0.5 bg-white/10 rounded-full text-emerald-200">
                    {semester.school_year}
                  </span>
                </div>
                {semester.is_active ? (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Currently Active</span>
                  </div>
                ) : (
                  <button
                    onClick={handleActivate}
                    className="mt-1 w-full bg-[#008C45] hover:bg-[#008C45]/80 active:scale-[0.98] transition-all text-white text-xs font-medium py-2 px-3 rounded-lg shadow-sm"
                  >
                    Set as Active
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs text-emerald-200/50 italic">No term active</p>
            )}
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="flex-1 p-8 relative flex flex-col justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Academic Session
              </label>
              <div className="relative">
                <select
                  value={semesterName}
                  onChange={(e) => setSemesterName(e.target.value)}
                  className="w-full bg-white border border-neutral-300 text-neutral-800 text-sm px-4 py-2.5 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all"
                >
                  <option value="">Select Option</option>
                  <option value="1st Semester">1st Semester</option>
                  <option value="2nd Semester">2nd Semester</option>
                  <option value="Summer">Summer</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-neutral-500">
                  <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                Identified School Year
              </label>
              <input
                type="text"
                placeholder="Calculated Year Range"
                value={schoolYear}
                disabled
                className="w-full bg-neutral-100 border border-neutral-200 text-neutral-500 text-sm px-4 py-2.5 rounded-xl cursor-not-allowed font-medium select-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-800 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wider mb-2">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-neutral-400 pointer-events-none" />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-neutral-300 text-neutral-800 text-sm pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008C45]/20 focus:border-[#008C45] transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-[#0A3A23] hover:bg-[#0A3A23]/90 active:scale-[0.99] transition-all text-white text-sm font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-[#0A3A23]/10"
              >
                <Save className="w-4 h-4" />
                <span>Save Setup</span>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}