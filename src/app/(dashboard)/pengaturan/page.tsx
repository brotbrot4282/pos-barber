"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"

interface Settings {
  store_name: string
  store_address: string
  store_phone: string
}

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Settings>({
    store_name: "",
    store_address: "",
    store_phone: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch(() =>
        toast.add({
          title: "Gagal",
          description: "Gagal memuat pengaturan",
          type: "error",
        })
      )
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.add({
          title: "Berhasil",
          description: "Pengaturan berhasil disimpan",
          type: "success",
        })
      }
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal menyimpan pengaturan",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Memuat data...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Pengaturan</h1>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Informasi Toko</CardTitle>
          <CardDescription>Atur informasi toko Anda</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="store_name">Nama Toko</Label>
            <Input
              id="store_name"
              value={settings.store_name}
              onChange={(e) =>
                setSettings({ ...settings, store_name: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="store_address">Alamat</Label>
            <Textarea
              id="store_address"
              value={settings.store_address}
              onChange={(e) =>
                setSettings({ ...settings, store_address: e.target.value })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="store_phone">No. HP / WhatsApp</Label>
            <Input
              id="store_phone"
              value={settings.store_phone}
              onChange={(e) =>
                setSettings({ ...settings, store_phone: e.target.value })
              }
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
