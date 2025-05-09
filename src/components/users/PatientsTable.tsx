// @ts-nocheck
"use client";
import type { Patient } from "@/types";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BriefcaseMedical, FilePenLine, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface PatientsTableProps {
  patients: Patient[];
  onEdit: (patient: Patient) => void;
  onDelete: (patientId: string) => void;
}

export function PatientsTable({ patients, onEdit, onDelete }: PatientsTableProps) {
  const router = useRouter();

  const handleDoctorClick = (doctorId: string) => {
    router.push(`/users?tab=doctors&scrollToDoctorId=${doctorId}`);
  };

  return (
    <div className="rounded-lg border shadow-md overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/60">
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="w-[80px]">Age</TableHead>
            <TableHead className="w-[100px]">Gender</TableHead>
            <TableHead className="w-[180px]">Medical Record #</TableHead>
            <TableHead className="w-[200px]">Attending Doctor</TableHead>
            <TableHead className="w-[130px] text-center">Video Count</TableHead>
            <TableHead className="w-[130px] text-center">Analysis Count</TableHead>
            <TableHead className="w-[80px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No patients found.
              </TableCell>
            </TableRow>
          ) : (
            patients.map((patient) => (
              <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                <TableCell className="font-medium text-foreground">{patient.name}</TableCell>
                <TableCell className="text-muted-foreground">{patient.age}</TableCell>
                <TableCell className="text-muted-foreground">{patient.gender}</TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm">{patient.medicalRecordNumber}</TableCell>
                <TableCell>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-primary hover:underline font-medium" 
                    onClick={() => handleDoctorClick(patient.attendingDoctorId)}
                    disabled={!patient.attendingDoctorId || patient.attendingDoctorId === ''}
                  >
                    {patient.attendingDoctorName || 'N/A'} 
                    {patient.attendingDoctorId && patient.attendingDoctorId !== '' && <BriefcaseMedical className="ml-1.5 h-4 w-4 inline-block" />}
                  </Button>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{patient.videoCount}</TableCell>
                <TableCell className="text-center text-muted-foreground">{patient.analysisCount}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(patient)}>
                          <FilePenLine className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(patient.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
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
