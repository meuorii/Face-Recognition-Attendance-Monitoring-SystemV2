// src/components/Instructor/Overview/InstructorStatCards.jsx
import { BookOpen, Users, Layers, Activity } from "lucide-react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const InstructorStatCards = ({ overviewData = {} }) => {
  const statCards = [
    { icon: BookOpen, label: "Assigned Subjects", value: overviewData.assignedSubjectsCount ?? 0 },
    { icon: Activity, label: "Global Yield Rate", value: `${overviewData.globalYieldRate ?? 0}%` },
    { icon: Users, label: "Total Enrolled Students", value: overviewData.totalEnrolledStudents ?? 0 },
    { icon: Layers, label: "Total Handled Sections", value: overviewData.totalHandledSections ?? 0 },
  ];

  // Setup data para sa Donut Pie
  const breakdown = overviewData.donutBreakdown || {};
  const pieData = [
    { name: "Present", value: breakdown.present || 0, color: "#008C45" },
    { name: "Late", value: breakdown.late || 0, color: "#FDCC0D" },
    { name: "Absent", value: breakdown.absent || 0, color: "#950606" },
  ].filter(item => item.value > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
      
      {/* KALIWANG BAHAGI: 2x2 Grid para sa Unang 4 na Tiles */}
      <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-[24px] border border-[#0A3A23]/5 flex flex-col justify-between min-h-[140px]
                shadow-[0_12px_40px_rgba(10,58,35,0.04)] relative overflow-hidden group hover:shadow-[0_16px_45px_rgba(0,140,69,0.08)] transition-all duration-300"
            >
              <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#008C45] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="flex justify-between items-center">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white shadow-md">
                  <Icon size={20} strokeWidth={2.2} />
                </div>
                {stat.label === "Global Yield Rate" && (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl ${overviewData.isLiveScannerActive ? 'bg-[#008C45] text-white animate-pulse' : 'bg-[#0A3A23]/5 text-[#0A3A23]/50'}`}>
                    {overviewData.isLiveScannerActive ? "Live" : "Idle"}
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-0.5">
                <span className="block text-[#0A3A23]/50 text-[10px] font-black uppercase tracking-wider">
                  {stat.label}
                </span>
                <h3 className="text-3xl font-black text-[#0A3A23] tracking-tighter">
                  {stat.value}
                </h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* KANANG BAHAGI: Tile 5 - Malaking Kuwadrado para sa Donut Breakdown */}
      <div className="bg-white p-6 rounded-[24px] border border-[#0A3A23]/5 shadow-[0_12px_40px_rgba(10,58,35,0.04)] flex flex-col justify-between min-h-[300px]">
        <div>
          <h4 className="font-black text-xs text-[#0A3A23] uppercase tracking-wider">Donut Breakdown</h4>
          <p className="text-[11px] text-[#0A3A23]/50 font-medium">Overall chart matrix distribution</p>
        </div>

        {/* Donut Visualization Ring Container */}
        <div className="w-full h-[150px] relative flex items-center justify-center my-2">
          {pieData.length === 0 ? (
            <span className="text-xs font-bold text-[#0A3A23]/30 uppercase tracking-wider">No records logged</span>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={65} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#0A3A23", borderRadius: "12px", color: "#fff", border: "none" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
          {overviewData.globalYieldRate > 0 && (
            <div className="absolute text-center">
              <span className="text-xl font-black text-[#0A3A23] tracking-tighter">{overviewData.globalYieldRate}%</span>
              <p className="text-[8px] font-black uppercase text-[#008C45] tracking-widest">Yield</p>
            </div>
          )}
        </div>

        {/* Micro-legends Bottom Section */}
        <div className="flex justify-center items-center gap-4 text-[9px] font-black tracking-wider text-[#0A3A23] border-t border-[#0A3A23]/5 pt-3">
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#008C45]" /><span>PRES ({breakdown.present || 0})</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#FDCC0D]" /><span>LATE ({breakdown.late || 0})</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#950606]" /><span>ABS ({breakdown.absent || 0})</span></div>
        </div>
      </div>

    </div>
  );
};

export default InstructorStatCards;