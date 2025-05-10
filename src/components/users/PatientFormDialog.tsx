
// @ts-nocheck
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Patient, Doctor } from '@/types'; 
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from 'next-intl';

const createPatientFormSchema = (t: ReturnType<typeof useTranslations<'PatientFormDialog'>>) => z.object({
  username: z.string().min(1, t('nameLabel') + " is required.").min(2, { message: t('nameLabel') + " must be at least 2 characters." }),
  age: z.coerce.number().min(0, t('ageLabel') + " cannot be negative.").optional().nullable(),
  gender: z.enum(['Male', 'Female', 'Other', '']).optional().nullable(), // Added empty string for placeholder case
  case_id: z.string().min(1, t('caseIdLabel') + " is required.").min(3, { message: t('caseIdLabel') + " must be at least 3 characters." }),
  doctor_id: z.string().optional().nullable(), 
  notes: z.string().optional().nullable(),
});

export type PatientFormData = z.infer<ReturnType<typeof createPatientFormSchema>>;

interface PatientFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: PatientFormData) => void;
  defaultValues?: Patient | null; 
  doctors: Doctor[]; 
}

const NO_DOCTOR_VALUE = "__NONE__"; 

export function PatientFormDialog({ open, onOpenChange, onSubmit, defaultValues, doctors }: PatientFormDialogProps) {
  const t = useTranslations('PatientFormDialog');
  const tCommon = useTranslations('Common');
  const patientFormSchema = createPatientFormSchema(t);
  
  const form = useForm<PatientFormData>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      username: defaultValues?.username || "",
      age: defaultValues?.age ?? undefined,
      gender: defaultValues?.gender || undefined,
      case_id: defaultValues?.case_id || "",
      doctor_id: defaultValues?.doctor_id ?? null,
      notes: defaultValues?.notes || "",
    },
  });

  const handleSubmit = (data: PatientFormData) => {
    const submissionData = {
      ...data,
      age: data.age === undefined || data.age === null || isNaN(data.age) ? null : Number(data.age),
      gender: data.gender === undefined || data.gender === null || data.gender === '' ? null : data.gender,
      doctor_id: data.doctor_id === NO_DOCTOR_VALUE ? null : data.doctor_id,
      notes: data.notes === "" || data.notes === undefined || data.notes === null ? null : data.notes,
    };
    onSubmit(submissionData as PatientFormData);
    form.reset({ 
        username: "", 
        age: undefined, 
        gender: undefined, 
        case_id: "", 
        doctor_id: null, 
        notes: "" 
    });
  };
  
  React.useEffect(() => {
    if (open) { 
      form.reset({
        username: defaultValues?.username || "",
        age: defaultValues?.age ?? undefined,
        gender: defaultValues?.gender || undefined,
        case_id: defaultValues?.case_id || "",
        doctor_id: defaultValues?.doctor_id ?? null,
        notes: defaultValues?.notes || "",
      });
    }
  }, [defaultValues, form, open]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{defaultValues ? t('editTitle') : t('addTitle')}</DialogTitle>
          <DialogDescription>
            {defaultValues ? t('editDescription') : t('addDescription')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nameLabel')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder={t('namePlaceholder')} {...field} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('ageLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={t('agePlaceholder')} {...field} onChange={e => field.onChange(e.target.value === '' ? null : +e.target.value)} value={field.value ?? ''} className="bg-background border-input"/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('genderLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""} defaultValue={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger className="bg-background border-input">
                          <SelectValue placeholder={t('selectGenderPlaceholder')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">{t('genderMale')}</SelectItem>
                        <SelectItem value="Female">{t('genderFemale')}</SelectItem>
                        <SelectItem value="Other">{t('genderOther')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="case_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('caseIdLabel')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder={t('caseIdPlaceholder')} {...field} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="doctor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('doctorLabel')}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === NO_DOCTOR_VALUE ? null : value)} 
                    value={field.value === null ? NO_DOCTOR_VALUE : (field.value || "")} 
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder={t('selectDoctorPlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_DOCTOR_VALUE}><em>{t('doctorNone')}</em></SelectItem>
                      {doctors.map(doctor => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          {doctor.username} - {doctor.department}
                        </SelectItem>
                      ))}
                       {doctors.length === 0 && !defaultValues?.doctor_id && <SelectItem value="no_doctors_available_placeholder" disabled>{t('noDoctorsAvailable')}</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('notesLabel')}</FormLabel>
                  <FormControl>
                    <Textarea placeholder={t('notesPlaceholder')} {...field} value={field.value ?? ''} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false); }}>{tCommon('cancel')}</Button>
              <Button type="submit">{defaultValues ? tCommon('saveChanges') : t('addButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
