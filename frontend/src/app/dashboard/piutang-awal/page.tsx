"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function InputPiutangAwalPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form states
  const [userId, setUserId] = useState("");
  const [partnerId, setPartnerId] = useState("");
  const [productId, setProductId] = useState("");
  const [type, setType] = useState("titip");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");
  const [createdAt, setCreatedAt] = useState("");

  const fetchData = async () => {
    try {
      const [resUsers, resPartners, resProducts] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/partners"),
        axios.get("/api/products")
      ]);
      setUsers(resUsers.data.filter((u: any) => u.role === 'user_sales'));
      setPartners(resPartners.data);
      // Hanya ambil produk jadi
      setProducts(resProducts.data.filter((p: any) => 
        p.category?.name?.toLowerCase() === 'produk jadi' || 
        p.category?.name?.toLowerCase().includes('jadi')
      ));
    } catch (err) {
      console.error(err);
      alert("Gagal memuat data referensi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || !partnerId || !productId || !quantity || !price || !createdAt) {
      return alert("Mohon lengkapi semua isian.");
    }

    setSubmitLoading(true);
    try {
      await axios.post("/api/sales-transactions/past-piutang", {
        user_id: userId,
        partner_id: partnerId,
        product_id: productId,
        type,
        quantity: Number(quantity),
        price: Number(price),
        created_at: createdAt
      });
      alert("Piutang masa lalu berhasil disimpan!");
      // Reset form
      setProductId("");
      setQuantity("");
      setPrice("");
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan data");
    } finally {
      setSubmitLoading(false);
    }
  };

  // Pre-fill price when product changes
  useEffect(() => {
    if (productId) {
      const prod: any = products.find((p: any) => p.id.toString() === productId);
      if (prod && prod.price) {
        setPrice(prod.price.toString());
      }
    }
  }, [productId, products]);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat form...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
        <div className="mb-6 border-b border-gray-100 pb-4">
          <h2 className="text-xl font-bold text-gray-800">
            Input Piutang Masa Lalu (Khusus Admin)
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Gunakan form ini untuk mencatat transaksi lama yang belum lunas agar tercatat di Daftar Partner. Stok barang tidak akan berkurang.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pilih Sales <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
              >
                <option value="">-- Pilih Sales --</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Pilih Partner <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                required
              >
                <option value="">-- Pilih Partner --</option>
                {partners.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Jenis Penjualan <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="titip">Titip (Konsinyasi)</option>
                <option value="jual">Jual Putus</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Produk <span className="text-red-500">*</span>
              </label>
              <select
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                <option value="">-- Pilih Produk --</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Kuantitas <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Harga Jual Satuan <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={submitLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center disabled:opacity-50"
            >
              {submitLoading ? "Menyimpan..." : "Simpan Piutang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
