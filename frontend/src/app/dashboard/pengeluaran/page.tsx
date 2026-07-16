"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default function PengeluaranPage() {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [expenseItems, setExpenseItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterCategoryId, setFilterCategoryId] = useState("all");

  // Form (Add / Edit)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    expense_category_id: "",
    expense_item_id: "",
    amount: "",
    expense_date: format(new Date(), "yyyy-MM-dd"),
    notes: ""
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resExpenses, resCategories, resItems] = await Promise.all([
        axios.get("/api/expenses", {
          params: { start_date: startDate, end_date: endDate, category_id: filterCategoryId }
        }),
        axios.get("/api/expense-categories"),
        axios.get("/api/expense-items")
      ]);
      setExpenses(resExpenses.data);
      setCategories(resCategories.data);
      setExpenseItems(resItems.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, filterCategoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expense_category_id || !formData.amount || !formData.expense_date) {
      alert("Lengkapi form dengan benar.");
      return;
    }

    try {
      if (editingId) {
        await axios.put(`/api/expenses/${editingId}`, formData);
        setEditingId(null);
      } else {
        await axios.post("/api/expenses", formData);
      }
      setFormData({
        expense_category_id: "",
        expense_item_id: "",
        amount: "",
        expense_date: format(new Date(), "yyyy-MM-dd"),
        notes: ""
      });
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan pengeluaran.");
    }
  };

  const handleEdit = (expense: any) => {
    setEditingId(expense.id);
    setFormData({
      expense_category_id: expense.expense_category_id,
      expense_item_id: expense.expense_item_id || "",
      amount: expense.amount,
      expense_date: expense.expense_date,
      notes: expense.notes || ""
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      expense_category_id: "",
      expense_item_id: "",
      amount: "",
      expense_date: format(new Date(), "yyyy-MM-dd"),
      notes: ""
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus data pengeluaran ini?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus.");
    }
  };

  // Kalkulasi total
  const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border-l-4 border-red-500">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pengeluaran Lain-lain</h1>
          <p className="text-sm text-gray-500 mt-1">Catat biaya operasional diluar bahan baku.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)} 
            className="border rounded-lg px-3 py-2 text-sm" 
          />
          <span className="self-center text-gray-400">s/d</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)} 
            className="border rounded-lg px-3 py-2 text-sm" 
          />
          <select 
            value={filterCategoryId} 
            onChange={e => setFilterCategoryId(e.target.value)} 
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* FORM */}
        <div className="bg-white rounded-2xl shadow-sm p-6 col-span-1 h-fit">
          <h2 className="text-lg font-bold mb-4 border-b pb-2">
            {editingId ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal</label>
              <input 
                type="date" 
                required 
                className="border rounded-lg w-full p-2"
                value={formData.expense_date}
                onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                required 
                className="border rounded-lg w-full p-2 bg-white"
                value={formData.expense_category_id}
                onChange={e => {
                  setFormData({ ...formData, expense_category_id: e.target.value, expense_item_id: "" });
                }}
              >
                <option value="">Pilih Kategori</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item Pengeluaran</label>
              <select 
                className="border rounded-lg w-full p-2 bg-white"
                value={formData.expense_item_id}
                onChange={e => setFormData({ ...formData, expense_item_id: e.target.value })}
              >
                <option value="">(Opsional) Pilih Item</option>
                {expenseItems.filter((i: any) => i.expense_category_id == formData.expense_category_id).map((i: any) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah (Rp)</label>
              <input 
                type="number" 
                required 
                min="0"
                className="border rounded-lg w-full p-2"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Deskripsi</label>
              <textarea 
                rows={3} 
                className="border rounded-lg w-full p-2"
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
            
            <div className="pt-2 flex gap-2">
              <button 
                type="submit" 
                className="bg-red-600 hover:bg-red-700 text-white w-full rounded-lg py-2 font-medium transition-colors"
              >
                {editingId ? "Simpan Perubahan" : "Simpan Pengeluaran"}
              </button>
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg px-4 py-2 font-medium transition-colors"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* LIST */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden col-span-1 md:col-span-2">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-gray-700">Riwayat Pengeluaran</h2>
            <div className="text-sm font-semibold bg-red-100 text-red-800 px-3 py-1 rounded-full">
              Total: {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalAmount)}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-gray-600 bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Catatan</th>
                  <th className="px-4 py-3 text-right">Jumlah</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">Memuat data...</td>
                  </tr>
                ) : expenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">Tidak ada data pengeluaran.</td>
                  </tr>
                ) : (
                  expenses.map((expense: any) => (
                    <tr key={expense.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        {format(new Date(expense.expense_date), "dd MMM yyyy", { locale: localeId })}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                          {expense.category?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {expense.item?.name || "-"}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{expense.notes || "-"}</td>
                      <td className="px-4 py-3 text-right font-medium text-red-600">
                        {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(expense.amount)}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap space-x-3">
                        <button 
                          onClick={() => handleEdit(expense)} 
                          className="text-blue-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(expense.id)} 
                          className="text-red-600 hover:underline"
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
        </div>

      </div>
    </div>
  );
}
