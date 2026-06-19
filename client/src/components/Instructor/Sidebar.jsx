// src/components/Instructor/Sidebar.jsx
import { useEffect } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  ClipboardCheck, 
  User, 
  LogOut,
  X
} from "lucide-react";
import AOS from "aos";
import "aos/dist/aos.css";

const Sidebar = ({ activeTab, setActiveTab, handleLogout, isOpen, setIsOpen }) => {
  useEffect(() => {
    AOS.init({ duration: 400, once: true });
  }, []);

  const tabs = [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "subject", label: "My Classes", icon: BookOpen },
    { key: "assigned", label: "Class List", icon: Users },
    { key: "attendance", label: "Attendance Report", icon: ClipboardCheck },
    { key: "profile", label: "Profile", icon: User },
  ];

  const handleTabClick = (tabKey) => {
    setActiveTab(tabKey);
    if (setIsOpen) setIsOpen(false);
  };

  return (
    <>
      {/* DESKTOP SIDEBAR (Slim Icon Bar) */}
      <aside 
        className="hidden md:flex flex-col items-center w-20 min-h-screen py-8 text-white fixed left-0 top-0 z-20
          bg-[#0A3A23] border-r border-[#008C45]/20 shadow-2xl transition-all duration-300"
      >
        {/* Branding Circle */}
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner mb-10 group cursor-pointer hover:bg-white/20 transition-all duration-300">
          <img 
            src="/ccit-logo.png" 
            alt="Logo" 
            className="w-8 h-8 object-cover rounded-md opacity-90 group-hover:scale-105 transition-transform"
          />
        </div>

        {/* Navigation Icons Container */}
        <nav className="flex flex-col items-center space-y-5 flex-1 w-full px-3">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <div key={tab.key} className="relative group w-full flex justify-center">
                <button
                  onClick={() => handleTabClick(tab.key)}
                  className={`p-3.5 rounded-xl transition-all duration-300 flex items-center justify-center relative
                    ${
                      isActive
                        ? "bg-[#008C45] text-white shadow-lg shadow-[#008C45]/40 scale-110"
                        : "text-neutral-300 hover:bg-white/10 hover:text-white"
                    }`}
                  aria-label={tab.label}
                >
                  <IconComponent size={22} strokeWidth={isActive ? 2.5 : 2} />
                  {/* Subtle Active Indicator Dot */}
                  {isActive && (
                    <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-2 rounded-r-full bg-white animate-pulse" />
                  )}
                </button>

                {/* Premium Floating Tooltip */}
                <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shadow-xl whitespace-nowrap z-30 border border-neutral-800">
                  {tab.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Logout Trigger (No Red Palette) */}
        <div className="relative group w-full flex justify-center px-3">
          <button
            onClick={handleLogout}
            className="p-3.5 rounded-xl text-neutral-300 hover:bg-white/10 hover:text-white transition-all duration-200"
            aria-label="Logout"
          >
            <LogOut size={22} />
          </button>
          <div className="absolute left-20 top-1/2 -translate-y-1/2 ml-2 px-3 py-1.5 bg-neutral-900 text-white text-xs font-medium rounded-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200 shadow-xl whitespace-nowrap z-30 border border-neutral-800">
            Logout
          </div>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-[#0A3A23]/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" 
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* MOBILE SIDEBAR (Drawer Mode) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-64 text-white z-50 transform transition-transform duration-300 ease-out
          bg-[#0A3A23] border-r border-[#008C45]/20 shadow-2xl ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/ccit-logo.png" alt="CCIT" className="w-7 h-7" />
            <span className="font-bold tracking-wide text-sm">Instructor Panel</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded-lg hover:bg-white/10 text-neutral-300"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabClick(tab.key)}
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

          {/* Mobile Logout (No Red Palette) */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 mt-6 text-neutral-300 hover:bg-white/5 rounded-xl font-medium transition-all duration-200"
          >
            <LogOut size={18} />
            <span className="text-sm">Logout</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;