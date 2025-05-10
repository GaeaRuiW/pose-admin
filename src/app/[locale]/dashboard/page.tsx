
// @ts-nocheck
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import type { DashboardMetrics, DataAnalysisDataPoint } from "@/types";
import { MetricsCard } from "@/components/dashboard/MetricsCard";
import { DataAnalysisChart } from "@/components/dashboard/DataAnalysisChart";
import { BriefcaseMedical, Users, Video, BarChart3, AlertCircle } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from '@/context/AuthContext';
import { useToast as useShadcnToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

function DashboardContent() {
  const t = useTranslations('DashboardPage');
  const tToast = useTranslations('ToastMessages');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<DataAnalysisDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const { toast } = useShadcnToast();

  const fetchData = async () => {
    if (!currentUser?.id) {
      setError("User not authenticated."); // This should ideally be handled by AuthContext redirect
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [metricsResponse, chartResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/management/dashboard/metrics?admin_doctor_id=${currentUser.id}`),
        fetch(`${API_BASE_URL}/management/dashboard/analysis-trends?admin_doctor_id=${currentUser.id}`)
      ]);

      if (!metricsResponse.ok) {
        const errData = await metricsResponse.json();
        throw new Error(errData.detail || `Failed to fetch metrics: ${metricsResponse.statusText}`);
      }
      const metricsData: DashboardMetrics = await metricsResponse.json();
      setMetrics(metricsData);

      if (!chartResponse.ok) {
        const errData = await chartResponse.json();
        throw new Error(errData.detail || `Failed to fetch chart data: ${chartResponse.statusText}`);
      }
      const chartDataFromServer: DataAnalysisDataPoint[] = await chartResponse.json();
      setChartData(chartDataFromServer);

    } catch (e) {
      console.error("Dashboard fetch error:", e);
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      toast({
        title: tToast('fetchDashboardError'),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  // fetchData is memoized by useCallback in newer patterns, but direct call here is fine for now.


  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive p-6 rounded-lg border border-destructive/50 bg-destructive/10">
        <AlertCircle className="w-16 h-16" />
        <h2 className="text-2xl font-semibold">{t('errorLoading')}</h2>
        <p className="text-center max-w-md">{error}</p>
        <Button onClick={fetchData} variant="destructive">{t('retry')}</Button>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>{t('noData')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricsCard
          title={t('totalDoctors')}
          value={metrics.doctorCount}
          icon={BriefcaseMedical}
          description={t('totalDoctorsDesc')}
        />
        <MetricsCard
          title={t('totalPatients')}
          value={metrics.patientCount}
          icon={Users}
          description={t('totalPatientsDesc')}
        />
        <MetricsCard
          title={t('uploadedVideos')}
          value={metrics.videoCount}
          icon={Video}
          description={t('uploadedVideosDesc')}
        />
        <MetricsCard
          title={t('dataAnalyses')}
          value={metrics.dataAnalysisCount}
          icon={BarChart3}
          description={t('dataAnalysesDesc')}
        />
      </div>
      {chartData.length > 0 ? (
        <DataAnalysisChart data={chartData} />
      ) : (
        <div className="p-4 text-center text-muted-foreground bg-card rounded-lg shadow-md h-[350px] flex items-center justify-center">
          {t('noTrendData')}
        </div>
      )}
    </div>
  );
}

const CardSkeleton = () => (
  <div className="p-4 bg-card rounded-lg shadow-md space-y-2">
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-8 w-1/2" />
    <Skeleton className="h-4 w-full" />
  </div>
);

const ChartSkeleton = () => {
  const t = useTranslations('DashboardPage');
  return (
    <div className="p-4 bg-card rounded-lg shadow-md">
      <Skeleton className="h-5 w-1/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-4" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  );
};


export default function DashboardPage() {
  const t = useTranslations('DashboardPage');
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex justify-center items-center h-64 text-muted-foreground">{t('loading')}</div>}>
        <DashboardContent />
      </Suspense>
    </AppLayout>
  );
}
