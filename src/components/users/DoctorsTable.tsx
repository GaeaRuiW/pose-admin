
// @ts-nocheck
"use client";
import type { Doctor } from "@/types"; 
import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Users, FilePenLine, Trash2, MoreHorizontal, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useTranslations } from 'next-intl';

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

interface DoctorsTableProps {
  doctors: Doctor[];
  scrollToDoctorId?: string | null;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
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

export function DoctorsTable({ doctors, scrollToDoctorId, onEdit, onDelete, sortConfig, onSort }: DoctorsTableProps) {
  const t = useTranslations('DoctorsTable');
  const tForm = useTranslations('DoctorFormDialog'); // For role names
  const router = useRouter();

  const roleIdToPermissionString = (roleId?: number | null): string => {
    if (roleId === 1) return tForm('roleAdmin');
    if (roleId === 2) return tForm('roleDoctor');
    return tForm('roleNone'); 
  };
  
  const doctorRowRefs = useMemo(() => 
    doctors.reduce<Record<string, React.RefObject<HTMLTableRowElement>>>((acc, doctor) => {
      acc[doctor.id] = React.createRef();
      return acc;
    }, {}), 
  [doctors]);

  useEffect(() => {
    if (scrollToDoctorId && doctorRowRefs[scrollToDoctorId]?.current) {
      setTimeout(() => {
        doctorRowRefs[scrollToDoctorId].current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100); 
    }
  }, [scrollToDoctorId, doctorRowRefs]);


  const handlePatientCountClick = (doctorId: string) => {
    router.push(`?tab=patients&doctorId=${doctorId}`); // Use relative path for query param changes
  };

  const headers = [
    { key: 'username', label: t('username'), className: 'w-[180px]' },
    { key: 'email', label: t('email'), className: 'w-[220px]' },
    { key: 'phone', label: t('phone'), className: 'w-[150px]' },
    { key: 'department', label: t('department'), className: 'w-[150px]' },
    { key: 'patientCount', label: t('patientCount'), className: 'w-[150px] text-center' },
    { key: 'role_id', label: t('role'), className: 'w-[120px]' },
    { key: 'notes', label: t('notes'), className: 'min-w-[150px]', sortable: false },
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
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={headers.length} className="h-24 text-center text-muted-foreground">
                  {t('noDoctorsFound')}
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((doctor) => (
                <TableRow 
                  key={doctor.id} 
                  ref={doctorRowRefs[doctor.id]}
                  id={`doctor-row-${doctor.id}`}
                  className={scrollToDoctorId === doctor.id ? "bg-primary/10" : "hover:bg-muted/30 transition-colors"}
                >
                  <TableCell className="font-medium text-foreground">{doctor.username}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.email}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.phone || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.department || '-'}</TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary hover:underline font-medium" 
                      onClick={() => handlePatientCountClick(doctor.id)}
                      disabled={doctor.patientCount === undefined || doctor.patientCount === null}
                    >
                      {doctor.patientCount ?? 'N/A'} <Users className="ml-1.5 h-4 w-4 inline-block" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={doctor.role_id === 1 ? "default" : (doctor.role_id === 2 ? "secondary" : "outline")}
                      className={`${doctor.role_id === 1 ? "bg-primary text-primary-foreground" : ""}`}
                    >
                      {roleIdToPermissionString(doctor.role_id)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={doctor.notes || undefined}>
                    {doctor.notes || '-'}
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
                        <DropdownMenuItem onClick={() => onEdit(doctor)}>
                          <FilePenLine className="mr-2 h-4 w-4" /> {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(doctor.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
