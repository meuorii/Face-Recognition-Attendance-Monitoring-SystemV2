// src/pages/AdminDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut } from "lucide-react"; // Idinagdag ang LogOut icon
import AdminSidebar from "../components/Admin/Sidebar";
import AdminOverviewComponent from "../components/Admin/AdminOverviewComponent";
import StudentManagementComponent from "../components/Admin/StudentManagementComponent";
import InstructorAssignmentComponent from "../components/Admin/InstructorAssignmentComponent";
import ClassManagementComponent from "../components/Admin/ClassManagementComponent";
import SubjectManagementComponent from "../components/Admin/SubjectManagementComponent";
import AttendanceMonitoringComponent from "../components/Admin/AttendanceMonitoringComponent";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(null);
  const navigate = useNavigate();

  // State para sa Premium Logout Confirmation Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const storedData = JSON.parse(localStorage.getItem("userData"));

    if (!token || userType !== "admin" || !storedData) {
      navigate("/admin/login", { replace: true });
    } else {
      setAdmin(storedData);
    }
  }, [navigate]);

  // Pinag-isang Logout Action kapag kinompirma na ng admin
  const handleConfirmLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  const adminName = admin?.first_name || (admin?.full_name ? admin.full_name.split(" ")[0] : "Admin");
  const avatarLetter = adminName.charAt(0).toUpperCase();

  return (
    <div className="bg-[#F5F3F0] text-neutral-800 min-h-screen antialiased font-sans flex selection:bg-[#008C45]/20">
      
      {/* ==========================================
          SIDEBAR CONTROLS (Slim View On Desktop)
         ========================================== */}
      {/* Desktop Sidebar Structure - Ipinasa ang toggle modal trigger dito */}
      <div className="hidden md:block">
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          handleLogout={() => setShowLogoutModal(true)} 
        />
      </div>

      {/* Mobile Drawer Navigation Sidebar Panel Component overlay setup */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${
          sidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Soft Dim Backdrop Mask overlay layout filter clicker block */}
        <div
          className="absolute inset-0 bg-[#0A3A23]/40 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />

        {/* Inside Sliding Sidebar Panel Content card drawer config */}
        <div
          className={`absolute left-0 top-0 w-64 bg-[#0A3A23] h-full shadow-2xl border-r border-[#008C45]/20 
            transform transition-transform duration-300 ease-out flex flex-col ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AdminSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onClose={() => setSidebarOpen(false)}
            handleLogout={() => {
              setSidebarOpen(false); // Isara muna ang mobile drawer
              setShowLogoutModal(true); // Buksan ang modal
            }}
          />
        </div>
      </div>

      {/* ==========================================
          MAIN AREA CONTENT (Responsive pl-20 Offset)
         ========================================== */}
      <div className="flex-1 flex flex-col min-h-screen md:pl-20 transition-all duration-300">
        
        {/* Sticky Header Top Control Panel component navbar layout */}
        <header className="sticky top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-md border-b border-neutral-200/60 shadow-sm px-6 py-3.5 flex items-center justify-between">
          
          {/* Top Decorative Micro Indicator Border layout element overlay */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#0A3A23] to-[#008C45]" />

          {/* System Admin Identity Header Title info context layout text */}
          <div className="flex flex-col justify-center">
            <h1 className="text-base md:text-lg font-bold text-[#0A3A23] tracking-tight leading-none">
              Welcome back, <span className="text-[#008C45]">{adminName}</span>!
            </h1>
            <p className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase mt-1.5 leading-none">
              Admin Dashboard
            </p>
          </div>

          {/* Right Action Trigger: Avatar indicator icon & Mobile Hamburger trigger link combo */}
          <div className="flex items-center gap-4">
            
            {/* Branded Profile Avatar Initials badge circle widget layout */}
            <div className="relative group cursor-pointer hidden sm:block">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A3A23] to-[#008C45] flex items-center justify-center shadow-md shadow-[#0A3A23]/10 border border-white">
                <span className="text-sm font-bold text-[#F5F3F0] tracking-wide">
                  {avatarLetter}
                </span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
            </div>

            {/* Mobile Hamburger Trigger layout anchor element */}
            <button
              className="md:hidden text-[#0A3A23] focus:outline-none p-2.5 rounded-xl bg-[#F5F3F0] hover:bg-neutral-200/50 active:scale-95 transition-all duration-200"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={20} strokeWidth={2.5} />
            </button>
          </div>
        </header>

        {/* Content Render Framework Slot Section view workspace canvas wrapper */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
          {activeTab === "overview" && (
            <AdminOverviewComponent setActiveTab={setActiveTab} />
          )}
          {activeTab === "students" && <StudentManagementComponent />}
          {activeTab === "instructors" && <InstructorAssignmentComponent />}
          {activeTab === "classes" && <ClassManagementComponent />}
          {activeTab === "subjects" && <SubjectManagementComponent />}
          {activeTab === "attendance" && <AttendanceMonitoringComponent />}
        </main>
      </div>

      {/* =========================================================
          HIGH-END BRANDED LOGOUT CONFIRMATION MODAL OVERLAY 
         ========================================================= */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-10">
          
          {/* Animated Glassmorphic Backdrop overlay */}
          <div 
            className="absolute inset-0 animate-premium-blur cursor-pointer"
            onClick={() => setShowLogoutModal(false)} 
          />
          
          {/* Ultra-Premium Modal Card Container */}
          <div 
            className="bg-white w-full max-w-md rounded-3xl shadow-[0_25px_50px_-12px_rgba(10,58,35,0.15)] 
              border border-neutral-200/50 relative z-10 p-8 sm:p-10 space-y-8 
              animate-premium-bounce overflow-hidden"
          >
            {/* Ambient Background Glow Inside Card */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#008C45]/5 blur-3xl rounded-full pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#0A3A23]/5 blur-3xl rounded-full pointer-events-none" />

            {/* Content Display: Generous Spacing Block */}
            <div className="flex flex-col items-center text-center space-y-5 relative z-10">
              
              {/* Refined Geometric Icon Container */}
              <div className="w-16 h-16 rounded-2xl bg-[#F5F3F0] border border-[#0A3A23]/10 
                flex items-center justify-center text-[#0A3A23] shadow-inner tracking-wide
                transition-transform duration-500 hover:rotate-12">
                <LogOut size={26} className="ml-0.5 text-[#0A3A23]" />
              </div>
              
              {/* Typography Structure */}
              <div className="space-y-2">
                <h3 className="text-xl font-extrabold text-[#0A3A23] tracking-tight sm:text-2xl">
                  End Admin Session?
                </h3>
                <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed font-normal">
                  You are about to sign out of your CCIT root administrator account. Security tokens will be cleared upon exit.
                </p>
              </div>

            </div>

            {/* Action Buttons Interface with Enhanced Breathing Room */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 relative z-10">
              
              {/* Secondary Cancel Trigger */}
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="w-full sm:order-1 py-3 px-5 text-sm font-bold text-neutral-600 bg-[#F5F3F0] 
                  hover:bg-neutral-200/70 hover:text-neutral-800 rounded-2xl transition-all duration-200 
                  active:scale-[0.98] outline-none focus:ring-2 focus:ring-neutral-200"
              >
                Cancel
              </button>

              {/* Primary Signature Success Action Button */}
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="w-full sm:order-2 py-3 px-5 text-sm font-bold text-white 
                  bg-[#0A3A23] hover:bg-[#008C45] rounded-2xl shadow-lg 
                  shadow-[#0A3A23]/10 hover:shadow-[#008C45]/20 hover:-translate-y-0.5
                  transition-all duration-200 active:scale-[0.98] active:translate-y-0"
              >
                Confirm Sign Out
              </button>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;