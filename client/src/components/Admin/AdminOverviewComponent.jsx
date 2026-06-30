import { useEffect, useState } from "react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import {
  Users, GraduationCap, Layers, ClipboardCheck, TrendingUp,
  PieChart as PieIcon, Award, AlertTriangle, Activity, Map, CalendarDays,
  ArrowUpRight
} from "lucide-react";
import { adminOverviewService } from "../../services/admin-api";

/* ---------- Shared premium primitives ---------- */

const BRAND = {
  deep: "#0A3A23",
  green: "#008C45",
  gold: "#FDCC0D",
  red: "#950606",
  cream: "#F5F3F0",
};

// Premium tooltip
const PremiumTooltip = ({ active, payload, label, suffix = "", labelKey }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_-12px_rgba(10,58,35,0.25)] px-3 py-2">
      {label && (
        <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-400 mb-1">
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color || p.payload?.color || BRAND.green }} />
          <span className="font-bold text-[#0A3A23]">
            {p.value}{suffix}
          </span>
          <span className="text-gray-400 font-medium">{labelKey || p.name}</span>
        </div>
      ))}
    </div>
  );
};

// Stat card shell — premium
function StatCard({ label, value, icon: Icon, onClick, accent = false, children }) {
  return (
    <div
      onClick={onClick}
      className={[
        "relative overflow-hidden p-6 rounded-2xl border transition-all flex flex-col justify-between group",
        "bg-gradient-to-br from-white via-white to-[#F5F3F0]/40",
        "border-gray-100 shadow-[0_1px_2px_rgba(10,58,35,0.04),0_8px_24px_-12px_rgba(10,58,35,0.08)]",
        onClick ? "cursor-pointer hover:-translate-y-0.5 hover:border-[#008C45]/40 hover:shadow-[0_12px_32px_-16px_rgba(0,140,69,0.35)]" : "",
      ].join(" ")}
    >
      {/* Decorative corner glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full bg-[#008C45]/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
      {accent && (
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#008C45]/40 to-transparent" />
      )}

      <div className="flex justify-between items-center w-full relative z-10">
        <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-[0.18em]">{label}</p>
        <div className="p-2 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 text-gray-400 group-hover:text-[#008C45] group-hover:border-[#008C45]/30 transition-all">
          <Icon size={15} />
        </div>
      </div>

      {children ?? (
        <div className="mt-5 flex items-end justify-between relative z-10">
          <p className="text-[2.5rem] leading-none font-black text-[#0A3A23] tracking-tight tabular-nums">
            {value}
          </p>
          {onClick && (
            <ArrowUpRight size={16} className="text-gray-300 group-hover:text-[#008C45] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          )}
        </div>
      )}
    </div>
  );
}

// Chart card shell
function ChartCard({ icon: Icon, title, children, className = "", accent = BRAND.deep }) {
  return (
    <div className={`relative bg-gradient-to-br from-white to-[#F5F3F0]/30 p-6 rounded-2xl border border-gray-100 shadow-[0_1px_2px_rgba(10,58,35,0.04),0_8px_24px_-12px_rgba(10,58,35,0.08)] flex flex-col ${className}`}>
      <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg" style={{ background: `${accent}10`, color: accent }}>
            <Icon size={14} />
          </span>
          <h3 className="text-[11px] font-extrabold text-[#0A3A23] uppercase tracking-[0.14em]">{title}</h3>
        </div>
        <span className="h-1.5 w-1.5 rounded-full bg-[#008C45] shadow-[0_0_0_3px_rgba(0,140,69,0.15)]" />
      </div>
      {children}
    </div>
  );
}

/* ---------- Main component ---------- */

export default function AdminOverviewComponent({ setActiveTab }) {
  const [program, setProgram] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    total_students: 0, total_instructors: 0, total_classes: 0,
    total_attendance_records: 0, attendance_rate: "0.0%",
  });

  const [programAttendance, setProgramAttendance] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [rawSessions, setRawSessions] = useState(0);
  const [topStudents, setTopStudents] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const [monthlyComparison, setMonthlyComparison] = useState([]);
  const [instructorActivity, setInstructorActivity] = useState([]);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No token found");
      const payload = JSON.parse(atob(token.split(".")[1]));
      const adminProgram = payload?.sub?.program || payload?.program;
      if (!adminProgram) throw new Error("Program not found in token");
      setProgram(adminProgram);
    } catch (e) {
      console.error("Token parsing error:", e);
      setErr("Session invalid. Please re-login.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!program) return;
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, progAttendanceRes, distRes, topStudRes, heatmapRes, riskRes, monthRes, instRes] =
          await Promise.allSettled([
            adminOverviewService.getOverviewStats(program),
            adminOverviewService.getProgramAttendance(),
            adminOverviewService.getAttendanceDistribution(program),
            adminOverviewService.getTopStudents(program),
            adminOverviewService.getAttendanceHeatmap(program),
            adminOverviewService.getAtRiskStudents(program),
            adminOverviewService.getMonthlyComparison(program),
            adminOverviewService.getInstructorActivity(program),
          ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        if (progAttendanceRes.status === "fulfilled" && progAttendanceRes.value.data) {
          setProgramAttendance(
            Object.keys(progAttendanceRes.value.data).map(key => ({
              name: key, rate: progAttendanceRes.value.data[key].attendance_rate,
            }))
          );
        }
        if (distRes.status === "fulfilled") {
          const rawDist = distRes.value;
          setRawSessions(rawDist.sessions || 0);
          setDistribution([
            { name: "Present", value: rawDist.present || 0, color: BRAND.green },
            { name: "Late", value: rawDist.late || 0, color: BRAND.gold },
            { name: "Absent", value: rawDist.absent || 0, color: BRAND.red },
          ]);
        }
        if (topStudRes.status === "fulfilled") setTopStudents(topStudRes.value);
        if (heatmapRes.status === "fulfilled") {
          const dayAggregates = {};
          heatmapRes.value.forEach(item => {
            const shortDay = item.day.substring(0, 3);
            dayAggregates[shortDay] = (dayAggregates[shortDay] || 0) + item.count;
          });
          setRadarData(
            Object.keys(dayAggregates).map(day => ({
              subject: day, A: dayAggregates[day], fullMark: 150,
            }))
          );
        }
        if (riskRes.status === "fulfilled") setAtRiskStudents(riskRes.value);
        if (monthRes.status === "fulfilled") setMonthlyComparison(monthRes.value);
        if (instRes.status === "fulfilled") setInstructorActivity(instRes.value);
      } catch (e) {
        console.error("Dashboard engine compile error:", e);
        setErr("Failed to compile institutional dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [program]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
        <p className="text-[#0A3A23] text-sm font-bold tracking-wide">Syncing institution metrics pipeline...</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="text-center py-12 border-2 border-[#950606]/10 p-6 max-w-md mx-auto rounded-2xl bg-[#950606]/5">
        <p className="text-[#950606] font-black">{err}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 px-4">
      {/* HEADER — unchanged */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-200/60 pb-6">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight flex items-center gap-3">
            {program ? `${program} Admin Dashboard Overview` : "Academic Overview"}
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Real-time institutional class analytics pipeline
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* ROW 1 */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard label="Total Students" value={stats.total_students} icon={Users} onClick={() => setActiveTab("students")} />
          <StatCard label="Total Classes" value={stats.total_classes} icon={Layers} onClick={() => setActiveTab("classes")} />

          {/* Premium attendance rate card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0A3A23] via-[#0A3A23] to-[#008C45] p-6 rounded-2xl border border-[#0A3A23] shadow-[0_12px_32px_-12px_rgba(10,58,35,0.45)] flex flex-col justify-between text-white">
            <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-[#008C45]/30 blur-3xl" />
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex justify-between items-center w-full relative z-10">
              <p className="text-[10px] text-white/60 font-extrabold uppercase tracking-[0.18em]">Attendance Rate</p>
              <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm text-white border border-white/15">
                <ClipboardCheck size={15} />
              </div>
            </div>
            <div className="my-3 relative z-10">
              <p className="text-5xl font-black tracking-tighter tabular-nums">{stats.attendance_rate}</p>
              <p className="text-[10px] text-white/60 font-bold mt-1 uppercase tracking-[0.14em]">Weighted Performance Metric</p>
            </div>
            <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden relative z-10">
              <div className="bg-gradient-to-r from-white to-[#FDCC0D] h-full rounded-full shadow-[0_0_12px_rgba(253,204,13,0.6)] transition-all duration-700" style={{ width: stats.attendance_rate }} />
            </div>
          </div>
        </div>

        {/* ROW 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <StatCard label="Total Instructors" value={stats.total_instructors} icon={GraduationCap} onClick={() => setActiveTab("instructors")} />
            <StatCard label="Total Logs Compiled" value={stats.total_attendance_records} icon={Activity} />

            <ChartCard icon={TrendingUp} title="Program Attendance" className="sm:col-span-2 min-h-[300px]">
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#008C45" />
                        <stop offset="100%" stopColor="#0A3A23" />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: 'rgba(245,243,240,0.4)' }} content={<PremiumTooltip suffix="%" labelKey="Attendance" />} />
                    <Bar dataKey="rate" fill="url(#barGreen)" radius={[10, 10, 0, 0]} barSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </div>

          {/* Donut */}
          <ChartCard icon={PieIcon} title="Attendance Distribution" className="items-center">
            <div className="w-full h-48 relative flex items-center justify-center my-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {distribution.map((entry, i) => (
                      <radialGradient id={`grad-${i}`} key={i}>
                        <stop offset="0%" stopColor={entry.color} stopOpacity={1} />
                        <stop offset="100%" stopColor={entry.color} stopOpacity={0.75} />
                      </radialGradient>
                    ))}
                  </defs>
                  <Pie data={distribution} cx="50%" cy="50%" innerRadius={64} outerRadius={84} paddingAngle={6} cornerRadius={8} dataKey="value" stroke="none">
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<PremiumTooltip labelKey="Logs" />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-[0.18em] block leading-none">Total Sessions</span>
                <span className="text-3xl font-black text-[#0A3A23] mt-1.5 leading-none tabular-nums">{rawSessions}</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-1 mt-3 bg-gradient-to-br from-gray-50 to-white p-2.5 rounded-xl border border-gray-100">
              {distribution.map(item => (
                <div key={item.name} className="flex flex-col items-center justify-center text-center">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: item.color, color: item.color }} />
                    <span className="text-gray-400 font-semibold text-[10px] uppercase tracking-wider">{item.name}</span>
                  </div>
                  <span className="text-sm font-black mt-0.5 tabular-nums" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* ROW 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard icon={Award} title="Top 10 Performing Students" className="md:col-span-2 min-h-[380px]">
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStudents} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="topBar" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0A3A23" />
                      <stop offset="100%" stopColor="#008C45" />
                    </linearGradient>
                  </defs>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<PremiumTooltip labelKey="Sessions" />} cursor={{ fill: 'rgba(245,243,240,0.5)' }} />
                  <Bar dataKey="present_count" fill="url(#topBar)" radius={[10, 10, 10, 10]} barSize={12} background={{ fill: '#F5F3F0', radius: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="space-y-6 flex flex-col justify-between h-full">
            {/* Risk */}
            <div className="relative bg-gradient-to-br from-white to-[#950606]/5 p-5 rounded-2xl border border-gray-100 shadow-[0_8px_24px_-12px_rgba(149,6,6,0.15)] flex-1 flex flex-col">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-3">
                <span className="p-1.5 rounded-lg bg-[#950606]/10 text-[#950606]">
                  <AlertTriangle size={13} />
                </span>
                <h3 className="text-[11px] font-extrabold text-[#950606] uppercase tracking-[0.14em]">Risk Students (&lt;75%)</h3>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 flex-1">
                {atRiskStudents.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No students flagged below threshold metrics.</p>
                ) : (
                  atRiskStudents.slice(0, 4).map((stud) => (
                    <div key={stud.student_id} className="flex justify-between items-center text-xs py-2 px-2 rounded-lg hover:bg-[#950606]/5 transition-colors">
                      <span className="text-[#0A3A23] font-bold truncate max-w-[150px]">{stud.name}</span>
                      <span className="text-[#950606] font-black bg-[#950606]/10 border border-[#950606]/15 px-2 py-0.5 rounded-md text-[10px] tabular-nums">{stud.attendance_rate}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Instructors */}
            <div className="relative bg-gradient-to-br from-white to-[#008C45]/5 p-5 rounded-2xl border border-gray-100 shadow-[0_8px_24px_-12px_rgba(0,140,69,0.15)] flex-1 flex flex-col">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-2.5 mb-3">
                <span className="p-1.5 rounded-lg bg-[#008C45]/10 text-[#008C45]">
                  <Activity size={13} />
                </span>
                <h3 className="text-[11px] font-extrabold text-[#0A3A23] uppercase tracking-[0.14em]">Instructors Activities</h3>
              </div>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1 flex-1">
                {instructorActivity.slice(0, 4).map((inst) => (
                  <div key={inst.instructor_id} className="flex justify-between items-center text-xs py-2 px-2 rounded-lg hover:bg-[#008C45]/5 transition-colors">
                    <span className="text-[#0A3A23] font-bold truncate max-w-[150px]">{inst.instructor_name}</span>
                    <span className="text-[#008C45] font-black bg-[#008C45]/10 border border-[#008C45]/15 px-2 py-0.5 rounded-md text-[10px] tabular-nums">{inst.sessions} logs</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ROW 4 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <ChartCard icon={Map} title="Attendance Radar View" className="min-h-[280px]">
            <div className="w-full h-52 mt-auto flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <defs>
                    <radialGradient id="radarFill">
                      <stop offset="0%" stopColor="#008C45" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#0A3A23" stopOpacity={0.1} />
                    </radialGradient>
                  </defs>
                  <PolarGrid stroke="#E5E7EB" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#0A3A23', fontSize: 10, fontWeight: 700 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#9CA3AF', fontSize: 8 }} axisLine={false} />
                  <Radar name="Logs Cluster" dataKey="A" stroke="#008C45" strokeWidth={2} fill="url(#radarFill)" />
                  <Tooltip content={<PremiumTooltip labelKey="Logs" />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard icon={CalendarDays} title="Monthly Comparison" className="md:col-span-2">
            <div className="w-full h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyComparison} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAttendancePremium" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#008C45" stopOpacity={0.4} />
                      <stop offset="50%" stopColor="#008C45" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#008C45" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<PremiumTooltip labelKey="Logs" />} cursor={{ stroke: '#008C45', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="attendance" stroke="#008C45" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttendancePremium)" dot={{ r: 4, fill: '#fff', stroke: '#008C45', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#008C45', stroke: '#fff', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
