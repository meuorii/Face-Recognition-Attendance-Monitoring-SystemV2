import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area,
  ScatterChart,
  Scatter,
  ZAxis
} from "recharts";
import { adminOverviewService } from "../../services/admin-api";

export default function AdminOverviewComponent({ setActiveTab }) {
  const [program, setProgram] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [stats, setStats] = useState({
    total_students: 0,
    total_instructors: 0,
    total_classes: 0,
    total_attendance_records: 0,
    attendance_rate: "0.0%",
  });

  const [programAttendance, setProgramAttendance] = useState([]);
  const [distribution, setDistribution] = useState([]);
  const [topStudents, setTopStudents] = useState([]);
  const [heatmap, setHeatmap] = useState([]);
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
        const [
          statsRes,
          progAttendanceRes,
          distRes,
          topStudRes,
          heatmapRes,
          riskRes,
          monthRes,
          instRes
        ] = await Promise.allSettled([
          adminOverviewService.getOverviewStats(program),
          adminOverviewService.getProgramAttendance(),
          adminOverviewService.getAttendanceDistribution(program),
          adminOverviewService.getTopStudents(program),
          adminOverviewService.getAttendanceHeatmap(program),
          adminOverviewService.getAtRiskStudents(program),
          adminOverviewService.getMonthlyComparison(program),
          adminOverviewService.getInstructorActivity(program)
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value);
        
        if (progAttendanceRes.status === "fulfilled" && progAttendanceRes.value.data) {
          const formattedProg = Object.keys(progAttendanceRes.value.data).map(key => ({
            name: key,
            rate: progAttendanceRes.value.data[key].attendance_rate
          }));
          setProgramAttendance(formattedProg);
        }
        
        if (distRes.status === "fulfilled") {
          const rawDist = distRes.value;
          setDistribution([
            { name: "Present", value: rawDist.present || 0, color: "#008C45" },
            { name: "Late", value: rawDist.late || 0, color: "#FDCC0D" },
            { name: "Absent", value: rawDist.absent || 0, color: "#950606" }
          ]);
        }
        
        if (topStudRes.status === "fulfilled") setTopStudents(topStudRes.value);
        
        if (heatmapRes.status === "fulfilled") {
          const dayMap = { Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6, Sunday: 7 };
          const formattedHeatmap = heatmapRes.value.map(item => ({
            day: item.day.substring(0, 3),
            hour: parseInt(item.hour.split(":")[0]),
            count: item.count
          }));
          setHeatmap(formattedHeatmap);
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
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
          {program ? `${program} Admin Dashboard Overview` : "Academic Overview"}
        </h2>
        <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
          Real-time institutional class analytics
        </p>
      </div>

      {/* FIGMA EXACT COMPONENT LAYOUT MATRIX */}
      <div className="space-y-6">

        {/* ROW 1: Three equal top-level stat cards (Total Students, Total Classes, Attendance Rate) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            onClick={() => setActiveTab("students")}
            className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm cursor-pointer hover:border-[#008C45]/30 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Students</p>
            <p className="text-4xl font-black text-[#0A3A23] mt-4">{stats.total_students}</p>
          </div>

          <div
            onClick={() => setActiveTab("classes")}
            className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm cursor-pointer hover:border-[#008C45]/30 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Classes</p>
            <p className="text-4xl font-black text-[#0A3A23] mt-4">{stats.total_classes}</p>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-between items-center text-center">
            <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider w-full text-left">Attendance Rate</p>
            <div className="my-auto">
              <p className="text-6xl font-black text-[#0A3A23] tracking-tighter">{stats.attendance_rate}</p>
              <p className="text-xs text-[#008C45] font-bold mt-2 uppercase tracking-wide">Historical Weighted Average</p>
            </div>
            <div className="w-full bg-[#F5F3F0] h-1.5 rounded-full overflow-hidden">
              <div className="bg-[#008C45] h-full rounded-full" style={{ width: stats.attendance_rate }} />
            </div>
          </div>
        </div>

        {/* ROW 2: Left = Instructors/Records cards stacked above Program Attendance Bar | Right = tall Donut chart spanning full height */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div
              onClick={() => setActiveTab("instructors")}
              className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm cursor-pointer hover:border-[#008C45]/30 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Instructors</p>
              <p className="text-4xl font-black text-[#0A3A23] mt-4">{stats.total_instructors}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-between">
              <p className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Total Attendance Records</p>
              <p className="text-4xl font-black text-[#0A3A23] mt-4">{stats.total_attendance_records}</p>
            </div>

            <div className="sm:col-span-2 bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm min-h-[300px] flex flex-col justify-between">
              <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider mb-4">Program Attendance (Bar Chart)</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={programAttendance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#0A3A23', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: '#F5F3F0' }} formatter={(value) => [`${value}%`, 'Attendance Rate']} />
                    <Bar dataKey="rate" fill="#0A3A23" radius={[8, 8, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-between items-center h-full">
            <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider w-full text-left">Attendance Rate (Donut Chart)</h3>
            <div className="w-full h-48 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Logs']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Status</span>
                <span className="text-xl font-black text-[#0A3A23]">Logs Chart</span>
              </div>
            </div>
            <div className="w-full flex justify-around text-[11px] font-black uppercase mt-2">
              {distribution.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span style={{ color: item.color }}>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 3: Horizontal Bar Chart Matrix for Top 10 Students vs Risk & Instructor Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm min-h-[380px] flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider mb-4">Top 10 Students (Horizontal Chart)</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topStudents} layout="vertical" margin={{ top: 0, right: 20, left: 30, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} width={100} />
                <Tooltip formatter={(value) => [value, 'Sessions Attended']} />
                <Bar dataKey="present_count" fill="#008C45" radius={[0, 6, 6, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6 flex flex-col justify-between h-full">
          {/* Risk Students Mini-Grid Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-[#950606] uppercase tracking-wider mb-3">Risk Students (&lt;75%)</h3>
            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 flex-1">
              {atRiskStudents.length === 0 ? (
                <p className="text-xs text-gray-400 italic">No students flagged below threshold metrics.</p>
              ) : (
                atRiskStudents.slice(0, 4).map((stud) => (
                  <div key={stud.student_id} className="flex justify-between items-center text-xs border-b border-[#F5F3F0] pb-1.5">
                    <span className="text-[#0A3A23] font-bold truncate max-w-[150px]">{stud.name}</span>
                    <span className="text-[#950606] font-black bg-[#950606]/5 px-2 py-0.5 rounded-md">{stud.attendance_rate}%</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Instructor Operational Statistics Box */}
          <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex-1 flex flex-col justify-between">
            <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider mb-3">Instructors Activities</h3>
            <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1 flex-1">
              {instructorActivity.slice(0, 4).map((inst) => (
                <div key={inst.instructor_id} className="flex justify-between items-center text-xs border-b border-[#F5F3F0] pb-1.5">
                  <span className="text-[#0A3A23] font-bold truncate max-w-[150px]">{inst.instructor_name}</span>
                  <span className="text-[#008C45] font-black bg-[#008C45]/5 px-2 py-0.5 rounded-md">{inst.sessions} logs</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>

        {/* ROW 4: Scatter Heatmap System Metric & Annual Overview Area Chart Block */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-between min-h-[280px]">
          <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider mb-2">Attendance Heat Map Chart</h3>
          <div className="w-full h-48 mt-auto">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="hour" type="number" domain={[7, 18]} name="Hour" tickFormatter={(v) => `${v}:00`} tick={{ fontSize: 10 }} />
                <YAxis dataKey="day" type="category" name="Day" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <ZAxis dataKey="count" range={[20, 400]} name="Records" />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={heatmap} fill="#008C45" opacity={0.8} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-[#F5F3F0] shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-extrabold text-[#0A3A23] uppercase tracking-wider mb-4">Monthly Comparison (Area Chart)</h3>
          <div className="w-full h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyComparison} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#008C45" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#008C45" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fill: '#0A3A23', fontSize: 11, fontWeight: 'bold' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#0A3A23', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => [value, 'Total Logs']} />
                <Area type="monotone" dataKey="attendance" stroke="#008C45" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        </div>

      </div>
    </div>
  );
}