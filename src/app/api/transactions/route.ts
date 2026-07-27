import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const search = searchParams.get("search");

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

    if (search) {
      where.invoiceNumber = { contains: search, mode: "insensitive" };
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        user: { select: { id: true, name: true } },
        member: true,
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const {
      subtotal,
      discount,
      total,
      paymentMethod,
      amountPaid,
      change,
      notes,
      memberId,
      userId,
      items,
    } = body;

    if (
      subtotal === undefined ||
      total === undefined ||
      !paymentMethod ||
      amountPaid === undefined ||
      !userId ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const invoiceNumber = `INV-${Date.now()}`;

    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          invoiceNumber,
          subtotal,
          discount: discount ?? 0,
          total,
          paymentMethod,
          amountPaid,
          change: change ?? 0,
          notes,
          memberId,
          userId,
          items: {
            create: items.map(
              (item: {
                name: string;
                price: number;
                quantity: number;
                subtotal: number;
                itemType?: string;
                serviceId?: string;
                productId?: string;
              }) => ({
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                subtotal: item.subtotal,
                itemType: item.itemType ?? "service",
                serviceId: item.serviceId,
                productId: item.productId,
              })
            ),
          },
        },
        include: {
          user: { select: { id: true, name: true } },
          member: true,
          items: true,
        },
      });

      for (const item of items) {
        if (item.productId && item.itemType === "product") {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      return created;
    });

    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    );
  }
}
