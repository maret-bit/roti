"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function HasilProduksiPage() {
  const [results, setResults] = useState<any[]>([]);
  const [transfers, setTransfers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [salesUsers, setSalesUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states Production
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  // Form states Transfer
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [transferUserId, setTransferUserId] = useState("");
  const [transferProductId, setTransferProductId] = useState("");
  const [transferQuantity, setTransferQuantity] = useState("");
  const [transferNotes, setTransferNotes] = useState("");

  const fetchData = async () => {
    try {
      const [resResults, resProducts, resUsers, resTransfers] = await Promise.all([
        axios.get("/api/production/results"),
        axios.get("/api/products"),
        axios.get("/api/users"),
        axios.get("/api/transfers")
      ]);
      setResults(resResults.data);
      setProducts(resProducts.data);
      setTransfers(resTransfers.data);
      setSalesUsers(resUsers.data.filter((u: any) => u.role === "user_sales"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const finishedProducts = products.filter((p: any) => p.category?.name === "Produk Jadi");

  const getProductBaseUnit = (id: string | number) => {
    const p = products.find((prod: any) => prod.id == id);
    return p ? (p as any).base_unit : "";
  };

  // Production Handlers
  const handleOpenForm = () => {
    setProductId("");
    setQuantity("");
    setNotes("");
    setShowForm(true);
    setShowTransferForm(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data hasil produksi ini? Stok yang sudah bertambah akan dikembalikan/dikurangi.")) return;
    try {
      await axios.delete(`/api/production/results/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data hasil produksi");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !quantity || Number(quantity) <= 0) {
      return alert("Mohon lengkapi produk dan quantity dengan benar");
    }

    try {
      await axios.post("/api/production/results", {
        product_id: productId,
        quantity: quantity,
        notes: notes
      });

      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan hasil produksi");
    }
  };

  // Transfer Handlers
  const handleOpenTransferForm = () => {
    setTransferUserId("");
    setTransferProductId("");
    setTransferQuantity("");
    setTransferNotes("");
    setShowTransferForm(true);
    setShowForm(false);
  };

  const handleDeleteTransfer = async (id: number) => {
    if (!confirm("Hapus data transfer ini? Stok gudang utama akan dikembalikan, dan stok sales akan dikurangi.")) return;
    try {
      await axios.delete(`/api/transfers/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data transfer");
    }
  };

  const handleSubmitTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferUserId || !transferProductId || !transferQuantity || Number(transferQuantity) <= 0) {
      return alert("Mohon lengkapi data transfer dengan benar");
    }

    // Optional: check if stock is enough
    const selectedProduct = products.find((p: any) => p.id == transferProductId) as any;
    if (selectedProduct && Number(selectedProduct.stock) < Number(transferQuantity)) {
      if(!confirm(`Stok gudang utama (${selectedProduct.stock}) kurang dari jumlah yang ditransfer (${transferQuantity}). Lanjutkan? (Stok akan menjadi minus)`)) {
        return;
      }
    }

    try {
      await axios.post("/api/transfers", {
        user_id: transferUserId,
        product_id: transferProductId,
        quantity: transferQuantity,
        notes: transferNotes
      });

      setShowTransferForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan transfer");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-6">
      
      {/* Form Input Hasil Produksi */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 max-w-2xl mx-auto mb-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">Input Hasil Produksi</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk Jadi</label>
              <select 
                value={productId} 
                onChange={e => setProductId(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border bg-white"
              >
                <option value="">-- Pilih Produk Jadi --</option>
                {finishedProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Hasil Produksi</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={quantity} 
                  onChange={e => setQuantity(e.target.value)}
                  required
                  placeholder="Jumlah jadi"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
                />
                <span className="absolute right-3 top-3 text-sm text-gray-500 font-medium">
                  {getProductBaseUnit(productId) || '-'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Stok produk jadi akan otomatis bertambah sebesar angka ini.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan (Opsional)</label>
              <textarea 
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Misal: Kloter 1 loyang, sedikit gosong 2 pcs, dll."
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-md shadow-orange-200 transition-all"
              >
                Simpan & Tambah Stok
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Form Input Transfer ke Sales */}
      {showTransferForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 max-w-2xl mx-auto mb-6">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">Transfer ke Sales</h2>
            <button 
              onClick={() => setShowTransferForm(false)}
              className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmitTransfer} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Sales</label>
              <select 
                value={transferUserId} 
                onChange={e => setTransferUserId(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white"
              >
                <option value="">-- Pilih Akun Sales --</option>
                {salesUsers.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Produk Jadi</label>
              <select 
                value={transferProductId} 
                onChange={e => setTransferProductId(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border bg-white"
              >
                <option value="">-- Pilih Produk Jadi --</option>
                {finishedProducts.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} (Stok Gudang: {Number(p.stock)} {p.base_unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qty Ditransfer</label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={transferQuantity} 
                  onChange={e => setTransferQuantity(e.target.value)}
                  required
                  placeholder="Jumlah yang dibawa sales"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                />
                <span className="absolute right-3 top-3 text-sm text-gray-500 font-medium">
                  {getProductBaseUnit(transferProductId) || '-'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Stok gudang utama akan berkurang, stok sales akan bertambah.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keterangan (Opsional)</label>
              <textarea 
                rows={2}
                value={transferNotes}
                onChange={e => setTransferNotes(e.target.value)}
                placeholder="Misal: Bawa keliling area X"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => setShowTransferForm(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-all"
              >
                Proses Transfer
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && !showTransferForm && (
        <div className="grid grid-cols-1 gap-6">
          {/* List Hasil Produksi */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Riwayat Hasil Produksi</h2>
              <button 
                onClick={handleOpenForm}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                + Input Hasil Produksi
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Memuat data hasil produksi...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Waktu</th>
                      <th className="px-4 py-3">Produk Jadi</th>
                      <th className="px-4 py-3">Qty Hasil</th>
                      <th className="px-4 py-3">Catatan</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">
                          Belum ada input hasil produksi.
                        </td>
                      </tr>
                    ) : (
                      results.map((item: any) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-orange-50/30 transition-colors">
                          <td className="px-4 py-4 text-gray-600">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-800">
                            {item.product?.name}
                          </td>
                          <td className="px-4 py-4 font-bold text-green-600">
                            +{Number(item.quantity)} {item.product?.base_unit}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {item.notes || '-'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* List Transfer ke Sales */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 mt-2">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Riwayat Transfer ke Sales</h2>
                <p className="text-sm text-gray-500 mt-1">Stok gudang yang dibawa oleh sales (Beralih ke stok sales).</p>
              </div>
              <button 
                onClick={handleOpenTransferForm}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
              >
                + Transfer ke Sales
              </button>
            </div>

            {loading ? (
              <p className="text-gray-500">Memuat data transfer...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Waktu</th>
                      <th className="px-4 py-3">Nama Sales</th>
                      <th className="px-4 py-3">Produk</th>
                      <th className="px-4 py-3">Qty Transfer</th>
                      <th className="px-4 py-3">Catatan</th>
                      <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transfers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-gray-500">
                          Belum ada riwayat transfer ke sales.
                        </td>
                      </tr>
                    ) : (
                      transfers.map((item: any) => (
                        <tr key={item.id} className="border-b last:border-0 hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-4 text-gray-600">
                            {formatDate(item.created_at)}
                          </td>
                          <td className="px-4 py-4 font-semibold text-gray-800">
                            {item.user?.name}
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-700">
                            {item.product?.name}
                          </td>
                          <td className="px-4 py-4 font-bold text-blue-600">
                            {Number(item.quantity)} {item.product?.base_unit}
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {item.notes || '-'}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button onClick={() => handleDeleteTransfer(item.id)} className="text-red-500 hover:text-red-700 font-medium">Batalkan</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
