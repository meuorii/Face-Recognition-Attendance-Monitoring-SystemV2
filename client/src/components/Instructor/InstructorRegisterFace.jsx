// src/components/Instructor/InstructorRegisterFace.jsx
import { useEffect, useRef, useState } from "react";
import { FaSave, FaPlay, FaCheckCircle, FaIdCard, FaUser, FaEnvelope, FaVideo, FaCompass, FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { registerInstructorFace, getInstructorProfile } from "../../services/api";
import * as faceapi from "face-api.js";

const REQUIRED_ANGLES = ["front", "left", "right", "up", "down"];
const MODEL_URL = "/models";
const CAPTURE_TOAST_ID = "capture-toast";
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

    // Retain accurate tracking payload coordinates
    currentDetectionRef.current = detection;

    const box = detection.detection.box;
    const squareSize = Math.max(box.width, box.height);
    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;
    
    // UI rendering coordinates mapping for the mirrored presentation
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
    <div className="space-y-12 px-4 text-gray-800">
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
          className="px-4 py-2 border border-[#0A3A23]/20 hover:bg-white rounded-xl text-xs font-bold text-[#0A3A23] flex items-center gap-2 transition-all shadow-sm"
        >
          <FaArrowLeft className="text-[10px]" /> Exit to Profile
        </button>
      </div>

      {/* WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
        
        {/* CAMERA SCREEN WITH OVERLAYS */}
        <div className="xl:col-span-3 relative border border-gray-200/80 rounded-3xl overflow-hidden bg-white shadow-xl shadow-[#0A3A23]/5 aspect-video w-full flex items-center justify-center min-h-[550px]">
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

          {/* TOP PANEL: DIRECTIONS */}
          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2.5 items-start">
            {isCapturing && !angleStatus[targetAngle] && (
              <span className="px-4 py-2 rounded-xl text-xs font-black tracking-wider uppercase bg-[#0A3A23] text-white shadow-lg border border-[#008C45]/30 flex items-center gap-2 animate-bounce whitespace-nowrap">
                <FaVideo className="text-[#008C45] animate-pulse" />
                Turn to: {targetAngle}
              </span>
            )}
            {faceDetected && currentAngle && (
              <span className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-white/90 backdrop-blur text-gray-800 shadow-md border border-gray-200/50 flex items-center gap-2 whitespace-nowrap">
                <FaCompass className="text-[#008C45]" />
                Position: {currentAngle}
              </span>
            )}
          </div>

          {/* BOTTOM PANEL OVERLAY */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 w-auto justify-center">
            {REQUIRED_ANGLES.map((angle) => {
              const isDone = angleStatus[angle];
              const isCurrentTarget = angle === targetAngle && isCapturing;
              
              return (
                <div key={angle} className="flex flex-col items-center gap-1 w-16 bg-black/50 backdrop-blur-sm p-2 rounded-xl border border-white/10">
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    isDone ? "text-[#008C45]" : isCurrentTarget ? "text-[#FDCC0D]" : "text-gray-300"
                  }`}>
                    {angle}
                  </span>
                  
                  <div className={`flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs border transition-all ${
                    isDone 
                      ? "bg-[#008C45] border-[#008C45] text-white" 
                      : isCurrentTarget
                      ? "bg-[#FDCC0D]/30 border-[#FDCC0D] text-[#FDCC0D] animate-pulse"
                      : "bg-white/10 border-white/20 text-gray-400"
                  }`}>
                    {isDone ? <FaCheckCircle className="text-[10px]" /> : <span className="font-mono text-[10px]">-</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {!modelsReady && (
            <div className="absolute inset-0 z-30 bg-[#F5F3F0] flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
              <p className="text-[#0A3A23] text-xs font-bold tracking-wider">Starting system views...</p>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="xl:col-span-1 border border-gray-200/80 rounded-3xl p-5 bg-white shadow-sm space-y-5 flex flex-col justify-between min-h-[550px]">
          
          <div className="space-y-5">
            {/* INSTRUCTOR DETAILS INFO */}
            <div className="bg-[#F5F3F0]/50 border border-gray-100 p-4 rounded-2xl space-y-3">
              <p className="text-[10px] font-black tracking-wider text-[#008C45] uppercase">Instructor Details</p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-700 font-bold">
                  <FaIdCard className="text-gray-400 shrink-0" />
                  <span className="truncate">{formData.Instructor_ID || "---"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700 font-medium">
                  <FaUser className="text-gray-400 shrink-0" />
                  <span className="truncate">{formData.First_Name} {formData.Last_Name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-medium text-[11px] truncate">
                  <FaEnvelope className="text-gray-400 shrink-0" />
                  <span className="truncate">{formData.Email}</span>
                </div>
              </div>
            </div>

            {/* LIVE CAMERA SCANNER STATUS */}
            <div className="p-3 rounded-xl bg-[#F5F3F0] border border-gray-200/60 flex flex-col gap-2 text-xs font-bold">
              <div className="flex flex-col gap-1">
                <span className="text-gray-500 text-[11px]">Camera Scanner:</span>
                {faceDetected ? (
                  <span className="text-[#008C45] bg-[#008C45]/10 px-2 py-1 rounded-lg border border-[#008C45]/20 text-center text-[11px]">
                    Face Active ({Object.keys(angleStatus).length}/5)
                  </span>
                ) : (
                  <span className="text-[#950606] bg-[#950606]/10 px-2 py-1 rounded-lg border border-[#950606]/20 text-center text-[11px] animate-pulse">
                    No Face Detected
                  </span>
                )}
              </div>
            </div>

            {/* STATUS ANGLE SAVED INDICATION */}
            {savedMessage && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700 flex items-center gap-2 transition-all">
                <FaInfoCircle className="text-[#008C45] shrink-0" />
                <span className="break-words w-full">{savedMessage}</span>
              </div>
            )}

            {/* PROGRESS BAR */}
            <div className="space-y-2 pt-1">
              <div className="flex justify-between items-center text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <div className="bg-[#F5F3F0] h-2 rounded-full overflow-hidden border border-gray-100">
                <div
                  className="h-full rounded-full bg-[#008C45] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="pt-2">
            {!allDone ? (
              <button
                onClick={handleStartCapture}
                disabled={!modelsReady || isCapturing}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#008C45] hover:bg-[#0A3A23] shadow-md shadow-[#008C45]/10 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaPlay className="text-[10px]" />
                {!modelsReady ? "Loading..." : isCapturing ? "Scanning..." : "Start Capture"}
              </button>
            ) : (
              <button
                onClick={() => { if (setActiveTab) setActiveTab("profile"); }}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#0A3A23] hover:bg-[#008C45] shadow-md shadow-[#0A3A23]/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaSave className="text-[10px]" />
                All Saved — Finish
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}