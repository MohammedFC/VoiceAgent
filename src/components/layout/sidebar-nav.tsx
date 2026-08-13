"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ClipboardList,
  ListChecks,
  LogOut,
  PhoneCall,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/calls", label: "Calls", icon: PhoneCall },
  { href: "/review-queue", label: "Review queue", icon: ListChecks },
  { href: "/known-issues", label: "Known issues", icon: ClipboardList },
  { href: "/config-changes", label: "Config changes", icon: Wrench },
  { href: "/stats", label: "Stats", icon: BarChart3 },
];

export function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r bg-muted/20 p-4">
      <div className="mb-6 px-2 text-sm font-semibold">Out-of-Hours Call Log</div>
      <div className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent",
                isActive ? "bg-accent font-medium" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </div>
      <Button variant="ghost" size="sm" className="justify-start gap-2" onClick={handleSignOut}>
        <LogOut className="h-4 w-4" />
        Sign out
      </Button>
    </nav>
  );
}
