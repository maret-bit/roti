"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (!token || !storedUser) {
      router.push("/");
      return;
    }

    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    setUser(JSON.parse(storedUser));
  }, [router]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  let menuItems: any[] = [];
  
  if (user?.role === "user_sales") {
    menuItems = [
      { name: "Dashboard", path: "/dashboard", icon: "📊" },
      { name: "Daftar Partner", path: "/dashboard/partner", icon: "🤝" },
      { name: "Daftar Transaksi", path: "/dashboard/transaksi", icon: "📝" },
    ];
  } else {
    menuItems = [
      { name: "Dashboard", path: "/dashboard", icon: "📊" },
      { name: "Stok (Inventory)", path: "/dashboard/stok", icon: "📦" },
      { name: "Pembelian", path: "/dashboard/pembelian", icon: "🛒" },
      { name: "Resep (BOM)", path: "/dashboard/resep", icon: "📖" },
      { name: "Hasil Produksi", path: "/dashboard/hasil-produksi", icon: "🥖" },
      { name: "Daftar Transaksi", path: "/dashboard/transaksi", icon: "📝" },
    ];
  }

  if (!user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white shadow-sm flex items-center justify-between p-4 sticky top-0 z-50">
        <div className="font-bold text-xl text-orange-600">BakeryApp</div>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-gray-600 focus:outline-none"
        >
          {isSidebarOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? "block" : "hidden"
        } md:block w-full md:w-64 bg-white shadow-lg flex-shrink-0 md:min-h-screen transition-all absolute md:sticky top-0 md:top-0 z-40`}
      >
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-extrabold text-orange-600 tracking-tight">
            BakeryApp
          </h1>
          <p className="text-xs text-gray-500 mt-1">Management System</p>
        </div>

        <div className="px-4 py-2 border-b border-gray-100 md:hidden">
            <p className="text-sm text-gray-500">Halo, <span className="font-semibold text-gray-800">{user.name}</span></p>
            <p className="text-xs text-gray-400 capitalize">{user.role.replace('_', ' ')}</p>
        </div>

        <nav className="mt-6 flex-1 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-orange-50 text-orange-700 font-semibold shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            );
          })}
          
          {user.role === 'admin' && (
             <>
               <Link
                 href="/dashboard/piutang-awal"
                 onClick={() => setIsSidebarOpen(false)}
                 className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                   pathname.includes('/piutang-awal')
                     ? "bg-orange-50 text-orange-700 font-semibold shadow-sm"
                     : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                 }`}
               >
                 <span className="mr-3 text-lg">📝</span>
                 Input Piutang Lama
               </Link>
               <Link
                 href="/dashboard/pengaturan"
                 onClick={() => setIsSidebarOpen(false)}
                 className={`flex items-center px-4 py-3 rounded-xl transition-all duration-200 ${
                   pathname.includes('/pengaturan')
                     ? "bg-orange-50 text-orange-700 font-semibold shadow-sm"
                     : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                 }`}
               >
                 <span className="mr-3 text-lg">⚙️</span>
                 Pengaturan
               </Link>
             </>
          )}
        </nav>

        <div className="p-4 absolute bottom-0 w-full md:relative md:mt-auto hidden md:block">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
            <button
              onClick={handleLogout}
              className="mt-3 w-full bg-white border border-gray-200 text-red-600 hover:bg-red-50 text-sm font-medium py-2 rounded-lg transition-colors"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Mobile Logout Button */}
        <div className="p-4 md:hidden border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-sm font-medium py-3 rounded-lg transition-colors"
            >
              Keluar
            </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full overflow-x-hidden md:min-h-screen">
        {/* Desktop Header */}
        <header className="hidden md:flex bg-white shadow-sm h-16 items-center justify-between px-8 sticky top-0 z-30">
          <div className="text-xl font-semibold text-gray-800">
            {menuItems.find(i => i.path === pathname)?.name || 'Pengaturan'}
          </div>
          <div className="flex items-center space-x-4">
             <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                 {user.name.charAt(0).toUpperCase()}
             </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
