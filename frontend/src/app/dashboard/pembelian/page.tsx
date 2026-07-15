"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function PembelianPage() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);

  // Data referensi untuk form
  const [products, setProducts] = useState<any[]>([]);
  const [units, setUnits] = useState<any[]>([]);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [details, setDetails] = useState([
    { product_id: "", quantity: 1, unit: "", price: 0 }
  ]);

  const fetchData = async () => {
    try {
      const [resPurchases, resProducts, resUnits] = await Promise.all([
        axios.get("/api/purchases"),
        axios.get("/api/products"),
        axios.get("/api/units"),
      ]);
      setPurchases(resPurchases.data);
      setProducts(resProducts.data);
      setUnits(resUnits.data);
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
    setEditId(null);
    setDetails([{ product_id: "", quantity: 1, unit: "", price: 0 }]);
    const today = new Date().toISOString().split('T')[0];
    setPurchaseDate(today);

    // Generate Invoice Number: INV-YYYYMMDD-XXXX
    const dateStr = today.replace(/-/g, '');
    let maxCount = 0;
    purchases.forEach((p: any) => {
      if (p.invoice_number && p.invoice_number.startsWith(`INV-${dateStr}-`)) {
        const parts = p.invoice_number.split('-');
        if (parts.length === 3) {
          const count = parseInt(parts[2], 10);
          if (count > maxCount) maxCount = count;
        }
      }
    });
    const nextCount = maxCount + 1;
    setInvoiceNumber(`INV-${dateStr}-${nextCount.toString().padStart(4, '0')}`);
    
    setShowForm(true);
  };

  const handleAddDetail = () => {
    setDetails([...details, { product_id: "", quantity: 1, unit: "", price: 0 }]);
  };

  const handleRemoveDetail = (index: number) => {
    const newDetails = details.filter((_, i) => i !== index);
    setDetails(newDetails);
  };

  const handleChangeDetail = (index: number, field: string, value: any) => {
    const newDetails = [...details];
    (newDetails[index] as any)[field] = value;
    
    // Auto-fill unit if product is selected
    if (field === 'product_id') {
      const selectedProduct = products.find((p: any) => p.id === parseInt(value) || p.id === value);
      if (selectedProduct) {
         if (selectedProduct.unit_conversions && selectedProduct.unit_conversions.length > 0) {
           newDetails[index].unit = selectedProduct.unit_conversions[0].from_unit;
         } else {
           newDetails[index].unit = selectedProduct.base_unit || "";
         }
      }
    }
    
    setDetails(newDetails);
  };

  const getProductUnits = (productId: any) => {
    if (!productId) return units;
    const selectedProduct = products.find((p: any) => p.id === parseInt(productId) || p.id === productId);
    if (!selectedProduct) return units;
    
    let validUnits: string[] = [];
    if (selectedProduct.unit_conversions && selectedProduct.unit_conversions.length > 0) {
      // Jika ada konversi, asumsikan itu adalah satuan beli
      validUnits = selectedProduct.unit_conversions.map((c: any) => c.from_unit);
    } else {
      // Jika tidak ada konversi, gunakan satuan dasar
      validUnits = [selectedProduct.base_unit];
    }
    
    return units.filter((u: any) => validUnits.includes(u.name));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (details.length === 0) {
      alert("Harap tambahkan minimal 1 produk.");
      return;
    }

    try {
      const payload = {
        invoice_number: invoiceNumber,
        purchase_date: purchaseDate,
        details: details.map(d => ({
          ...d,
          quantity: parseFloat(d.quantity as any),
          price: parseFloat(d.price as any)
        }))
      };

      if (editId) {
        await axios.put(`/api/purchases/${editId}`, payload);
        alert("Pembelian berhasil diperbarui!");
      } else {
        await axios.post("/api/purchases", payload);
        alert("Pembelian berhasil disimpan!");
      }

      setShowForm(false);
      setEditId(null);
      setInvoiceNumber("");
      setPurchaseDate("");
      setDetails([{ product_id: "", quantity: 1, unit: "", price: 0 }]);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Terjadi kesalahan saat menyimpan pembelian.");
    }
  };

  const handleEdit = (purchase: any) => {
    setEditId(purchase.id);
    setInvoiceNumber(purchase.invoice_number);
    setPurchaseDate(purchase.purchase_date);
    setDetails(purchase.details.map((d: any) => ({
      product_id: d.product_id,
      quantity: d.quantity,
      unit: d.unit,
      price: d.price
    })));
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus transaksi pembelian ini? Stok yang terkait akan ditarik kembali.")) return;
    try {
      await axios.delete(`/api/purchases/${id}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || "Gagal menghapus transaksi.");
    }
  };

  const totalAmount = details.reduce((sum, d) => sum + (Number(d.quantity) * Number(d.price)), 0);

  return (
    <div className="space-y-6">
      
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Form Tambah Pembelian</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 font-bold">&times; Tutup</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">No. Invoice</label>
                <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} required className="border rounded-lg p-2 w-full" placeholder="INV-2026-..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Pembelian</label>
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} required className="border rounded-lg p-2 w-full" />
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold text-gray-700 mb-2">Daftar Produk / Bahan Baku</h3>
              <div className="space-y-3">
                {details.map((detail, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1 min-w-[200px]">
                      <select value={detail.product_id} onChange={e => handleChangeDetail(index, "product_id", e.target.value)} required className="border rounded p-2 w-full bg-white">
                        <option value="">Pilih Produk</option>
                        {products
                          .filter((p: any) => p.category?.name === 'Bahan Baku')
                          .map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-24">
                      <input type="number" step="0.01" min="0.01" placeholder="Qty" value={detail.quantity} onChange={e => handleChangeDetail(index, "quantity", e.target.value)} required className="border rounded p-2 w-full" />
                    </div>
                    <div className="w-32">
                      {getProductUnits(detail.product_id).length <= 1 ? (
                        <input type="text" value={detail.unit} readOnly placeholder="Satuan" className="border rounded p-2 w-full bg-gray-100 text-gray-500 cursor-not-allowed" />
                      ) : (
                        <select value={detail.unit} onChange={e => handleChangeDetail(index, "unit", e.target.value)} required className="border rounded p-2 w-full bg-white">
                          <option value="">Satuan</option>
                          {getProductUnits(detail.product_id).map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div className="w-40">
                      <input type="number" placeholder="Harga Satuan" value={detail.price} onChange={e => handleChangeDetail(index, "price", e.target.value)} required className="border rounded p-2 w-full" />
                    </div>
                    <div className="w-32 text-right font-medium text-gray-700">
                      Rp {new Intl.NumberFormat('id-ID').format(Number(detail.quantity) * Number(detail.price))}
                    </div>
                    {details.length > 1 && (
                      <button type="button" onClick={() => handleRemoveDetail(index)} className="text-red-500 hover:text-red-700 font-bold px-2">&times;</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <button type="button" onClick={handleAddDetail} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1 px-3 rounded font-medium">
                  + Tambah Baris
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center border-t pt-4 mt-6">
              <div className="text-lg">
                Total: <span className="font-bold text-green-600">Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}</span>
              </div>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">
                {editId ? "Perbarui Transaksi" : "Simpan Transaksi"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Riwayat Pembelian</h2>
          {!showForm && (
            <button onClick={handleOpenForm} className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Tambah Pembelian
            </button>
          )}
        </div>

        {loading ? (
          <p>Memuat data pembelian...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">No. Invoice</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Detail Produk</th>
                  <th className="px-4 py-3">Pembeli</th>
                  <th className="px-4 py-3 text-right">Total Transaksi</th>
                  <th className="px-4 py-3 rounded-tr-lg text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">Belum ada data pembelian</td>
                  </tr>
                ) : (
                  purchases.map((p: any) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium align-top">{p.invoice_number}</td>
                      <td className="px-4 py-3 align-top">{p.purchase_date}</td>
                      <td className="px-4 py-3 align-top">
                        {p.details && p.details.length > 0 ? (
                          <ul className="list-disc list-inside text-gray-700 space-y-1">
                            {p.details.map((d: any, i: number) => (
                              <li key={i}>{d.product?.name} <span className="font-semibold text-blue-600">({d.quantity} {d.unit})</span></li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Detail tidak tersedia</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">{p.user?.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600 align-top">
                        Rp {new Intl.NumberFormat('id-ID').format(p.total_amount)}
                      </td>
                      <td className="px-4 py-3 text-center align-top space-x-3">
                        <button onClick={() => handleEdit(p)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:text-red-800 font-medium">Hapus</button>
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
  );
}
