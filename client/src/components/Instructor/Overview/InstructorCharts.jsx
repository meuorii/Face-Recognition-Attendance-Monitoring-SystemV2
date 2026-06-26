// src/components/Instructor/Overview/InstructorCharts.jsx
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const InstructorCharts = ({ mode, trendData = [], yearLevelData = [] }) => {
  
  // 1. MODE: TREND (Wide Area Rectangle Graph)
  if (mode === "trend") {
    return (
      <div className="bg-white p-6 rounded-[24px] border border-[#0A3A23]/5 shadow-[0_12px_40px_rgba(10,58,35,0.04)] min-h-[350px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#0A3A23] text-white shadow-md">
              <TrendingUp size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-black text-xs text-[#0A3A23] uppercase tracking-wider">Attendance Trend</h4>
              <p className="text-[11px] text-[#0A3A23]/50 font-medium">Daily student logging progression</p>
            </div>
          </div>
          
          <div className="w-full h-[230px] text-[11px] font-bold pt-2">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#0A3A23]/30 uppercase tracking-widest text-xs">No active deployment trend data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTrendPresent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#008C45" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#008C45" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#0A3A23" opacity={0.05} vertical={false} />
                  <XAxis dataKey="date" stroke="#0A3A23" opacity={0.4} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#0A3A23" opacity={0.4} tickLine={false} axisLine={false} dx={-5} />
                  <Tooltip contentStyle={{ background: "#0A3A23", borderRadius: "16px", color: "#fff", border: "none" }} />
                  <Area type="monotone" dataKey="present" stroke="#008C45" strokeWidth={3} fillOpacity={1} fill="url(#colorTrendPresent)" name="Present" />
                  <Area type="monotone" dataKey="late" stroke="#FDCC0D" strokeWidth={2} fill="none" name="Late" />
                  <Area type="monotone" dataKey="absent" stroke="#950606" strokeWidth={2} fill="none" name="Absent" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 2. MODE: BAR (4-Year Bar Chart Display Matrix)
  if (mode === "bar") {
    return (
      <div className="bg-white p-6 rounded-[24px] border border-[#0A3A23]/5 shadow-[0_12px_40px_rgba(10,58,35,0.04)] min-h-[350px] flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-[#0A3A23] text-white shadow-md">
              <BarChart3 size={18} strokeWidth={2.5} />
            </div>
            <div>
              <h4 className="font-black text-xs text-[#0A3A23] uppercase tracking-wider">Year Level Yield</h4>
              <p className="text-[11px] text-[#0A3A23]/50 font-medium">Yield distribution rate performance</p>
            </div>
          </div>

          <div className="w-full h-[230px] text-[10px] font-bold pt-2">
            {yearLevelData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[#0A3A23]/30 uppercase tracking-widest text-xs">No metrics data logged</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearLevelData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.05} vertical={false} stroke="#0A3A23" />
                  <XAxis dataKey="display_label" stroke="#0A3A23" opacity={0.5} tickLine={false} axisLine={false} />
                  <YAxis stroke="#0A3A23" opacity={0.5} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip cursor={{ fill: '#F5F3F0' }} contentStyle={{ background: "#0A3A23", borderRadius: "12px", color: "#fff", border: "none" }} />
                  <Bar dataKey="attendance_rate" fill="#008C45" radius={[6, 6, 0, 0]} name="Rate (%)">
                    {yearLevelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#008C45' : '#0A3A23'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InstructorCharts;