
// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Analysis } from '@/types'; 
import { AnalysesTable } from '@/components/analyses/AnalysesTable';
import { Input } from '@/components/ui/input';
import { Search, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast as useShadcnToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/AppLayout";
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type SortDirection = 'ascending' | 'descending';
interface SortConfig {
  key: string;
  direction: SortDirection;
}

function AnalysisManagementContent() {
  const t = useTranslations('AnalysesPage');
  const tCommon = useTranslations('Common');
  const tToast = useTranslations('ToastMessages');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useShadcnToast();
  const { currentUser } = useAuth(); 
  
  const filterPatientIdParam = searchParams.get('patientId');
  const filterVideoIdParam = searchParams.get('videoId');
  const filterAnalysisIdParam = searchParams.get('analysisId');
  const filterParentIdParam = searchParams.get('parentId');

  const [analyses, setAnalyses] = useState<Analysis[]>([]);
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
        throw new Error(errData.detail || `Failed to fetch analyses: ${response.statusText}`);
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
      const errorMessage = (e as Error).message;
      setError(errorMessage);
      toast({ title: tToast('error'), description: tToast('fetchAnalysesError'), variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, toast, tToast]);

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
    if (filterAnalysisIdParam) {
        filtered = filtered.filter(analysis => analysis.id === filterAnalysisIdParam);
    }
    if (filterParentIdParam) {
        filtered = filtered.filter(analysis => analysis.parent_id === filterParentIdParam);
    }
    
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(analysis =>
        (analysis.id.toString().toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.parent_id?.toString().toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.patient_username?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.status?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.progress?.toLowerCase() || '').includes(lowerSearchTerm) ||
        (analysis.original_video_path?.split('/').pop()?.toLowerCase() || '').includes(lowerSearchTerm)
      );
    }

    const analysisKeyAccessor = (analysis: Analysis, key: string) => {
        switch(key) {
            case 'id': return parseInt(analysis.id);
            case 'parent_id': return analysis.parent_id ? parseInt(analysis.parent_id) : null;
            case 'patient_username': return analysis.patient_username;
            case 'video_id': return analysis.original_video_path?.split('/').pop();
            case 'status': return analysis.status;
            case 'progress': return analysis.progress;
            case 'create_time': return analysis.create_time;
            default: return (analysis as any)[key];
        }
    }
    return sortData(filtered, sortConfig, analysisKeyAccessor);
  }, [analyses, filterPatientIdParam, filterVideoIdParam, filterAnalysisIdParam, filterParentIdParam, searchTerm, sortConfig]);


  const handleDeleteAnalysis = (analysisId: string) => setDeletingAnalysisId(analysisId);

  const confirmDeleteAnalysis = async () => {
    if (!deletingAnalysisId || !currentUser?.id) return;
    const payload = {
        admin_doctor_id: parseInt(currentUser.id),
        action_id: parseInt(deletingAnalysisId),
    };
    try {
      const response = await fetch(`${API_BASE_URL}/management/action`, { 
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || tToast('deleteAnalysisError', {statusText: response.statusText}));
      }
      toast({ title: t('analysisDeletedToast'), description: t('analysisDeletedDesc', {analysisId: deletingAnalysisId}), variant: "destructive" });
      fetchAnalyses(); 
    } catch (e) {
      toast({ title: tToast('error'), description: (e as Error).message, variant: "destructive" });
    }
    setDeletingAnalysisId(null);
  };


  if (isLoading && !error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
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
        <h2 className="text-2xl font-semibold">{t('errorLoadingAnalyses')}</h2>
        <p className="text-center">{error}</p>
        <Button onClick={() => { fetchAnalyses(); }}>{tCommon('retry')}</Button>
      </div>
    )
  }
  
  const patientForFiltered = filterPatientIdParam ? analyses.find(a => a.patient_id === filterPatientIdParam)?.patient_username : null;
  const videoForFiltered = filterVideoIdParam ? analyses.find(a => a.video_id === filterVideoIdParam)?.original_video_path?.split('/').pop() : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('title')}</h1>
      
      <div className="flex justify-between items-center mb-2">
          <div className="relative w-full sm:w-auto sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('searchPlaceholder')}
              className="pl-10 h-10 bg-card border-border focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
      </div>

      {filterPatientIdParam && patientForFiltered && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
          <p className="text-sm text-primary font-medium">
            {t('showingAnalysesForPatient', {patientName: patientForFiltered})}
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20" onClick={() => router.push('/analyses')}>
            {t('showAllAnalyses')}
          </Button>
        </div>
      )}
       {filterVideoIdParam && videoForFiltered && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
          <p className="text-sm text-primary font-medium">
            {t('showingAnalysesForVideo', {videoName: videoForFiltered})}
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20" onClick={() => router.push('/analyses')}>
            {t('showAllAnalyses')}
          </Button>
        </div>
      )}
      {filterAnalysisIdParam && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
          <p className="text-sm text-primary font-medium">
            {t('showingDetailsForAnalysis', {analysisId: filterAnalysisIdParam})}
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20" onClick={() => router.push('/analyses')}>
            {t('showAllAnalyses')}
          </Button>
        </div>
      )}
      {filterParentIdParam && (
        <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
          <p className="text-sm text-primary font-medium">
            {t('showingAnalysesWithParent', {parentId: filterParentIdParam})}
          </p>
          <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/20" onClick={() => router.push('/analyses')}>
            {t('showAllAnalyses')}
          </Button>
        </div>
      )}
      
      <AnalysesTable 
        analyses={displayedAnalyses}
        onDelete={handleDeleteAnalysis}
        sortConfig={sortConfig}
        onSort={handleSort}
      />

      <AlertDialog open={!!deletingAnalysisId} onOpenChange={(open) => !open && setDeletingAnalysisId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmDeleteAnalysisTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmDeleteAnalysisDescription', {analysisId: deletingAnalysisId})}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingAnalysisId(null)}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteAnalysis} className="bg-destructive hover:bg-destructive/90">{tCommon('delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function AnalysisManagementPage() {
  const t = useTranslations('AnalysesPage');
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex justify-center items-center h-64 text-muted-foreground">{t('loadingAnalysisData')}</div>}>
        <AnalysisManagementContent />
      </Suspense>
    </AppLayout>
  );
}
