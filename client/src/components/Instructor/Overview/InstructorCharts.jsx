import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, PieChart as PieIcon } from "lucide-react";

const InstructorCharts = ({ overviewData = {}, trendData = [] }) => {
  // Pie content setup gamit ang iyong exact color adjustments
  const pieData = [
    { name: "Present", value: overviewData.present || 0, color: "#008C45" },
    { name: "Late", value: overviewData.late || 0, color: "#FDCC0D" },
    { name: "Absent", value: overviewData.absent || 0, color: "#950606" }, 
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* AREA CHART - Attendance Tracking */}
      <div className="lg:col-span-2 bg-[#F5F3F0] p-10 rounded-[28px] border border-[#0A3A23]/5
        shadow-[0_16px_45px_rgba(10,58,35,0.06)] flex flex-col justify-between min-h-[420px]">
        
        <div className="space-y-8">
          {/* Header Row */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#0A3A23] text-white shadow-md">
              <TrendingUp size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-black text-base text-[#0A3A23] uppercase tracking-tight">Attendance Trend</h4>
              <p className="text-xs text-[#0A3A23]/50 font-medium mt-0.5">Daily student tracking data</p>
            </div>
          </div>

          {/* Chart Core with expanded room */}
          <div className="w-full h-[260px] text-[11px] font-bold mt-6">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#0A3A23]/30">
                No active records found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#008C45" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#008C45" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FDCC0D" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#FDCC0D" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#0A3A23" opacity={0.05} vertical={false} />
                  <XAxis dataKey="date" stroke="#0A3A23" opacity={0.4} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#0A3A23" opacity={0.4} tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip 
                    contentStyle={{ 
                      background: "#0A3A23", 
                      borderRadius: "16px", 
                      color: "#fff", 
                      border: "none",
                      padding: "12px 16px",
                      boxShadow: "0 12px 30px rgba(10,58,35,0.2)"
                    }} 
                  />
                  <Area type="monotone" dataKey="present" stroke="#008C45" strokeWidth={3} fillOpacity={1} fill="url(#colorPresent)" name="Present" />
                  <Area type="monotone" dataKey="late" stroke="#FDCC0D" strokeWidth={3} fillOpacity={1} fill="url(#colorLate)" name="Late" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* PIE CHART - Rate Distribution */}
      <div className="bg-[#F5F3F0] p-10 rounded-[28px] border border-[#0A3A23]/5
        shadow-[0_16px_45px_rgba(10,58,35,0.06)] flex flex-col justify-between min-h-[420px]">
        
        {/* Header Row */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-[#0A3A23] text-white shadow-md">
            <PieIcon size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h4 className="font-black text-base text-[#0A3A23] uppercase tracking-tight">Total Shares</h4>
            <p className="text-xs text-[#0A3A23]/50 font-medium mt-0.5">Overall status ratio</p>
          </div>
        </div>

        {/* Center Ring Graphic */}
        <div className="w-full h-[200px] relative flex items-center justify-center my-6">
          {pieData.length === 0 ? (
            <span className="text-xs font-bold text-[#0A3A23]/30 uppercase tracking-wider">No records logged.</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={68} outerRadius={88} paddingAngle={6} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: "#0A3A23", 
                    borderRadius: "12px", 
                    color: "#fff", 
                    border: "none"
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          )}
          {overviewData.attendanceRate > 0 && (
            <div className="absolute text-center">
              <span className="text-3xl font-black text-[#0A3A23] tracking-tighter">{overviewData.attendanceRate}%</span>
              <p className="text-[10px] font-bold uppercase text-[#008C45] tracking-widest mt-0.5">Avg Rate</p>
            </div>
          )}
        </div>

        {/* Premium Clean Legend Indicators */}
        <div className="flex justify-center items-center gap-6 text-[11px] font-bold tracking-wider text-[#0A3A23] border-t border-[#0A3A23]/5 pt-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#008C45]" /> 
            <span className="opacity-70">PRESENT</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FDCC0D]" /> 
            <span className="opacity-70">LATE</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#950606]" /> 
            <span className="opacity-70">ABSENT</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default InstructorCharts;