"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signToken, verifyToken, comparePassword } from "@/lib/auth";

const COOKIE_NAME = "token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function loginAction(
  formData: FormData
): Promise<{ success: boolean; error?: string; role?: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email dan password harus diisi" };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return { success: false, error: "Email atau password salah" };
  }

  if (!user.isActive) {
    return { success: false, error: "Akun tidak aktif" };
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return { success: false, error: "Email atau password salah" };
  }

  const token = await signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    maxAge: COOKIE_MAX_AGE,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return { success: true, role: user.role };
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  redirect("/login");
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  return user;
}
