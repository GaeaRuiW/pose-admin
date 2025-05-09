"use client";
import type { Patient } from "@/types";
import { useRouter } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { BriefcaseMedical } from "lucide-react";

interface PatientsTableProps {
  patients: Patient[];
}

export function PatientsTable({ patients }: PatientsTableProps) {
  const router = useRouter();

  const handleDoctorClick = (doctorId: string) => {
    router.push(`/users?tab=doctors&scrollToDoctorId=${doctorId}`);
  };

  return (
    <div className="rounded-lg border shadow-md overflow-x-auto bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[180px]">Name</TableHead>
            <TableHead className="w-[80px]">Age</TableHead>
            <TableHead className="w-[100px]">Gender</TableHead>
            <TableHead className="w-[180px]">Medical Record #</TableHead>
            <TableHead className="w-[200px]">Attending Doctor</TableHead>
            <TableHead className="w-[130px] text-center">Video Count</TableHead>
            <TableHead className="w-[130px] text-center">Analysis Count</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {patients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
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
                  >
                    {patient.attendingDoctorName} <BriefcaseMedical className="ml-1.5 h-4 w-4 inline-block" />
                  </Button>
                </TableCell>
                <TableCell className="text-center text-muted-foreground">{patient.videoCount}</TableCell>
                <TableCell className="text-center text-muted-foreground">{patient.analysisCount}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
