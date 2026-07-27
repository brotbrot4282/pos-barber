"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  isActive: boolean;
  categoryId: string;
  category: { id: string; name: string };
};

type Category = {
  id: string;
  name: string;
};

const emptyForm = {
  name: "",
  price: 0,
  stock: 0,
  categoryId: "",
  description: "",
};

export default function ProdukPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(Array.isArray(prodData) ? prodData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch {
      setProducts([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (prod: Product) => {
    setEditingId(prod.id);
    setForm({
      name: prod.name,
      price: prod.price,
      stock: prod.stock,
      categoryId: prod.categoryId,
      description: prod.description ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId) {
      toast.add({
        title: "Error",
        description: "Nama dan kategori wajib diisi",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/products/${editingId}` : "/api/products";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }

      toast.add({
        title: "Berhasil",
        description: editingId
          ? "Produk berhasil diperbarui"
          : "Produk berhasil ditambahkan",
        type: "success",
      });

      setDialogOpen(false);
      fetchData();
    } catch (e: any) {
      toast.add({
        title: "Error",
        description: e.message || "Terjadi kesalahan",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const res = await fetch(`/api/products/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus");
      }

      toast.add({
        title: "Berhasil",
        description: "Produk berhasil dihapus",
        type: "success",
      });

      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchData();
    } catch (e: any) {
      toast.add({
        title: "Error",
        description: e.message || "Terjadi kesalahan",
        type: "error",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar produk barbershop
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah Produk
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      ) : products.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada data produk.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Stok</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((prod, i) => (
                <TableRow key={prod.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{prod.name}</TableCell>
                  <TableCell className="text-right">{fmt.format(prod.price)}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={prod.stock > 0 ? "default" : "destructive"}>
                      {prod.stock}
                    </Badge>
                  </TableCell>
                  <TableCell>{prod.category?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={prod.isActive ? "default" : "destructive"}>
                      {prod.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(prod)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(prod.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Produk" : "Tambah Produk"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui informasi produk"
                : "Isi formulir untuk menambahkan produk baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Produk</Label>
              <Input
                placeholder="Contoh: Pomade"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Harga (IDR)</Label>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) =>
                    setForm({ ...form, price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Stok</Label>
                <Input
                  type="number"
                  value={form.stock}
                  onChange={(e) =>
                    setForm({ ...form, stock: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Select
                value={form.categoryId}
                onValueChange={(val) => { if (val) setForm({ ...form, categoryId: val }) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Deskripsi</Label>
              <Textarea
                placeholder="Deskripsi produk (opsional)"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : null}
              {editingId ? "Simpan Perubahan" : "Tambahkan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Produk</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak
              dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
