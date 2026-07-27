import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const members = await prisma.member.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, phone, email, level } = body;

    if (!name || !phone) {
      return NextResponse.json(
        { error: "Name and phone are required" },
        { status: 400 }
      );
    }

    const member = await prisma.member.create({
      data: {
        name,
        phone,
        email,
        level,
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create member" },
      { status: 500 }
    );
  }
}
