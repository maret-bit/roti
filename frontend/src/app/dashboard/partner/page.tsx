"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function PartnerPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [unpaidTransactions, setUnpaidTransactions] = useState<any[]>([]);
  const [returInputs, setReturInputs] = useState<Record<number, number>>({});
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");

  const fetchPartners = async () => {
    try {
      const res = await axios.get("/api/partners");
      setPartners(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleOpenForm = (partner?: any) => {
    if (partner) {
      setEditId(partner.id);
      setName(partner.name);
      setLocation(partner.location || "");
      setPhone(partner.phone || "");
    } else {
      setEditId(null);
      setName("");
      setLocation("");
      setPhone("");
    }
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Nama partner wajib diisi");

    try {
      if (editId) {
        await axios.put(`/api/partners/${editId}`, { name, location, phone });
      } else {
        await axios.post("/api/partners", { name, location, phone });
      }
      handleCloseForm();
      fetchPartners();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan data partner");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data partner ini?")) return;
    try {
      await axios.delete(`/api/partners/${id}`);
      fetchPartners();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus data partner");
    }
  };

  const handleOpenPayment = async (partner: any) => {
    setSelectedPartner(partner);
    setShowPaymentModal(true);
    setPaymentLoading(true);
    try {
      const res = await axios.get("/api/sales-transactions");
      const pending = res.data.filter((t: any) => t.partner_id === partner.id && t.status === "pending");
      setUnpaidTransactions(pending);
      const initialRetur: Record<number, number> = {};
      pending.forEach((t: any) => {
        initialRetur[t.id] = 0;
      });
      setReturInputs(initialRetur);
    } catch (err) {
      console.error(err);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setSelectedPartner(null);
    setUnpaidTransactions([]);
  };

  const handleReturChange = (txId: number, val: string) => {
    setReturInputs(prev => ({
      ...prev,
      [txId]: Number(val)
    }));
  };

  const handleBulkPay = async () => {
    if (!confirm("Proses pembayaran untuk semua transaksi ini?")) return;
    try {
      await Promise.all(unpaidTransactions.map(t => {
        const returQty = returInputs[t.id] || 0;
        const subtotal = (Number(t.quantity) - returQty) * Number(t.price);
        return axios.post(`/api/sales-transactions/${t.id}/pay`, {
          returned_quantity: returQty,
          paid_amount: subtotal
        });
      }));
      alert("Pembayaran berhasil!");
      handleClosePayment();
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses pembayaran");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const calculateGrandTotal = () => {
    return unpaidTransactions.reduce((total, t) => {
      const returQty = returInputs[t.id] || 0;
      return total + ((Number(t.quantity) - returQty) * Number(t.price));
    }, 0);
  };

  return (
    <div className="space-y-6">
      {showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <h2 className="text-xl font-bold text-gray-800">
              {editId ? "Edit Partner Konsinyasi" : "Tambah Partner Konsinyasi"}
            </h2>
            <button 
              onClick={handleCloseForm}
              className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Partner / Toko</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="Misal: Warung Ibu Budi"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi / Alamat</label>
              <textarea 
                rows={2}
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="Misal: Jl. Mawar No. 12"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
              <input 
                type="text" 
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Misal: 08123456789"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
              />
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
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium shadow-md shadow-blue-200 transition-all"
              >
                Simpan
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">Daftar Partner Konsinyasi</h2>
              <p className="text-sm text-gray-500 mt-1">Tempat penitipan / penjualan produk roti</p>
            </div>
            <button 
              onClick={() => handleOpenForm()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              + Tambah Partner
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Memuat data partner...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Nama Partner / Toko</th>
                    <th className="px-4 py-3">Lokasi / Alamat</th>
                    <th className="px-4 py-3">Nomor HP</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {partners.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-gray-500">
                        Belum ada daftar partner.
                      </td>
                    </tr>
                  ) : (
                    partners.map((p: any) => (
                      <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-4 py-4 font-semibold text-gray-800">
                          {p.name}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {p.location || '-'}
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {p.phone || '-'}
                        </td>
                        <td className="px-4 py-4 text-right space-x-3">
                          <button 
                            onClick={() => handleOpenPayment(p)} 
                            className="text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            Bayar
                          </button>
                          <button 
                            onClick={() => handleOpenForm(p)} 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(p.id)} 
                            className="text-red-500 hover:text-red-700 font-medium"
                          >
                            Hapus
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
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Tagihan Partner: {selectedPartner.name}</h2>
                <p className="text-sm text-gray-500 mt-1">Daftar transaksi yang belum dibayar</p>
              </div>
              <button onClick={handleClosePayment} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            </div>

            {paymentLoading ? (
              <p className="text-gray-500">Memuat data tagihan...</p>
            ) : unpaidTransactions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-emerald-600 font-semibold mb-2">🎉 Semua tagihan lunas!</p>
                <p className="text-sm text-gray-500">Tidak ada transaksi yang belum dibayar untuk partner ini.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-700">
                      <tr>
                        <th className="px-4 py-3">Tanggal</th>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3">Harga</th>
                        <th className="px-4 py-3">Bawa</th>
                        <th className="px-4 py-3 w-32">Retur</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {unpaidTransactions.map(t => {
                        const retur = returInputs[t.id] || 0;
                        const subtotal = (Number(t.quantity) - retur) * Number(t.price);
                        return (
                          <tr key={t.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600">
                              {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(t.created_at))}
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-800">{t.product?.name}</td>
                            <td className="px-4 py-3 text-gray-600">{formatCurrency(Number(t.price))}</td>
                            <td className="px-4 py-3 font-semibold">{Number(t.quantity)} {t.product?.base_unit}</td>
                            <td className="px-4 py-3">
                              <input 
                                type="number" 
                                min="0" 
                                max={Number(t.quantity)}
                                step="0.01"
                                value={returInputs[t.id] === undefined ? "" : returInputs[t.id]}
                                onChange={(e) => handleReturChange(t.id, e.target.value)}
                                className="w-full border-gray-300 rounded shadow-sm focus:border-emerald-500 focus:ring-emerald-500 p-1.5 text-sm border"
                              />
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-orange-600">
                              {formatCurrency(subtotal)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <span className="text-emerald-900 font-semibold text-lg">Total Pembayaran:</span>
                  <span className="text-2xl font-bold text-emerald-600">{formatCurrency(calculateGrandTotal())}</span>
                  <button 
                    onClick={handleBulkPay}
                    className="w-full md:w-auto px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-md shadow-emerald-200 transition-all"
                  >
                    Lunas Semua
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
