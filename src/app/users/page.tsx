"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { mockDoctors, mockPatients } from '@/lib/mockData';
import type { Doctor, Patient } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorsTable } from '@/components/users/DoctorsTable';
import { PatientsTable } from '@/components/users/PatientsTable';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

function UserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const activeTab = searchParams.get('tab') || 'doctors';
  const filterDoctorId = searchParams.get('doctorId'); // For filtering patients by doctor
  const scrollToDoctorId = searchParams.get('scrollToDoctorId'); // For scrolling to a doctor

  const [searchTermDoctors, setSearchTermDoctors] = useState('');
  const [searchTermPatients, setSearchTermPatients] = useState('');

  const allDoctors: Doctor[] = useMemo(() => mockDoctors, []);
  const allPatients: Patient[] = useMemo(() => mockPatients, []);

  const displayedDoctors = useMemo(() => {
    return allDoctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTermDoctors.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTermDoctors.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchTermDoctors.toLowerCase())
    );
  }, [allDoctors, searchTermDoctors]);

  const displayedPatients = useMemo(() => {
    let patients = allPatients;
    if (activeTab === 'patients' && filterDoctorId) {
      patients = patients.filter(patient => patient.attendingDoctorId === filterDoctorId);
    }
    return patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTermPatients.toLowerCase()) ||
      patient.medicalRecordNumber.toLowerCase().includes(searchTermPatients.toLowerCase()) ||
      patient.attendingDoctorName.toLowerCase().includes(searchTermPatients.toLowerCase())
    );
  }, [allPatients, filterDoctorId, searchTermPatients, activeTab]);

  const handleTabChange = (newTabValue: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', newTabValue);

    // If switching to 'doctors' tab, remove 'doctorId' (patient filter) unless 'scrollToDoctorId' is present.
    if (newTabValue === 'doctors') {
      if (!newParams.has('scrollToDoctorId')) {
        newParams.delete('doctorId');
      }
    }
    // If switching to 'patients' tab, remove 'scrollToDoctorId' (doctor scroll).
    if (newTabValue === 'patients') {
      newParams.delete('scrollToDoctorId');
    }
    router.push(`/users?${newParams.toString()}`, { scroll: false });
  };
  
  // Effect to clean up URL params if navigating directly or state becomes inconsistent
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    let paramsChanged = false;

    if (activeTab === 'doctors' && filterDoctorId && !scrollToDoctorId) {
      currentParams.delete('doctorId'); // doctorId is for patient filtering, not relevant for general doctor view
      paramsChanged = true;
    }
    if (activeTab === 'patients' && scrollToDoctorId) {
      currentParams.delete('scrollToDoctorId'); // scrollToDoctorId is for doctor view
      paramsChanged = true;
    }

    if (paramsChanged) {
      router.replace(`/users?${currentParams.toString()}`, { scroll: false });
    }
  }, [activeTab, filterDoctorId, scrollToDoctorId, searchParams, router]);

  const doctorForFilteredPatients = useMemo(() => {
    if (activeTab === 'patients' && filterDoctorId) {
      return allDoctors.find(d => d.id === filterDoctorId);
    }
    return null;
  }, [activeTab, filterDoctorId, allDoctors]);


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="doctors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Doctors</TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Patients</TabsTrigger>
          </TabsList>
          
          {activeTab === 'doctors' && (
            <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search doctors (name, email, dept)..."
                className="pl-10 h-10 bg-background border-border focus:ring-primary"
                value={searchTermDoctors}
                onChange={(e) => setSearchTermDoctors(e.target.value)}
              />
            </div>
          )}
          {activeTab === 'patients' && (
             <div className="relative w-full sm:w-auto sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search patients (name, MRN, doctor)..."
                className="pl-10 h-10 bg-background border-border focus:ring-primary"
                value={searchTermPatients}
                onChange={(e) => setSearchTermPatients(e.target.value)}
              />
            </div>
          )}
        </div>

        {activeTab === 'patients' && doctorForFilteredPatients && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-md flex justify-between items-center">
            <p className="text-sm text-primary font-medium">
              Showing patients for Dr. {doctorForFilteredPatients.name}.
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-primary hover:bg-primary/20"
              onClick={() => router.push('/users?tab=patients')}
            >
              Show All Patients
            </Button>
          </div>
        )}

        <TabsContent value="doctors">
          <DoctorsTable doctors={displayedDoctors} scrollToDoctorId={scrollToDoctorId} />
        </TabsContent>
        <TabsContent value="patients">
          <PatientsTable patients={displayedPatients} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64 text-muted-foreground">Loading user data...</div>}>
      <UserManagementContent />
    </Suspense>
  );
}
