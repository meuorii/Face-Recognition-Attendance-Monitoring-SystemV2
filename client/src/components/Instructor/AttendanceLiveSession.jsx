import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as faceapi from "face-api.js";

// Global model loader — loads once, reused across all sessions
let modelsLoaded = false;
let modelsLoadingPromise = null;

const loadModels = () => {
  if (modelsLoaded) return Promise.resolve();
  if (modelsLoadingPromise) return modelsLoadingPromise;

  modelsLoadingPromise = Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
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
  const isDetectingRef = useRef(true);
  const timerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const registeredIdsRef = useRef(new Set());
  const isProcessingFrame = useRef(false);
  const lastSentRef = useRef(0);
  const rafIdRef = useRef(null);
  const [faceCount, setFaceCount] = useState(0);

  // Mapping lookup to tie detected student coordinates directly to names on canvas
  const studentMapRef = useRef(new Map());

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

  useEffect(() => {
    if (!activeClassId) return;

    let stream;
    isDetectingRef.current = true;

    const init = async () => {
      try {
        const [, userStream] = await Promise.all([
          loadModels(),
          navigator.mediaDevices.getUserMedia({
            video: {
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30 } // Increased target frame rate for smoothness
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

    return () => {
      isDetectingRef.current = false;
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      stopTimer();
      registeredIdsRef.current.clear();
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [activeClassId]);

  const startDetectionLoop = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 100; // Smoother tracking intervals (~10fps recognition passes, high fluid layout)

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
          new faceapi.SsdMobilenetv1Options({ minConfidence: 0.25 })
        );
      } catch (err) {
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
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-width, 0);

        detections.forEach((detection, idx) => {
          const box = detection.box;
          const padding = Math.max(25, Math.round(box.width * 0.2));
          const x = Math.max(0, box.x - padding);
          const y = Math.max(0, box.y - padding);
          const boxW = Math.min(width - x, box.width + padding * 2);
          const boxH = Math.min(height - y, box.height + padding * 2);

          if (boxW <= 1 || boxH <= 1) return;

          // Box Boundary Color Selection Strategy (#008C45 Accent)
          ctx.strokeStyle = "#008C45";
          ctx.lineWidth = 3;
          ctx.lineJoin = "round";
          ctx.strokeRect(x, y, boxW, boxH);

          // Find if we have a resolved student name for this ongoing boundary index layout
          const currentLoggedArray = Array.from(studentMapRef.current.values());
          const matchingStudent = currentLoggedArray[idx] || currentLoggedArray[currentLoggedArray.length - 1 - idx];
          const labelText = matchingStudent ? `${matchingStudent.first_name} ${matchingStudent.last_name}` : "Scanning...";

          // Premium label typography backing
          ctx.fillStyle = "#0A3A23";
          ctx.font = "600 14px Inter, sans-serif";
          const textWidth = ctx.measureText(labelText).width;
          
          ctx.fillRect(x - 1.5, y - 26, textWidth + 16, 26);
          ctx.fillStyle = "#F5F3F0";
          ctx.fillText(labelText, x + 8, y - 8);

          const face = cropFace(video, x, y, boxW, boxH, width);
          if (face) facesToSend.push(face);
        });

        ctx.restore();

        if (facesToSend.length > 0 && !isProcessingFrame.current) {
          const nowMs = Date.now();
          if (nowMs - lastSentRef.current > 1200) {
            lastSentRef.current = nowMs;
            isProcessingFrame.current = true;
            sendFaces(facesToSend)
              .catch((err) => console.error("Recognition Error:", err))
              .finally(() => {
                isProcessingFrame.current = false;
              });
          }
        }
      }

      if (isDetectingRef.current) {
        rafIdRef.current = requestAnimationFrame(processFrame);
      }
    };

    rafIdRef.current = requestAnimationFrame(processFrame);
  };

  const sendFaces = async (facesToSend) => {
    if (!isDetectingRef.current || isStopping) return;
    abortControllerRef.current = new AbortController();

    try {
      const res = await axios.post(
        "http://127.0.0.1:8080/api/face/multi-recognize",
        { faces: facesToSend, class_id: activeClassId },
        { signal: abortControllerRef.current.signal }
      );

      if (typeof res.data.instructor_detected !== "undefined") {
        setInstructorDetected(res.data.instructor_detected);
        if (res.data.instructor_detected) {
          setInstructorName(
            `${formatName(res.data.instructor_first_name)} ${formatName(
              res.data.instructor_last_name
            )}`
          );
        }
      }

      if (res.data?.logged?.length > 0) {
        const enrichedData = res.data.logged.map((s) => ({
          student_id: s.student_id,
          first_name: formatName(s.first_name || ""),
          last_name: formatName(s.last_name || ""),
          status: s.status || "Present",
          time:
            s.time ||
            new Date().toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
        }));

        setRecognized((prev) => {
          const updated = [...prev];
          enrichedData.forEach((newFace) => {
            studentMapRef.current.set(newFace.student_id, newFace);
            const index = updated.findIndex((f) => f.student_id === newFace.student_id);
            if (index !== -1) {
              updated[index] = { ...updated[index], ...newFace };
            } else {
              updated.unshift(newFace); // Unshift pushes new records perfectly to the top
            }
          });
          return updated;
        });
      }
    } catch (err) {
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
      console.error("Frame recognition transaction anomaly skipped:", err);
    }
  };

  const cropFace = (video, x, y, boxW, boxH, videoWidth) => {
    const tmp = document.createElement("canvas");
    const ctx = tmp.getContext("2d");
    const targetSize = 224;
    tmp.width = targetSize;
    tmp.height = targetSize;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);

    const mirroredX = videoWidth - (x + boxW);
    ctx.drawImage(video, mirroredX, y, boxW, boxH, 0, 0, targetSize, targetSize);

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

  return (
    <div className="flex flex-col lg:flex-row items-stretch justify-between w-full min-h-screen bg-[#F5F3F0] p-6 gap-6 font-sans antialiased text-[#0A3A23]">
      
      {/* LEFT CAMERA PANEL CONTAINER */}
      <div className="relative flex-[3] flex flex-col items-center justify-center bg-white rounded-2xl border border-neutral-200/80 shadow-sm overflow-hidden p-3 min-h-[500px]">
        
        {isStarting && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#F5F3F0] space-y-3">
            <div className="w-10 h-10 border-4 border-[#008C45] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-medium text-neutral-500 tracking-wide">Securing visual hardware streaming channel...</p>
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

          {/* Minimalist Floating Overlay Controls */}
          <div className="absolute bottom-5 left-5 right-5 z-10 flex items-center justify-between pointer-events-none">
            {/* Live Counter Tracking Frame */}
            <div className="bg-[#0A3A23]/90 backdrop-blur-md text-[#F5F3F0] px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase border border-white/10 shadow-lg pointer-events-auto transition-transform duration-200">
              {faceCount} {faceCount === 1 ? "Face Detected" : "Faces Detected"}
            </div>

            {/* Quick Kill Action Switch */}
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
      <div className="flex-[1.2] flex flex-col bg-white rounded-2xl border border-neutral-200/80 shadow-sm p-6 overflow-hidden">
        
        {/* INSTRUCTOR VERIFICATION MATRIX SECTION */}
        <div className="mb-5 pb-5 border-b border-neutral-100">
          <p className="text-[11px] uppercase tracking-widest font-bold text-neutral-400 mb-2">Live Supervisor Node</p>
          <div className="flex items-center justify-between bg-[#F5F3F0] p-3.5 rounded-xl border border-neutral-200/40">
            <div className="overflow-hidden pr-2">
              <h4 className="text-xs text-neutral-400 font-medium">Instructor Assigned</h4>
              <p className="text-sm font-bold truncate mt-0.5 text-[#0A3A23]">
                {instructorName ? instructorName : "Awaiting Verification"}
              </p>
            </div>
            <div>
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

          <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 scrollbar-thin scrollbar-thumb-neutral-200">
            {recognized.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-neutral-100 rounded-xl">
                <p className="text-xs text-neutral-400 italic font-medium">Scanning operational array space for authorized face profiles...</p>
              </div>
            ) : (
              recognized.map((student) => {
                // Inline mapping layout color selector variables
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
                      <p className="text-xs text-neutral-400 font-medium mt-0.5">
                        {student.student_id} <span className="mx-1.5 text-neutral-300">•</span> <span className="font-mono text-[11px] text-neutral-500">{student.time}</span>
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