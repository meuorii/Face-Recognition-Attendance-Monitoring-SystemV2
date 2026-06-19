import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaLock, FaUser } from "react-icons/fa";

function GlobalLogin() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);

  const BASE_URL = "http://127.0.0.1:8080/api";

  // Ino-initialize ang AOS animation kapag nag-load ang component
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleLogin = async () => {
    if (!userId || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      const adminRes = await axios.post(`${BASE_URL}/admin/login`, {
        user_id: userId,
        password,
      });

      if (adminRes.data?.token) {
        toast.success("Admin login successful!");
        localStorage.setItem("token", adminRes.data.token);
        localStorage.setItem("userType", "admin");
        localStorage.setItem("userData", JSON.stringify(adminRes.data.admin));
        navigate("/admin/dashboard");
        return;
      }
    } catch (err) {
      const status = err.response?.status;

      if (status === 401 || status === 404) {
        try {
          const instructorRes = await axios.post(`${BASE_URL}/instructor/login`, {
            instructor_id: userId,
            password,
          });

          if (instructorRes.data?.token) {
            toast.success("Instructor login successful!");
            localStorage.setItem("token", instructorRes.data.token);
            localStorage.setItem("userType", "instructor");
            localStorage.setItem(
              "userData",
              JSON.stringify(instructorRes.data.instructor)
            );
            navigate("/instructor/dashboard");
            return;
          }
        } catch {
          toast.error("Invalid credentials. Please check your ID or password.");
        }
      } else {
        toast.error("Server error. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === "Enter") {
      if (field === "userId") {
        passwordRef.current.focus();
      } else if (field === "password") {
        handleLogin();
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3F0] p-4 sm:p-6 md:p-8 font-sans antialiased selection:bg-[#008C45]/20">
      {/* Main Structural Wrapper - Dinagdagan ng data-aos="fade-up" */}
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-12 min-h-[600px]"
        data-aos="fade-up"
      >
        
        {/* Left Side: Department Logo & Campus Building Image Banner */}
        <div className="hidden md:flex md:col-span-5 relative bg-[#0A3A23] flex-col justify-between p-8 text-white overflow-hidden">
          
          {/* Custom Image: Premium Modern University/Campus Building */}
          <img 
            src="/images/homehero.jpg" 
            alt="University Campus Building" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25 select-none pointer-events-none"
          />

          {/* Department Logo Container */}
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <img 
                src="/ccit-logo.png" 
                alt="CCIT Logo" 
                className="w-7 h-7 object-cover rounded-md opacity-90"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold tracking-wider text-white">CCIT</span>
              <span className="text-[9px] font-medium tracking-wide text-neutral-300 uppercase">Attendance Portal</span>
            </div>
          </div>

          {/* Core System Branding & Department Text */}
          <div className="relative z-10 space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#008C45] bg-[#008C45]/10 px-2 py-0.5 rounded inline-block">
                Biometric Login
              </p>
              <h3 className="text-xl font-semibold tracking-tight leading-tight text-white">
                Face Recognition <br />Attendance System
              </h3>
            </div>
            
            <p className="text-[11px] text-neutral-300 font-normal leading-relaxed border-t border-white/10 pt-3">
              College of Communication and Information Technology
            </p>
          </div>
        </div>

        {/* Right Side: Compact Login Form */}
        <div className="col-span-12 md:col-span-7 flex flex-col justify-center px-6 py-10 sm:px-12 md:px-16 bg-white">
          <div className="w-full max-w-md mx-auto space-y-6">
            
            {/* Header Identity block */}
            <div>
              <h2 className="text-xl font-semibold text-[#0A3A23] tracking-tight">
                System Sign In
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Provide your structural credentials to open your administrative dashboard.
              </p>
            </div>

            {/* Form Controls */}
            <div className="space-y-4">
              
              {/* User ID field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  User Identification Number
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="text"
                    placeholder="Enter Admin / Instructor ID"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "userId")}
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    ref={passwordRef}
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, "password")}
                  />
                </div>
              </div>

              {/* Submission Button */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-lg text-sm font-medium text-white 
                  bg-[#0A3A23] hover:bg-[#008C45] transition-colors duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? "Verifying Credentials..." : "Authenticate Account"}
              </button>
            </div>

            {/* Registration Anchor */}
            <div className="pt-2 border-t border-neutral-100 text-center">
              <p className="text-xs text-neutral-500">
                Authorized Faculty without an account?{" "}
                <button
                  type="button"
                  className="text-[#008C45] font-semibold hover:underline focus:outline-none ml-1"
                  onClick={() => navigate("/instructor/register")}
                >
                  Register as Instructor
                </button>
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default GlobalLogin;