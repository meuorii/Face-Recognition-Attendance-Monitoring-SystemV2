import { useEffect, useState } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import AOS from "aos";
import "aos/dist/aos.css";
import { FaUser, FaEnvelope, FaLock, FaIdBadge, FaShieldAlt, FaTimes } from "react-icons/fa";

const InstructorRegisterComponent = () => {
  const [formData, setFormData] = useState({
    instructor_id: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate(); 

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const sendOtp = () => {
    if (!formData.instructor_id || !formData.first_name || !formData.last_name || !formData.email || !formData.password) {
      toast.error("Please fill in all registration fields.");
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    const otp = generateOtp();
    setGeneratedOtp(otp);

    const emailParams = {
      instructor_name: `${formData.first_name} ${formData.last_name}`,
      otp_code: otp,
      to_email: formData.email,
    };

    emailjs
      .send(
        "service_m4ms27t",
        "template_fziuwnk",
        emailParams,
        "y3BmHmZwAFxMQuUVe"
      )
      .then(() => {
        toast.success("OTP sent to your email.");
        setOtpSent(true);
      })
      .catch((err) => {
        console.error("EmailJS error:", err);
        toast.error("Failed to send OTP.");
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const verifyOtpAndRegister = async () => {
    if (enteredOtp !== generatedOtp) {
      toast.error("Invalid OTP. Please try again.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post("http://127.0.0.1:8080/api/instructor/register", formData);
      if (res.status === 201) {
        toast.success("Registration successful!");
        setOtpSent(false);
        setEnteredOtp("");
        setFormData({
          instructor_id: "",
          first_name: "",
          last_name: "",
          email: "",
          password: "",
          confirm_password: "",
        });
        navigate('/login');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F3F0] p-4 sm:p-6 md:p-8 font-sans antialiased selection:bg-[#008C45]/20 relative">
      
      {/* Main Structural Wrapper */}
      <div 
        className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-12 min-h-[600px]"
        data-aos="fade-up"
      >
        
        {/* LEFT SIDE: Compact & Clean Registration Form */}
        <div className="col-span-12 md:col-span-7 flex flex-col justify-center px-6 py-8 sm:px-12 md:px-14 bg-white order-1">
          <div className="w-full max-w-xl mx-auto space-y-5">
            
            {/* Header Identity Block */}
            <div>
              <h2 className="text-xl font-semibold text-[#0A3A23] tracking-tight">
                Create Account
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Provide your institutional details to complete secure OTP email activation.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Instructor ID */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Instructor ID
                </label>
                <div className="relative">
                  <FaIdBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="text"
                    name="instructor_id"
                    placeholder="e.g. INST-2026-001"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.instructor_id}
                  />
                </div>
              </div>

              {/* First Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  First Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First Name"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.first_name}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Last Name
                </label>
                <div className="relative">
                  <FaUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last Name"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.last_name}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Email Address
                </label>
                <div className="relative">
                  <FaEnvelope className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="email"
                    name="email"
                    placeholder="instructor@school.edu.ph"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.email}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.password}
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-[#0A3A23]/80 block">
                  Confirm Password
                </label>
                <div className="relative">
                  <FaLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm" />
                  <input
                    type="password"
                    name="confirm_password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg bg-[#F5F3F0]/60 border border-neutral-200 
                      text-neutral-800 placeholder-neutral-400 focus:outline-none focus:bg-white
                      focus:ring-1 focus:ring-[#008C45] focus:border-[#008C45] transition-all duration-150"
                    onChange={handleChange}
                    value={formData.confirm_password}
                  />
                </div>
              </div>
            </div>

            {/* Submit Trigger */}
            <div className="pt-2">
              <button
                onClick={sendOtp}
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-lg text-sm font-medium text-white 
                  bg-[#0A3A23] hover:bg-[#008C45] transition-all duration-200 shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Sending..." : "Send OTP to Email"}
              </button>
            </div>

            {/* Footer Navigation */}
            <div className="pt-2 border-t border-neutral-100 text-center">
              <p className="text-xs text-neutral-500">
                Already have an instructor or admin account?{" "}
                <button
                  type="button"
                  className="text-[#008C45] font-semibold hover:underline focus:outline-none ml-1"
                  onClick={() => navigate("/login")}
                >
                  Sign In Here
                </button>
              </p>
            </div>

          </div>
        </div>

        {/* RIGHT SIDE: Campus Image & Department Logo Banner */}
        <div className="hidden md:flex md:col-span-5 relative bg-[#0A3A23] flex-col justify-between p-8 text-white overflow-hidden order-2">
          <img 
            src="/images/homehero.jpg" 
            alt="University Campus Building" 
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-25 select-none pointer-events-none"
          />

          {/* Department Logo */}
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

          {/* Core System Branding */}
          <div className="relative z-10 space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#008C45] bg-[#008C45]/10 px-2 py-0.5 rounded inline-block">
                Instructor Registration
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

      </div>

      {/* MODERN & PREMIUM OTP MODAL OVERLAY */}
      {otpSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Blur Glass backdrop */}
          <div 
            className="absolute inset-0 bg-[#0A3A23]/40 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setOtpSent(false)}
          />
          
          {/* Modal Box */}
          <div 
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden relative z-10 p-6 sm:p-8 space-y-6 transform scale-100 transition-all duration-300"
            data-aos="zoom-in"
          >
            {/* Close Button */}
            <button 
              onClick={() => setOtpSent(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <FaTimes className="text-lg" />
            </button>

            {/* Modal Header Icon */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-[#008C45]/10 border border-[#008C45]/20 flex items-center justify-center text-[#008C45] shadow-sm">
                <FaShieldAlt className="text-xl" />
              </div>
              <h3 className="text-lg font-bold text-[#0A3A23] tracking-tight">
                Security Verification
              </h3>
              <p className="text-xs text-neutral-500 max-w-xs">
                We sent a 6-digit dynamic activation token to <span className="font-semibold text-neutral-700">{formData.email}</span>.
              </p>
            </div>

            {/* OTP Input Form */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#0A3A23] block text-center">
                  Verification Token (OTP)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="0 0 0 0 0 0"
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  className="w-full tracking-[0.5em] text-center font-mono font-bold text-lg px-4 py-3 rounded-xl bg-[#F5F3F0]/80 border border-neutral-200 
                    text-[#0A3A23] placeholder-neutral-300 focus:outline-none focus:bg-white
                    focus:ring-2 focus:ring-[#008C45] focus:border-transparent transition-all duration-150"
                />
              </div>

              {/* Verify Button */}
              <button
                onClick={verifyOtpAndRegister}
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white tracking-wide
                  bg-gradient-to-r from-[#0A3A23] to-[#008C45] hover:opacity-95 shadow-md 
                  transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 disabled:opacity-50"
              >
                {isSubmitting ? "Verifying Account..." : "Verify & Activate Account"}
              </button>

              {/* Cancel Link */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-neutral-400 hover:text-neutral-600 underline transition-colors"
                >
                  Cancel / Change details
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default InstructorRegisterComponent;