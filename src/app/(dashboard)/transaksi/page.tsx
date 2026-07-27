"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Search, Loader2 } from "lucide-react";

const fmt = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
type Transaction = {
  id: string;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  createdAt: string;
  user: { id: string; name: string };
  member: { id: string; name: string } | null;
  items: any[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toInputDate(d: string) {
  return d ? new Date(d).toISOString().split("T")[0] : "";
}

export default function TransaksiPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      if (search) params.set("search", search);

      const res = await fetch(`/api/transactions?${params.toString()}`);
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilter = () => {
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Riwayat Transaksi</h1>
        <p className="text-sm text-muted-foreground">
          Lihat semua riwayat transaksi toko
        </p>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Tanggal Mulai</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Tanggal Akhir</label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">No. Invoice</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Cari invoice..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleFilter()}
              className="pl-8"
            />
          </div>
        </div>
        <Button onClick={handleFilter}>Terapkan Filter</Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Memuat data...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          Tidak ada data transaksi ditemukan.
        </div>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Invoice</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Bayar</TableHead>
                <TableHead className="text-right">Kembali</TableHead>
                <TableHead>Metode</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx, i) => (
                <TableRow key={tx.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{tx.invoiceNumber}</TableCell>
                  <TableCell>{formatDate(tx.createdAt)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {fmt.format(tx.total)}
                  </TableCell>
                  <TableCell className="text-right">{fmt.format(tx.amountPaid)}</TableCell>
                  <TableCell className="text-right">{fmt.format(tx.change)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{tx.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" render={<Link href={`/transaksi/${tx.id}`} />}>
                        <Eye className="mr-1 h-4 w-4" />
                        Lihat
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
