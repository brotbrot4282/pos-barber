import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const service = await prisma.service.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch service" },
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

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: body,
      include: { category: true },
    });

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update service" },
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

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(service);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
