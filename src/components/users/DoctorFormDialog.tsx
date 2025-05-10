
// @ts-nocheck
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Doctor } from '@/types';
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslations } from 'next-intl';

const permissionToRoleId = {
  'Admin': 1,
  'Doctor': 2,
};

const NO_ROLE_VALUE = "__NO_ROLE__";

const createDoctorFormSchema = (isEditing: boolean, t: ReturnType<typeof useTranslations<'DoctorFormDialog'>>) => z.object({
  username: z.string().min(1, t('usernameLabel') + " is required.").min(2, { message: t('usernameLabel') + " must be at least 2 characters." }),
  email: z.string().min(1, t('emailLabel') + " is required.").email({ message: "Invalid email address." }),
  password: isEditing
    ? z.string().min(6, { message: t('passwordDescriptionEdit') }).optional().or(z.literal(''))
    : z.string().min(6, { message: t('passwordDescriptionNew') }),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  role_id: z.union([z.nativeEnum(permissionToRoleId), z.number().min(1), z.string().regex(/^\d+$/).transform(Number)])
           .optional()
           .nullable(),
  notes: z.string().optional().nullable(),
});

export type DoctorFormData = z.infer<ReturnType<typeof createDoctorFormSchema>>;

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DoctorFormData) => void;
  defaultValues?: Doctor | null;
}

export function DoctorFormDialog({ open, onOpenChange, onSubmit, defaultValues }: DoctorFormDialogProps) {
  const t = useTranslations('DoctorFormDialog');
  const tCommon = useTranslations('Common');
  const isEditing = !!defaultValues;
  const doctorFormSchema = createDoctorFormSchema(isEditing, t);

  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      username: defaultValues?.username || "",
      email: defaultValues?.email || "",
      password: "", 
      phone: defaultValues?.phone || "",
      department: defaultValues?.department || "",
      role_id: defaultValues?.role_id ?? null, 
      notes: defaultValues?.notes || "",
    },
  });

  const handleSubmit = (data: DoctorFormData) => {
    const submissionData = { ...data };
    if (isEditing && !data.password) { 
      delete submissionData.password;
    }
    submissionData.phone = data.phone || null;
    submissionData.department = data.department || null;
    submissionData.role_id = data.role_id ? Number(data.role_id) : null;
    submissionData.notes = data.notes || null;
    
    onSubmit(submissionData);
    form.reset({ 
        username: "",
        email: "",
        password: "",
        phone: "",
        department: "",
        role_id: null,
        notes: ""
    });
  };

  React.useEffect(() => {
    if (open) { 
        form.reset({
            username: defaultValues?.username || "",
            email: defaultValues?.email || "",
            password: "",
            phone: defaultValues?.phone || "",
            department: defaultValues?.department || "",
            role_id: defaultValues?.role_id ?? null,
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
                  <FormLabel>{t('usernameLabel')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder={t('usernamePlaceholder')} {...field} className="bg-background border-input" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')} <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input type="email" placeholder={t('emailPlaceholder')} {...field} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')} {!isEditing && <span className="text-destructive">*</span>}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={defaultValues ? t('passwordPlaceholderEdit') : t('passwordPlaceholderNew')} {...field} className="bg-background border-input"/>
                  </FormControl>
                  <FormDescription>
                    {defaultValues ? t('passwordDescriptionEdit') : t('passwordDescriptionNew')}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('phonePlaceholder')} {...field} value={field.value ?? ''} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('departmentLabel')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('departmentPlaceholder')} {...field} value={field.value ?? ''} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>
            <FormField
              control={form.control}
              name="role_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('roleLabel')}</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(value === NO_ROLE_VALUE ? null : parseInt(value))} 
                    value={field.value === null || field.value === undefined ? NO_ROLE_VALUE : field.value.toString()}
                    defaultValue={field.value === null || field.value === undefined ? NO_ROLE_VALUE : field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder={t('selectRolePlaceholder')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_ROLE_VALUE}><em>{t('roleNone')}</em></SelectItem>
                      <SelectItem value={String(permissionToRoleId['Admin'])}>{t('roleAdmin')}</SelectItem>
                      <SelectItem value={String(permissionToRoleId['Doctor'])}>{t('roleDoctor')}</SelectItem>
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
              <Button type="button" variant="outline" onClick={() => { form.reset(); onOpenChange(false);}}>{tCommon('cancel')}</Button>
              <Button type="submit">{defaultValues ? t('saveButton') : t('addButton')}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
