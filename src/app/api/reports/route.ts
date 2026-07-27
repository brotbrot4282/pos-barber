import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: Record<string, unknown> = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        (where.createdAt as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.createdAt as Record<string, unknown>).lte = new Date(
          endDate + "T23:59:59.999Z"
        );
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "asc" },
    });

    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = transactions.length;
    const totalItems = transactions.reduce(
      (sum, t) => sum + t.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    const serviceMap = new Map<
      string,
      { name: string; count: number; revenue: number }
    >();
    for (const transaction of transactions) {
      for (const item of transaction.items) {
        const key = item.serviceId ?? item.productId ?? item.name;
        const existing = serviceMap.get(key) ?? {
          name: item.name,
          count: 0,
          revenue: 0,
        };
        existing.count += item.quantity;
        existing.revenue += item.subtotal;
        serviceMap.set(key, existing);
      }
    }
    const topServices = Array.from(serviceMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const dailyMap = new Map<
      string,
      { date: string; revenue: number; count: number }
    >();
    for (const transaction of transactions) {
      const dateKey = transaction.createdAt.toISOString().split("T")[0];
      const existing = dailyMap.get(dateKey) ?? {
        date: dateKey,
        revenue: 0,
        count: 0,
      };
      existing.revenue += transaction.total;
      existing.count += 1;
      dailyMap.set(dateKey, existing);
    }
    const dailyRevenue = Array.from(dailyMap.values());

    return NextResponse.json({
      totalRevenue,
      totalTransactions,
      totalItemsSold: totalItems,
      topServices,
      dailyRevenue,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
