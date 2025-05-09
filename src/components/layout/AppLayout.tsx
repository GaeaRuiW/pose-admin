"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, Stethoscope } from "lucide-react";
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
} from "@/components/ui/sidebar"; // Assuming sidebar is in ui, adjust if custom path
import { Button } from "@/components/ui/button";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/users", label: "User Management", icon: Users },
  ];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar className="border-r border-sidebar-border">
        <SidebarHeader className="p-4 border-b border-sidebar-border">
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
                    isActive={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))}
                    className="w-full justify-start text-sm font-medium"
                    tooltip={item.label}
                    variant={pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)) ? "default" : "ghost"} // 'default' uses primary for active
                    // style={{
                    //   backgroundColor: pathname.startsWith(item.href) ? 'hsl(var(--sidebar-primary))' : 'transparent',
                    //   color: pathname.startsWith(item.href) ? 'hsl(var(--sidebar-primary-foreground))' : 'hsl(var(--sidebar-foreground))'
                    // }}
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
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
          <SidebarTrigger className="md:hidden" />
          {/* Placeholder for potential breadcrumbs or page title */}
          <div className="flex-1">
             {/* Dynamically set page title based on route maybe? */}
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 bg-background min-h-[calc(100vh-4rem)]">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
