// @ts-nocheck
"use client";
import type { Doctor } from "@/types";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Users, FilePenLine, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

interface DoctorsTableProps {
  doctors: Doctor[];
  scrollToDoctorId?: string | null;
  onEdit: (doctor: Doctor) => void;
  onDelete: (doctorId: string) => void;
}

export function DoctorsTable({ doctors, scrollToDoctorId, onEdit, onDelete }: DoctorsTableProps) {
  const router = useRouter();
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
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

  const togglePasswordVisibility = (doctorId: string) => {
    setRevealedPasswords(prev => ({ ...prev, [doctorId]: !prev[doctorId] }));
  };

  const handlePatientCountClick = (doctorId: string) => {
    router.push(`/users?tab=patients&doctorId=${doctorId}`);
  };

  return (
    <TooltipProvider>
      <div className="rounded-lg border shadow-md overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/60">
              <TableHead className="w-[180px]">Name</TableHead>
              <TableHead className="w-[180px]">Password</TableHead>
              <TableHead className="w-[220px]">Email</TableHead>
              <TableHead className="w-[150px]">Phone</TableHead>
              <TableHead className="w-[150px]">Department</TableHead>
              <TableHead className="w-[150px] text-center">Patient Count</TableHead>
              <TableHead className="w-[120px]">Permissions</TableHead>
              <TableHead className="min-w-[150px]">Notes</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
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
                  <TableCell className="font-medium text-foreground">{doctor.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-sm">
                        {revealedPasswords[doctor.id] ? doctor.password : '••••••••'}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-primary" 
                            onClick={() => togglePasswordVisibility(doctor.id)}
                            aria-label={revealedPasswords[doctor.id] ? "Hide password" : "Show password"}
                          >
                            {revealedPasswords[doctor.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{revealedPasswords[doctor.id] ? "Hide password" : "Show password"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{doctor.email}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.phone}</TableCell>
                  <TableCell className="text-muted-foreground">{doctor.department}</TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary hover:underline font-medium" 
                      onClick={() => handlePatientCountClick(doctor.id)}
                    >
                      {doctor.patientCount} <Users className="ml-1.5 h-4 w-4 inline-block" />
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={doctor.permissions === "Admin" ? "default" : (doctor.permissions === "Doctor" ? "secondary" : "outline")}
                      className={`${doctor.permissions === "Admin" ? "bg-primary text-primary-foreground" : ""} ${doctor.permissions === "Read-Only" ? "bg-accent text-accent-foreground" : ""}`}
                    >
                      {doctor.permissions}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate" title={doctor.notes}>
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
