
// @ts-nocheck
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Doctor } from '@/types'; // Use the updated Doctor type
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

// Mapping frontend permission strings to backend role_id
const permissionToRoleId = {
  'Admin': 1,
  'Doctor': 2,
};
const roleIdToPermission = {
  1: 'Admin',
  2: 'Doctor',
};

const doctorFormSchema = z.object({
  username: z.string().min(2, { message: "Username must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().optional(), 
  phone: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  department: z.string().min(2, { message: "Department must be at least 2 characters." }),
  role_id: z.nativeEnum(permissionToRoleId).or(z.number().min(1)), // Store as number, validate against keys of mapping
  notes: z.string().optional().nullable(),
});

export type DoctorFormData = z.infer<typeof doctorFormSchema>;

interface DoctorFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: DoctorFormData) => void;
  defaultValues?: Doctor | null; // Doctor type from src/types
}

export function DoctorFormDialog({ open, onOpenChange, onSubmit, defaultValues }: DoctorFormDialogProps) {
  const form = useForm<DoctorFormData>({
    resolver: zodResolver(doctorFormSchema),
    defaultValues: {
      username: defaultValues?.username || "",
      email: defaultValues?.email || "",
      password: "", // Always blank for edit, or for new
      phone: defaultValues?.phone || "",
      department: defaultValues?.department || "康复科",
      role_id: defaultValues?.role_id || permissionToRoleId['Doctor'], // Default to 'Doctor' role (ID 2)
      notes: defaultValues?.notes || "",
    },
  });

  const handleSubmit = (data: DoctorFormData) => {
    // Ensure password is not sent if it's empty and we are editing
    const submissionData = { ...data };
    if (defaultValues && !data.password) {
      delete submissionData.password;
    }
    onSubmit(submissionData);
    form.reset(); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card text-card-foreground">
        <DialogHeader>
          <DialogTitle>{defaultValues ? 'Edit Doctor' : 'Add New Doctor'}</DialogTitle>
          <DialogDescription>
            {defaultValues ? 'Update the details for this doctor.' : 'Enter the details for the new doctor.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input placeholder="drjohn" {...field} className="bg-background border-input" />
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
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="john.doe@example.com" {...field} className="bg-background border-input"/>
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder={defaultValues ? "Leave blank to keep current" : "Enter password"} {...field} className="bg-background border-input"/>
                  </FormControl>
                  <FormDescription>
                    {defaultValues ? "Leave blank to keep the current password." : "Create a password for the new doctor."}
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
                  <FormLabel>Phone</FormLabel>
                  <FormControl>
                    <Input placeholder="555-123-4567" {...field} className="bg-background border-input"/>
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
                  <FormLabel>Department</FormLabel>
                  <FormControl>
                    <Input placeholder="Cardiology" {...field} className="bg-background border-input"/>
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
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                    <FormControl>
                      <SelectTrigger className="bg-background border-input">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={String(permissionToRoleId['Admin'])}>Admin</SelectItem>
                      <SelectItem value={String(permissionToRoleId['Doctor'])}>Doctor</SelectItem>
                      {/* <SelectItem value="Read-Only">Read-Only</SelectItem> // Option removed for simplicity or map to a role_id if backend supports */}
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
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes about the doctor..." {...field} value={field.value ?? ''} className="bg-background border-input"/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">{defaultValues ? 'Save Changes' : 'Add Doctor'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
