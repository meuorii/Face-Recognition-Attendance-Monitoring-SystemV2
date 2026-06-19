import { BookOpen, Users, Activity, CheckCircle, Clock, ArrowUpRight } from "lucide-react";

const InstructorStatCards = ({ overviewData = {}, setActiveTab }) => {
  const statToTab = {
    totalClasses: "subject",
    totalStudents: "assigned",
    activeSessions: "attendance",
    present: "attendance",
    late: "attendance",
  };

  const statCards = [
    { key: "totalClasses", icon: BookOpen, label: "Total Classes", value: overviewData.totalClasses ?? 0 },
    { key: "totalStudents", icon: Users, label: "Total Students", value: overviewData.totalStudents ?? 0 },
    { key: "activeSessions", icon: Activity, label: "Active Sessions", value: overviewData.activeSessions ?? 0 },
    { key: "present", icon: CheckCircle, label: "Present Today", value: overviewData.present ?? 0 },
    { key: "late", icon: Clock, label: "Late Records", value: overviewData.late ?? 0 },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            onClick={() => {
              const tab = statToTab[stat.key];
              if (tab) setActiveTab(tab);
            }}
            className="group cursor-pointer bg-white p-8 rounded-[24px] border border-[#0A3A23]/5
              transition-all duration-500 ease-out relative overflow-hidden flex flex-col justify-between min-h-[210px]
              shadow-[0_12px_40px_rgba(10,58,35,0.08)] hover:shadow-[0_24px_50px_rgba(0,140,69,0.18)] 
              hover:-translate-y-2 active:scale-[0.98]"
          >
            {/* Subtle Inner Decorative Brand Accent Line */}
            <div className="absolute top-0 left-0 right-0 h-[4px] bg-[#008C45] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Top Toolbar Row */}
            <div className="flex justify-between items-center relative z-10">
              {/* Premium Icon Container utilizing #0A3A23 and #008C45 gradient bg, and white icon text */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#008C45] to-[#0A3A23] text-white shadow-[0_6px_20px_rgba(10,58,35,0.2)] group-hover:scale-110 transition-transform duration-500">
                <Icon size={22} strokeWidth={2.2} />
              </div>
              
              <div className="p-2 rounded-xl bg-slate-50 border border-transparent group-hover:border-[#008C45]/20 group-hover:bg-white transition-all duration-300">
                <ArrowUpRight size={16} className="text-[#0A3A23]/40 group-hover:text-[#008C45] transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </div>

            {/* Bottom Metrics Information Block with premium spacing */}
            <div className="relative z-10 mt-8 space-y-1.5">
              <span className="block text-[#0A3A23]/50 text-[10px] font-black uppercase tracking-[0.15em] group-hover:text-[#008C45] transition-colors duration-300">
                {stat.label}
              </span>
              
              <h3 className="text-4xl font-black text-[#0A3A23] tracking-tighter sm:text-4xl lg:text-3xl xl:text-4xl">
                {stat.value}
              </h3>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default InstructorStatCards;