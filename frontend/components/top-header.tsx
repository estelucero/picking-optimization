"use client";

import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePathname } from "next/navigation";

export function TopHeader() {
  const pathname = usePathname();

  const getPlaceholder = () => {
    if (pathname.includes("experimentation")) {
      return "Search experiments...";
    } else if (pathname.includes("product-mapping")) {
      return "Search products...";
    } else if (pathname.includes("dashboard")) {
      return "Search warehouse...";
    }
    return "Search...";
  };

  return (
    <header className="h-20 border-b border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 fixed top-0 left-64 right-0 flex items-center px-6 gap-4 z-40">
      {/* <div className="flex-1 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2">
        <Search className="w-5 h-5 text-slate-500 dark:text-slate-400" />

        <Input
          type="text"
          placeholder={getPlaceholder()}
          className="bg-transparent border-0 focus:ring-0 text-sm placeholder-slate-500 dark:placeholder-slate-400 dark:text-white"
        />
      </div> */}

      {/* <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div> */}
    </header>
  );
}
