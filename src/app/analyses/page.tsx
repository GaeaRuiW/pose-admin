
// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Analysis, Patient, Video } from '@/types'; // Assuming Analysis type is defined
import { AnalysesTable } from '@/components/analyses/AnalysesTable';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

function AnalysisManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentUser } = useAuth(); 
  
  const filterPatientIdParam = searchParams.get('patientId');
  const filterVideoIdParam = searchParams.get('videoId');


  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  // const [patients, setPatients] = useState<Patient[]>([]); // May need if filtering by patient name directly or showing patient dropdown
  // const [videos, setVideos] = useState<Video[]>([]); // May need if filtering by video name directly

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingAnalysisId, setDeletingAnalysisId] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  const fetchAnalyses = useCallback(async () => {
    if (!currentUser?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/management/actions?admin_doctor_id=${currentUser.id}`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(`Failed to fetch analyses: ${response.status} ${errData.detail || response.statusText}`);
      }
      const data: Analysis[] = await response.json();
      setAnalyses(data.map(a => ({
        ...a, 
        id: String(a.id), 
        patient_id: String(a.patient_id), 
        video_id: String(a.video_id),
        parent_id: a.parent_id ? String(a.parent_id) : null,
      })));
    } catch (e) {
      setError((e as Error).message);
      toast({ title: "Error", description: "Could not fetch analyses.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast]);

  useEffect(() => {
    fetchAnalyses();
  }, [fetchAnalyses]);

  const handleSort = (key: string) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortData = <T,>(data: T[], config: SortConfig | null, keyAccessor: (item: T, key: string) => any): T[] => {
    if (!config) return data;
    const { key, direction } = config;
    return [...data].sort((a, b) => {
      const aValue = keyAccessor(a, key);
      const bValue = keyAccessor(b, key);
  
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;
  
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
      } else {
        comparison = String(aValue).toLowerCase().localeCompare(String(bValue).toLowerCase());
      }
      return direction === 'ascending' ? comparison : -comparison;
    });
  };

  const displayedAnalyses = useMemo(() => {
    let filtered = analyses;
    if (filterPatientIdParam) {
      filtered = filtered.filter(analysis => analysis.patient_id === filterPatientIdParam);
    }
    if (filterVideoIdParam) {
      filtered = filtered.filter(analysis => analysis.video_id === filterVideoIdParam);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(analysis =>
        (analysis.id.toString().toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.patient_username?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.status?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.progress?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.original_video_path?.split('/').pop()?.toLowerCase() || '').includes(lowerSearchTerm)
      );
    }

    const analysisKeyAccessor = (analysis: Analysis, key: string) => {
        switch(key) {
            case 'id': return parseInt(analysis.id);
            case 'patient_username': return analysis.patient_username;
            case 'video_id': return analysis.original_video_path?.split('/').pop(); // Sort by filename
            case 'status': return analysis.status;
            case 'progress': return analysis.progress;
            case 'create_time': return analysis.create_time;
            default: return (analysis as any)[key];
        }
    }
    return sortData(filtered, sortConfig, analysisKeyAccessor);
  }, [analyses, filterPatientIdParam, filterVideoIdParam, searchTerm, sortConfig]);


  const handleDeleteAnalysis = (analysisId: string) => setDeletingAnalysisId(analysisId);

  const confirmDeleteAnalysis = async () => {
    if (!deletingAnalysisId || !currentUser?.id) return;
    const payload = {
        admin_doctor_id: parseInt(currentUser.id),
        action_id: parseInt(deletingAnalysisId),
    };
    try {
      const response = await fetch(`${API_BASE_URL}/management/action`, { // Assuming endpoint is /management/action for delete
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Failed to delete analysis: ${response.statusText}`);
      }
      toast({ title: "Analysis Deleted", description: `Analysis ${deletingAnalysisId} has been deleted.`, variant: "destructive" });
      fetchAnalyses(); // Refresh analysis list
    } catch (e) {
      toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
    setDeletingAnalysisId(null);
  };


  if (isLoading && !error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis Management</h1>
        <Skeleton className="h-10 w-1/3 mb-4" /> 
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" /> 
          <Skeleton className="h-64 w-full" /> 
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-destructive">
        <AlertCircle className="w-16 h-16" />
        <h2 className="text-2xl font-semibold">Error Loading Analyses</h2>
        <p className="text-center">{error}</p>
        <Button onClick={() => { fetchAnalyses(); }}>Retry</Button>
      </div>
    )
  }

  // TODO: Add logic to fetch patient/video names for filter descriptions if params are present
  // const patientForFilteredAnalyses = ...
  // const videoForFilteredAnalyses = ...

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Analysis Management</h1>
      
      <div className="flex justify-between items-center mb-2">
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search analyses..."
              className="pl-10 h-10 bg-card border-border focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* Add Analysis Button can be added here if needed (e.g. re-run) */}
      </div>

      {/* TODO: Add filter description notices here if patientIdParam or videoIdParam is active */}
      
      <AnalysesTable 
        analyses={displayedAnalyses}
        onDelete={handleDeleteAnalysis}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <AlertDialog open={!!deletingAnalysisId} onOpenChange={(open) => !open && setDeletingAnalysisId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark the analysis (Action ID: {deletingAnalysisId}) as deleted. This may also affect associated inference videos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAnalysisId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnalysis} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AnalysisManagementPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex justify-center items-center h-64 text-muted-foreground">Loading analysis data...</div>}>
        <AnalysisManagementContent />
      </Suspense>
    </AppLayout>
  );
}
