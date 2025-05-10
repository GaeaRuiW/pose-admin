
'use client';
import Link from 'next/link'; // Using next/link, middleware handles locale
import { usePathname, useRouter } from 'next/navigation'; // Using next/navigation, middleware handles locale
import React, { useEffect } from 'react';
import { LayoutDashboard, Users, Stethoscope, Video as VideoIcon, ListChecks } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { UserNav } from '@/components/layout/UserNav';
import { useTranslations } from 'next-intl';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('AppLayout');
  const pathname = usePathname(); // This will be the full path including locale if prefixed
  const { currentUser, isLoading } = useAuth(); // Removed logout as it's not used here directly
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push('/login'); // Redirect to non-localized /login, middleware will handle it
    }
  }, [currentUser, isLoading, router]);

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
           <Stethoscope className="h-16 w-16 text-primary animate-pulse" />
           <p className="text-muted-foreground">{t('loadingApp')}</p>
        </div>
      </div>
    );
  }
  
  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/users', label: t('userManagement'), icon: Users },
    { href: '/videos', label: t('videoManagement'), icon: VideoIcon },
    { href: '/analyses', label: t('analysisManagement'), icon: ListChecks },
  ];

  // Helper to check active state, considering potential locale prefixes
  const isActive = (itemHref: string) => {
    // pathname from next/navigation might or might not include locale
    // For simplicity, we check if the localized path starts with the item's base href
    // This assumes item.href is base path like '/dashboard'
    const currentBasePath = pathname.replace(/^\/(en|zh)/, ''); // Remove locale prefix if present
    if (itemHref === '/dashboard') {
      return currentBasePath === '/dashboard' || currentBasePath === ''; // Root also implies dashboard
    }
    return currentBasePath.startsWith(itemHref);
  };


  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
          {/* Link component from next/link will work with next-intl middleware */}
          <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-foreground hover:text-sidebar-primary transition-colors">
            <Stethoscope className="h-7 w-7" />
            <h1 className="text-xl font-bold tracking-tight">MediAdmin</h1>
          </Link>
        </SidebarHeader>
        <SidebarContent className="p-2">
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={isActive(item.href)}
                    className="w-full justify-start text-sm font-medium"
                    tooltip={item.label}
                    variant={isActive(item.href) ? "default" : "ghost"}
                    style={
                      isActive(item.href) ? 
                      { backgroundColor: 'hsl(var(--sidebar-primary))', color: 'hsl(var(--sidebar-primary-foreground))' } : 
                      { backgroundColor: 'transparent', color: 'hsl(var(--sidebar-foreground))' }
                    }
                  >
                    <item.icon className="h-5 w-5 mr-2" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Placeholder for breadcrumbs or dynamic page title if needed */}
          </div>
          <UserNav />
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
