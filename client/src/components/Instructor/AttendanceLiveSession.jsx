import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";
import { ShieldAlert, UserX, ScanFace } from "lucide-react"; // Import ng Lucide Icons para sa Spoof at Unknown States

let modelsLoaded = false;
let modelsLoadingPromise = null;

const loadModels = () => {
  if (modelsLoaded) return Promise.resolve();
  if (modelsLoadingPromise) return modelsLoadingPromise;

  modelsLoadingPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  ]).then(() => {
    modelsLoaded = true;
  });

  return modelsLoadingPromise;
};

const AttendanceLiveSession = ({
  classId,
  subjectCode,
  subjectTitle,
  course,
  section,
  semester,
  schoolYear,
  onStopSession,
}) => {
  const activeClassId = classId;
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [recognized, setRecognized] = useState([]);
  const [isStarting, setIsStarting] = useState(true);
  const [elapsedTime, setElapsedTime] = useState("00:00");
  const [isStopping, setIsStopping] = useState(false);
  const [instructorDetected, setInstructorDetected] = useState(false);
  const [instructorName, setInstructorName] = useState(null);
  const [latestLog, setLatestLog] = useState(null); // Kinakabitan ng dynamic state mula sa backend 'latest_face'
  const isDetectingRef = useRef(true);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isProcessingFrame = useRef(false);
  const lastSentRef = useRef(0);
  const rafIdRef = useRef(null);
  const [faceCount, setFaceCount] = useState(0);

  const currentFrameOverlaysRef = useRef([]);

  const formatName = (value = "") =>
    value
      .trim()
      .split(" ")
      .map((w) =>
        w.length > 0 ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""
      )
      .join(" ");

  const startTimer = () => {
    const start = Date.now();
    timerRef.current = setInterval(() => {
      const diff = Date.now() - start;
      const minutes = String(Math.floor(diff / 60000)).padStart(2, "0");
      const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, "0");
      setElapsedTime(`${minutes}:${seconds}`);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const fetchCurrentAttendanceStatus = async () => {
    if (!activeClassId) return;
    try {
      const res = await axios.get(`http://127.0.0.1:8080/api/attendance/session/${activeClassId}`);
      
      if (res.data && res.data.success) {
        if (res.data.instructor_first_name) {
          setInstructorName(
            `${formatName(res.data.instructor_first_name)} ${formatName(res.data.instructor_last_name)}`
          );
        }

        if (res.data.instructor_detected) {
          setInstructorDetected(true);
        }

        const rawStudentsList = res.data.logged || res.data.students || [];
        const mappedStudents = rawStudentsList.map((s) => ({
          student_id: s.student_id,
          first_name: s.first_name || "",
          last_name: s.last_name || "",
          status: s.status || "Present",
          spoof_status: s.spoof_status || "Real",
          time: s.time ? convertTo12Hour(s.time) : "" 
        }));

        setRecognized(mappedStudents);
      }
    } catch (err) {
      console.error("Failed to sync database logs with frontend interface:", err);
    }
  };

  const convertTo12Hour = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("AM") || timeStr.includes("PM")) return timeStr;
    
    try {
      const [hours, minutes] = timeStr.split(":");
      const hourInt = parseInt(hours, 10);
      const ampm = hourInt >= 12 ? "PM" : "AM";
      const formattedHour = hourInt % 12 || 12;
      return `${String(formattedHour).padStart(2, "0")}:${minutes} ${ampm}`;
    } catch (e) {
      return timeStr;
    }
  };

  useEffect(() => {
    if (!activeClassId) return;

    let stream;
    isDetectingRef.current = true;

    const init = async () => {
      try {
        await fetchCurrentAttendanceStatus();

        const [, userStream] = await Promise.all([
          loadModels(),
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 }
            }
          }),
        ]);

        stream = userStream;
        videoRef.current.srcObject = userStream;

        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });

        setIsStarting(false);
        startTimer();
        await new Promise((res) => setTimeout(res, 300));
        startDetectionLoop();
      } catch (err) {
        console.error("Initialization failed:", err);
      }
    };

    init();

    const dbSyncInterval = setInterval(() => {
      if (isDetectingRef.current && !isStopping) {
        fetchCurrentAttendanceStatus();
      }
    }, 5000);

    return () => {
      isDetectingRef.current = false;
      clearInterval(dbSyncInterval);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      stopTimer();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [activeClassId]);

  const startDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 40; 

    const processFrame = async (now) => {
      if (
        !isDetectingRef.current ||
        !video ||
        video.videoWidth === 0 ||
        video.videoHeight === 0
      ) {
        if (isDetectingRef.current) {
          rafIdRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      if (now - lastDetectionTime < DETECTION_INTERVAL) {
        rafIdRef.current = requestAnimationFrame(processFrame);
        return;
      }
      lastDetectionTime = now;

      let detections = [];
      try {
        detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.10 })
        );
      } catch (err) {
        console.error("Detection error:", err);
        rafIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const width = video.videoWidth;
      const height = video.videoHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);

      const facesToSend = [];
      setFaceCount(detections.length);

      if (detections.length > 0) {
        detections.forEach((detection, idx) => {
          const box = detection.box;
          
          const paddingW = Math.round(box.width * 0.03);
          const paddingH = Math.round(box.height * 0.03);
          
          const rawX = Math.max(0, box.x - paddingW);
          const y = Math.max(0, box.y - paddingH);
          const boxW = Math.min(width - rawX, box.width + paddingW * 2);
          const boxH = Math.min(height - y, box.height + paddingH * 2);
          
          const x = width - rawX - boxW; 

          if (boxW <= 3 || boxH <= 3) return;

          // 1. Tumingin sa memory overlays reference kung ang mukha na ito ay verified na spoof target
          const matchedOverlay = currentFrameOverlaysRef.current.find((overlay) => {
            const centerX = x + boxW / 2;
            const centerY = y + boxH / 2;
            return (
              centerX >= overlay.bounds.x &&
              centerX <= overlay.bounds.x + overlay.bounds.width &&
              centerY >= overlay.bounds.y &&
              centerY <= overlay.bounds.y + overlay.bounds.height
            );
          });

          // 2. 💡 ENHANCEMENT: Conditional Canvas Styling Pass based on liveness signal flags
          const faceIsSpoof = matchedOverlay?.isSpoof === true;

          if (faceIsSpoof) {
            ctx.strokeStyle = "#950606"; // Crimson Red Boundary para sa Spoof
            ctx.fillStyle = "#950606";   // Red Label Background
          } else {
            ctx.strokeStyle = "#008C45"; // Emerald Green para sa Real o valid human streams
            ctx.fillStyle = "#0A3A23";   // Dark Green Background
          }

          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          ctx.strokeRect(x, y, boxW, boxH);

          // 💡 ENHANCEMENT: Kapag spoof, "SPOOF ATTEMPTED" ang ipipinta, kung hindi ay name/scanning
          const labelText = faceIsSpoof 
            ? "SPOOF ATTEMPTED" 
            : matchedOverlay 
              ? matchedOverlay.name 
              : "Scanning...";

          ctx.font = "700 12px Inter, sans-serif";
          const textWidth = ctx.measureText(labelText).width;
          
          ctx.fillRect(x - 1.5, y - 24, textWidth + 14, 24);
          ctx.fillStyle = "#F5F3F0"; // Off-white font canvas layer color
          ctx.fillText(labelText, x + 6, y - 7);

          const faceBase64 = cropFace(video, rawX, y, boxW, boxH);
          if (faceBase64) {
            facesToSend.push({
              base64: faceBase64,
              bounds: { x, y, width: boxW, height: boxH }
            });
          }
        });

        if (facesToSend.length > 0 && !isProcessingFrame.current) {
          const nowMs = Date.now();
          if (nowMs - lastSentRef.current > 1500) {
            lastSentRef.current = nowMs;
            isProcessingFrame.current = true;
            sendFaces(facesToSend)
              .catch((err) => console.error("Recognition Pipeline Error:", err))
              .finally(() => {
                isProcessingFrame.current = false;
              });
          }
        }
      } else {
        currentFrameOverlaysRef.current = [];
      }

      if (isDetectingRef.current) {
        rafIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    rafIdRef.current = requestAnimationFrame(processFrame);
  };

  const sendFaces = async (facesWithBounds) => {
    if (!isDetectingRef.current || isStopping) return;
    abortControllerRef.current = new AbortController();

    const base64Payload = facesWithBounds.map(f => f.base64);

    try {
      const res = await axios.post(
        "http://127.0.0.1:8080/api/face/multi-recognize",
        { faces: base64Payload, class_id: activeClassId },
        { signal: abortControllerRef.current.signal }
      );

      if (res.data && typeof res.data.instructor_detected !== "undefined") {
        if (res.data.instructor_detected) {
          setInstructorDetected(true);
        }
      }
      
      if (res.data.instructor_first_name) {
        setInstructorName(
          `${formatName(res.data.instructor_first_name)} ${formatName(res.data.instructor_last_name)}`
        );
      }

      const nextOverlays = [];

      // I-update si Latest Log Card Overlay gamit si 'latest_face' structural node
      if (res.data && res.data.latest_face) {
        const lf = res.data.latest_face;
        
        let resolvedName = "Unknown Face";
        if (lf.status === "Spoof Attempt") {
          resolvedName = "Spoof Attempt";
        } else if (lf.status === "Instructor Present") {
          resolvedName = `${formatName(lf.first_name || "")} ${formatName(lf.last_name || "")} (Instructor)`;
        } else if (lf.first_name || lf.last_name) {
          resolvedName = `${formatName(lf.first_name || "")} ${formatName(lf.last_name || "")}`;
        }

        setLatestLog({
          name: resolvedName,
          status: lf.status || "Present",
          spoof_status: lf.spoof_status || "Real",
          time: lf.time || ""
        });
      }

      // --- LIVE OVERLAYS COLOR INJECTION MAP Core Loop Sequence ---
      // Kung may natukoy na valid profiles o spoof log signatures, ipapasa natin sa box rendering tracker
      if (res.data?.latest_face && facesWithBounds[0]) {
        const lf = res.data.latest_face;
        const currentIsSpoof = lf.spoof_status?.toLowerCase() === "spoof";
        
        nextOverlays.push({
          name: currentIsSpoof ? "SPOOF ATTEMPTED" : lf.first_name ? `${formatName(lf.first_name)} ${formatName(lf.last_name || "")}` : "Unknown Face",
          bounds: facesWithBounds[0].bounds,
          isSpoof: currentIsSpoof
        });
      }

      if (res.data?.logged?.length > 0) {
        res.data.logged.forEach((s, idx) => {
          const studentName = `${formatName(s.first_name || "")} ${formatName(s.last_name || "")}`;
          // I-skip ang unang index kung nasakop na ito ng latest_face structural checkpoint tracking pass sa itaas
          if (idx > 0 && facesWithBounds[idx]) {
            nextOverlays.push({
              name: studentName,
              bounds: facesWithBounds[idx].bounds,
              isSpoof: false
            });
          }

          // I-append sa real-time activity roster array safely
          setRecognized((prev) => {
            const updated = [...prev];
            const newFace = {
              student_id: s.student_id,
              first_name: formatName(s.first_name || ""),
              last_name: formatName(s.last_name || ""),
              status: s.status || "Present",
              spoof_status: s.spoof_status || "Real",
              time: convertTo12Hour(s.time),
            };
            const index = updated.findIndex((f) => f.student_id === newFace.student_id);
            if (index !== -1) {
              const existingTime = updated[index].time;
              updated[index] = { ...updated[index], ...newFace, time: existingTime ? existingTime : newFace.time };
            } else {
              updated.unshift(newFace);
            }
            return updated;
          });
        });
      }

      currentFrameOverlaysRef.current = nextOverlays;

    } catch (err) {
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
      console.error("Frame recognition error handled:", err);
    }
  };

  const cropFace = (video, x, y, boxW, boxH) => {
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    const targetSize = 224; 
    tmp.width = targetSize;
    tmp.height = targetSize;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);

    ctx.drawImage(video, x, y, boxW, boxH, 0, 0, targetSize, targetSize);
    return tmp.toDataURL("image/jpeg", 0.85);
  };

  const handleStopSession = async () => {
    try {
      setIsStopping(true);
      isDetectingRef.current = false;

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      stopTimer();

      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }

      const res = await axios.post(`http://127.0.0.1:8080/api/attendance/stop-session`, {
        class_id: activeClassId,
      });

      const resolvedClassId = res.data?.class?.class_id || activeClassId;
      if (resolvedClassId) {
        localStorage.setItem("lastClassId", resolvedClassId);
      }
      if (onStopSession) onStopSession();
    } catch (error) {
      console.error("Error stopping session:", error);
    } finally {
      setIsStopping(false);
    }
  };

  const isSpoof = latestLog?.spoof_status?.toLowerCase() === "spoof";
  const isUnknown = latestLog?.status === "Unknown Face";

  return (
    <div className="flex flex-col lg:flex-row items-stretch justify-between w-full min-h-screen bg-[#F5F3F0] p-6 gap-6 font-sans antialiased text-[#0A3A23]">
      
      {/* LEFT CAMERA PANEL CONTAINER */}
      <div className="relative flex-[3] flex flex-col items-center justify-center bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden p-3 min-h-[500px]">
        {isStarting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F5F3F0] space-y-3">
            <div className="w-10 h-10 border-4 border-[#008C45] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-neutral-500 tracking-wide">Opening camera...</p>
          </div>
        )}

        <div className="relative w-full h-full overflow-hidden rounded-xl bg-neutral-900">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover transform scale-x-[-1]"
          />
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
          />

          {/* DYNAMIC FLOATING OVERLAY CARD (TOP LEFT) */}
          {latestLog && (
            <div className={`absolute top-4 left-4 z-10 w-full max-w-[260px] backdrop-blur-md border shadow-2xl rounded-xl p-3.5 flex flex-col gap-2.5 pointer-events-auto transition-all duration-300 animate-fadeIn ${
              isSpoof 
                ? "bg-red-50/95 border-red-200 text-red-900 shadow-red-900/10" 
                : isUnknown
                  ? "bg-amber-50/95 border-amber-200 text-amber-900"
                  : "bg-white/95 border-neutral-200/60 text-[#0A3A23]"
            }`}>
              
              <div className="flex items-start gap-2.5 min-w-0">
                {/* CONDITIONAL ICON INJECTION PASS */}
                {isSpoof ? (
                  <div className="p-2 bg-red-100 rounded-lg shrink-0 text-red-600 animate-pulse">
                    <ShieldAlert size={18} />
                  </div>
                ) : isUnknown ? (
                  <div className="p-2 bg-amber-100 rounded-lg shrink-0 text-amber-600">
                    <UserX size={18} />
                  </div>
                ) : (
                  <div className="p-2 bg-emerald-50 rounded-lg shrink-0 text-emerald-600">
                    <ScanFace size={18} />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider block mb-0.5 ${
                    isSpoof ? "text-red-500" : isUnknown ? "text-amber-500" : "text-neutral-400"
                  }`}>
                    Latest Detected
                  </span>
                  
                  <h5 className="font-extrabold text-xs truncate leading-tight">
                    {latestLog.name}
                  </h5>

                  {/* ALITUNTUNIN: Tanggalin ang time string kapag Real o Valid Identity */}
                  {!isSpoof && !isUnknown && latestLog.time && (
                    <p className="text-[10px] text-neutral-500 font-medium mt-1">
                      Logged at {latestLog.time}
                    </p>
                  )}
                </div>
              </div>

              <div className={`flex items-center justify-between gap-1.5 pt-2 border-t ${
                isSpoof ? "border-red-200/60" : isUnknown ? "border-amber-200/60" : "border-neutral-100"
              }`}>
                {/* Liveness Status / Anti-Spoof indicator label */}
                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  isSpoof 
                    ? "bg-red-600 text-white font-black animate-bounce" 
                    : isUnknown
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                }`}>
                  {latestLog.spoof_status}
                </span>

                {/* Attendance Status Badge (Itatago kapag Spoof o Unknown) */}
                {!isSpoof && !isUnknown && (
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    latestLog.status === "Late" 
                      ? "bg-[#FDCC0D] text-[#0A3A23]" 
                      : latestLog.status === "Absent" 
                        ? "bg-[#950606] text-white" 
                        : "bg-[#008C45] text-white"
                  }`}>
                    {latestLog.status}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* BOTTOM CONTROLS OVERLAY */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
            <div className="bg-[#0A3A23]/90 backdrop-blur-md text-[#F5F3F0] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase border border-white/10 shadow-lg pointer-events-auto">
              {faceCount} {faceCount === 1 ? "Face Detected" : "Faces Detected"}
            </div>

            <button
              onClick={handleStopSession}
              disabled={isStopping}
              className={`pointer-events-auto px-5 py-2.5 rounded-xl font-bold tracking-wide text-xs uppercase shadow-xl border border-transparent text-white transition-all duration-200 ${
                isStopping 
                  ? "bg-neutral-500 cursor-not-allowed opacity-50" 
                  : "bg-[#950606] hover:bg-[#950606]/90 transform active:scale-95"
              }`}
            >
              {isStopping ? "Stopping..." : "Stop Session"}
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT METRICS & RECORD LOG PANEL */}
      <div className="flex-[1.2] flex flex-col bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-6 overflow-hidden max-h-screen">
        
        {/* INSTRUCTOR VERIFICATION MATRIX SECTION */}
        <div className="mb-5 pb-5 border-b border-neutral-100">
          <p className="text-[11px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Live Supervisor Node</p>
          <div className="flex items-center justify-between bg-[#F5F3F0] p-3.5 rounded-xl border border-neutral-200/40">
            <div className="overflow-hidden pr-2 flex-1">
              <h4 className="text-xs text-neutral-400 font-medium">Instructor Assigned</h4>
              <p className="text-sm font-bold truncate mt-0.5 text-[#0A3A23]">
                {instructorName ? instructorName : "No Instructor Assigned"}
              </p>
            </div>
            <div className="shrink-0">
              {instructorDetected ? (
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#008C45]/10 text-[#008C45] border border-[#008C45]/20">
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#950606]/10 text-[#950606] border border-[#950606]/20 animate-pulse">
                  Missing
                </span>
              )}
            </div>
          </div>
        </div>

        {/* METADATA SUMMARY CARD */}
        <div className="mb-5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-base font-extrabold tracking-tight text-[#0A3A23] truncate">
              {subjectCode && subjectTitle ? `${subjectCode} — ${subjectTitle}` : "Live Feed Stream"}
            </h3>
            <span className="shrink-0 font-mono text-xs font-bold text-[#008C45] bg-[#008C45]/10 px-2.5 py-1 rounded-lg">
              {elapsedTime}
            </span>
          </div>
          
          <p className="text-xs text-neutral-500 font-medium leading-relaxed">
            {course} {section} • {semester} • SY {schoolYear}
          </p>
          <p className="text-[11px] text-neutral-400 font-semibold mt-1">
            {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* ATTENDANCE SCROLLABLE REAL-TIME ROSTER LOG */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[11px] uppercase tracking-widest font-bold text-neutral-400">Activity Roster</h4>
            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-bold">
              {recognized.length} Logged
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 max-h-[380px] lg:max-h-[440px] scrollbar-thin scrollbar-thumb-neutral-200">
            {recognized.length === 0 ? (
              <div className="h-28 flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-neutral-100 rounded-xl">
                <p className="text-xs text-neutral-400 italic font-medium">No students logged yet. Waiting for faces...</p>
              </div>
            ) : (
              recognized.map((student) => {
                let badgeStyle = "bg-[#008C45] text-white";
                if (student.status === "Late") badgeStyle = "bg-[#FDCC0D] text-[#0A3A23]";
                if (student.status === "Absent") badgeStyle = "bg-[#950606] text-white";

                return (
                  <div
                    key={student.student_id}
                    className="flex items-center justify-between bg-white border border-neutral-100 rounded-xl p-3 shadow-2xs hover:border-neutral-200/80 hover:bg-[#F5F3F0]/20 transition-all duration-150"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-sm text-[#0A3A23] truncate">
                        {student.first_name} {student.last_name}
                      </p>
                      <p className="text-xs text-neutral-400 font-medium mt-0.5 flex items-center gap-1">
                        <span>{student.student_id}</span>
                        <span className="text-neutral-300">•</span>
                        <span className="font-mono text-[11px] text-neutral-500">{student.time}</span>
                      </p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1.5 rounded-lg ${badgeStyle}`}>
                      {student.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AttendanceLiveSession;