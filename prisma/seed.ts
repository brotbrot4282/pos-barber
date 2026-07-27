import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Found" : "NOT FOUND");

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const cashierPassword = await bcrypt.hash("kasir123", 10);

  await prisma.user.upsert({
    where: { email: "admin@barber.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@barber.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "kasir@barber.com" },
    update: {},
    create: {
      name: "Kasir Satu",
      email: "kasir@barber.com",
      password: cashierPassword,
      role: "CASHIER",
    },
  });

  const catLayanan = await prisma.category.upsert({
    where: { name: "Layanan" },
    update: {},
    create: { name: "Layanan" },
  });

  const catProduk = await prisma.category.upsert({
    where: { name: "Produk" },
    update: {},
    create: { name: "Produk" },
  });

  const services = [
    { name: "Potong Rambut Dewasa", price: 35000, duration: 30, categoryId: catLayanan.id },
    { name: "Potong Rambut Anak", price: 25000, duration: 20, categoryId: catLayanan.id },
    { name: "Styling / Blow", price: 50000, duration: 30, categoryId: catLayanan.id },
    { name: "Creambath", price: 80000, duration: 45, categoryId: catLayanan.id },
    { name: "Hair Mask", price: 60000, duration: 40, categoryId: catLayanan.id },
    { name: "Hair Coloring", price: 150000, duration: 60, categoryId: catLayanan.id },
    { name: "Shaving / Cukur Jenggot", price: 20000, duration: 15, categoryId: catLayanan.id },
    { name: "Pijat Kepala", price: 30000, duration: 20, categoryId: catLayanan.id },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    if (!existing) {
      await prisma.service.create({ data: s });
    }
  }

  const products = [
    { name: "Pomade", price: 45000, stock: 50, categoryId: catProduk.id },
    { name: "Shampoo", price: 35000, stock: 30, categoryId: catProduk.id },
    { name: "Hair Tonic", price: 55000, stock: 25, categoryId: catProduk.id },
    { name: "Hair Dryer Spray", price: 30000, stock: 40, categoryId: catProduk.id },
    { name: "Minyak Rambut", price: 25000, stock: 60, categoryId: catProduk.id },
  ];

  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  const settings = [
    { key: "store_name", value: "BARBERSHOP PRO" },
    { key: "store_address", value: "Jl. Contoh No. 123, Kota" },
    { key: "store_phone", value: "081234567890" },
  ];

  for (const s of settings) {
    await prisma.storeSetting.upsert({
      where: { key: s.key },
      update: { value: s.value },
      create: s,
    });
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
