"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { Plus, Pencil, Trash2, Calendar, Clock, User, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

interface Reservation {
  id: string
  customerName: string
  phone: string
  date: string
  time: string
  barberName: string
  notes: string
  status: "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED"
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Menunggu",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  CONFIRMED: {
    label: "Dikonfirmasi",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  COMPLETED: {
    label: "Selesai",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  CANCELLED: {
    label: "Dibatalkan",
    className: "bg-red-100 text-red-800 border-red-300",
  },
}

const emptyForm = {
  customerName: "",
  phone: "",
  date: "",
  time: "",
  barberName: "",
  notes: "",
}

export default function ReservasiPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [selected, setSelected] = useState<Reservation | null>(null)

  const [formData, setFormData] = useState(emptyForm)

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFilter) params.set("date", dateFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/reservations?${params}`)
      const data = await res.json()
      setReservations(data)
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal memuat data reservasi",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [dateFilter, statusFilter])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  const resetForm = () => setFormData(emptyForm)

  const openEditDialog = (r: Reservation) => {
    setSelected(r)
    setFormData({
      customerName: r.customerName,
      phone: r.phone,
      date: r.date,
      time: r.time,
      barberName: r.barberName,
      notes: r.notes,
    })
    setEditOpen(true)
  }

  const openDeleteDialog = (r: Reservation) => {
    setSelected(r)
    setDeleteOpen(true)
  }

  const handleAdd = async () => {
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "PENDING" }),
      })
      if (res.ok) {
        toast.add({
          title: "Berhasil",
          description: "Reservasi berhasil ditambahkan",
          type: "success",
        })
        setAddOpen(false)
        resetForm()
        fetchReservations()
      }
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal menambahkan reservasi",
        type: "error",
      })
    }
  }

  const handleEdit = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/reservations/${selected.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        toast.add({
          title: "Berhasil",
          description: "Reservasi berhasil diperbarui",
          type: "success",
        })
        setEditOpen(false)
        resetForm()
        fetchReservations()
      }
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal memperbarui reservasi",
        type: "error",
      })
    }
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        toast.add({
          title: "Berhasil",
          description: "Status berhasil diperbarui",
          type: "success",
        })
        fetchReservations()
      }
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal memperbarui status",
        type: "error",
      })
    }
  }

  const handleDelete = async () => {
    if (!selected) return
    try {
      const res = await fetch(`/api/reservations/${selected.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.add({
          title: "Berhasil",
          description: "Reservasi berhasil dihapus",
          type: "success",
        })
        setDeleteOpen(false)
        fetchReservations()
      }
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal menghapus reservasi",
        type: "error",
      })
    }
  }

  const getNextStatus = (current: string): string | null => {
    switch (current) {
      case "PENDING":
        return "CONFIRMED"
      case "CONFIRMED":
        return "COMPLETED"
      default:
        return null
    }
  }

  const nextStatusLabel: Record<string, string> = {
    CONFIRMED: "Konfirmasi",
    COMPLETED: "Selesai",
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Reservasi</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-40"
          />
          <Select value={statusFilter} onValueChange={(val) => { if (val) setStatusFilter(val) }}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="PENDING">Menunggu</SelectItem>
              <SelectItem value="CONFIRMED">Dikonfirmasi</SelectItem>
              <SelectItem value="COMPLETED">Selesai</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open)
              if (!open) resetForm()
            }}
          >
            <DialogTrigger render={<Button />}>
              <Plus className="size-4" />
              Tambah Reservasi
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Tambah Reservasi</DialogTitle>
                <DialogDescription>Isi data reservasi baru</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="grid gap-2">
                  <Label htmlFor="add-customerName">Nama Pelanggan</Label>
                  <Input
                    id="add-customerName"
                    value={formData.customerName}
                    onChange={(e) =>
                      setFormData({ ...formData, customerName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-phone">No. HP</Label>
                  <Input
                    id="add-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="add-date">Tanggal</Label>
                    <Input
                      id="add-date"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="add-time">Jam</Label>
                    <Input
                      id="add-time"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        setFormData({ ...formData, time: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-barberName">Nama Barber</Label>
                  <Input
                    id="add-barberName"
                    value={formData.barberName}
                    onChange={(e) =>
                      setFormData({ ...formData, barberName: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="add-notes">Catatan</Label>
                  <Textarea
                    id="add-notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOpen(false)}>
                  Batal
                </Button>
                <Button onClick={handleAdd}>Simpan</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Memuat data...</div>
        </div>
      ) : reservations.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            Tidak ada data reservasi
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reservations.map((reservation) => {
            const nextStatus = getNextStatus(reservation.status)
            const cfg = statusConfig[reservation.status]
            return (
              <Card key={reservation.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      {reservation.customerName}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cfg?.className}
                    >
                      {cfg?.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4" />
                      {reservation.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="size-4" />
                      {format(new Date(reservation.date), "dd MMMM yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="size-4" />
                      {reservation.time}
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="size-4" />
                      {reservation.barberName}
                    </div>
                  </div>
                  {reservation.notes && (
                    <p className="text-sm text-muted-foreground">
                      {reservation.notes}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-2">
                    {nextStatus && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleStatusUpdate(reservation.id, nextStatus)
                        }
                      >
                        {nextStatusLabel[nextStatus]}
                      </Button>
                    )}
                    {reservation.status !== "CANCELLED" &&
                      reservation.status !== "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleStatusUpdate(reservation.id, "CANCELLED")
                          }
                        >
                          Batalkan
                        </Button>
                      )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditDialog(reservation)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openDeleteDialog(reservation)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open)
          if (!open) resetForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reservasi</DialogTitle>
            <DialogDescription>Perbarui data reservasi</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-customerName">Nama Pelanggan</Label>
              <Input
                id="edit-customerName"
                value={formData.customerName}
                onChange={(e) =>
                  setFormData({ ...formData, customerName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">No. HP</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Tanggal</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-time">Jam</Label>
                <Input
                  id="edit-time"
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-barberName">Nama Barber</Label>
              <Input
                id="edit-barberName"
                value={formData.barberName}
                onChange={(e) =>
                  setFormData({ ...formData, barberName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-notes">Catatan</Label>
              <Textarea
                id="edit-notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleEdit}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus Reservasi</DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus reservasi{" "}
              <span className="font-medium text-foreground">
                {selected?.customerName}
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
