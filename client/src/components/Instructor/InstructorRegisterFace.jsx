// src/components/Instructor/InstructorRegisterFace.jsx
import { useEffect, useRef, useState } from "react";
import { FaSave, FaPlay, FaCheckCircle, FaIdCard, FaUser, FaEnvelope, FaVideo, FaCompass, FaArrowLeft } from "react-icons/fa";
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

  const [modelsReady, setModelsReady] = useState(false);
  const [angleStatus, setAngleStatus] = useState({});
  const [faceDetected, setFaceDetected] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(null);
  const [targetAngle, setTargetAngle] = useState(REQUIRED_ANGLES[0]);
  const [allDone, setAllDone] = useState(false);

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
    if (yaw > 20)           return "left";
    if (yaw < -20)          return "right";
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
      toast.warn("Profile fields are still loading.");
      return;
    }
    if (!isCapturingRef.current) return;

    const image = captureImage();
    if (!image) return;

    toast.dismiss(CAPTURE_TOAST_ID);
    toast.loading(`Saving ${detectedAngle.toUpperCase()} view...`, {
      toastId: CAPTURE_TOAST_ID,
    });

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
        toast.dismiss(CAPTURE_TOAST_ID);

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

        toast.success(`${detectedAngle.toUpperCase()} view saved!`, {
          autoClose: 1000,
        });

        if (!isLast && next) {
          setTimeout(() => {
            toast.info(`Please turn your face: ${next.toUpperCase()}`, {
              autoClose: 1500,
            });
          }, 1100);
        } else {
          setAllDone(true);
          toast.success("Face registration complete!", { autoClose: 1500 });
          setTimeout(() => {
            if (setActiveTab) setActiveTab("profile");
          }, 1500);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo.");
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
    if (!modelsReady) {
      toast.warn("Please wait for camera tools to load.");
      return;
    }
    setIsCapturing(true);
    isCapturingRef.current = true;
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
        {/* INSTANT GO BACK FALLBACK TRIGGER */}
        <button
          onClick={() => { if (setActiveTab) setActiveTab("profile"); }}
          className="px-4 py-2 border border-[#0A3A23]/20 hover:bg-white rounded-xl text-xs font-bold text-[#0A3A23] flex items-center gap-2 transition-all shadow-sm"
        >
          <FaArrowLeft className="text-[10px]" /> Exit to Profile
        </button>
      </div>

      {/* WORKSPACE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        
        {/* CAMERA SCREEN WITH OVERLAYS */}
        <div className="xl:col-span-2 relative border border-gray-200/80 rounded-3xl overflow-hidden bg-white shadow-xl shadow-[#0A3A23]/5 aspect-video w-full flex items-center justify-center min-h-[500px]">
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

          <div className="absolute top-6 left-6 z-20 flex flex-col gap-2.5">
            {isCapturing && !angleStatus[targetAngle] && (
              <span className="px-5 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase bg-[#0A3A23] text-white shadow-lg border border-[#008C45]/30 inline-flex items-center gap-2 animate-bounce">
                <FaVideo className="text-[#008C45] animate-pulse" />
                Please turn: {targetAngle}
              </span>
            )}
            {faceDetected && currentAngle && (
              <span className="px-4 py-2 rounded-xl text-xs font-bold tracking-wide uppercase bg-white/90 backdrop-blur text-gray-800 shadow-md border border-gray-200/50 inline-flex items-center gap-2">
                <FaCompass className="text-[#008C45]" />
                Your Position: {currentAngle}
              </span>
            )}
          </div>

          <div className="absolute bottom-6 left-6 z-20 hidden sm:flex flex-col gap-2 max-w-xs bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-gray-200/50">
            <p className="text-[10px] font-black tracking-wider text-[#008C45] uppercase">Instructor Profile</p>
            <div className="space-y-1.5 text-xs">
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

          {!modelsReady && (
            <div className="absolute inset-0 z-30 bg-[#F5F3F0] flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
              <p className="text-[#0A3A23] text-xs font-bold tracking-wider">Starting system views...</p>
            </div>
          )}
        </div>

        {/* SIDE PANEL */}
        <div className="border border-gray-200/80 rounded-3xl p-6 bg-white shadow-sm space-y-8 flex flex-col justify-between h-full min-h-[500px]">
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-extrabold text-[#0A3A23] tracking-tight">Face Positions</h4>
              <p className="text-xs text-gray-400 mt-1">Please move your face to match each direction below.</p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F5F3F0] border border-gray-200/60 flex flex-col gap-2 text-xs font-bold">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Camera Scanner:</span>
                {faceDetected ? (
                  <span className="text-[#008C45] bg-[#008C45]/10 px-2.5 py-1 rounded-lg border border-[#008C45]/20">
                    Face Found ({Object.keys(angleStatus).length}/5)
                  </span>
                ) : (
                  <span className="text-[#950606] bg-[#950606]/10 px-2.5 py-1 rounded-lg border border-[#950606]/20 animate-pulse">
                    Looking for face...
                  </span>
                )}
              </div>
              {faceDetected && (
                <div className="flex justify-between items-center border-t border-gray-200/50 pt-2 mt-1">
                  <span className="text-gray-400 font-medium">Current View:</span>
                  <span className="text-[#0A3A23] uppercase tracking-wider font-extrabold">
                    {currentAngle || "Checking..."}
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {REQUIRED_ANGLES.map((angle) => (
                <div 
                  key={angle} 
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    angleStatus[angle] 
                      ? "bg-[#008C45]/5 border-[#008C45]/30 text-[#0A3A23]" 
                      : angle === targetAngle && isCapturing
                      ? "bg-[#FDCC0D]/5 border-[#FDCC0D]/40 text-gray-800 animate-pulse"
                      : "bg-white border-gray-100 text-gray-400"
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${angleStatus[angle] ? "bg-[#008C45]" : angle === targetAngle && isCapturing ? "bg-[#FDCC0D]" : "bg-gray-300"}`} />
                    {angle} Photo
                  </span>
                  {angleStatus[angle] ? (
                    <FaCheckCircle className="text-[#008C45] text-base" />
                  ) : (
                    <span className="text-[10px] font-mono tracking-widest text-gray-300">WAITING</span>
                  )}
                </div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                <span>Progress</span>
                <span>{Math.round(progressPercent)}% Done</span>
              </div>
              <div className="bg-[#F5F3F0] h-2 rounded-full overflow-hidden border border-gray-100">
                <div
                  className="h-full rounded-full bg-[#008C45] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div>
            {!allDone ? (
              <button
                onClick={handleStartCapture}
                disabled={!modelsReady || isCapturing}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#008C45] hover:bg-[#0A3A23] shadow-md shadow-[#008C45]/10 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <FaPlay className="text-[10px]" />
                {!modelsReady ? "Loading System..." : isCapturing ? "Capturing..." : "Start Capture"}
              </button>
            ) : (
              <button
                onClick={() => { if (setActiveTab) setActiveTab("profile"); }}
                className="w-full py-3.5 rounded-xl font-bold tracking-wide text-xs uppercase text-white bg-[#0A3A23] hover:bg-[#008C45] shadow-md shadow-[#0A3A23]/10 hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaSave className="text-[10px]" />
                All Saved — Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}