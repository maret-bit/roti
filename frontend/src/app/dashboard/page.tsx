"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import Link from "next/link";

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [salesData, setSalesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      if (parsedUser.role === 'user_sales') {
        fetchSalesDashboard();
      } else {
        setLoading(false);
      }
    }
  }, []);

  const fetchSalesDashboard = async () => {
    try {
      const res = await axios.get("/api/dashboard-sales");
      setSalesData(res.data);
    } catch (err) {
      console.error("Gagal memuat dashboard sales", err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount || 0);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Memuat dashboard...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 md:p-8 shadow-lg text-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-2">Selamat Datang, {user?.name}! 🥐</h2>
        <p className="text-orange-50 max-w-xl">
          {user?.role === 'admin' 
            ? "Pantau dan kelola produksi bakery serta inventori bahan baku harian Anda dengan mudah."
            : "Kelola stok Anda, catat transaksi penjualan dan pantau penerimaan pembayaran hari ini."}
        </p>
      </div>

      {user?.role === 'user_sales' && salesData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-emerald-100 border-l-4 border-l-emerald-500">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Penerimaan Uang Hari Ini</h3>
              <div className="text-2xl font-black text-emerald-600 mb-2">{formatCurrency(salesData.receipts?.total)}</div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Penjualan Langsung:</span>
                  <span className="font-semibold">{formatCurrency(salesData.receipts?.jual)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tagihan Konsinyasi:</span>
                  <span className="font-semibold">{formatCurrency(salesData.receipts?.titip)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-blue-100 border-l-4 border-l-blue-500">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Transaksi Hari Ini</h3>
              <div className="text-2xl font-black text-blue-600 mb-2">
                {salesData.transactions?.jual?.length + salesData.transactions?.titip?.length} <span className="text-sm font-medium text-gray-500">transaksi</span>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Jual Putus:</span>
                  <span className="font-semibold">{salesData.transactions?.jual?.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Titip Konsinyasi:</span>
                  <span className="font-semibold">{salesData.transactions?.titip?.length}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-orange-100 border-l-4 border-l-orange-500">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Transfer Stok Masuk Hari Ini</h3>
              <div className="text-2xl font-black text-orange-600 mb-2">
                {salesData.transfers?.today?.length} <span className="text-sm font-medium text-gray-500">kali</span>
              </div>
              <div className="text-xs text-gray-600">
                Total item diterima hari ini tercatat dalam {salesData.transfers?.today?.length} nota transfer dari Admin.
              </div>
            </div>
          </div>

          {/* Combined History Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Aktivitas Stok Hari Ini & Sebelumnya</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md inline-block mb-3">Hari Ini</h4>
                {(() => {
                  const todayActivity = [
                    ...(salesData.transfers?.today || []).map((t: any) => ({ ...t, activity_type: 'transfer' })),
                    ...(salesData.transactions?.today || []).map((t: any) => ({ ...t, activity_type: 'transaction' }))
                  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                  if (todayActivity.length === 0) {
                    return <p className="text-sm text-gray-500 italic px-2">Belum ada aktivitas stok hari ini.</p>;
                  }

                  return (
                    <ul className="space-y-3">
                      {todayActivity.map((item: any) => (
                        <li key={`${item.activity_type}-${item.id}`} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                          <div>
                            <p className="font-semibold text-gray-800">{item.product?.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.activity_type === 'transfer' ? 'Dari Admin' : (item.partner?.name || 'Langsung')} &bull; {new Intl.DateTimeFormat('id-ID', { timeStyle: 'short' }).format(new Date(item.created_at))} WIB
                            </p>
                          </div>
                          {item.activity_type === 'transfer' ? (
                            <div className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-sm">
                              +{Number(item.quantity)} {item.product?.base_unit}
                            </div>
                          ) : (
                            <div className={`font-bold px-3 py-1 rounded-full text-sm ${item.type === 'jual' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              -{Number(item.quantity)} {item.product?.base_unit}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  );
                })()}
              </div>

              {(() => {
                const pastActivity = [
                  ...(salesData.transfers?.past || []).map((t: any) => ({ ...t, activity_type: 'transfer' })),
                  ...(salesData.transactions?.past || []).map((t: any) => ({ ...t, activity_type: 'transaction' }))
                ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

                if (pastActivity.length === 0) return null;

                const displayActivity = pastActivity.slice(0, 8);

                return (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 bg-gray-50 px-3 py-1.5 rounded-md inline-block mb-3">Sebelumnya</h4>
                    <ul className="space-y-3">
                      {displayActivity.map((item: any) => (
                        <li key={`${item.activity_type}-${item.id}`} className="flex justify-between items-center bg-gray-50/50 p-3 rounded-lg border border-gray-100 opacity-80">
                          <div>
                            <p className="font-semibold text-gray-700">{item.product?.name}</p>
                            <p className="text-xs text-gray-500">
                              {item.activity_type === 'transfer' ? 'Dari Admin' : (item.partner?.name || 'Langsung')} &bull; {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(item.created_at))}
                            </p>
                          </div>
                          {item.activity_type === 'transfer' ? (
                            <div className="bg-gray-200 text-gray-700 font-bold px-3 py-1 rounded-full text-sm">
                              +{Number(item.quantity)} {item.product?.base_unit}
                            </div>
                          ) : (
                            <div className={`font-bold px-3 py-1 rounded-full text-sm ${item.type === 'jual' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              -{Number(item.quantity)} {item.product?.base_unit}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {pastActivity.length > 8 && (
                      <p className="text-xs text-gray-500 text-center mt-3">Menampilkan 8 aktivitas terakhir.</p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Admin Dashboard */}
      {user?.role === 'admin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4">
              📦
            </div>
            <h3 className="text-lg font-bold text-gray-800">Manajemen Stok</h3>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              Pantau stok bahan baku (terigu, gula, mentega) dan stok barang jadi Anda secara realtime.
            </p>
            <Link href="/dashboard/stok" className="text-blue-600 font-medium text-sm hover:underline">
              Lihat Stok &rarr;
            </Link>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center text-2xl mb-4">
              🛒
            </div>
            <h3 className="text-lg font-bold text-gray-800">Pembelian Bahan</h3>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              Catat semua transaksi pembelian (kulakan) bahan baku ke supplier untuk menambah stok.
            </p>
            <Link href="/dashboard/pembelian" className="text-green-600 font-medium text-sm hover:underline">
              Kelola Pembelian &rarr;
            </Link>
          </div>
        </div>
      )}

    </div>
  );
}
