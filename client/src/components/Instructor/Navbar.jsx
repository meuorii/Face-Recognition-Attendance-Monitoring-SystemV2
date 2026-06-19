// src/components/Instructor/Navbar.jsx
import { Menu } from "lucide-react";

const Navbar = ({ instructor, onToggleSidebar }) => {
  const displayName = instructor?.first_name || "Instructor";
  
  // Kukuha ng unang titik ng pangalan para sa avatar icon (halimbawa: "J" para sa "John")
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header
      className="w-full px-6 py-3.5 bg-white/80 backdrop-blur-md relative border-b border-neutral-200/60 
        flex items-center justify-between shadow-sm z-10 balance-content"
    >
      {/* Visual Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0A3A23] to-[#008C45]" />

      {/* Left Side: Greeting Header */}
      <div className="flex flex-col justify-center">
        <h1 className="text-base md:text-lg font-bold text-[#0A3A23] tracking-tight leading-none">
          Welcome back, <span className="text-[#008C45]">{displayName}</span>
        </h1>
        <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1.5 leading-none">
          Academic Portal Management
        </p>
      </div>

      {/* Right Side: Navigation Triggers & Avatar Profile */}
      <div className="flex items-center gap-4">
        
        {/* Premium First Name Letter Avatar Circle */}
        <div className="relative group cursor-pointer hidden sm:block">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A3A23] to-[#008C45] flex items-center justify-center shadow-md shadow-[#0A3A23]/10 border border-white transition-transform duration-200 group-hover:scale-105">
            <span className="text-sm font-bold text-[#F5F3F0] tracking-wide">
              {avatarLetter}
            </span>
          </div>
          {/* Subtle Online Status Dot Indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
        </div>

        {/* Mobile Sidebar Toggle Hamburger Trigger */}
        <button
          onClick={onToggleSidebar}
          className="md:hidden text-[#0A3A23] focus:outline-none 
            p-2.5 rounded-xl bg-[#F5F3F0] hover:bg-neutral-200/50 active:scale-95 transition-all duration-200 flex items-center justify-center"
          aria-label="Open Navigation Menu"
        >
          <Menu size={20} strokeWidth={2.5} />
        </button>
        
      </div>
    </header>
  );
};

export default Navbar;