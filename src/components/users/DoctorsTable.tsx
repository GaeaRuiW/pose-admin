
// @ts-nocheck
"use client";
import type { Doctor } from "@/types"; // Use updated Doctor type
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Users, FilePenLine, Trash2, MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface DoctorsTableProps {
  doctors: Doctor[];
  scrollToDoctorId?: string | null;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
}

// Mapping backend role_id to frontend display string
const roleIdToPermissionString = (roleId?: number): string => {
  if (roleId === 1) return 'Admin';
  if (roleId === 2) return 'Doctor';
  // Add more roles if needed
  return 'Unknown'; // Fallback for unknown roles
};

export function DoctorsTable({ doctors, scrollToDoctorId, onEdit, onDelete }: DoctorsTableProps) {
  const router = useRouter();
  // Password reveal state is not needed as backend won't send passwords
  
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
      }, 100); // Small delay to ensure layout is complete
    }
  }, [scrollToDoctorId, doctorRowRefs]);


  const handlePatientCountClick = (doctorId: string) => {
    router.push(`/users?tab=patients&doctorId=${doctorId}`);
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-md overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead className="w-[180px]">Username</TableHead>
              {/* Password column removed as it's not sent from backend */}
              <TableHead className="w-[220px]">Email</TableHead>
              <TableHead className="w-[150px]">Phone</TableHead>
              <TableHead className="w-[150px]">Department</TableHead>
              <TableHead className="w-[150px] text-center">Patient Count</TableHead>
              <TableHead className="w-[120px]">Role</TableHead>
              <TableHead className="min-w-[150px]">Notes</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No doctors found.
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
                  <TableCell className="text-muted-foreground">{doctor.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.department}</TableCell>
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
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(doctor)}>
                          <FilePenLine className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(doctor.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
    </TooltipProvider>
  );
}
