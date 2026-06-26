// src/components/Instructor/InstructorOverview.jsx
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { 
  getInstructorOverviewStats, 
  getInstructorAttendanceTrend, 
  getAttendanceByYearLevel, 
  getClassMatrix 
} from "../../services/api"; 

// Import ng mga modular sections natin
import InstructorStatCards from "./Overview/InstructorStatCards";
import InstructorCharts from "./Overview/InstructorCharts";
import InstructorClassMatrix from "./Overview/InstructorClassMatrix";

const InstructorOverview = ({ setActiveTab }) => {
  const [overviewData, setOverviewData] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [yearLevelData, setYearLevelData] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  const instructor = JSON.parse(localStorage.getItem("userData"));

  useEffect(() => {
    if (!instructor?.instructor_id) {
      toast.error("Instructor not logged in.");
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Sabay-sabay na tatawagin ang apat na endpoints gamit ang modular api functions
        const [overviewRes, trendRes, yearLevelRes, classRes] = await Promise.all([
          getInstructorOverviewStats(instructor.instructor_id),
          getInstructorAttendanceTrend(instructor.instructor_id),
          getAttendanceByYearLevel(instructor.instructor_id),
          getClassMatrix(instructor.instructor_id)
        ]);

        setOverviewData(overviewRes);
        setTrendData(trendRes);
        setYearLevelData(yearLevelRes);
        setClassSummary(classRes);
      } catch (err) {
        console.error("❌ Framework Error loading academic data:", err);
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
    );
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

      {/* ROW 1: 4 Mini Cards + Large Donut Card Block inside StatCards Component */}
      <InstructorStatCards overviewData={overviewData} setActiveTab={setActiveTab} />

      {/* ROW 2: Wide Area Graph + 4-Year Bar Chart via 2-Column Grid Wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        <div className="lg:col-span-2">
          <InstructorCharts mode="trend" trendData={trendData} />
        </div>
        <div>
          <InstructorCharts mode="bar" yearLevelData={yearLevelData} />
        </div>
      </div>

      {/* ROW 3: Full-Width Class Matrix Table Workload */}
      <div className="w-full">
        <InstructorClassMatrix classSummary={classSummary} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default InstructorOverview;