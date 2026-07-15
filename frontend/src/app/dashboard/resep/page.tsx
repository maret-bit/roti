"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function ResepPage() {
  const [recipes, setRecipes] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState([
    { product_id: "", quantity: 1, unit: "" }
  ]);

  const fetchData = async () => {
    try {
      const [resRecipes, resProducts] = await Promise.all([
        axios.get("/api/recipes"),
        axios.get("/api/products"),
      ]);
      setRecipes(resRecipes.data);
      setProducts(resProducts.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const rawMaterials = products.filter((p: any) => p.category?.name === "Bahan Baku");

  const getProductBaseUnit = (id: string | number) => {
    const p = products.find((prod: any) => prod.id == id);
    return p ? (p as any).base_unit : "";
  };

  const handleOpenForm = () => {
    setEditId(null);
    setName("");
    setIngredients([{ product_id: "", quantity: 1, unit: "" }]);
    setShowForm(true);
  };

  const handleEdit = (recipe: any) => {
    setEditId(recipe.id);
    setName(recipe.name || "");
    setIngredients(recipe.ingredients.map((ing: any) => ({
      product_id: ing.product_id,
      quantity: ing.quantity,
      unit: ing.unit,
    })));
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus resep ini?")) return;
    try {
      await axios.delete(`/api/recipes/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus resep");
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { product_id: "", quantity: 1, unit: "" }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleChangeIngredient = (index: number, field: string, value: any) => {
    const newIngredients = [...ingredients];
    (newIngredients[index] as any)[field] = value;
    
    // Automatically set the unit to base_unit when product is selected
    if (field === "product_id" && value) {
      newIngredients[index].unit = getProductBaseUnit(value);
    }
    
    setIngredients(newIngredients);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Nama Resep harus diisi");
    if (ingredients.some(i => !i.product_id || i.quantity <= 0)) {
      return alert("Mohon lengkapi semua baris bahan baku");
    }

    try {
      const payload = {
        name,
        ingredients
      };

      if (editId) {
        await axios.put(`/api/recipes/${editId}`, payload);
      } else {
        await axios.post("/api/recipes", payload);
      }

      setShowForm(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Gagal menyimpan resep");
    }
  };

  return (
    <div className="space-y-6">
      {/* List Resep */}
      {!showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Daftar Resep (BOM)</h2>
            <button 
              onClick={handleOpenForm}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              + Tambah Resep
            </button>
          </div>

          {loading ? (
            <p className="text-gray-500">Memuat data resep...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg w-1/3">Nama Resep</th>
                    <th className="px-4 py-3 w-1/2">Bahan Baku (Komposisi)</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg w-1/6">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recipes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-gray-500">
                        Belum ada data resep. Klik Tambah Resep untuk memulai.
                      </td>
                    </tr>
                  ) : (
                    recipes.map((recipe: any) => (
                      <tr key={recipe.id} className="border-b last:border-0 hover:bg-orange-50/30 transition-colors">
                        <td className="px-4 py-4 align-top font-semibold text-gray-800">
                          {recipe.name}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            {recipe.ingredients.map((ing: any) => (
                              <li key={ing.id}>
                                {ing.product?.name} <span className="font-semibold text-gray-800">({Number(ing.quantity)} {ing.unit})</span>
                              </li>
                            ))}
                          </ul>
                        </td>
                        <td className="px-4 py-4 text-right align-top">
                          <div className="flex justify-end space-x-3">
                            <button onClick={() => handleEdit(recipe)} className="text-blue-600 hover:text-blue-800 font-medium">Edit</button>
                            <button onClick={() => handleDelete(recipe.id)} className="text-red-500 hover:text-red-700 font-medium">Hapus</button>
                          </div>
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

      {/* Form Resep */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">{editId ? 'Edit Resep' : 'Tambah Resep'}</h2>
            <button 
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:bg-gray-100 px-3 py-1 rounded-lg transition-colors"
            >
              Kembali
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama Resep</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                required
                placeholder="Contoh: Adonan Roti Dasar / Adonan Topping Coklat"
                className="w-full border-gray-300 rounded-lg shadow-sm focus:border-orange-500 focus:ring-orange-500 p-3 border"
              />
              <p className="text-xs text-gray-500 mt-2">Nama resep ini nantinya akan Anda pilih saat memproses Produksi.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-800 border-b pb-2">Komposisi Bahan Baku</h3>
              
              <div className="space-y-3">
                {ingredients.map((ing, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1 min-w-[200px]">
                      <select 
                        value={ing.product_id} 
                        onChange={e => handleChangeIngredient(index, "product_id", e.target.value)}
                        required
                        className="w-full border rounded p-2 bg-white"
                      >
                        <option value="">Pilih Bahan</option>
                        {rawMaterials.map((p: any) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="w-32">
                      <input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        placeholder="Qty"
                        value={ing.quantity} 
                        onChange={e => handleChangeIngredient(index, "quantity", e.target.value)}
                        required
                        className="w-full border rounded p-2"
                      />
                    </div>

                    <div className="w-24">
                      <input 
                        type="text" 
                        value={ing.unit} 
                        readOnly
                        placeholder="Satuan"
                        className="w-full border rounded p-2 bg-gray-100 text-gray-500 cursor-not-allowed"
                        title="Satuan mengikuti satuan dasar bahan baku di master data"
                      />
                    </div>

                    {ingredients.length > 1 && (
                      <button type="button" onClick={() => handleRemoveIngredient(index)} className="text-red-500 hover:text-red-700 font-bold px-3 text-lg">&times;</button>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-3">
                <button type="button" onClick={handleAddIngredient} className="text-sm bg-gray-200 hover:bg-gray-300 text-gray-800 py-1.5 px-3 rounded font-medium transition-colors">
                  + Tambah Bahan Baku
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-3 border-t pt-6 mt-6">
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
                Simpan Resep
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
