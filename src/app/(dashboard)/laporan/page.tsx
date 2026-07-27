"use client"

import { useEffect, useState, useCallback } from "react"
import { format } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"

interface TopService {
  name: string
  quantitySold: number
  totalRevenue: number
}

interface DailyRevenue {
  date: string
  revenue: number
}

interface ReportData {
  totalRevenue: number
  totalTransactions: number
  totalItemsSold: number
  topServices: TopService[]
  dailyRevenue: DailyRevenue[]
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount)

type DatePreset = "today" | "week" | "month" | "custom"

export default function LaporanPage() {
  const [datePreset, setDatePreset] = useState<DatePreset>("today")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  const getDateRange = useCallback(() => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (datePreset) {
      case "today":
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString(),
        }
      case "week": {
        const dayOfWeek = today.getDay()
        const monday = new Date(
          today.getTime() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) * 86400000
        )
        return {
          startDate: monday.toISOString(),
          endDate: new Date(monday.getTime() + 7 * 86400000).toISOString(),
        }
      }
      case "month": {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
        const nextFirstDay = new Date(now.getFullYear(), now.getMonth() + 1, 1)
        return {
          startDate: firstDay.toISOString(),
          endDate: nextFirstDay.toISOString(),
        }
      }
      case "custom": {
        if (!customStart || !customEnd) return null
        return {
          startDate: new Date(customStart).toISOString(),
          endDate: new Date(
            new Date(customEnd).getTime() + 86400000
          ).toISOString(),
        }
      }
      default:
        return {
          startDate: today.toISOString(),
          endDate: new Date(today.getTime() + 86400000).toISOString(),
        }
    }
  }, [datePreset, customStart, customEnd])

  const fetchReport = useCallback(async () => {
    const range = getDateRange()
    if (!range) {
      setReportData(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({
        startDate: range.startDate,
        endDate: range.endDate,
      })
      const res = await fetch(`/api/reports?${params}`)
      if (!res.ok) throw new Error("Failed to fetch report")
      const data = await res.json()
      setReportData(data)
    } catch {
      toast.add({
        title: "Gagal",
        description: "Gagal memuat laporan",
        type: "error",
      })
    } finally {
      setLoading(false)
    }
  }, [getDateRange])

  useEffect(() => {
    fetchReport()
  }, [fetchReport])

  const maxRevenue = reportData?.dailyRevenue?.length
    ? Math.max(...reportData.dailyRevenue.map((d) => d.revenue), 1)
    : 1

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Laporan Penjualan</h1>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["today", "Hari Ini"],
              ["week", "Minggu Ini"],
              ["month", "Bulan Ini"],
              ["custom", "Kustom"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              variant={datePreset === key ? "default" : "outline"}
              onClick={() => setDatePreset(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        {datePreset === "custom" && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Dari</Label>
              <Input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="whitespace-nowrap">Sampai</Label>
              <Input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-40"
              />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Memuat data...</div>
        </div>
      ) : !reportData ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">
            Pilih rentang tanggal untuk melihat laporan
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Pendapatan</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">
                  {formatCurrency(reportData.totalRevenue)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Transaksi</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">
                  {reportData.totalTransactions}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Item Terjual</CardDescription>
                <CardTitle className="text-xl sm:text-2xl">
                  {reportData.totalItemsSold}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top 5 Layanan Terlaris</CardTitle>
            </CardHeader>
            <CardContent>
              {!reportData.topServices?.length ? (
                <div className="py-6 text-center text-muted-foreground">
                  Tidak ada data layanan
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table className="min-w-[480px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">Rank</TableHead>
                        <TableHead>Nama Layanan</TableHead>
                        <TableHead className="text-right">
                          Jumlah Terjual
                        </TableHead>
                        <TableHead className="text-right">
                          Total Pendapatan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topServices.map((service, i) => (
                        <TableRow key={service.name}>
                          <TableCell className="font-medium">
                            {i + 1}
                          </TableCell>
                          <TableCell>{service.name}</TableCell>
                          <TableCell className="text-right">
                            {service.quantitySold}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(service.totalRevenue)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pendapatan Harian</CardTitle>
            </CardHeader>
            <CardContent>
              {!reportData.dailyRevenue?.length ? (
                <div className="py-6 text-center text-muted-foreground">
                  Tidak ada data pendapatan harian
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-end gap-1.5 h-52" style={{ minWidth: `${reportData.dailyRevenue.length * 48}px` }}>
                  {reportData.dailyRevenue.map((item) => {
                    const height =
                      maxRevenue > 0
                        ? (item.revenue / maxRevenue) * 100
                        : 0
                    return (
                      <div
                        key={item.date}
                        className="flex flex-1 flex-col items-center gap-1"
                      >
                        <span className="text-[10px] text-muted-foreground leading-none">
                          {formatCurrency(item.revenue)}
                        </span>
                        <div
                          className="w-full rounded-t bg-primary transition-all"
                          style={{ height: `${Math.max(height, 2)}%` }}
                        />
                        <span className="text-[10px] text-muted-foreground leading-none">
                          {format(new Date(item.date), "dd/MM")}
                        </span>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
