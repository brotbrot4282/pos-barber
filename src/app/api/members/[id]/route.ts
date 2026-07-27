import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    const member = await prisma.member.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.member.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    await prisma.member.delete({ where: { id } });

    return NextResponse.json({ message: "Member deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete member" },
      { status: 500 }
    );
  }
}
