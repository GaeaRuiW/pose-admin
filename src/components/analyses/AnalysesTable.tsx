
// @ts-nocheck
"use client";
import type { Analysis } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, Info, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";
import { useTranslations } from 'next-intl';

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

interface AnalysesTableProps {
  analyses: Analysis[];
  onDelete: (analysisId: string) => void;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
}

const SortableHeader = ({ children, sortKey, currentSort, onSort }: { children: React.ReactNode, sortKey: string, currentSort: SortConfig | null, onSort: (key: string) => void }) => {
  const isSorted = currentSort?.key === sortKey;
  const Icon = isSorted ? (currentSort.direction === 'ascending' ? ArrowUp : ArrowDown) : ChevronsUpDown;
  return (
    <Button variant="ghost" onClick={() => onSort(sortKey)} className="px-1 py-0.5 h-auto font-medium text-muted-foreground hover:text-foreground group">
      {children}
      <Icon className={`ml-2 h-4 w-4 ${isSorted ? 'text-foreground' : 'opacity-50 group-hover:opacity-100'}`} />
    </Button>
  );
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'finished':
      return 'bg-green-500 hover:bg-green-600';
    case 'running':
    case 'processing':
      return 'bg-blue-500 hover:bg-blue-600';
    case 'failed':
    case 'error':
      return 'bg-red-500 hover:bg-red-600';
    case 'waiting':
      return 'bg-yellow-500 hover:bg-yellow-600 text-black';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};


export function AnalysesTable({ analyses, onDelete, sortConfig, onSort }: AnalysesTableProps) {
  const t = useTranslations('AnalysesTable');
  
  const headers = [
    { key: 'id', label: t('analysisId'), className: 'w-[120px]' },
    { key: 'parent_id', label: t('parentId'), className: 'w-[120px]' },
    { key: 'patient_username', label: t('patient'), className: 'w-[180px]' },
    { key: 'video_id', label: t('originalVideo'), className: 'w-[200px]' }, 
    { key: 'status', label: t('status'), className: 'w-[120px]' },
    { key: 'progress', label: t('progress'), className: 'w-[200px]', sortable: false },
    { key: 'create_time', label: t('createdDate'), className: 'w-[180px]' },
    { key: 'actions', label: t('actions'), className: 'w-[80px] text-right', sortable: false },
  ];
  
  return (
    <TooltipProvider>
    <div className="rounded-lg border shadow-md overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/60">
            {headers.map(header => (
              <TableHead key={header.key} className={header.className}>
                {header.sortable !== false ? (
                  <SortableHeader sortKey={header.key} currentSort={sortConfig} onSort={onSort}>
                    {header.label}
                  </SortableHeader>
                ) : (
                  header.label
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="h-24 text-center text-muted-foreground">
                {t('noAnalysesFound')}
              </TableCell>
            </TableRow>
          ) : (
            analyses.map((analysis) => (
              <TableRow key={analysis.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-mono text-sm text-foreground">{analysis.id}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">
                  {analysis.parent_id && analysis.parent_id !== analysis.id ? (
                    <Link href={`/analyses?parentId=${analysis.parent_id}`} className="hover:underline text-primary">
                      {analysis.parent_id}
                    </Link>
                  ) : (
                    analysis.parent_id ? analysis.parent_id : '-'
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/users?tab=patients&patientId=${analysis.patient_id}`} className="hover:underline text-primary">
                    {analysis.patient_username || t('notApplicable')}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                   <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                      <Link href={`/videos?videoId=${analysis.video_id}`} className="hover:underline text-primary truncate block max-w-[180px]">
                        {analysis.original_video_path?.split('/').pop() || `${t('analysisId')}: ${analysis.video_id}`}
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="top" align="start">
                      <p className="text-xs">{analysis.original_video_path || t('notApplicable')}</p>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(analysis.status)} text-white`}>
                    {analysis.status || t('notApplicable')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs max-w-[180px] truncate" title={analysis.progress}>
                  {analysis.progress || '-'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(analysis.create_time), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">{t('openMenu')}</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <DropdownMenuItem onClick={() => alert(`${t('viewDetails')} ${t('analysisId')}: ${analysis.id}`)}>
                        <Info className="mr-2 h-4 w-4" /> {t('viewDetails')}
                      </DropdownMenuItem>
                       {analysis.status?.toLowerCase() === 'completed' || analysis.status?.toLowerCase() === 'finished' ? (
                         <DropdownMenuItem asChild>
                           <Link href={`/videos?videoId=${analysis.video_id}&playInference=true`}>
                             <ExternalLink className="mr-2 h-4 w-4" /> {t('viewProcessedVideo')}
                           </Link>
                         </DropdownMenuItem>
                       ) : null}
                      <DropdownMenuItem onClick={() => onDelete(analysis.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
    </TooltipProvider>
  );
}
