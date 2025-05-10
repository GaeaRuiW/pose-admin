
// @ts-nocheck
"use client";
import type { Video } from "@/types";
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Trash2, MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown, ExternalLink } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

interface VideosTableProps {
  videos: Video[];
  onDelete: (videoId: string) => void;
  sortConfig: SortConfig | null;
  onSort: (key: string) => void;
  apiBaseUrl: string;
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

const getVideoType = (video: Video): string => {
  if (video.original_video) return "Original";
  if (video.inference_video) return "Analysis";
  return "Unknown";
};

const getThumbnailUrl = (video: Video, apiBaseUrl: string): string => {
  const typeString = video.original_video ? "original" : (video.inference_video ? "inference" : "unknown");
  if (typeString === "unknown") return "https://picsum.photos/seed/placeholder/100/60"; // Fallback
  return `${apiBaseUrl}/videos/thumbnail_image/${typeString}/${video.patient_id}/${video.id}`;
};


export function VideosTable({ videos, onDelete, sortConfig, onSort, apiBaseUrl }: VideosTableProps) {
  
  const headers = [
    { key: 'thumbnail', label: 'Thumbnail', className: 'w-[120px]', sortable: false },
    { key: 'video_path', label: 'Video Info', className: 'w-[250px]' },
    { key: 'patient_username', label: 'Patient', className: 'w-[180px]' },
    { key: 'create_time', label: 'Upload Date', className: 'w-[180px]' },
    { key: 'action_id', label: 'Analysis ID', className: 'w-[150px]' },
    { key: 'actions', label: 'Actions', className: 'w-[80px] text-right', sortable: false },
  ];
  
  const handleViewVideo = (video: Video) => {
    const videoTypeStr = video.original_video ? "original" : "inference";
    // Construct the direct video URL. This might need adjustment if your API serves files differently.
    const videoUrl = `${apiBaseUrl}/videos/video/${videoTypeStr}/${video.patient_id}/${video.id}`;
    window.open(videoUrl, '_blank');
  };


  return (
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
          {videos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={headers.length} className="h-24 text-center text-muted-foreground">
                No videos found.
              </TableCell>
            </TableRow>
          ) : (
            videos.map((video) => (
              <TableRow key={video.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <Image 
                    src={getThumbnailUrl(video, apiBaseUrl)} 
                    alt={`Thumbnail for video ${video.id}`} 
                    width={100} 
                    height={60} 
                    className="rounded object-cover"
                    unoptimized // If thumbnails are directly served and not processed by Next/Image optimization
                    onError={(e) => { e.currentTarget.src = 'https://picsum.photos/seed/error/100/60'; }} // Fallback for broken images
                    data-ai-hint="video thumbnail"
                  />
                </TableCell>
                <TableCell>
                  <div className="font-medium text-foreground truncate max-w-[200px]" title={video.video_path}>
                    {video.video_path.split('/').pop() || video.video_path}
                  </div>
                  <Badge variant={video.original_video ? "secondary" : "outline"} className="mt-1">
                    {getVideoType(video)}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{video.patient_username || 'N/A'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(video.create_time), "MMM dd, yyyy HH:mm")}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">
                  {video.action_id || '-'}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewVideo(video)}>
                        <ExternalLink className="mr-2 h-4 w-4" /> View Video
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(video.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
  );
}
