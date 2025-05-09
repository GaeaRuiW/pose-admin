import { mockDashboardMetrics, mockDataAnalysisChartData } from "@/lib/mockData";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { DataAnalysisChart } from "@/components/dashboard/DataAnalysisChart";
import { BriefcaseMedical, Users, Video, BarChart3 } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";

function DashboardContent() {
  const metrics = mockDashboardMetrics;
  const chartData = mockDataAnalysisChartData;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard 
          title="Total Doctors" 
          value={metrics.doctorCount} 
          icon={BriefcaseMedical} 
          description="Number of active doctors" 
        />
        <MetricsCard 
          title="Total Patients" 
          value={metrics.patientCount} 
          icon={Users} 
          description="Registered patients in system" 
        />
        <MetricsCard 
          title="Uploaded Videos" 
          value={metrics.videoCount} 
          icon={Video} 
          description="Consultation videos" 
        />
        <MetricsCard 
          title="Data Analyses" 
          value={metrics.dataAnalysisCount} 
          icon={BarChart3} 
          description="Analyses performed" 
        />
      </div>
      <DataAnalysisChart data={chartData} />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppLayout>
      <DashboardContent />
    </AppLayout>
  );
}
