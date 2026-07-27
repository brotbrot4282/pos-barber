"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logoutAction } from "@/lib/auth-actions";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const menuItems = [
  { label: "Dashboard", icon: "🏠", href: "/dashboard" },
  { label: "Kasir", icon: "💰", href: "/kasir" },
  { label: "Transaksi", icon: "📋", href: "/transaksi" },
  { label: "Layanan", icon: "✂️", href: "/layanan" },
  { label: "Produk", icon: "📦", href: "/produk" },
  { label: "Member", icon: "👤", href: "/member" },
  { label: "Reservasi", icon: "📅", href: "/reservasi" },
  { label: "Laporan", icon: "📊", href: "/laporan" },
  { label: "Pengguna", icon: "👥", href: "/pengguna" },
  { label: "Pengaturan", icon: "⚙️", href: "/pengaturan" },
];

interface SidebarContentProps {
  onNavigate?: () => void;
}

function SidebarContent({ onNavigate }: SidebarContentProps) {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900 text-white">
      <div className="flex items-center gap-2 px-6 py-5">
        <span className="text-2xl">✂️</span>
        <span className="text-xl font-bold tracking-tight">POS BARBER</span>
      </div>

      <Separator className="bg-gray-700" />

      <nav className="flex-1 space-y-1 px-3 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <Separator className="bg-gray-700" />

      <div className="px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-gray-700 text-sm text-white">
              A
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">Admin</p>
            <p className="truncate text-xs text-gray-400">admin@barber.com</p>
          </div>
        </div>
        <form action={logoutAction}>
          <Button
            type="submit"
            variant="ghost"
            className="mt-3 w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          >
            🚪 Logout
          </Button>
        </form>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger render={<Button variant="outline" size="icon" className="bg-gray-900 text-white hover:bg-gray-800" />}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
