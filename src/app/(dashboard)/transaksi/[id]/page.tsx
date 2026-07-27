"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Printer, Loader2 } from "lucide-react";

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
  notes: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string };
  member: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    level: string;
  } | null;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    subtotal: number;
    itemType: string;
  }[];
};

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function methodBadge(method: string) {
  const map: Record<string, "default" | "secondary" | "outline"> = {
    CASH: "default",
    QRIS: "secondary",
  };
  const label: Record<string, string> = {
    CASH: "Tunai",
    QRIS: "QRIS",
  };
  return (
    <Badge variant={map[method] ?? "outline"}>{label[method] ?? method}</Badge>
  );
}

export default function TransaksiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = params.id as string;
    if (!id) return;

    fetch(`/api/transactions/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(setTx)
      .catch(() => setError("Transaksi tidak ditemukan"))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Memuat data...</span>
      </div>
    );
  }

  if (error || !tx) {
    return (
      <div className="space-y-4">
        <p className="text-destructive">{error || "Data tidak ditemukan"}</p>
        <Button variant="outline" render={<Link href="/transaksi" />}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Transaksi #{tx.invoiceNumber}
          </h1>
          <p className="text-sm text-muted-foreground">
            Detail transaksi
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => alert("Fitur cetak struk akan segera hadir")}
          >
            <Printer className="mr-1 h-4 w-4" />
            Cetak Struk
          </Button>
          <Button variant="outline" render={<Link href="/transaksi" />}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Kembali
          </Button>
        </div>
      </div>

      <Separator />

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informasi Transaksi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Invoice</span>
              <span className="font-medium">{tx.invoiceNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tanggal</span>
              <span>{formatDate(tx.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kasir</span>
              <span>{tx.user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member</span>
              <span>{tx.member ? tx.member.name : "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metode Bayar</span>
              {methodBadge(tx.paymentMethod)}
            </div>
            {tx.notes && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catatan</span>
                <span>{tx.notes}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ringkasan Pembayaran</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{fmt.format(tx.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Diskon</span>
              <span>- {fmt.format(tx.discount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{fmt.format(tx.total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dibayar</span>
              <span>{fmt.format(tx.amountPaid)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kembali</span>
              <span>{fmt.format(tx.change)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Item Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama Item</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Subtotal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tx.items.map((item, i) => (
                <TableRow key={item.id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{fmt.format(item.price)}</TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    {fmt.format(item.subtotal)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
