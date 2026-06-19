// src/components/Instructor/InstructorOverview.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

// Import ng mga modular sections natin
import InstructorStatCards from "./Overview/InstructorStatCards";
import InstructorCharts from "./Overview/InstructorCharts";
import InstructorClassMatrix from "./Overview/InstructorClassMatrix";

const InstructorOverview = ({ setActiveTab }) => {
  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const instructor = JSON.parse(localStorage.getItem("userData"));
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!instructor?.instructor_id || !token) {
      toast.error("Instructor not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = "http://127.0.0.1:8080/api/instructor";

        // Tumawag sa tatlong endpoints nang sabay-sabay
        const [overviewRes, trendRes, classRes] = await Promise.all([
          axios.get(`${baseUrl}/${instructor.instructor_id}/overview`, { headers }),
          axios.get(`${baseUrl}/${instructor.instructor_id}/overview/attendance-trend`, { headers }),
          axios.get(`${baseUrl}/${instructor.instructor_id}/overview/classes`, { headers }),
        ]);

        setOverviewData(overviewRes.data);
        setTrendData(trendRes.data);
        setClassSummary(classRes.data);
      } catch (err) {
        console.error("❌ Framework Error loading academic data:", err.response?.data || err.message);
        toast.error("Failed to compile institutional dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-4 border-[#008C45]/20 border-t-[#008C45] rounded-full animate-spin" />
        <p className="text-[#0A3A23] text-sm font-bold tracking-wide">Syncing institution metrics pipeline...</p>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="text-center py-12 border-2 border-[#0A3A23]/10 p-6 max-w-md mx-auto rounded-2xl bg-[#0A3A23]/5">
        <p className="text-[#0A3A23] font-black">Data array connection lost.</p>
      </div>
    );s
  }

  return (
    <div className="space-y-12 px-4">
      {/* HEADER SECTION */}
      <div>
        <h2 className="text-3xl font-black text-[#0A3A23] tracking-tight">
          Academic Overview
        </h2>
        <p className="text-[11px] text-[#008C45] font-extrabold tracking-widest uppercase mt-1">
          Real-time institutional class analytics
        </p>
      </div>

      {/* MODULE 1: STAT CARDS SECTION */}
      <InstructorStatCards overviewData={overviewData} setActiveTab={setActiveTab} />

      {/* MODULE 2: INTERACTIVE RECHARTS VISUALIZATION */}
      <InstructorCharts overviewData={overviewData} trendData={trendData} />

      {/* MODULE 3: DATA MATRIX WORKLOAD */}
      <InstructorClassMatrix classSummary={classSummary} setActiveTab={setActiveTab} />
    </div>
  );
};

export default InstructorOverview;