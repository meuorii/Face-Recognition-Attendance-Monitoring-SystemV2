// src/components/Instructor/InstructorProfile.jsx
import { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaUserCircle, FaIdCard, FaEnvelope, FaUserCheck, FaUserSlash, FaShieldAlt } from "react-icons/fa";
import { getInstructorProfile } from "../../services/api";

export default function InstructorProfile({ setActiveTab }) {
  const [loading, setLoading] = useState(true);
  const [prof, setProf] = useState(null);

  // ------------------------------------------------
  // RANDOM MASK FUNCTIONS
  // ------------------------------------------------
  const maskEmail = (email) => {
    if (!email || !email.includes("@")) return email;
    const [user, domain] = email.split("@");
    const chars = user.split("");
    const revealCount = Math.random() < 0.5 ? 1 : 2;
    const revealPositions = [];

    while (revealPositions.length < revealCount) {
      const pos = Math.floor(Math.random() * chars.length);
      if (!revealPositions.includes(pos) && /[A-Za-z0-9]/.test(chars[pos])) {
        revealPositions.push(pos);
      }
    }

    const maskedUser = chars
      .map((ch, i) => (revealPositions.includes(i) ? ch : "*"))
      .join("");

    return `${maskedUser}@${domain}`;
  };

  const maskInstructorId = (id) => {
    if (!id) return "";
    const chars = id.split("");
    const revealCount = Math.random() < 0.5 ? 1 : 2;
    const revealPositions = [];
    
    while (revealPositions.length < revealCount) {
      const pos = Math.floor(Math.random() * chars.length);
      if (!revealPositions.includes(pos) && chars[pos] !== "-") {
        revealPositions.push(pos);
      }
    }

    return chars
      .map((ch, i) => {
        if (ch === "-") return "-";
        return revealPositions.includes(i) ? ch : "*";
      })
      .join("");
  };

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await getInstructorProfile();

        const normalized = {
          instructor_id: data?.instructor_id || "",
          name: data?.name || "",
          email: data?.email || "",
          face_registered: data?.face_registered === "Yes",
        };

        setProf(normalized);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-12 px-4 animate-pulse">
        <div>
          <div className="h-8 bg-gray-200 rounded-lg w-1/4 mb-2" />
          <div className="h-3 bg-gray-200 rounded w-1/6" />
        </div>
        <div className="h-64 bg-gray-100 rounded-2xl w-full" />
        <ToastContainer position="top-center" theme="light" />
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="text-center py-12 border-2 border-[#0A3A23]/10 p-6 max-w-md mx-auto rounded-2xl bg-[#0A3A23]/5">
        <p className="text-[#0A3A23] font-bold">Cannot load your profile information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 px-4">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
          Instructor Profile
        </h2>
        <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
          Your account and face login details
        </p>
      </div>

      {/* MAIN PREMIUM PROFILE WORKSPACE */}
      <div className="border border-gray-200/70 rounded-3xl bg-white shadow-xl shadow-[#0A3A23]/5 overflow-hidden">
        
        {/* Top Hero Banner Section */}
        <div className="bg-gradient-to-r from-[#0A3A23]/5 via-[#F5F3F0] to-transparent p-8 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="p-1 bg-white rounded-full shadow-md border border-gray-100">
              <FaUserCircle className="text-6xl text-[#0A3A23]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-gray-800 tracking-tight">{prof.name}</h3>
              <p className="text-xs font-bold text-[#008C45] uppercase tracking-wider mt-0.5">Instructor Account</p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
              prof.face_registered
                ? "bg-[#008C45]/10 text-[#008C45] border-[#008C45]/30 shadow-sm"
                : "bg-[#950606]/10 text-[#950606] border-[#950606]/20 shadow-sm"
            }`}
          >
            {prof.face_registered ? (
              <>
                <FaUserCheck className="text-sm" />
                Face Registered
              </>
            ) : (
              <>
                <FaUserSlash className="text-sm" />
                Face Not Registered
              </>
            )}
          </span>
        </div>

        {/* Info Split Panel System */}
        <div className="p-8 grid md:grid-cols-5 gap-8">
          
          {/* Left Column: Essential Account Specs (3/5 width) */}
          <div className="md:col-span-3 space-y-5">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#0A3A23]/60 mb-2">Profile Information</h4>
            
            {/* Field Row: Instructor ID */}
            <div className="flex items-center justify-between p-4 bg-[#F5F3F0]/60 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <FaIdCard className="text-[#0A3A23]/50 text-base" />
                <span className="text-sm font-bold text-gray-500">Instructor ID</span>
              </div>
              <span className="text-sm font-mono font-bold text-gray-800 tracking-wide bg-white px-3 py-1 rounded-md border border-gray-200/60">
                {maskInstructorId(prof.instructor_id)}
              </span>
            </div>

            {/* Field Row: Email */}
            <div className="flex items-center justify-between p-4 bg-[#F5F3F0]/60 rounded-xl border border-gray-100">
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-[#0A3A23]/50 text-base" />
                <span className="text-sm font-bold text-gray-500">Email Address</span>
              </div>
              <span className="text-sm font-semibold text-gray-700 bg-white px-3 py-1 rounded-md border border-gray-200/60">
                {maskEmail(prof.email)}
              </span>
            </div>
          </div>

          {/* Right Column: Dynamic Security Actions Panel (2/5 width) */}
          <div className="md:col-span-2 p-6 rounded-2xl bg-[#0A3A23]/5 border border-[#0A3A23]/10 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-[#0A3A23] font-bold text-sm mb-2">
                <FaShieldAlt className="text-base text-[#008C45]" />
                Face Login Status
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {prof.face_registered 
                  ? "Your face photo is saved. You can scan your face again if you have trouble logging in."
                  : "Your face photo is not saved yet. Please register your face below to use face login."
                }
              </p>
            </div>

            <button
              onClick={() => setActiveTab("register-face")}
              className={`w-full px-5 py-3 rounded-xl font-bold tracking-wide text-xs uppercase shadow-sm transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] text-white ${
                !prof.face_registered
                  ? "bg-[#008C45] hover:bg-[#0A3A23] shadow-[#008C45]/10"
                  : "bg-[#0A3A23] hover:bg-[#008C45] shadow-[#0A3A23]/10"
              }`}
            >
              {!prof.face_registered ? "Register Face Now" : "Register Face Again"}
            </button>
          </div>

        </div>
      </div>

      <ToastContainer position="top-center" theme="light" />
    </div>
  );
}