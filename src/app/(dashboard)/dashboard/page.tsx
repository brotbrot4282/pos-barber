import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Receipt,
  Banknote,
  Users,
  CalendarClock,
} from "lucide-react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Tx = {
  id: string;
  invoiceNumber: string;
  total: number;
  paymentMethod: any;
  amountPaid: number;
  change: number;
  createdAt: Date | string;
};
type Res = {
  id: string;
  customerName: string;
  date: Date | string;
  time: string;
  barberName: string;
  status: string;
};

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

function statusBadge(status: string) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    PENDING: "outline",
    CONFIRMED: "default",
    COMPLETED: "secondary",
    CANCELLED: "destructive",
  };

  const labels: Record<string, string> = {
    PENDING: "Menunggu",
    CONFIRMED: "Dikonfirmasi",
    COMPLETED: "Selesai",
    CANCELLED: "Dibatalkan",
  };

  return (
    <Badge variant={variants[status] ?? "outline"}>
      {labels[status] ?? status}
    </Badge>
  );
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  const [
    todayTransactions,
    todayRevenue,
    totalMembers,
    todayReservations,
    recentTransactions,
    upcomingReservations,
  ] = await Promise.all([
    prisma.transaction.count({
      where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: { gte: todayStart, lt: tomorrowStart } },
      _sum: { total: true },
    }),
    prisma.member.count(),
    prisma.reservation.count({
      where: { date: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.reservation.findMany({
      where: {
        date: { gte: todayStart },
      },
      orderBy: { date: "asc" },
      take: 10,
    }),
  ]);

  const stats = [
    {
      title: "Transaksi Hari Ini",
      value: todayTransactions,
      icon: Receipt,
    },
    {
      title: "Pendapatan Hari Ini",
      value: currencyFormatter.format(todayRevenue._sum.total ?? 0),
      icon: Banknote,
    },
    {
      title: "Total Member",
      value: totalMembers,
      icon: Users,
    },
    {
      title: "Reservasi Hari Ini",
      value: todayReservations,
      icon: CalendarClock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {format(now, "EEEE, d MMMM yyyy", { locale: id })}
        </p>
      </div>

      <Separator />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator />

      {/* Recent Transactions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Transaksi Terbaru
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Metode Bayar</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Belum ada transaksi hari ini.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentTransactions.map((tx: Tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {tx.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(tx.createdAt), "dd MMM yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {currencyFormatter.format(tx.total)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.paymentMethod}</Badge>
                      </TableCell>
                      <TableCell>
                        {tx.change > 0 || tx.amountPaid >= tx.total ? (
                          <Badge variant="default">Lunas</Badge>
                        ) : (
                          <Badge variant="destructive">Belum Lunas</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Upcoming Reservations */}
      <div>
        <h2 className="mb-4 text-lg font-semibold tracking-tight">
          Reservasi Mendatang
        </h2>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam</TableHead>
                  <TableHead>Barber</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingReservations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      Tidak ada reservasi mendatang.
                    </TableCell>
                  </TableRow>
                ) : (
                  upcomingReservations.map((res: Res) => (
                    <TableRow key={res.id}>
                      <TableCell className="font-medium">
                        {res.customerName}
                      </TableCell>
                      <TableCell>
                        {format(new Date(res.date), "dd MMM yyyy")}
                      </TableCell>
                      <TableCell>{res.time}</TableCell>
                      <TableCell>{res.barberName}</TableCell>
                      <TableCell>{statusBadge(res.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
