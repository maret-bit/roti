"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function PengaturanPage() {
  const [users, setUsers] = useState([]);
  const [conversions, setConversions] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  
  // --- Unit Form ---
  const [unitName, setUnitName] = useState("");

  // --- User Form ---
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user_sales");

  // Edit User State
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [editUserName, setEditUserName] = useState("");
  const [editUserEmail, setEditUserEmail] = useState("");
  const [editUserPassword, setEditUserPassword] = useState("");
  const [editUserRole, setEditUserRole] = useState("user_sales");

  // --- Conversion Form ---
  const [productId, setProductId] = useState("");
  const [fromUnit, setFromUnit] = useState("");
  const [toUnit, setToUnit] = useState("");
  const [multiplier, setMultiplier] = useState("");

  // Edit Conversion State
  const [editingConversionId, setEditingConversionId] = useState<number | null>(null);
  const [editConversionProductId, setEditConversionProductId] = useState("");
  const [editConversionFromUnit, setEditConversionFromUnit] = useState("");
  const [editConversionToUnit, setEditConversionToUnit] = useState("");
  const [editConversionMultiplier, setEditConversionMultiplier] = useState("");

  // --- Category Form ---
  const [categoryName, setCategoryName] = useState("");

  // --- Product Form ---
  const [productName, setProductName] = useState("");
  const [productCategoryId, setProductCategoryId] = useState("");
  const [productBaseUnit, setProductBaseUnit] = useState("");
  const [productSellingPrice, setProductSellingPrice] = useState("");

  // Edit Product State
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductName, setEditProductName] = useState("");
  const [editProductCategoryId, setEditProductCategoryId] = useState("");
  const [editProductBaseUnit, setEditProductBaseUnit] = useState("");
  const [editProductSellingPrice, setEditProductSellingPrice] = useState("");

  const fetchData = async () => {
    try {
      const [resUsers, resConversions, resProducts, resCategories, resUnits] = await Promise.all([
        axios.get("/api/users"),
        axios.get("/api/unit-conversions"),
        axios.get("/api/products"),
        axios.get("/api/categories"),
        axios.get("/api/units")
      ]);
      setUsers(resUsers.data);
      setConversions(resConversions.data);
      setProducts(resProducts.data);
      setCategories(resCategories.data);
      setUnits(resUnits.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers Unit ---
  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/units", { name: unitName });
      setUnitName("");
      fetchData();
    } catch (err) {
      alert("Gagal menambah satuan. Mungkin nama sudah ada.");
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm("Hapus satuan? Pastikan tidak sedang digunakan oleh produk/konversi.")) return;
    try {
      await axios.delete(`/api/units/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus satuan.");
    }
  };

  // --- Handlers User ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/users", { name, email, password, role });
      setName(""); setEmail(""); setPassword(""); setRole("user_sales");
      fetchData();
    } catch (err) {
      alert("Gagal menambah user.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm("Hapus user?")) return;
    try {
      await axios.delete(`/api/users/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus user.");
    }
  };

  const handleEditUserClick = (u: any) => {
    setEditingUserId(u.id);
    setEditUserName(u.name);
    setEditUserEmail(u.email);
    setEditUserPassword(""); 
    setEditUserRole(u.role);
  };

  const handleCancelEditUser = () => {
    setEditingUserId(null);
  };

  const handleSaveEditUser = async (id: number) => {
    try {
      const payload: any = {
        name: editUserName,
        email: editUserEmail,
        role: editUserRole,
      };
      if (editUserPassword) {
        payload.password = editUserPassword;
      }
      await axios.put(`/api/users/${id}`, payload);
      setEditingUserId(null);
      fetchData();
    } catch (err) {
      alert("Gagal mengupdate user. Pastikan email belum digunakan.");
    }
  };

  // --- Handlers Kategori ---
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/categories", { name: categoryName });
      setCategoryName("");
      fetchData();
    } catch (err) {
      alert("Gagal menambah kategori.");
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!confirm("Hapus kategori? Ini mungkin gagal jika kategori sedang digunakan produk.")) return;
    try {
      await axios.delete(`/api/categories/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus kategori.");
    }
  };

  // --- Handlers Produk ---
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/products", { 
        name: productName, 
        category_id: productCategoryId, 
        base_unit: productBaseUnit,
        selling_price: productSellingPrice ? parseFloat(productSellingPrice) : 0 
      });
      setProductName(""); setProductCategoryId(""); setProductBaseUnit(""); setProductSellingPrice("");
      fetchData();
    } catch (err) {
      alert("Gagal menambah produk.");
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Hapus produk?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus produk.");
    }
  };

  const handleEditProductClick = (p: any) => {
    setEditingProductId(p.id);
    setEditProductName(p.name);
    setEditProductCategoryId(p.category_id);
    setEditProductBaseUnit(p.base_unit);
    setEditProductSellingPrice(p.selling_price || "");
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
  };

  const handleSaveEditProduct = async (id: number) => {
    try {
      await axios.put(`/api/products/${id}`, {
        name: editProductName,
        category_id: editProductCategoryId,
        base_unit: editProductBaseUnit,
        selling_price: editProductSellingPrice ? parseFloat(editProductSellingPrice) : 0
      });
      setEditingProductId(null);
      fetchData();
    } catch (err) {
      alert("Gagal mengupdate produk.");
    }
  };

  // --- Handlers Konversi ---
  const handleAddConversion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("/api/unit-conversions", {
        product_id: productId,
        from_unit: fromUnit,
        to_unit: toUnit,
        conversion_rate: parseFloat(multiplier)
      });
      setProductId(""); setFromUnit(""); setToUnit(""); setMultiplier("");
      fetchData();
    } catch (err) {
      alert("Gagal menambah konversi.");
    }
  };

  const handleDeleteConversion = async (id: number) => {
    if (!confirm("Hapus konversi?")) return;
    try {
      await axios.delete(`/api/unit-conversions/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus konversi.");
    }
  };

  const handleEditConversionClick = (c: any) => {
    setEditingConversionId(c.id);
    setEditConversionProductId(c.product_id);
    setEditConversionFromUnit(c.from_unit);
    setEditConversionToUnit(c.to_unit);
    setEditConversionMultiplier(c.conversion_rate);
  };

  const handleCancelEditConversion = () => {
    setEditingConversionId(null);
  };

  const handleSaveEditConversion = async (id: number) => {
    try {
      await axios.put(`/api/unit-conversions/${id}`, {
        product_id: editConversionProductId,
        from_unit: editConversionFromUnit,
        to_unit: editConversionToUnit,
        conversion_rate: parseFloat(editConversionMultiplier)
      });
      setEditingConversionId(null);
      fetchData();
    } catch (err) {
      alert("Gagal mengupdate konversi.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Master Satuan */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border-l-4 border-indigo-500">
        <h2 className="text-xl font-bold mb-4">Master Satuan</h2>
        <form onSubmit={handleAddUnit} className="flex gap-4 mb-6">
          <input type="text" placeholder="Nama Satuan (ex: kg, pcs, box)" value={unitName} onChange={(e) => setUnitName(e.target.value)} required className="border rounded-lg p-2 flex-1" />
          <button type="submit" className="bg-indigo-600 text-white rounded-lg px-4 font-medium hover:bg-indigo-700">Tambah Satuan</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {units.map((u: any) => (
            <div key={u.id} className="bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full flex items-center gap-2 text-sm">
              <span className="font-medium text-indigo-700">{u.name}</span>
              <button onClick={() => handleDeleteUnit(u.id)} className="text-red-500 font-bold hover:text-red-700">&times;</button>
            </div>
          ))}
          {units.length === 0 && <p className="text-sm text-gray-500">Belum ada satuan.</p>}
        </div>
      </div>

      {/* Kategori Management */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Master Kategori</h2>
        <form onSubmit={handleAddCategory} className="flex gap-4 mb-6">
          <input type="text" placeholder="Nama Kategori (ex: Bahan Baku)" value={categoryName} onChange={(e) => setCategoryName(e.target.value)} required className="border rounded-lg p-2 flex-1" />
          <button type="submit" className="bg-orange-600 text-white rounded-lg px-4 font-medium hover:bg-orange-700">Tambah Kategori</button>
        </form>
        <div className="flex flex-wrap gap-2">
          {categories.map((c: any) => (
            <div key={c.id} className="bg-gray-100 border px-3 py-1 rounded-full flex items-center gap-2 text-sm">
              <span className="font-medium text-gray-700">{c.name}</span>
              <button onClick={() => handleDeleteCategory(c.id)} className="text-red-500 font-bold hover:text-red-700">&times;</button>
            </div>
          ))}
          {categories.length === 0 && <p className="text-sm text-gray-500">Belum ada kategori.</p>}
        </div>
      </div>

      {/* Product Management */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Master Produk & Bahan Baku</h2>
        <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-start">
          <input type="text" placeholder="Nama Produk / Bahan" value={productName} onChange={(e) => setProductName(e.target.value)} required className="border rounded-lg p-2" />
          <select value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)} required className="border rounded-lg p-2 bg-white">
            <option value="">Pilih Kategori</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={productBaseUnit} onChange={(e) => setProductBaseUnit(e.target.value)} required className="border rounded-lg p-2 bg-white">
            <option value="">Pilih Satuan Dasar</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
          {categories.find((c: any) => c.id == productCategoryId)?.name?.toLowerCase().includes("produk jadi") && (
            <input type="number" placeholder="Harga Jual (Rp)" value={productSellingPrice} onChange={(e) => setProductSellingPrice(e.target.value)} required className="border rounded-lg p-2" />
          )}
          <button type="submit" className="bg-orange-600 text-white rounded-lg p-2 font-medium hover:bg-orange-700 h-[42px] self-start md:col-start-5">Tambah Produk</button>
        </form>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Satuan Dasar (Stok)</th>
                <th className="px-4 py-3">Harga Jual</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: any) => {
                const isEditing = editingProductId === p.id;
                const isProdukJadi = p.category?.name?.toLowerCase().includes("produk jadi") || categories.find((c: any) => c.id == editProductCategoryId)?.name?.toLowerCase().includes("produk jadi");
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="text" value={editProductName} onChange={e => setEditProductName(e.target.value)} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        p.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editProductCategoryId} onChange={e => setEditProductCategoryId(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                          <option value="">Pilih Kategori</option>
                          {categories.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      ) : (
                        p.category?.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editProductBaseUnit} onChange={e => setEditProductBaseUnit(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                          <option value="">Pilih Satuan Dasar</option>
                          {units.map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      ) : (
                        p.base_unit
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        isProdukJadi ? (
                          <input type="number" value={editProductSellingPrice} onChange={e => setEditProductSellingPrice(e.target.value)} className="border rounded px-2 py-1 w-24" placeholder="Harga Jual" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )
                      ) : (
                        p.category?.name?.toLowerCase().includes("produk jadi") && p.selling_price 
                          ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.selling_price) 
                          : "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEditProduct(p.id)} className="text-green-600 hover:underline font-medium">Simpan</button>
                          <button onClick={handleCancelEditProduct} className="text-gray-500 hover:underline">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditProductClick(p)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-600 hover:underline">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit Conversions */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Pengaturan Konversi Satuan</h2>
        <form onSubmit={handleAddConversion} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <select value={productId} onChange={(e) => setProductId(e.target.value)} required className="border rounded-lg p-2 bg-white">
            <option value="">Pilih Produk / Bahan</option>
            {products.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name} ({p.base_unit})</option>
            ))}
          </select>
          <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)} required className="border rounded-lg p-2 bg-white">
            <option value="">Satuan Beli</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
          <select value={toUnit} onChange={(e) => setToUnit(e.target.value)} required className="border rounded-lg p-2 bg-white">
            <option value="">Satuan Metrix (Stok)</option>
            {units.map((u: any) => (
              <option key={u.id} value={u.name}>{u.name}</option>
            ))}
          </select>
          <input type="number" step="0.01" placeholder="Pengali" value={multiplier} onChange={(e) => setMultiplier(e.target.value)} required className="border rounded-lg p-2" />
          <button type="submit" className="bg-blue-600 text-white rounded-lg p-2 font-medium hover:bg-blue-700">Tambah Konversi</button>
        </form>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Produk / Bahan Baku</th>
                <th className="px-4 py-3">Satuan Beli</th>
                <th className="px-4 py-3">Satuan Metrix (Stok)</th>
                <th className="px-4 py-3">Pengali</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {conversions.map((c: any) => {
                const isEditing = editingConversionId === c.id;
                return (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editConversionProductId} onChange={e => setEditConversionProductId(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                          <option value="">Pilih Produk / Bahan</option>
                          {products.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.base_unit})</option>
                          ))}
                        </select>
                      ) : (
                        c.product?.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editConversionFromUnit} onChange={e => setEditConversionFromUnit(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                          <option value="">Satuan Beli</option>
                          {units.map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      ) : (
                        c.from_unit
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <select value={editConversionToUnit} onChange={e => setEditConversionToUnit(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                          <option value="">Satuan Metrix (Stok)</option>
                          {units.map((u: any) => (
                            <option key={u.id} value={u.name}>{u.name}</option>
                          ))}
                        </select>
                      ) : (
                        c.to_unit
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="number" step="0.01" value={editConversionMultiplier} onChange={e => setEditConversionMultiplier(e.target.value)} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        `x ${Number(c.conversion_rate)}`
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEditConversion(c.id)} className="text-green-600 hover:underline font-medium">Simpan</button>
                          <button onClick={handleCancelEditConversion} className="text-gray-500 hover:underline">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditConversionClick(c)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteConversion(c.id)} className="text-red-600 hover:underline">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
              {conversions.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-gray-500">Belum ada pengaturan konversi</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Management */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold mb-4">Pengaturan User</h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <input type="text" placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} required className="border rounded-lg p-2" />
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="border rounded-lg p-2" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required className="border rounded-lg p-2" />
          <select value={role} onChange={(e) => setRole(e.target.value)} className="border rounded-lg p-2 bg-white">
            <option value="admin">Admin</option>
            <option value="user_sales">Sales</option>
            <option value="user_produksi">Produksi</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white rounded-lg p-2 font-medium hover:bg-blue-700">Tambah User</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase">
              <tr>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u: any) => {
                const isEditing = editingUserId === u.id;
                return (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="text" value={editUserName} onChange={e => setEditUserName(e.target.value)} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        u.name
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <input type="email" value={editUserEmail} onChange={e => setEditUserEmail(e.target.value)} className="border rounded px-2 py-1 w-full" />
                      ) : (
                        u.email
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isEditing ? (
                        <div className="flex flex-col space-y-2">
                          <select value={editUserRole} onChange={e => setEditUserRole(e.target.value)} className="border rounded px-2 py-1 w-full bg-white">
                            <option value="admin">Admin</option>
                            <option value="user_sales">Sales</option>
                            <option value="user_produksi">Produksi</option>
                          </select>
                          <input type="password" placeholder="Kosongkan jika tak diubah" value={editUserPassword} onChange={e => setEditUserPassword(e.target.value)} className="border rounded px-2 py-1 w-full text-xs" />
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-gray-200 rounded-full text-xs font-semibold">{u.role}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEditUser(u.id)} className="text-green-600 hover:underline font-medium">Simpan</button>
                          <button onClick={handleCancelEditUser} className="text-gray-500 hover:underline">Batal</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditUserClick(u)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => handleDeleteUser(u.id)} className="text-red-600 hover:underline">Hapus</button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
