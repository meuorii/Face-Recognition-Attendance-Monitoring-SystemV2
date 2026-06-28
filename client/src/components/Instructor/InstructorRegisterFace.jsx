// src/components/Instructor/InstructorRegisterFace.jsx
import { useEffect, useRef, useState } from "react";
import { FaSave, FaPlay, FaCheckCircle, FaIdCard, FaUser, FaEnvelope, FaVideo, FaCompass, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { registerInstructorFace, getInstructorProfile } from "../../services/api";
import * as faceapi from "face-api.js";

const REQUIRED_ANGLES = ["front", "left", "right", "up", "down"];
const MODEL_URL = "/models";
const MODEL_LOAD_TOAST_ID = "model-load";

export default function InstructorRegisterFace({ setActiveTab }) {
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

  const currentAngleRef = useRef(null);
  const faceDetectedStateRef = useRef(false);
  
  // Track current detection coordinates globally for cropping
  const currentDetectionRef = useRef(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [angleStatus, setAngleStatus] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [targetAngle, setTargetAngle] = useState(REQUIRED_ANGLES[0]);
  const [allDone, setAllDone] = useState(false);
  const [savedMessage, setSavedMessage] = useState("");

  const [formData, setFormData] = useState({
    Instructor_ID: "",
    First_Name: "",
    Last_Name: "",
    Email: "",
  });

  // Get profile data
  useEffect(() => {
    const fetchInstructorProfile = async () => {
      try {
        const instructorData = await getInstructorProfile(); 
        if (instructorData) {
          const [First_Name, ...Last_Name] = instructorData.name.split(' ');
          const prefilled = {
            Instructor_ID: instructorData.instructor_id, 
            First_Name: First_Name,
            Last_Name: Last_Name.join(' '), 
            Email: instructorData.email,
          };
          setFormData(prefilled);
          formDataRef.current = prefilled;
        }
      } catch (err) {
        console.error("Failed to fetch profile", err);
        toast.error("Cannot load your profile.");
      }
    };
    fetchInstructorProfile();
  }, []);

  // Setup face-api and camera
  useEffect(() => {
    let isMounted = true;
    let stream = null;

    const setup = async () => {
      try {
        toast.loading("Loading camera tools...", { toastId: MODEL_LOAD_TOAST_ID });

        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);

        modelsLoadedRef.current = true;
        if (isMounted) setModelsReady(true);
        toast.dismiss(MODEL_LOAD_TOAST_ID);

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
        toast.dismiss(MODEL_LOAD_TOAST_ID);
        toast.error("Cannot open camera.");
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (animationIdRef.current) cancelAnimationFrame(animationIdRef.current);
      if (stream) stream.getTracks().forEach((t) => t.stop());
      toast.dismiss(MODEL_LOAD_TOAST_ID);
    };
  }, []);

  useEffect(() => {
    if (Object.keys(angleStatus).length === REQUIRED_ANGLES.length) {
      setIsCapturing(false);
      isCapturingRef.current = false;
      setAllDone(true);
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
      currentDetectionRef.current = null;
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

    currentDetectionRef.current = detection;

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

    const formReady = ["Instructor_ID", "First_Name", "Last_Name"].every(
      (key) => String(formDataRef.current[key]).trim() !== ""
    );
    if (!formReady) {
      setSavedMessage("⚠️ Profile fields are still loading.");
      return;
    }
    if (!isCapturingRef.current) return;

    const image = captureImage();
    if (!image) {
      setSavedMessage("❌ Failed to isolate face boundaries.");
      return;
    }

    setSavedMessage(`📸 Saving ${detectedAngle.toUpperCase()} view...`);

    try {
      const payload = {
        instructor_id: formDataRef.current.Instructor_ID,
        First_Name: formDataRef.current.First_Name,
        Last_Name: formDataRef.current.Last_Name,
        Email: formDataRef.current.Email,
        image,
        angle: detectedAngle,
      };

      const res = await registerInstructorFace(payload);

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

        setSavedMessage(`✅ ${detectedAngle.toUpperCase()} saved!`);

        if (isLast) {
          setAllDone(true);
          setSavedMessage("🎉 Registration complete!");
          setTimeout(() => {
            if (setActiveTab) setActiveTab("profile");
          }, 2000);
        } else {
          setTimeout(() => {
            setSavedMessage("");
          }, 2000);
        }
      }
    } catch (err) {
      console.error(err);
      setSavedMessage("❌ Failed to upload photo.");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const detection = currentDetectionRef.current;
    if (!video || !detection) return null;

    const { x, y, width, height } = detection.detection.box;
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const squareSize = Math.max(width, height) * 1.3;
    const centerX = x + width / 2;
    const centerY = y + height / 2;

    let cropX = centerX - squareSize / 2;
    let cropY = centerY - squareSize / 2;

    if (cropX < 0) cropX = 0;
    if (cropY < 0) cropY = 0;
    if (cropX + squareSize > videoWidth) cropX = videoWidth - squareSize;
    if (cropY + squareSize > videoHeight) cropY = videoHeight - squareSize;

    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);

    let mirroredCropX = videoWidth - (cropX + squareSize);
    if (mirroredCropX < 0) mirroredCropX = 0;
    if (mirroredCropX + squareSize > videoWidth) mirroredCropX = videoWidth - squareSize;

    try {
      ctx.drawImage(
        video,
        mirroredCropX,   
        cropY,          
        squareSize,      
        squareSize,      
        0,              
        0,               
        canvas.width,   
        canvas.height    
      );

      return canvas.toDataURL("image/jpeg", 0.95);
    } catch (error) {
      console.error("Cropping error captured:", error);
      return null;
    }
  };

  const handleStartCapture = () => {
    if (!modelsReady) {
      toast.warn("Please wait for camera tools to load.");
      return;
    }
    setIsCapturing(true);
    isCapturingRef.current = true;
    setSavedMessage("");
  };

  const progressPercent = (Object.keys(angleStatus).length / REQUIRED_ANGLES.length) * 100;

  return (
    <div className="space-y-6 px-4 text-gray-800">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
            Face Registration
          </h2>
          <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
            Setup face login for your account
          </p>
        </div>
        <button
          onClick={() => { if (setActiveTab) setActiveTab("profile"); }}
          className="px-4 py-2 border border-[#0A3A23]/20 hover:bg-gray-50 rounded-xl text-xs font-bold text-[#0A3A23] flex items-center gap-2 transition-all shadow-sm bg-white"
        >
          <FaArrowLeft className="text-[10px]" /> Exit to Profile
        </button>
      </div>

      {/* WIREFRAME GRID REPLICATION LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        
        {/* LEFT COMPONENT: MAIN CAMERA SCREEN (Occupies 3 Columns) */}
        <div className="lg:col-span-3 relative border border-gray-200/80 bg-white rounded-[2rem] overflow-hidden min-h-[550px] flex items-center justify-center shadow-xl shadow-gray-100">
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

          {/* TOP LEFT PANEL: FACE ANGLE DIRECTION SPECIFIED FROM DRAWING */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2 items-start">
            <div className="px-5 py-3 rounded-2xl bg-white/90 backdrop-blur-md border border-gray-200/60 text-gray-800 flex flex-col gap-1 min-w-[200px] shadow-sm">
              <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">Face Angle Direction</span>
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

        {/* RIGHT COLUMN SIDEBAR PANELS (Occupies 1 Column Stacked Exactly like Wireframe) */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full justify-between">
          
          {/* BOX 1: STATUS ANGLE SAVED INDICATION */}
          <div className="bg-white border border-gray-200/80 rounded-[1.5rem] p-4 flex flex-col justify-center min-h-[80px] shadow-sm">
            <span className="text-[10px] font-black tracking-wider text-gray-400 uppercase mb-1 block">
              Status Angle Saved Indication
            </span>
            {savedMessage ? (
              <div className="text-xs font-bold text-gray-800 flex items-center gap-2 animate-pulse">
                <FaInfoCircle className="text-[#008C45] shrink-0" />
                <span className="break-words w-full">{savedMessage}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400 font-medium italic">Awaiting Capture Action...</span>
            )}
          </div>

          {/* BOX 2: INSTRUCTOR INFORMATION */}
          <div className="bg-white border border-gray-200/80 rounded-[1.5rem] p-5 flex-grow flex flex-col justify-between min-h-[260px] shadow-sm">
            <div className="space-y-4">
              <span className="text-[11px] font-black tracking-wider text-gray-500 uppercase block border-b border-gray-100 pb-2">
                Instructor Information
              </span>
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                  <FaIdCard className="text-gray-400 shrink-0" />
                  <span className="font-mono font-bold text-gray-700">{formData.Instructor_ID || "---"}</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100">
                  <FaUser className="text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-700">{formData.First_Name} {formData.Last_Name}</span>
                </div>
                <div className="flex items-center gap-3 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100 truncate">
                  <FaEnvelope className="text-gray-400 shrink-0" />
                  <span className="font-medium text-gray-600 truncate">{formData.Email}</span>
                </div>
              </div>
            </div>

            {/* LIVE CAMERA ACTIVATION TRIGGER */}
            <div className="pt-4 border-t border-gray-100">
              {!allDone ? (
                <button
                  onClick={handleStartCapture}
                  disabled={!modelsReady || isCapturing}
                  className="w-full py-3 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#008C45] hover:bg-[#0A3A23] shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FaPlay className="text-[10px]" />
                  {!modelsReady ? "Loading..." : isCapturing ? "Scanning..." : "Start Capture"}
                </button>
              ) : (
                <button
                  onClick={() => { if (setActiveTab) setActiveTab("profile"); }}
                  className="w-full py-3 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#0A3A23] hover:bg-[#008C45] shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <FaSave className="text-[10px]" />
                  Finish Registration
                </button>
              )}
            </div>
          </div>

          {/* BOX 3: ANGLE CHECKPOINTS & PROGRESS BAR CONTAINER */}
          <div className="bg-white border border-gray-200/80 rounded-[1.5rem] p-5 flex flex-col gap-4 shadow-sm">
            
            {/* 5 Dots Alignment Layout */}
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

            {/* Continuous Progress Tracker Bar */}
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

        </div>
      </div>
    </div>
  );
}