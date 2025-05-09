// @ts-nocheck
"use client";

import React, { useEffect, useMemo, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { mockDoctors, mockPatients, mockDashboardMetrics } from '@/lib/mockData';
import type { Doctor, Patient, DashboardMetrics } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DoctorsTable } from '@/components/users/DoctorsTable';
import { PatientsTable } from '@/components/users/PatientsTable';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DoctorFormDialog, DoctorFormData } from '@/components/users/DoctorFormDialog';
import { PatientFormDialog, PatientFormData } from '@/components/users/PatientFormDialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

function UserManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const activeTab = searchParams.get('tab') || 'doctors';
  const filterDoctorIdParam = searchParams.get('doctorId');
  const scrollToDoctorIdParam = searchParams.get('scrollToDoctorId');

  const [doctors, setDoctors] = useState<Doctor[]>([...mockDoctors]);
  const [patients, setPatients] = useState<Patient[]>([...mockPatients]);

  const [searchTermDoctors, setSearchTermDoctors] = useState('');
  const [searchTermPatients, setSearchTermPatients] = useState('');

  const [isDoctorModalOpen, setIsDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const [deletingDoctorId, setDeletingDoctorId] = useState<string | null>(null);
  const [deletingPatientId, setDeletingPatientId] = useState<string | null>(null);


  const updateGlobalMetrics = (currentDoctors: Doctor[], currentPatients: Patient[]) => {
    const newMetrics: DashboardMetrics = {
        doctorCount: currentDoctors.length,
        patientCount: currentPatients.length,
        videoCount: currentPatients.reduce((sum, p) => sum + p.videoCount, 0),
        dataAnalysisCount: currentPatients.reduce((sum, p) => sum + p.analysisCount, 0),
    };
    // This mutates the imported object, which is a simplified approach for mock data
    Object.assign(mockDashboardMetrics, newMetrics); 
  };


  const displayedDoctors = useMemo(() => {
    return doctors.filter(doctor =>
      doctor.name.toLowerCase().includes(searchTermDoctors.toLowerCase()) ||
      doctor.email.toLowerCase().includes(searchTermDoctors.toLowerCase()) ||
      doctor.department.toLowerCase().includes(searchTermDoctors.toLowerCase())
    );
  }, [doctors, searchTermDoctors]);

  const displayedPatients = useMemo(() => {
    let filtered = patients;
    if (activeTab === 'patients' && filterDoctorIdParam) {
      filtered = filtered.filter(patient => patient.attendingDoctorId === filterDoctorIdParam);
    }
    return filtered.filter(patient =>
      patient.name.toLowerCase().includes(searchTermPatients.toLowerCase()) ||
      patient.medicalRecordNumber.toLowerCase().includes(searchTermPatients.toLowerCase()) ||
      (patient.attendingDoctorName && patient.attendingDoctorName.toLowerCase().includes(searchTermPatients.toLowerCase()))
    );
  }, [patients, filterDoctorIdParam, searchTermPatients, activeTab]);

  const handleTabChange = (newTabValue: string) => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set('tab', newTabValue);
    if (newTabValue === 'doctors' && !newParams.has('scrollToDoctorId')) newParams.delete('doctorId');
    if (newTabValue === 'patients') newParams.delete('scrollToDoctorId');
    router.push(`/users?${newParams.toString()}`, { scroll: false });
  };
  
  useEffect(() => {
    const currentParams = new URLSearchParams(searchParams.toString());
    let paramsChanged = false;
    if (activeTab === 'doctors' && filterDoctorIdParam && !scrollToDoctorIdParam) {
      currentParams.delete('doctorId');
      paramsChanged = true;
    }
    if (activeTab === 'patients' && scrollToDoctorIdParam) {
      currentParams.delete('scrollToDoctorId');
      paramsChanged = true;
    }
    if (paramsChanged) router.replace(`/users?${currentParams.toString()}`, { scroll: false });
  }, [activeTab, filterDoctorIdParam, scrollToDoctorIdParam, searchParams, router]);

  const doctorForFilteredPatients = useMemo(() => {
    if (activeTab === 'patients' && filterDoctorIdParam) {
      return doctors.find(d => d.id === filterDoctorIdParam);
    }
    return null;
  }, [activeTab, filterDoctorIdParam, doctors]);

  // Doctor CRUD
  const handleAddDoctor = () => {
    setEditingDoctor(null);
    setIsDoctorModalOpen(true);
  };

  const handleEditDoctor = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setIsDoctorModalOpen(true);
  };

  const handleSaveDoctor = (data: DoctorFormData) => {
    let updatedDoctors;
    if (editingDoctor) {
      updatedDoctors = doctors.map(d => d.id === editingDoctor.id ? { ...d, ...data, password: data.password || d.password } : d);
      toast({ title: "Doctor Updated", description: `${data.name} has been updated successfully.` });
    } else {
      const newDoctor: Doctor = { 
        ...data, 
        id: `doc${Date.now()}`, 
        patientCount: 0, // New doctors start with 0 patients
        password: data.password || `pass${Date.now()}` // Ensure password exists
      };
      updatedDoctors = [...doctors, newDoctor];
      toast({ title: "Doctor Added", description: `${data.name} has been added successfully.` });
    }
    setDoctors(updatedDoctors);
    updateGlobalMetrics(updatedDoctors, patients);
    // Update mockDoctors directly for persistence in this mock setup
    mockDoctors.length = 0;
    Array.prototype.push.apply(mockDoctors, updatedDoctors);
    setIsDoctorModalOpen(false);
  };

  const handleDeleteDoctor = (doctorId: string) => setDeletingDoctorId(doctorId);

  const confirmDeleteDoctor = () => {
    if (!deletingDoctorId) return;
    const doctorToDelete = doctors.find(d => d.id === deletingDoctorId);
    const updatedDoctors = doctors.filter(d => d.id !== deletingDoctorId);
    setDoctors(updatedDoctors);
    // Also remove patients associated with this doctor or reassign them
    const updatedPatients = patients.map(p => p.attendingDoctorId === deletingDoctorId ? {...p, attendingDoctorId: '', attendingDoctorName: 'N/A'} : p);
    setPatients(updatedPatients);

    updateGlobalMetrics(updatedDoctors, updatedPatients);
     // Update mockDoctors & mockPatients directly
    mockDoctors.length = 0;
    Array.prototype.push.apply(mockDoctors, updatedDoctors);
    mockPatients.length = 0;
    Array.prototype.push.apply(mockPatients, updatedPatients);

    toast({ title: "Doctor Deleted", description: `${doctorToDelete?.name} has been deleted. Associated patients are now unassigned.` , variant: "destructive"});
    setDeletingDoctorId(null);
  };

  // Patient CRUD
  const handleAddPatient = () => {
    setEditingPatient(null);
    setIsPatientModalOpen(true);
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setIsPatientModalOpen(true);
  };

  const handleSavePatient = (data: PatientFormData) => {
    let updatedPatients;
    const attendingDoctor = doctors.find(d => d.id === data.attendingDoctorId);

    if (editingPatient) {
      updatedPatients = patients.map(p => p.id === editingPatient.id ? { ...p, ...data, attendingDoctorName: attendingDoctor?.name || 'N/A' } : p);
      toast({ title: "Patient Updated", description: `${data.name} has been updated successfully.` });
    } else {
      const newPatient: Patient = { ...data, id: `pat${Date.now()}`, attendingDoctorName: attendingDoctor?.name || 'N/A', videoCount: 0, analysisCount: 0 };
      updatedPatients = [...patients, newPatient];
      toast({ title: "Patient Added", description: `${data.name} has been added successfully.` });
    }
    setPatients(updatedPatients);
    
    // Update patient counts for doctors
    const updatedDoctors = doctors.map(doc => ({
      ...doc,
      patientCount: updatedPatients.filter(p => p.attendingDoctorId === doc.id).length
    }));
    setDoctors(updatedDoctors);

    updateGlobalMetrics(updatedDoctors, updatedPatients);
    // Update mockPatients & mockDoctors directly
    mockPatients.length = 0;
    Array.prototype.push.apply(mockPatients, updatedPatients);
    mockDoctors.length = 0;
    Array.prototype.push.apply(mockDoctors, updatedDoctors);

    setIsPatientModalOpen(false);
  };

  const handleDeletePatient = (patientId: string) => setDeletingPatientId(patientId);

  const confirmDeletePatient = () => {
    if (!deletingPatientId) return;
    const patientToDelete = patients.find(p => p.id === deletingPatientId);
    const updatedPatients = patients.filter(p => p.id !== deletingPatientId);
    setPatients(updatedPatients);
    
    const updatedDoctors = doctors.map(doc => ({
      ...doc,
      patientCount: updatedPatients.filter(p => p.attendingDoctorId === doc.id).length
    }));
    setDoctors(updatedDoctors);

    updateGlobalMetrics(updatedDoctors, updatedPatients);

    mockPatients.length = 0;
    Array.prototype.push.apply(mockPatients, updatedPatients);
    mockDoctors.length = 0;
    Array.prototype.push.apply(mockDoctors, updatedDoctors);

    toast({ title: "Patient Deleted", description: `${patientToDelete?.name} has been deleted.`, variant: "destructive" });
    setDeletingPatientId(null);
  };


  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">User Management</h1>
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <TabsList className="bg-muted p-1 rounded-lg">
            <TabsTrigger value="doctors" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Doctors</TabsTrigger>
            <TabsTrigger value="patients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Patients</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {activeTab === 'doctors' && (
              <>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search doctors..."
                    className="pl-10 h-10 bg-card border-border focus:ring-primary"
                    value={searchTermDoctors}
                    onChange={(e) => setSearchTermDoctors(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddDoctor} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Doctor
                </Button>
              </>
            )}
            {activeTab === 'patients' && (
              <>
                <div className="relative w-full sm:w-auto sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search patients..."
                    className="pl-10 h-10 bg-card border-border focus:ring-primary"
                    value={searchTermPatients}
                    onChange={(e) => setSearchTermPatients(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddPatient} className="w-full sm:w-auto">
                  <PlusCircle className="mr-2 h-4 w-4" /> Add Patient
                </Button>
              </>
            )}
          </div>
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
          <DoctorsTable 
            doctors={displayedDoctors} 
            scrollToDoctorId={scrollToDoctorIdParam}
            onEdit={handleEditDoctor}
            onDelete={handleDeleteDoctor}
          />
        </TabsContent>
        <TabsContent value="patients">
          <PatientsTable 
            patients={displayedPatients} 
            onEdit={handleEditPatient}
            onDelete={handleDeletePatient}
          />
        </TabsContent>
      </Tabs>

      {isDoctorModalOpen && (
        <DoctorFormDialog
          open={isDoctorModalOpen}
          onOpenChange={setIsDoctorModalOpen}
          onSubmit={handleSaveDoctor}
          defaultValues={editingDoctor}
        />
      )}

      {isPatientModalOpen && (
         <PatientFormDialog
            open={isPatientModalOpen}
            onOpenChange={setIsPatientModalOpen}
            onSubmit={handleSavePatient}
            defaultValues={editingPatient}
            doctors={doctors} // Pass doctors list for selection
        />
      )}

      <AlertDialog open={!!deletingDoctorId} onOpenChange={(open) => !open && setDeletingDoctorId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Dr. {doctors.find(d => d.id === deletingDoctorId)?.name} and unassign their patients.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingDoctorId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteDoctor} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingPatientId} onOpenChange={(open) => !open && setDeletingPatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete patient {patients.find(p => p.id === deletingPatientId)?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeletingPatientId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeletePatient} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
