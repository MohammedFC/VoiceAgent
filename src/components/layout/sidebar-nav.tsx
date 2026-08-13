"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  ListChecks,
  LogOut,
  Menu,
  PhoneCall,
  Wrench,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

function navItems(pendingActionCount: number): {
  href: string;
  label: string;
  icon: typeof PhoneCall;
  count?: number;
}[] {
  return [
    { href: "/calls", label: "Calls", icon: PhoneCall },
    {
      href: "/action-queue",
      label: "Action queue",
      icon: ClipboardCheck,
      count: pendingActionCount,
    },
    { href: "/review-queue", label: "Review queue", icon: ListChecks },
    { href: "/known-issues", label: "Known issues", icon: ClipboardList },
    { href: "/config-changes", label: "Config changes", icon: Wrench },
    { href: "/stats", label: "Stats", icon: BarChart3 },
  ];
}

function NavLinks({
  pathname,
  pendingActionCount,
  onNavigate,
}: {
  pathname: string;
  pendingActionCount: number;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      {navItems(pendingActionCount).map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
              isActive ? "bg-accent font-medium" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="flex-1">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <Badge variant="warning" className="h-5 min-w-5 justify-center px-1">
                {item.count}
              </Badge>
            )}
          </Link>
        );
      })}
    </div>
  );
}

function useSignOut() {
  const router = useRouter();
  return async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };
}

export function SidebarNav({ pendingActionCount = 0 }: { pendingActionCount?: number }) {
  const pathname = usePathname();
  const handleSignOut = useSignOut();

  return (
    <nav className="hidden h-full w-56 shrink-0 flex-col border-r bg-muted/20 p-4 md:flex">
      <div className="mb-6 px-2 text-sm font-semibold">Out-of-Hours Call Log</div>
      <NavLinks pathname={pathname} pendingActionCount={pendingActionCount} />
      <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </nav>
  );
}

export function MobileTopNav({ pendingActionCount = 0 }: { pendingActionCount?: number }) {
  const pathname = usePathname();
  const handleSignOut = useSignOut();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="Open navigation menu" />}
        >
          <Menu className="h-5 w-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Out-of-Hours Call Log</SheetTitle>
          </SheetHeader>
          <div className="flex flex-1 flex-col p-4">
            <NavLinks
              pathname={pathname}
              pendingActionCount={pendingActionCount}
              onNavigate={() => setOpen(false)}
            />
            <Button
              variant="ghost"
              size="sm"
              className="justify-start gap-2"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </SheetContent>
      </Sheet>
      <span className="text-sm font-semibold">Out-of-Hours Call Log</span>
    </div>
  );
}
