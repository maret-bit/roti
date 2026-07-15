"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function StokPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Bahan Baku");

  // Opname Modal States
  const [opnameProduct, setOpnameProduct] = useState<any>(null);
  const [actualStock, setActualStock] = useState<string>("");
  const [opnameNotes, setOpnameNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchStok = async () => {
    try {
      const [resProducts, resHistory] = await Promise.all([
        axios.get("/api/inventory"),
        axios.get("/api/inventory/history")
      ]);
      setProducts(resProducts.data);
      setHistory(resHistory.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStok();
  }, []);

  const filteredProducts = products.filter((p: any) => p.category?.name === activeTab);
  const filteredHistory = history.filter((h: any) => h.product?.category?.name === activeTab);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const handleOpenOpname = (product: any) => {
    setOpnameProduct(product);
    setActualStock(Number(product.stock).toString());
    setOpnameNotes("");
  };

  const handleCloseOpname = () => {
    setOpnameProduct(null);
    setActualStock("");
    setOpnameNotes("");
  };

  const submitOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opnameProduct || actualStock === "") return;

    setSubmitting(true);
    try {
      await axios.post("/api/inventory/opname", {
        product_id: opnameProduct.id,
        actual_stock: parseFloat(actualStock),
        notes: opnameNotes
      });
      
      // Close modal and refresh data
      handleCloseOpname();
      fetchStok();
    } catch (error) {
      console.error("Opname error:", error);
      alert("Gagal melakukan opname stock.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stok Terkini */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Stok (Inventory)</h2>
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab("Bahan Baku")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Bahan Baku" ? "bg-white shadow text-orange-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              Bahan Baku
            </button>
            <button 
              onClick={() => setActiveTab("Produk Jadi")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "Produk Jadi" ? "bg-white shadow text-orange-600" : "text-gray-600 hover:text-gray-900"}`}
            >
              Produk Jadi
            </button>
          </div>
        </div>
        
        {loading ? (
          <p className="text-gray-500">Memuat data stok...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase border-b">
                <tr>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Stok Saat Ini</th>
                  <th className="px-4 py-3">Satuan Dasar</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500">Belum ada data stok untuk {activeTab}</td>
                  </tr>
                ) : (
                  filteredProducts.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                      <td className="px-4 py-3 text-gray-600">{p.category?.name}</td>
                      <td className="px-4 py-3 text-orange-600 font-bold">{Number(p.stock)}</td>
                      <td className="px-4 py-3 text-gray-600">{p.base_unit}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => handleOpenOpname(p)}
                          className="bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors"
                        >
                          Stock Opname
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Opname Modal Overlay */}
      {opnameProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Form Stock Opname</h3>
              <p className="text-sm text-gray-500 mt-1">Sesuaikan stok sistem dengan fisik di lapangan.</p>
            </div>
            
            <form onSubmit={submitOpname} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                <input 
                  type="text" 
                  value={opnameProduct.name} 
                  disabled
                  className="w-full border-gray-200 bg-gray-50 text-gray-600 rounded-lg p-2.5 border font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Sistem</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={Number(opnameProduct.stock)} 
                      disabled
                      className="w-full border-gray-200 bg-red-50 text-red-700 rounded-lg p-2.5 border font-bold"
                    />
                    <span className="absolute right-3 top-3 text-sm text-red-500/70">{opnameProduct.base_unit}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Nyata (Fisik)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      required
                      value={actualStock} 
                      onChange={(e) => setActualStock(e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border font-bold text-blue-700"
                    />
                    <span className="absolute right-3 top-3 text-sm text-blue-500/70">{opnameProduct.base_unit}</span>
                  </div>
                </div>
              </div>
              
              {actualStock !== "" && Number(actualStock) !== Number(opnameProduct.stock) && (
                <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg border border-blue-100 flex items-center">
                  <span className="mr-2">💡</span>
                  Selisih stok: <strong>
                    {Number(actualStock) - Number(opnameProduct.stock) > 0 ? '+' : ''}
                    {Number(actualStock) - Number(opnameProduct.stock)} {opnameProduct.base_unit}
                  </strong>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan (Opsional)</label>
                <textarea 
                  rows={2}
                  value={opnameNotes}
                  onChange={(e) => setOpnameNotes(e.target.value)}
                  placeholder="Misal: Barang rusak, salah hitung sebelumnya, dll."
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border text-sm"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={handleCloseOpname}
                  disabled={submitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-all ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {submitting ? 'Memproses...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tracking Stock */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">Tracking Stock Terakhir</h2>
          <p className="text-sm text-gray-500 mt-1">30 aktivitas terakhir untuk {activeTab}</p>
        </div>

        {loading ? (
          <p className="text-gray-500">Memuat riwayat stok...</p>
        ) : (
          <div className="overflow-x-auto border rounded-xl overflow-hidden">
            <div className="max-h-[480px] overflow-y-auto">
              <table className="w-full text-sm text-left relative">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase sticky top-0 shadow-sm z-10">
                  <tr>
                    <th className="px-4 py-3">Waktu</th>
                    <th className="px-4 py-3">Barang</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Catatan / Referensi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-gray-500">Belum ada riwayat pergerakan stok.</td>
                    </tr>
                  ) : (
                    filteredHistory.map((h: any) => (
                      <tr key={h.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(h.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{h.product?.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${h.type === 'in' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {h.type === 'in' ? 'IN' : 'OUT'}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${h.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                          {h.type === 'in' ? '+' : '-'}{Number(h.quantity)} {h.product?.base_unit}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {h.reference_type === 'Purchase' && 'Pembelian'}
                          {h.reference_type === 'Production' && 'Produksi'}
                          {h.reference_type === 'Opname' && 'Stock Opname'}
                          {h.notes ? ` - ${h.notes}` : ''}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
