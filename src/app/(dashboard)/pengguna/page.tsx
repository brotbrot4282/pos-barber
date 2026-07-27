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

/* eslint-disable @typescript-eslint/no-explicit-any */
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

const emptyForm = {
  name: "",
  email: "",
  password: "",
  role: "CASHIER",
};

function roleBadge(role: string) {
  const map: Record<string, "default" | "secondary"> = {
    ADMIN: "default",
    CASHIER: "secondary",
  };
  const label: Record<string, string> = {
    ADMIN: "Admin",
    CASHIER: "Kasir",
  };
  return (
    <Badge variant={map[role] ?? "outline"}>{label[role] ?? role}</Badge>
  );
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
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
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
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

  const openEdit = (user: User) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.email) {
      toast.add({
        title: "Error",
        description: "Nama dan email wajib diisi",
        type: "error",
      });
      return;
    }

    if (!editingId && !form.password) {
      toast.add({
        title: "Error",
        description: "Password wajib diisi untuk pengguna baru",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/users/${editingId}` : "/api/users";
      const method = editingId ? "PUT" : "POST";

      const body: Record<string, string> = {
        name: form.name,
        email: form.email,
        role: form.role,
      };
      if (form.password) {
        body.password = form.password;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }

      toast.add({
        title: "Berhasil",
        description: editingId
          ? "Pengguna berhasil diperbarui"
          : "Pengguna berhasil ditambahkan",
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
      const res = await fetch(`/api/users/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus");
      }

      toast.add({
        title: "Berhasil",
        description: "Pengguna berhasil dihapus",
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
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Pengguna</h1>
          <p className="text-sm text-muted-foreground">
            Kelola akun pengguna sistem
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah Pengguna
        </Button>
      </div>

      <Separator />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada data pengguna.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user, i) => (
                <TableRow key={user.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roleBadge(user.role)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(user.id)}
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
              {editingId ? "Edit Pengguna" : "Tambah Pengguna"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui informasi pengguna"
                : "Isi formulir untuk menambahkan pengguna baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Contoh: Andi Kurniawan"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Contoh: andi@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>
                Password
                {editingId && (
                  <span className="text-xs text-muted-foreground">
                    {" "}
                    (Kosongkan jika tidak ingin mengubah)
                  </span>
                )}
              </Label>
              <Input
                type="password"
                placeholder={editingId ? "••••••" : "Masukkan password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={form.role}
                onValueChange={(val) => { if (val) setForm({ ...form, role: val }) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="CASHIER">Kasir</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogTitle>Hapus Pengguna</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak
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
