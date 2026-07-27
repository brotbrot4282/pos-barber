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
type Service = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration: number;
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
  duration: 30,
  categoryId: "",
  description: "",
};

export default function LayananPage() {
  const [services, setServices] = useState<Service[]>([]);
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
      const [svcRes, catRes] = await Promise.all([
        fetch("/api/services"),
        fetch("/api/categories"),
      ]);
      const svcData = await svcRes.json();
      const catData = await catRes.json();
      setServices(Array.isArray(svcData) ? svcData : []);
      setCategories(Array.isArray(catData) ? catData : []);
    } catch {
      setServices([]);
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

  const openEdit = (svc: Service) => {
    setEditingId(svc.id);
    setForm({
      name: svc.name,
      price: svc.price,
      duration: svc.duration,
      categoryId: svc.categoryId,
      description: svc.description ?? "",
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
      const url = editingId ? `/api/services/${editingId}` : "/api/services";
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
          ? "Layanan berhasil diperbarui"
          : "Layanan berhasil ditambahkan",
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
      const res = await fetch(`/api/services/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus");
      }

      toast.add({
        title: "Berhasil",
        description: "Layanan berhasil dihapus",
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
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Layanan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar layanan barbershop
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah Layanan
        </Button>
      </div>

      <Separator />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      ) : services.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada data layanan.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead className="text-right">Harga</TableHead>
                <TableHead className="text-center">Durasi</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((svc, i) => (
                <TableRow key={svc.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{svc.name}</TableCell>
                  <TableCell className="text-right">{fmt.format(svc.price)}</TableCell>
                  <TableCell className="text-center">{svc.duration} menit</TableCell>
                  <TableCell>{svc.category?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant={svc.isActive ? "default" : "destructive"}>
                      {svc.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(svc)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(svc.id)}
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
              {editingId ? "Edit Layanan" : "Tambah Layanan"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui informasi layanan"
                : "Isi formulir untuk menambahkan layanan baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Layanan</Label>
              <Input
                placeholder="Contoh: Potong Rambut"
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
                <Label>Durasi (menit)</Label>
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: Number(e.target.value) })
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
                placeholder="Deskripsi layanan (opsional)"
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
            <DialogTitle>Hapus Layanan</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus layanan ini? Tindakan ini tidak
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
