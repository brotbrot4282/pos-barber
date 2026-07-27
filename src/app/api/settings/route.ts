import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.storeSetting.findMany();

    const settingsMap: Record<string, string> = {};
    for (const setting of settings) {
      settingsMap[setting.key] = setting.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const upserts = Object.entries(body).map(([key, value]) =>
      prisma.storeSetting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      })
    );

    await Promise.all(upserts);

    return NextResponse.json({ message: "Settings updated" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
