// src/components/Admin/Sidebar.jsx
import { 
  LayoutDashboard, 
  UserCheck, 
  GraduationCap, 
  Layers, 
  BookMarked, 
  Activity, 
  LogOut,
  X 
} from "lucide-react";

// Tinatanggap na rito ang handleLogout bilang isang prop mula sa parent component
const Sidebar = ({ activeTab, setActiveTab, onClose, handleLogout }) => {

  const tabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "students", label: "Student Management", icon: GraduationCap },
    { id: "instructors", label: "Instructor Management", icon: UserCheck },
    { id: "classes", label: "Class Management", icon: Layers },
    { id: "subjects", label: "Subjects Management", icon: BookMarked },
    { id: "attendance", label: "Attendance Monitoring", icon: Activity },
  ];

  return (
    <>
      {/* DESKTOP SIDEBAR (Slim Icon Bar) */}
      <aside className="hidden md:flex flex-col items-center w-20 min-h-screen py-8 text-white fixed left-0 top-0 z-30
        bg-[#0A3A23] border-r border-[#008C45]/20 shadow-2xl transition-all duration-300">
        
        {/* Academic Branding Circle */}
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner mb-10 group cursor-pointer hover:bg-white/20 transition-all duration-300">
          <img 
            src="/ccit-logo.png" 
            alt="CCIT Logo" 
            className="w-8 h-8 object-cover rounded-md opacity-90 group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Navigation Items Map Container */}
        <nav className="flex flex-col items-center space-y-5 flex-1 w-full px-3">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <div key={tab.id} className="relative group w-full flex justify-center">
                <button
                  onClick={() => {
                    setActiveTab(tab.id);
                    onClose?.();
                  }}
                  className={`p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center relative
                    ${
                      isActive
                        ? "bg-[#008C45] text-white shadow-lg shadow-[#008C45]/40 scale-110"
                        : "text-neutral-300 hover:bg-white/10 hover:text-white"
                    }`}
                  aria-label={tab.label}
                >
                  <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
                  
                  {/* Active Anchor Dot */}
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full bg-white animate-pulse" />
                  )}
                </button>

                {/* Floating Micro Tooltip */}
                <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-neutral-950 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shadow-xl whitespace-nowrap z-40 border border-neutral-800">
                  {tab.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Desktop Logout Hook Trigger (No Red Palette) */}
        <div className="relative group w-full flex justify-center px-3">
          <button
            onClick={handleLogout}
            className="p-3.5 rounded-xl text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            aria-label="Logout"
          >
            <LogOut size={22} />
          </button>
          <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-neutral-950 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shadow-xl whitespace-nowrap z-40 border border-neutral-800">
            Logout
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR DRAWNING DRAWER */}
      <div className="relative z-10 flex flex-col h-full justify-between md:hidden">
        <div>
          {/* Header block with close icon */}
          <div className="p-5 border-b border-white/10 flex justify-between items-center bg-[#0A3A23]">
            <div className="flex items-center gap-3">
              <img src="/ccit-logo.png" alt="CCIT" className="w-7 h-7" />
              <span className="font-bold tracking-wide text-sm text-white">Admin System</span>
            </div>
            {onClose && (
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-neutral-300">
                <X size={20} />
              </button>
            )}
          </div>

          {/* Nav Container Links */}
          <nav className="p-4 space-y-2 bg-[#0A3A23]">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    onClose?.();
                  }}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-medium transition-all duration-200
                    ${
                      isActive
                        ? "bg-[#008C45] text-white shadow-lg shadow-[#008C45]/20"
                        : "hover:bg-white/5 text-neutral-300 hover:text-white"
                    }`}
                >
                  <IconComponent size={18} />
                  <span className="text-sm">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Mobile Logout Block Section (No Red Palette) */}
        <div className="p-4 border-t border-white/10 bg-[#0A3A23]">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 text-neutral-300 hover:bg-white/5 rounded-xl font-medium transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;