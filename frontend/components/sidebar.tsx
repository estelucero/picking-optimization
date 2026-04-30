"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MapPin, Zap } from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      label: "Inicio",
      icon: LayoutGrid,
    },
    {
      href: "/product-mapping",
      label: "Distribuciones",
      icon: MapPin,
    },
    {
      href: "/experimentation",
      label: "Experimentos",
      icon: Zap,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-800 border-r border-blue-200 dark:border-slate-700 h-screen fixed left-0 top-0 pt-6 px-4 overflow-y-auto">
      {/* Logo */}
      <div className="mb-8 pl-2 pb-4 border-b border-blue-100 dark:border-slate-700">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 flex items-center justify-center group-hover:shadow-lg transition-all">
            <span className="text-white font-bold text-base">PO</span>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white text-base">
              Picking Optimization
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              DEPOSITO ADMIN
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive
                  ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 font-semibold"
                  : "text-slate-700 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      {/* <div className="absolute bottom-6 left-4 right-4 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            AC
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">Alex Chen</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">Warehouse Lead</p>
          </div>
        </div>
      </div> */}
    </aside>
  );
}
