// src/components/Instructor/Subjects.jsx
import { useEffect, useState } from "react";
import { getClassesByInstructor, activateAttendance, stopAttendance, getInstructorById } from "../../services/api";
import { toast } from "react-toastify";
import { LayoutGrid, Table2, CalendarClock, BookOpenCheck, CalendarX } from "lucide-react"; 

import SubjectsTableView from "./Subjects/SubjectsTableView";
import SubjectsCardView from "./Subjects/SubjectsCardView";

const Subjects = ({ onActivateSession }) => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const [viewMode, setViewMode] = useState("table"); 
  const [instructorData, setInstructorData] = useState(JSON.parse(localStorage.getItem("userData")));
  const [time, setTime] = useState(new Date());

  const token = localStorage.getItem("token");

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    if (instructorData?.instructor_id && token) fetchClasses();
    return () => clearInterval(timer);
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await getClassesByInstructor(instructorData.instructor_id, token);
      setClasses(data || []);
    } catch (err) {
      console.error("❌ Error loading classes:", err.response?.data || err);
      toast.error("Failed to load classes.");
    } finally {
      setLoading(false);
    }
  };

  const isWithinSchedule = (schedule_blocks = []) => {
    if (!Array.isArray(schedule_blocks) || schedule_blocks.length === 0) return false;
    const nowPH = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const currentDay = dayMap[nowPH.getDay()];
    const currentTime = nowPH.toTimeString().slice(0, 5);

    return schedule_blocks.some((b) => {
      if (!b.days || !b.start || !b.end) return false;
      return b.days.includes(currentDay) && currentTime >= b.start && currentTime <= b.end;
    });
  };

  const getTodayClasses = () => {
    const dayMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const today = dayMap[new Date().getDay()];
    return classes.filter(c => c.schedule_blocks?.some(b => b.days.includes(today)));
  };

  // =============================
  // 🔹 ACTIVATE ATTENDANCE SESSION
  // =============================
  const handleActivate = async (classId) => {
    try {
      setLoadingId(classId);
      
      // 1. Kumuha ng pinakabagong biometrics status ng instructor
      const fresh = await getInstructorById(instructorData.instructor_id);
      localStorage.setItem("userData", JSON.stringify(fresh));
      setInstructorData(fresh);

      if (!fresh?.registered || !fresh.embeddings) {
        toast.error("❌ Face biometrics missing.");
        return;
      }

      // 2. I-validate kung pasok sa oras ng schedule block
      const classInfo = classes.find((c) => c._id === classId);
      if (!classInfo || !isWithinSchedule(classInfo.schedule_blocks)) {
        toast.error("⚠ Cannot activate outside your schedule.");
        return;
      }

      // 3. Ipadala sa totoong post session endpoint gamit ang classId at instructor metadata
      await activateAttendance(classId, instructorData.instructor_id, token);
      toast.success("✅ Attendance activated successfully.");
      
      // I-refresh ang view state at i-trigger ang live view tab switcher
      await fetchClasses();
      onActivateSession?.(classInfo);
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Activation failed.");
    } finally {
      setLoadingId(null);
    }
  };

  // =============================
  // 🔹 STOP ATTENDANCE SESSION
  // =============================
  const handleStop = async (classId) => {
    try {
      setLoadingId(classId);
      await stopAttendance(classId, instructorData.instructor_id, token);
      toast.info("🛑 Attendance stopped.");
      await fetchClasses();
    } catch (err) {
      toast.error("Failed to stop attendance.");
    } finally {
      setLoadingId(null);
    }
  };

  const todayClasses = getTodayClasses();

  return (
    <div className="space-y-12 px-4">
      
      {/* 1. HEADER & ICON TOGGLES */}
      <div className="flex items-center justify-between border-b border-[#0A3A23]/5 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Subjects
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Manage your class list and attendance
          </p>
        </div>

        {!loading && classes.length > 0 && (
          <div className="flex items-center gap-1 bg-[#F5F3F0] border border-[#0A3A23]/5 rounded-xl p-1.5 shadow-sm">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-2 rounded-lg transition-all ${
                viewMode === "table" 
                  ? "bg-[#0A3A23] text-white shadow-md shadow-[#0A3A23]/10" 
                  : "text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-white"
              }`}
            >
              <Table2 size={16} strokeWidth={2.5} />
            </button>
            <button
              onClick={() => setViewMode("card")}
              title="Card View"
              className={`p-2 rounded-lg transition-all ${
                viewMode === "card" 
                  ? "bg-[#0A3A23] text-white shadow-md shadow-[#0A3A23]/10" 
                  : "text-[#0A3A23]/40 hover:text-[#0A3A23] hover:bg-white"
              }`}
            >
              <LayoutGrid size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* 2. PREMIUM METRIC GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Card 1: Time, Date & Day (Premium Solid Dark Emerald Accent View) */}
        <div className="lg:col-span-4 bg-[#0A3A23] p-10 rounded-[32px] shadow-[0_20px_50px_rgba(10,58,35,0.15)] flex flex-col justify-between min-h-[260px] text-white relative overflow-hidden group">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#008C45]/20 rounded-full blur-3xl pointer-events-none transition-all group-hover:bg-[#008C45]/30" />
          
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black tracking-widest text-[#008C45] bg-white px-3.5 py-1.5 rounded-xl uppercase shadow-sm">
                {time.toLocaleDateString("en-US", { weekday: 'long' })}
              </span>
              <h4 className="text-3xl font-black text-white pt-4 tracking-tight">
                {time.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
              </h4>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 text-white border border-white/10 shadow-inner backdrop-blur-md">
              <CalendarClock size={22} strokeWidth={2.5} />
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 relative z-10">
            <p className="text-[10px] font-black tracking-widest text-white/50 uppercase mb-1">Current Time</p>
            <span className="text-4xl font-black text-white font-mono tracking-tight drop-shadow-sm">
              {time.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Card 2: Today's Class Schedule List (Modern Clean Minimalist View) */}
        <div className="lg:col-span-8 bg-white p-10 rounded-[32px] border border-[#0A3A23]/5 shadow-[0_20px_50px_rgba(10,58,35,0.04)] min-h-[260px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#0A3A23]/5 pb-5 mb-5">
            <div>
              <h4 className="text-xl font-black text-[#0A3A23] uppercase tracking-tight">Today's Classes</h4>
              <p className="text-xs font-medium text-[#0A3A23]/50 mt-0.5">Your schedule for today</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#0A3A23]/5 text-[#0A3A23] border border-[#0A3A23]/5">
              <BookOpenCheck size={20} strokeWidth={2.5} />
            </div>
          </div>

          {/* Scrollable list layer */}
          <div className="flex-1 overflow-y-auto max-h-[150px] space-y-3 pr-2 custom-scrollbar">
            {loading ? (
              <div className="h-full flex items-center justify-center py-6">
                <p className="text-xs font-bold text-[#0A3A23]/40 uppercase tracking-wider animate-pulse">Loading schedule...</p>
              </div>
            ) : todayClasses.length > 0 ? (
              todayClasses.map((tc, index) => {
                const liveNow = isWithinSchedule(tc.schedule_blocks);
                return (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${
                      liveNow 
                        ? "bg-gradient-to-r from-[#008C45]/5 to-transparent border-[#008C45] shadow-[0_4px_20px_rgba(0,140,69,0.06)]" 
                        : "bg-[#F5F3F0]/50 border-[#0A3A23]/5 hover:bg-[#F5F3F0] hover:border-[#0A3A23]/10"
                    }`}
                  >
                    <div className="flex items-center gap-5 min-w-[75%]">
                      <div className="min-w-[85px]">
                        <span className={`text-xs font-black tracking-tight px-2.5 py-1 rounded-lg ${
                          liveNow ? "bg-[#008C45] text-white" : "bg-[#0A3A23]/5 text-[#0A3A23]"
                        }`}>
                          {tc.subject_code}
                        </span>
                      </div>
                      <div className="truncate pr-3">
                        <p className="text-xs font-black text-[#0A3A23] truncate uppercase tracking-wide">
                          {tc.subject_title}
                        </p>
                        <p className="text-[11px] font-medium text-[#0A3A23]/50 mt-1">
                          Section: <strong className="text-[#0A3A23] font-black">{tc.section}</strong>
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className={`text-[9px] font-black tracking-widest px-3 py-1.5 rounded-xl uppercase transition-all ${
                        liveNow 
                          ? "bg-[#008C45] text-white shadow-sm shadow-[#008C45]/20 animate-pulse" 
                          : "bg-[#0A3A23]/5 text-[#0A3A23]/40 border border-[#0A3A23]/5"
                      }`}>
                        {liveNow ? "Ongoing" : "Pending"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              /* PREMIUM MODERN EMPTY STATE WITH LUCIDE ICON */
              <div className="flex flex-col items-center justify-center py-4 text-center animate-fade-in">
                <div className="p-4 rounded-full bg-[#F5F3F0] text-[#0A3A23]/40 border border-[#0A3A23]/5 mb-3">
                  <CalendarX size={26} strokeWidth={1.8} className="text-[#0A3A23]/40" />
                </div>
                <p className="text-xs font-black text-[#0A3A23]/70 uppercase tracking-wide">
                  No classes scheduled for today
                </p>
                <p className="text-[11px] text-[#0A3A23]/40 font-medium mt-1 max-w-[280px] leading-relaxed">
                  Your agenda is clear. Enjoy your free time or prepare for your upcoming sessions.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. DYNAMIC DATA VIEW LAYER */}
      <div>
        {loading ? (
          <div className="text-center py-12 text-sm font-bold text-[#0A3A23]/40 uppercase tracking-widest animate-pulse">
            Loading classes...
          </div>
        ) : classes.length > 0 ? (
          viewMode === "table" ? (
            <SubjectsTableView 
              classes={classes} 
              isWithinSchedule={isWithinSchedule} 
              handleActivate={handleActivate} 
              handleStop={handleStop} 
              loadingId={loadingId} 
            />
          ) : (
            <SubjectsCardView 
              classes={classes} 
              isWithinSchedule={isWithinSchedule} 
              handleActivate={handleActivate} 
              handleStop={handleStop} 
              loadingId={loadingId} 
            />
          )
        ) : (
          <div className="bg-[#F5F3F0] p-12 text-center rounded-[28px] border border-[#0A3A23]/5 text-xs font-bold text-[#0A3A23]/40 uppercase tracking-wider">
            No classes found.
          </div>
        )}
      </div>
    </div>
  );
};

export default Subjects;