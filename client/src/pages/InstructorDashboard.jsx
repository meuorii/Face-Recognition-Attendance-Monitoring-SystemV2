// src/pages/InstructorDashboard.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import { ToastContainer } from "react-toastify";
import { LogOut } from "lucide-react"; 
import "react-toastify/dist/ReactToastify.css";
import "aos/dist/aos.css";

import Navbar from "../components/Instructor/Navbar";
import Sidebar from "../components/Instructor/Sidebar";
import Subjects from "../components/Instructor/Subjects";
import InstructorOverview from "../components/Instructor/InstructorOverview";
import StudentsInClass from "../components/Instructor/StudentsInClass";
import AttendanceReports from "../components/Instructor/AttendanceReports";
import AttendanceSession from "../components/Instructor/AttendanceSession";
import ModalManager from "../components/Instructor/ModalManager";
import AttendanceLiveSession from "../components/Instructor/AttendanceLiveSession";
import InstructorRegisterFace from "../components/Instructor/InstructorRegisterFace";
import InstructorProfile from "../components/Instructor/InstructorProfile";

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [instructor, setInstructor] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeClassId, setActiveClassId] = useState(null);
  const [activeClass, setActiveClass] = useState(null);
  
  // State para sa Logout Confirmation Modal
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const hideLayout = activeTab === "session";

  useEffect(() => {
    AOS.init({ duration: 600, once: true });

    const token = localStorage.getItem("token");
    const userType = localStorage.getItem("userType");
    const storedData = JSON.parse(localStorage.getItem("userData"));

    if (!token || userType !== "instructor" || !storedData) {
      navigate("/instructor/login", { replace: true });
    } else {
      setInstructor(storedData);
    }
  }, [navigate]);

  const handleConfirmLogout = () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("token");
    localStorage.removeItem("userType");
    navigate("/login");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <InstructorOverview setActiveTab={setActiveTab} />;
      case "subject":
        return (
          <Subjects
            onActivateSession={(classObj) => {
              setActiveClassId(classObj._id);
              setActiveClass(classObj);
              setActiveTab("session");
            }}
          />
        );
      case "assigned":
        return <StudentsInClass />;
      case "attendance":
        return <AttendanceReports />;
      case "session":
        return (
          <AttendanceLiveSession
            classId={activeClassId}
            subjectCode={activeClass.subject_code}
            subjectTitle={activeClass.subject_title}
            course={activeClass.course}
            section={activeClass.section}
            semester={activeClass.semester}
            schoolYear={activeClass.school_year}
            onStopSession={() => setActiveTab("summary")}
          />
        );
      case "summary":
        return <AttendanceSession refetchTrigger={activeClassId} />;
      case "profile":
        return <InstructorProfile setActiveTab={setActiveTab} />;
      case "register-face":
        return <InstructorRegisterFace setActiveTab={setActiveTab} />;
      default:
        return <InstructorOverview />;
    }
  };

  return (
    <ModalManager>
      <div className="bg-[#F5F3F0] min-h-screen text-neutral-800 antialiased font-sans flex flex-col selection:bg-[#008C45]/20">

        {/* SIDEBAR CONTAINER */}
        {!hideLayout && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            handleLogout={() => setShowLogoutModal(true)} 
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />
        )}

        {/* MAIN WORKSPACE CONTENT CONTAINER */}
        <div className={`flex-1 flex flex-col w-full min-h-screen transition-all duration-300 ${!hideLayout ? "md:pl-20" : ""}`}>
          
          {/* STICKY TOP NAVBAR */}
          {!hideLayout && (
            <div className="sticky top-0 right-0 left-0 z-10 w-full">
              <Navbar
                instructor={instructor}
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              />
            </div>
          )}

          {/* INNER TAB DISPLAY COMPONENT FRAME */}
          <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-[1600px] w-full mx-auto">
            <div data-aos="fade-up" data-aos-delay="50" className="h-full">
              {renderContent()}
            </div>
          </main>
        </div>
      </div>

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
                  End Active Session?
                </h3>
                <p className="text-sm text-neutral-500 max-w-xs mx-auto leading-relaxed font-normal">
                  You are about to sign out of your CCIT instructor account. You will need your identification credentials to log back in.
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

      {/* Global Toast Container na makakasalo sa lahat ng tabs kabilang ang face registration */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="light"
        newestOnTop={true}
        pauseOnHover={true}
      />
    </ModalManager>
  );
};

export default InstructorDashboard;