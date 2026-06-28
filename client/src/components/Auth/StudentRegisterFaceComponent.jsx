import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaSave, FaPlay, FaCheckCircle, FaIdCard, FaUser, FaCompass, FaArrowLeft, FaVideo, FaGraduationCap } from "react-icons/fa";
import { 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Fingerprint 
} from "lucide-react";
import { registerFaceAuto } from "../../services/api";
import * as faceapi from "face-api.js";
import axios from "axios";

const REQUIRED_ANGLES = ["front", "left", "right", "up", "down"];
const API_URL = "http://127.0.0.1:8080";
const MODEL_URL = "/models";

// Clean state messages configuration matching luxury wireframe layout
const STATUS_CONFIGS = {
  idle: {
    text: "Ready to start. Click 'Start Capture' to begin.",
    icon: Fingerprint,
    styles: "bg-white border-gray-200 text-[#0A3A23]"
  },
  loading_fields: {
    text: "Please complete Student ID, First Name, and Last Name before capturing.",
    icon: AlertTriangle,
    styles: "bg-[#FDCC0D]/10 border-[#FDCC0D] text-gray-800"
  },
  models_loading: {
    text: "Loading face detection models... Camera readying.",
    icon: Loader2,
    styles: "bg-[#FDCC0D]/10 border-[#FDCC0D] text-gray-800 animate-pulse"
  },
  crop_error: {
    text: "Can't see your face clearly. Please look straight at the camera.",
    icon: XCircle,
    styles: "bg-[#950606]/5 border-[#950606]/30 text-[#950606]"
  },
  saving: {
    text: "Saving your photo angle. Hold still...",
    icon: Loader2,
    styles: "bg-[#008C45]/5 border-[#008C45]/30 text-[#0A3A23]"
  },
  saved: {
    text: "Angle photo saved successfully!",
    icon: CheckCircle2,
    styles: "bg-[#008C45]/10 border-[#008C45] text-[#008C45]"
  },
  complete: {
    text: "All done! Face registered successfully across all views.",
    icon: CheckCircle2,
    styles: "bg-[#0A3A23] border-[#0A3A23] text-[#F5F3F0] shadow-md"
  },
  error: {
    text: "Connection or server error. Failed to upload photo angle.",
    icon: AlertTriangle,
    styles: "bg-[#950606]/10 border-[#950606] text-[#950606]"
  }
};

function StudentRegisterFaceComponent() {
  const navigate = useNavigate();
  const location = useLocation();
  const reRegData = location.state || null;
  const IS_REREGISTER = reRegData !== null;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationIdRef = useRef(null);
  const modelsLoadedRef = useRef(false);

  // Capture control refs
  const isCapturingRef = useRef(false);
  const targetAngleRef = useRef(REQUIRED_ANGLES[0]);
  const stableAngleRef = useRef(null);
  const stableCountRef = useRef(0);
  const captureLockRef = useRef(false);
  const lastCapturedAngleRef = useRef(null);
  const lostFaceFramesRef = useRef(0);
  const faceDetectedRef = useRef(false);
  const angleStatusRef = useRef({});
  const formDataRef = useRef({});
  const adminCourseRef = useRef("");

  const currentAngleRef = useRef(null);
  const faceDetectedStateRef = useRef(false);

  const [modelsReady, setModelsReady] = useState(false);
  const [angleStatus, setAngleStatus] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [targetAngle, setTargetAngle] = useState(REQUIRED_ANGLES[0]);
  const [adminCourse, setAdminCourse] = useState("");
  const [allDone, setAllDone] = useState(false);

  // Luxury dynamic inline status state
  const [statusKey, setStatusKey] = useState("models_loading");
  const [dynamicDetail, setDynamicDetail] = useState("");

  const [formData, setFormData] = useState({
    Student_ID: "",
    First_Name: "",
    Middle_Name: "",
    Last_Name: "",
    Suffix: "",
    Course: "",
  });

  // Re-register prefill
  useEffect(() => {
    if (IS_REREGISTER) {
      const prefilled = {
        Student_ID: reRegData.student_id || "",
        First_Name: reRegData.first_name || "",
        Middle_Name: reRegData.middle_name || "",
        Last_Name: reRegData.last_name || "",
        Suffix: reRegData.suffix || "",
        Course: reRegData.course || "",
      };
      setFormData(prefilled);
      formDataRef.current = prefilled;
    }
  }, [IS_REREGISTER, reRegData]);

  // Fetch admin program
  useEffect(() => {
    const fetchAdminProgram = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const res = await axios.get(`${API_URL}/api/admin/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const program = res.data.program || "Unknown Program";
        adminCourseRef.current = program;
        setAdminCourse(program);
        setFormData((prev) => {
          const updated = { ...prev, Course: program };
          formDataRef.current = updated;
          return updated;
        });
      } catch (err) {
        console.error("Failed to fetch admin program:", err);
      }
    };
    fetchAdminProgram();
  }, []);

  // Load face-api models + start webcam
  useEffect(() => {
    let isMounted = true;
    let stream = null;

    const setup = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        modelsLoadedRef.current = true;
        if (isMounted) {
          setModelsReady(true);
          setStatusKey("idle");
        }

        const video = videoRef.current;
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });

        if (!isMounted) return;
        video.srcObject = stream;
        await video.play();

        await new Promise((resolve) => {
          const check = setInterval(() => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              clearInterval(check);
              resolve();
            }
          }, 100);
        });

        startDetectionLoop(video, isMounted);
      } catch (err) {
        console.error("Setup error:", err);
        if (isMounted) setStatusKey("error");
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // All angles done
  useEffect(() => {
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) {
      setIsCapturing(false);
      isCapturingRef.current = false;
      setAllDone(true);
      setStatusKey("complete");
    }
  }, [angleStatus]);

  const startDetectionLoop = (video, isMounted) => {
    let lastVideoTime = -1;
    let frameCount = 0;

    const detect = async () => {
      if (!isMounted || !modelsLoadedRef.current) return;
      frameCount++;

      if (frameCount % 3 !== 0) {
        animationIdRef.current = requestAnimationFrame(detect);
        return;
      }

      if (!video.videoWidth || !video.videoHeight || video.currentTime === lastVideoTime) {
        animationIdRef.current = requestAnimationFrame(detect);
        return;
      }
      lastVideoTime = video.currentTime;

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ 
            scoreThreshold: 0.4,
            inputSize: 320
          }))
          .withFaceLandmarks();

        processDetection(detection, video);
      } catch (err) {
        console.warn("Frame skipped:", err.message);
      }

      animationIdRef.current = requestAnimationFrame(detect);
    };

    animationIdRef.current = requestAnimationFrame(detect);
  };

  const processDetection = (detection, video) => {
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    const w = video.videoWidth;
    const h = video.videoHeight;

    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);

    if (!detection) {
      lostFaceFramesRef.current++;
      if (lostFaceFramesRef.current >= 25) {
        stableAngleRef.current = null;
        stableCountRef.current = 0;
        if (faceDetectedStateRef.current) {
          faceDetectedStateRef.current = false;
          faceDetectedRef.current = false;
          setFaceDetected(false);
          setCurrentAngle(null);
          currentAngleRef.current = null;
        }
      }
      return;
    }

    lostFaceFramesRef.current = 0;

    if (!faceDetectedStateRef.current) {
      faceDetectedStateRef.current = true;
      faceDetectedRef.current = true;
      setFaceDetected(true);
    }

    // Bounding Box Overlay (Aligned with mirrored view scale sizing context)
    const box = detection.detection.box;
    const squareSize = Math.max(box.width, box.height);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    const squareX = w - (centerX + squareSize / 2);
    const squareY = centerY - squareSize / 2;

    ctx.strokeStyle = "#008C45"; 
    ctx.lineWidth = 4;
    ctx.strokeRect(squareX, squareY, squareSize, squareSize);

    const pts = detection.landmarks.positions;
    const noseTip = pts[30];
    const leftEye = pts[36];
    const rightEye = pts[45];
    const mouthTop = pts[51];

    const eyeMidX = (leftEye.x + rightEye.x) / 2;
    const eyeDist = Math.abs(rightEye.x - leftEye.x);
    const yaw = ((noseTip.x - eyeMidX) / (eyeDist + 1e-6)) * 90;

    const distToEyeLevel = Math.abs(noseTip.y - ((leftEye.y + rightEye.y) / 2));
    const distToMouth = Math.abs(noseTip.y - mouthTop.y);
    const pitchRatio = distToEyeLevel / (distToMouth + 1e-6);

    const detectedAngle = classifyAngle(yaw, pitchRatio);

    if (currentAngleRef.current !== detectedAngle) {
      currentAngleRef.current = detectedAngle;
      setCurrentAngle(detectedAngle);
    }

    if (detectedAngle === stableAngleRef.current) {
      stableCountRef.current++;
    } else {
      stableAngleRef.current = detectedAngle;
      stableCountRef.current = 1;
      if (detectedAngle !== targetAngleRef.current) {
        lastCapturedAngleRef.current = null;
      }
    }

    const requiredStable = detectedAngle === "down" ? 18 : 12;

    if (
      stableCountRef.current >= requiredStable &&
      faceDetectedRef.current &&
      lastCapturedAngleRef.current !== detectedAngle &&
      !captureLockRef.current &&
      isCapturingRef.current
    ) {
      lastCapturedAngleRef.current = detectedAngle;
      handleAutoCapture(detectedAngle);
      stableCountRef.current = 0;
    }
  };

  const classifyAngle = (yaw, pitchRatio) => {
    if (yaw > 20)          return "left";
    if (yaw < -20)         return "right";
    if (pitchRatio < 0.55)  return "up";
    if (pitchRatio > 1.6)   return "down";
    return "front";
  };

  const handleAutoCapture = async (detectedAngle) => {
    if (!faceDetectedRef.current) return;
    if (Object.keys(angleStatusRef.current).length === REQUIRED_ANGLES.length) return;
    if (detectedAngle !== targetAngleRef.current) return;
    if (angleStatusRef.current[detectedAngle]) return;
    if (captureLockRef.current) return;

    captureLockRef.current = true;
    setTimeout(() => { captureLockRef.current = false; }, 2500);

    const formReady = ["Student_ID", "First_Name", "Last_Name"].every(
      (key) => String(formDataRef.current[key]).trim() !== ""
    );
    if (!formReady) {
      setStatusKey("loading_fields");
      return;
    }
    if (!isCapturingRef.current) return;

    const image = captureImage();
    if (!image) {
      setStatusKey("crop_error");
      return;
    }

    const courseToSend = (formDataRef.current.Course || adminCourseRef.current || "").trim().toUpperCase();
    if (!courseToSend) return;

    setStatusKey("saving");
    setDynamicDetail(detectedAngle.toUpperCase());

    try {
      const payload = {
        student_id: formDataRef.current.Student_ID,
        First_Name: formDataRef.current.First_Name,
        Middle_Name: formDataRef.current.Middle_Name || null,
        Last_Name: formDataRef.current.Last_Name,
        Suffix: formDataRef.current.Suffix || null,
        Course: courseToSend,
        image,
        angle: detectedAngle,
      };

      const res = await registerFaceAuto(payload);

      if (res.status === 200) {
        const idx = REQUIRED_ANGLES.indexOf(detectedAngle);
        const isLast = idx === REQUIRED_ANGLES.length - 1;
        const next = !isLast ? REQUIRED_ANGLES[idx + 1] : null;

        if (!isLast && next) {
          targetAngleRef.current = next;
          setTargetAngle(next);
        }

        setAngleStatus((prev) => {
          const updated = { ...prev, [detectedAngle]: true };
          angleStatusRef.current = updated;
          return updated;
        });

        setStatusKey("saved");
        setDynamicDetail(detectedAngle.toUpperCase());

        if (isLast) {
          setAllDone(true);
          setStatusKey("complete");
          setTimeout(() => {
            navigate("/admin/dashboard");
          }, 2500);
        } else {
          setTimeout(() => {
            setStatusKey("idle");
          }, 2000);
        }
      } else {
        setStatusKey("error");
      }
    } catch (err) {
      console.error(err);
      setStatusKey("error");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    if (!video) return null;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  };

  const handleStartCapture = () => {
    if (!modelsReady) return;
    
    const ready = ["Student_ID", "First_Name", "Last_Name"].every(
      (key) => String(formDataRef.current[key]).trim() !== ""
    );
    if (!ready) {
      setStatusKey("loading_fields");
      return;
    }
    
    setIsCapturing(true);
    isCapturingRef.current = true;
    setStatusKey("idle");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const forceCaps = ["Student_ID", "First_Name", "Middle_Name", "Last_Name", "Suffix"];
    const newValue = forceCaps.includes(name) ? value.toUpperCase() : value;
    setFormData((prev) => {
      const updated = { ...prev, [name]: newValue };
      formDataRef.current = updated;
      return updated;
    });
  };

  const progressPercent = (Object.keys(angleStatus).length / REQUIRED_ANGLES.length) * 100;
  const currentStatus = STATUS_CONFIGS[statusKey] || STATUS_CONFIGS.idle;
  const StatusIconComponent = currentStatus.icon;

  return (
    <div className="space-y-12 px-4 text-gray-800">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Student Face Registration
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Take photos from multiple angles for your student profile
          </p>
        </div>
      </div>

      {/* SYSTEM WORKSPACE WIREFRAME GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* LEFT SYSTEM BOX: MAIN FEED SCREEN WINDOW */}
        <div className="lg:col-span-3 relative border border-gray-200/80 bg-white rounded-[2rem] overflow-hidden min-h-[580px] flex items-center justify-center shadow-xl shadow-gray-100">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
          />

          {/* OVERLAY INDICATORS */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 items-start">
            <div className="px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 text-gray-800 flex flex-col gap-1 min-w-[200px] shadow-sm">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Target Track Heading</span>
              <span className="text-sm font-bold text-[#0A3A23] flex items-center gap-2">
                <FaCompass className="text-[#008C45] text-xs" />
                {currentAngle ? currentAngle.toUpperCase() : "Detecting..."}
              </span>
            </div>

            {isCapturing && !angleStatus[targetAngle] && (
              <span className="px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase bg-[#0A3A23] text-white shadow-lg border border-[#008C45]/30 flex items-center gap-2 animate-bounce whitespace-nowrap">
                <FaVideo className="text-[#008C45] animate-pulse" />
                Turn to: {targetAngle}
              </span>
            )}
          </div>

          {!modelsReady && (
            <div className="absolute inset-0 z-30 bg-white flex flex-col items-center justify-center gap-3 rounded-[2rem]">
              <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
              <p className="text-[#0A3A23] text-xs font-bold tracking-wider">Starting system views...</p>
            </div>
          )}
        </div>

        {/* RIGHT SYSTEM PANEL SIDEBARS */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          
          {/* STATE UTILITY: INLINE PREMIUM STATUS BLOCK */}
          <div className={`relative overflow-hidden rounded-2xl border p-4 flex items-center justify-between min-h-[90px] shadow-sm backdrop-blur-md transition-all duration-500 ease-out ${currentStatus.styles}`}>
            <div className="flex items-center gap-4">
              <div className="shrink-0 w-11 h-11 rounded-xl bg-white/60 border border-white/40 flex items-center justify-center shadow-sm">
                <StatusIconComponent className={`w-5 h-5 ${statusKey === "saving" || statusKey === "models_loading" ? "animate-spin" : ""}`} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">System Notification</span>
                <p className="text-xs font-semibold tracking-wide leading-snug">{currentStatus.text}</p>
              </div>
            </div>
            {dynamicDetail && (statusKey === "saved" || statusKey === "saving") && (
              <div className="shrink-0 self-center pl-4 border-l border-current/10 hidden sm:block">
                <div className="px-2.5 py-1 rounded-md bg-white/40 border border-white/30 text-[10px] font-black tracking-wider uppercase shadow-2xs">
                  {dynamicDetail}
                  <span className="text-[9px] block font-medium tracking-normal opacity-70 lowercase">focus view</span>
                </div>
              </div>
            )}
          </div>

          {/* IDENTITY UTILITY: EDITABLE STUDENT MANAGEMENT INTERFACE */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-5 flex-grow flex flex-col shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-gray-100">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">Student Info</span>
                <h4 className="text-xs font-bold text-[#0A3A23]">Your Details</h4>
              </div>
            </div>

            {/* SYNCED FORM FIELDS WRAPPER */}
            <div className="space-y-3 flex-grow flex flex-col justify-start">
              
              <div className="relative">
                <FaIdCard className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                <input 
                  name="Student_ID" 
                  placeholder="STUDENT ID NUMBER" 
                  value={formData.Student_ID} 
                  onChange={handleChange} 
                  readOnly={IS_REREGISTER} 
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-[#0A3A23] uppercase bg-[#F5F3F0]/30 placeholder-gray-400 focus:outline-none focus:border-[#008C45] transition-colors read-only:opacity-60" 
                />
              </div>

              <div className="relative">
                <FaUser className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                <input 
                  name="First_Name" 
                  placeholder="FIRST NAME" 
                  value={formData.First_Name} 
                  onChange={handleChange} 
                  readOnly={IS_REREGISTER} 
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 uppercase bg-[#F5F3F0]/30 placeholder-gray-400 focus:outline-none focus:border-[#008C45] transition-colors read-only:opacity-60" 
                />
              </div>

              <div className="relative">
                <FaUser className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                <input 
                  name="Middle_Name" 
                  placeholder="MIDDLE NAME" 
                  value={formData.Middle_Name} 
                  onChange={handleChange} 
                  readOnly={IS_REREGISTER} 
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 uppercase bg-[#F5F3F0]/30 placeholder-gray-400 focus:outline-none focus:border-[#008C45] transition-colors read-only:opacity-60" 
                />
              </div>

              <div className="relative">
                <FaUser className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                <input 
                  name="Last_Name" 
                  placeholder="LAST NAME" 
                  value={formData.Last_Name} 
                  onChange={handleChange} 
                  readOnly={IS_REREGISTER} 
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-800 uppercase bg-[#F5F3F0]/30 placeholder-gray-400 focus:outline-none focus:border-[#008C45] transition-colors read-only:opacity-60" 
                />
              </div>

              <div className="relative">
                <FaGraduationCap className="absolute left-3.5 top-3.5 text-gray-400 text-xs" />
                <input
                  name="Course"
                  value={formData.Course ? formData.Course.toUpperCase() : "LOADING COURSE..."}
                  readOnly
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#008C45]/20 bg-[#008C45]/5 text-xs font-bold text-[#008C45] cursor-not-allowed focus:outline-none"
                />
              </div>

              <div className="relative">
                <select
                  name="Suffix"
                  value={formData.Suffix || ""}
                  onChange={handleChange}
                  disabled={IS_REREGISTER}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-medium text-gray-600 bg-white uppercase tracking-wider focus:outline-none focus:border-[#008C45] transition-colors disabled:opacity-60"
                >
                  <option value="">SELECT SUFFIX (OPTIONAL)</option>
                  <option value="Jr.">JR.</option>
                  <option value="Sr.">SR.</option>
                  <option value="II">II</option>
                  <option value="III">III</option>
                  <option value="IV">IV</option>
                  <option value="None">NONE</option>
                </select>
              </div>
            </div>
          </div>

          {/* STATUS UTILITY: RADIAL STEP MAP DISPATCHER */}
          <div className="bg-white border border-gray-200/80 rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-sm">
            <div className="grid grid-cols-5 gap-2 w-full justify-center">
              {REQUIRED_ANGLES.map((angle) => {
                const isDone = angleStatus[angle];
                const isCurrentTarget = angle === targetAngle && isCapturing;
                
                return (
                  <div key={angle} className="flex flex-col items-center gap-1.5">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border transition-all ${
                      isDone 
                        ? "bg-[#008C45] border-[#008C45] text-white shadow-sm" 
                        : isCurrentTarget
                        ? "bg-yellow-400 border-yellow-500 text-gray-900 animate-pulse"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}>
                      {isDone ? <FaCheckCircle className="text-[11px]" /> : <span className="text-[9px] font-mono">-</span>}
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-tight ${
                      isDone ? "text-[#008C45]" : isCurrentTarget ? "text-yellow-600 font-extrabold" : "text-gray-400"
                    }`}>
                      {angle}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5 border-t border-gray-100 pt-3">
              <div className="flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-wider">
                <span>Registration Track</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="bg-gray-100 h-2.5 rounded-full overflow-hidden border border-gray-200/40">
                <div
                  className="h-full rounded-full bg-[#008C45] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* DISPATCH ACTION CAPTURE CONTROLLER BUTTON */}
          <div className="mt-auto">
            {!allDone ? (
              <button
                onClick={handleStartCapture}
                disabled={!modelsReady || isCapturing}
                className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-xs uppercase text-white bg-[#008C45] hover:bg-[#0A3A23] shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FaPlay className="text-[10px]" />
                {!modelsReady ? "Loading Engine..." : isCapturing ? "Scanning Feed..." : "Start Capture"}
              </button>
            ) : (
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-xs uppercase text-white bg-[#0A3A23] hover:bg-[#008C45] shadow-md transition-all flex items-center justify-center gap-2"
              >
                <FaSave className="text-[10px]" />
                Finish Registration
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default StudentRegisterFaceComponent;