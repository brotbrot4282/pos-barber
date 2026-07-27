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
import { Plus, Pencil, Trash2, Search, Loader2 } from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Member = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  level: string;
  points: number;
};

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  level: "SILVER",
};

function levelBadge(level: string) {
  const map: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    SILVER: "outline",
    GOLD: "secondary",
    PLATINUM: "default",
  };
  const colors: Record<string, string> = {
    SILVER: "border-gray-400 text-gray-600",
    GOLD: "border-yellow-500 text-yellow-600",
    PLATINUM: "border-purple-500 text-purple-600",
  };
  return (
    <Badge variant={map[level] ?? "outline"} className={colors[level] ?? ""}>
      {level}
    </Badge>
  );
}

export default function MemberPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async (q?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("search", q);
      const res = await fetch(`/api/members?${params.toString()}`);
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch {
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = () => {
    fetchData(search);
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (m: Member) => {
    setEditingId(m.id);
    setForm({
      name: m.name,
      phone: m.phone,
      email: m.email ?? "",
      level: m.level,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.phone) {
      toast.add({
        title: "Error",
        description: "Nama dan No. HP wajib diisi",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/members/${editingId}` : "/api/members";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }

      toast.add({
        title: "Berhasil",
        description: editingId
          ? "Member berhasil diperbarui"
          : "Member berhasil ditambahkan",
        type: "success",
      });

      setDialogOpen(false);
      fetchData(search);
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
      const res = await fetch(`/api/members/${deletingId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menghapus");
      }

      toast.add({
        title: "Berhasil",
        description: "Member berhasil dihapus",
        type: "success",
      });

      setDeleteDialogOpen(false);
      setDeletingId(null);
      fetchData(search);
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
          <h1 className="text-2xl font-bold tracking-tight">Manajemen Member</h1>
          <p className="text-sm text-muted-foreground">
            Kelola data member barbershop
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="mr-1 h-4 w-4" />
          Tambah Member
        </Button>
      </div>

      <Separator />

      {/* Search */}
      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Cari Member</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Nama atau No. HP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={handleSearch}>Cari</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      ) : members.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Belum ada data member.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>No. HP</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right">Poin</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((m, i) => (
                <TableRow key={m.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{m.name}</TableCell>
                  <TableCell>{m.phone}</TableCell>
                  <TableCell>{m.email ?? "-"}</TableCell>
                  <TableCell>{levelBadge(m.level)}</TableCell>
                  <TableCell className="text-right">{m.points}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="icon-sm"
                        onClick={() => confirmDelete(m.id)}
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
              {editingId ? "Edit Member" : "Tambah Member"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Perbarui informasi member"
                : "Isi formulir untuk menambahkan member baru"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Nama Lengkap</Label>
              <Input
                placeholder="Contoh: Budi Santoso"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>No. HP</Label>
              <Input
                placeholder="Contoh: 081234567890"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="Contoh: budi@email.com (opsional)"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Level</Label>
              <Select
                value={form.level}
                onValueChange={(val) => { if (val) setForm({ ...form, level: val }) }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SILVER">SILVER</SelectItem>
                  <SelectItem value="GOLD">GOLD</SelectItem>
                  <SelectItem value="PLATINUM">PLATINUM</SelectItem>
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
            <DialogTitle>Hapus Member</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus member ini? Tindakan ini tidak
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
