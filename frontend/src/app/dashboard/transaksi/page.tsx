"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function DaftarTransaksiPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [myStock, setMyStock] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSales, setFilterSales] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form states
  const [partnerId, setPartnerId] = useState("");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("titip");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Modal States
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTransaction, setPayTransaction] = useState<any>(null);
  const [returQty, setReturQty] = useState("0");
  const [paidAmount, setPaidAmount] = useState("");

  // Return Stock Modal States
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnStockItem, setReturnStockItem] = useState<any>(null);
  const [returnStockQty, setReturnStockQty] = useState("");
  const [returnNotes, setReturnNotes] = useState("");

  const fetchData = async () => {
    try {
      const [resTx, resPartners, resStock, resUser] = await Promise.all([
        axios.get("/api/sales-transactions"),
        axios.get("/api/partners"),
        axios.get("/api/my-stock"),
        axios.get("/api/user")
      ]);
      setTransactions(resTx.data);
      setPartners(resPartners.data);
      setMyStock(resStock.data);
      setUser(resUser.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenForm = () => {
    setPartnerId("");
    setProductId("");
    setType("titip");
    setQuantity("");
    setPrice("");
    setNotes("");
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = async (transaction: any) => {
    if (user?.role === "admin") {
      try {
        const resStock = await axios.get(`/api/my-stock?user_id=${transaction.user_id}`);
        setMyStock(resStock.data);
      } catch (e) {
        console.error(e);
      }
    }
    setPartnerId(transaction.partner_id.toString());
    setProductId(transaction.product_id.toString());
    setType(transaction.type);
    setQuantity(transaction.quantity);
    setPrice(transaction.price);
    setNotes(transaction.notes || "");
    setEditingId(transaction.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerId || !productId || !quantity || !price || Number(quantity) <= 0 || Number(price) < 0) {
      return alert("Mohon lengkapi semua field dengan benar.");
    }

    try {
      const payload = {
        partner_id: partnerId,
        product_id: productId,
        type,
        quantity,
        price,
        notes 
      };

      if (editingId) {
        await axios.put(`/api/sales-transactions/${editingId}`, payload);
      } else {
        await axios.post("/api/sales-transactions", payload);
      }
      handleCloseForm();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menyimpan transaksi");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus transaksi ini? (Stok akan dikembalikan)")) return;
    try {
      await axios.delete(`/api/sales-transactions/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus transaksi");
    }
  };

  const handleOpenPayModal = (transaction: any) => {
    setPayTransaction(transaction);
    setReturQty("0");
    setPaidAmount("");
    setShowPayModal(true);
  };

  const handleClosePayModal = () => {
    setShowPayModal(false);
    setPayTransaction(null);
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTransaction) return;

    if (Number(returQty) < 0 || Number(returQty) > Number(payTransaction.quantity)) {
      return alert("Jumlah retur tidak valid.");
    }
    
    if (Number(paidAmount) < 0) {
      return alert("Jumlah bayar tidak valid.");
    }

    try {
      await axios.post(`/api/sales-transactions/${payTransaction.id}/pay`, {
        returned_quantity: returQty,
        paid_amount: paidAmount
      });
      handleClosePayModal();
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal memproses pembayaran");
    }
  };

  const handleOpenReturnModal = (stockItem: any) => {
    setReturnStockItem(stockItem);
    setReturnStockQty("");
    setReturnNotes("");
    setShowReturnModal(true);
  };

  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
    setReturnStockItem(null);
  };

  const handleReturnStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnStockItem) return;

    if (Number(returnStockQty) <= 0 || Number(returnStockQty) > Number(returnStockItem.quantity)) {
      return alert("Jumlah retur tidak valid. Pastikan tidak melebihi stok yang Anda bawa.");
    }

    try {
      await axios.post('/api/my-stock/return', {
        product_id: returnStockItem.product_id,
        quantity: returnStockQty,
        notes: returnNotes
      });
      alert("Stok berhasil dikembalikan ke gudang utama.");
      handleCloseReturnModal();
      fetchData(); // refresh stock
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal mengembalikan stok.");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const amountToPay = payTransaction ? (Number(payTransaction.quantity) - Number(returQty)) * Number(payTransaction.price) : 0;

  const uniqueSales = Array.from(new Set(transactions.map(t => t.user?.name).filter(Boolean)));

  const filteredTransactions = transactions.filter(t => {
    if (filterStatus === 'paid' && t.status !== 'paid') return false;
    if (filterStatus === 'unpaid' && t.status === 'paid') return false;
    if (filterSales !== 'all' && t.user?.name !== filterSales) return false;
    
    if (startDate || endDate) {
      const txDate = new Date(t.created_at);
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (txDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (txDate > end) return false;
      }
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Sisa Stok Bawaan (Hanya untuk Sales, kecuali Admin sedang edit) */}
      {!showForm && user?.role === "user_sales" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-sm p-6 text-white col-span-1 md:col-span-3">
            <h3 className="text-lg font-medium opacity-90 mb-4">Sisa Stok Pegangan Anda Saat Ini</h3>
            <div className="flex flex-wrap gap-4">
              {myStock.length === 0 ? (
                <p className="opacity-80 text-sm">Anda belum memiliki stok bawaan. Minta admin melakukan Transfer ke Sales.</p>
              ) : (
                myStock.map((s: any) => (
                  <div key={s.id} className="bg-white/20 px-4 py-3 rounded-xl backdrop-blur-sm border border-white/30 flex flex-col justify-between">
                    <div>
                      <p className="text-xs opacity-90">{s.product?.name}</p>
                      <p className="text-xl font-bold">{Number(s.quantity)} <span className="text-sm font-normal">{s.product?.base_unit}</span></p>
                    </div>
                    {Number(s.quantity) > 0 && (
                      <button 
                        onClick={() => handleOpenReturnModal(s)}
                        className="mt-2 text-xs bg-white text-orange-600 hover:bg-orange-50 px-3 py-1.5 rounded-lg font-semibold transition-colors w-full"
                      >
                        Kembalikan ke Admin
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">{editingId ? "Edit Transaksi" : "Catat Transaksi Sales"}</h2>
            <button 
              onClick={handleCloseForm}
              className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Partner / Toko Tujuan</label>
              <select 
                value={partnerId}
                onChange={e => setPartnerId(e.target.value)}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border bg-white"
              >
                <option value="">-- Pilih Partner --</option>
                {partners.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name} {p.location ? `- ${p.location}` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Produk (Dari stok pegangan Anda)</label>
              <select 
                value={productId}
                onChange={e => {
                  const val = e.target.value;
                  setProductId(val);
                  const selectedStock = myStock.find((s:any) => s.product_id == val);
                  if (selectedStock && selectedStock.product?.selling_price) {
                    setPrice(selectedStock.product.selling_price);
                  } else {
                    setPrice("");
                  }
                }}
                required
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border bg-white"
              >
                <option value="">-- Pilih Produk --</option>
                {myStock.map((s: any) => (
                  <option key={s.product_id} value={s.product_id}>{s.product?.name} (Sisa: {Number(s.quantity)} {s.product?.base_unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Transaksi</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value="titip" checked={type === 'titip'} onChange={(e) => setType(e.target.value)} className="text-orange-600 focus:ring-orange-500"/>
                  <span>Titip Konsinyasi</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="radio" name="type" value="jual" checked={type === 'jual'} onChange={(e) => setType(e.target.value)} className="text-orange-600 focus:ring-orange-500"/>
                  <span>Jual Putus</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Qty (Jumlah)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  required
                  placeholder="0"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Harga Satuan</label>
                <input 
                  type="number" 
                  min="0"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  required
                  placeholder="Rp 0"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
                />
              </div>
            </div>

            {quantity && price && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex justify-between items-center">
                <span className="text-orange-800 font-medium">Total Nilai:</span>
                <span className="text-xl font-bold text-orange-600">{formatCurrency(Number(quantity) * Number(price))}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan Tambahan (Opsional)</label>
              <textarea 
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Misal: Titipan expired 3 hari lagi"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
              <button 
                type="button" 
                onClick={handleCloseForm}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                className="px-6 py-2 bg-orange-600 text-white rounded-xl hover:bg-orange-700 font-medium shadow-md shadow-orange-200 transition-all"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Transaksi"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Daftar Transaksi Sales</h2>
              <p className="text-sm text-gray-500 mt-1">Riwayat penitipan dan penjualan produk ke partner.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2">
                <input 
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="border-gray-300 rounded-xl shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 text-sm border bg-white"
                />
                <span className="text-gray-500 text-sm">s/d</span>
                <input 
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="border-gray-300 rounded-xl shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 text-sm border bg-white"
                />
              </div>
              <select 
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border-gray-300 rounded-xl shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 text-sm border bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="unpaid">Belum Bayar</option>
                <option value="paid">Lunas</option>
              </select>
              {user?.role === "admin" && (
                <select 
                  value={filterSales}
                  onChange={e => setFilterSales(e.target.value)}
                  className="border-gray-300 rounded-xl shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2 text-sm border bg-white"
                >
                  <option value="all">Semua Sales</option>
                  {uniqueSales.map((salesName: any, idx: number) => (
                    <option key={idx} value={salesName}>{salesName}</option>
                  ))}
                </select>
              )}
              {user?.role === "user_sales" && (
                <button 
                  onClick={() => handleOpenForm()}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
                >
                  + Buat Transaksi
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="text-gray-500">Memuat data transaksi...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Waktu</th>
                    <th className="px-4 py-3">Sales</th>
                    <th className="px-4 py-3">Partner</th>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Tipe</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Total Harga</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-gray-500">
                        Belum ada riwayat transaksi.
                      </td>
                    </tr>
                  ) : (
                    filteredTransactions.map((t: any) => (
                      <tr key={t.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-4 text-gray-600 whitespace-nowrap">
                          {formatDate(t.created_at)}
                        </td>
                        <td className="px-4 py-4 text-gray-800">
                          {t.user?.name}
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-800">
                          {t.partner?.name}
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-700">
                          {t.product?.name}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'jual' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {t.type === 'jual' ? 'JUAL PUTUS' : 'TITIP'}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-gray-700">
                          {Number(t.quantity)} {t.product?.base_unit}
                        </td>
                        <td className="px-4 py-4 font-bold text-orange-600">
                          {formatCurrency(Number(t.total_price))}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {t.status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right space-x-3 whitespace-nowrap">
                          {user?.role === "user_sales" && t.status !== 'paid' && (
                            <button 
                              onClick={() => handleOpenPayModal(t)}
                              className="text-emerald-600 hover:text-emerald-800 font-medium"
                            >
                              Bayar
                            </button>
                          )}
                          {user?.role === "user_sales" && t.status !== 'paid' && (
                            <button 
                              onClick={() => handleDelete(t.id)} 
                              className="text-red-500 hover:text-red-700 font-medium"
                            >
                              Batalkan
                            </button>
                          )}
                          {user?.role === "admin" && (
                            <button 
                              onClick={() => handleEdit(t)} 
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && payTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Pembayaran Transaksi</h2>
            <div className="mb-4 bg-gray-50 p-3 rounded-lg text-sm space-y-1">
              <p><span className="text-gray-500 w-24 inline-block">Partner:</span> <strong>{payTransaction.partner?.name}</strong></p>
              <p><span className="text-gray-500 w-24 inline-block">Produk:</span> <strong>{payTransaction.product?.name}</strong></p>
              <p><span className="text-gray-500 w-24 inline-block">Harga Satuan:</span> <strong>{formatCurrency(Number(payTransaction.price))}</strong></p>
              <p><span className="text-gray-500 w-24 inline-block">Total Bawa:</span> <strong>{Number(payTransaction.quantity)} {payTransaction.product?.base_unit}</strong></p>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Retur (Sisa yang tidak laku)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    min="0"
                    max={Number(payTransaction.quantity)}
                    step="0.01"
                    value={returQty}
                    onChange={e => setReturQty(e.target.value)}
                    required
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                  />
                  <span className="text-gray-500 font-medium">{payTransaction.product?.base_unit}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Barang retur akan dikembalikan ke stok pegangan Anda.</p>
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex justify-between items-center">
                <span className="text-emerald-800 font-medium">Harus Dibayar:</span>
                <span className="text-xl font-bold text-emerald-600">{formatCurrency(amountToPay)}</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nominal yang Dibayarkan (Rp)</label>
                <input 
                  type="number" 
                  min="0"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  required
                  placeholder="Misal: 50000"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-2.5 border"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={handleClosePayModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium shadow-md shadow-emerald-200 transition-all"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Stock Modal */}
      {showReturnModal && returnStockItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Kembalikan Stok ke Admin</h2>
            <div className="mb-4 bg-orange-50 p-3 rounded-lg text-sm space-y-1">
              <p><span className="text-orange-800 w-24 inline-block">Produk:</span> <strong>{returnStockItem.product?.name}</strong></p>
              <p><span className="text-orange-800 w-24 inline-block">Sisa di Tangan:</span> <strong>{Number(returnStockItem.quantity)} {returnStockItem.product?.base_unit}</strong></p>
            </div>

            <form onSubmit={handleReturnStockSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah yang Dikembalikan</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" 
                    min="0.01"
                    max={Number(returnStockItem.quantity)}
                    step="0.01"
                    value={returnStockQty}
                    onChange={e => setReturnStockQty(e.target.value)}
                    required
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
                  />
                  <span className="text-gray-500 font-medium">{returnStockItem.product?.base_unit}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan (Opsional)</label>
                <textarea 
                  rows={2}
                  value={returnNotes}
                  onChange={e => setReturnNotes(e.target.value)}
                  placeholder="Misal: Barang sisa ditarik admin"
                  className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-2.5 border"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                <button 
                  type="button" 
                  onClick={handleCloseReturnModal}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium shadow-md shadow-orange-200 transition-all"
                >
                  Proses Pengembalian
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
