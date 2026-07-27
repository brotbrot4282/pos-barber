"use client";

import { useRef } from "react";

interface ReceiptItem {
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface ReceiptProps {
  invoiceNumber: string;
  date: string;
  cashierName: string;
  memberName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  amountPaid: number;
  change: number;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export function Receipt({
  invoiceNumber,
  date,
  cashierName,
  memberName,
  items,
  subtotal,
  discount,
  total,
  paymentMethod,
  amountPaid,
  change,
  storeName = "BARBERSHOP PRO",
  storeAddress = "Jl. Contoh No. 123, Kota",
  storePhone = "081234567890",
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const formatRupiah = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=400,height=600");
    if (!printWindow) return;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Struk ${invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            width: 280px;
            margin: 0 auto;
            padding: 10px;
            color: #000;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .border-top { border-top: 1px dashed #000; margin: 8px 0; }
          .border-bottom { border-bottom: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; }
          .item-row { margin: 4px 0; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 80px; text-align: right; }
          .summary-row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-row { font-weight: bold; font-size: 14px; margin: 5px 0; }
          @media print {
            body { width: 80mm; padding: 5mm; }
            @page { size: 80mm auto; margin: 0; }
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px;">${storeName}</div>
        <div class="center" style="font-size: 10px;">${storeAddress}</div>
        <div class="center" style="font-size: 10px;">Telp: ${storePhone}</div>
        <div class="border-top"></div>
        <div class="row">
          <span>Invoice</span>
          <span>${invoiceNumber}</span>
        </div>
        <div class="row">
          <span>Tanggal</span>
          <span>${date}</span>
        </div>
        <div class="row">
          <span>Kasir</span>
          <span>${cashierName}</span>
        </div>
        ${memberName ? `<div class="row"><span>Member</span><span>${memberName}</span></div>` : ""}
        <div class="border-top"></div>
        ${items
          .map(
            (item) => `
          <div class="item-row">
            <div>${item.name}</div>
            <div style="display:flex;justify-content:space-between;">
              <span>${item.quantity} x ${formatRupiah(item.price)}</span>
              <span>${formatRupiah(item.subtotal)}</span>
            </div>
          </div>
        `
          )
          .join("")}
        <div class="border-top"></div>
        <div class="summary-row"><span>Subtotal</span><span>${formatRupiah(subtotal)}</span></div>
        ${
          discount > 0
            ? `<div class="summary-row"><span>Diskon</span><span>-${formatRupiah(discount)}</span></div>`
            : ""
        }
        <div class="summary-row total-row"><span>TOTAL</span><span>${formatRupiah(total)}</span></div>
        <div class="border-bottom"></div>
        <div class="summary-row"><span>Bayar (${paymentMethod})</span><span>${formatRupiah(amountPaid)}</span></div>
        ${change > 0 ? `<div class="summary-row"><span>Kembali</span><span>${formatRupiah(change)}</span></div>` : ""}
        <div class="border-bottom"></div>
        <div class="center" style="margin-top: 10px; font-size: 10px;">Terima kasih atas kunjungan Anda</div>
        <div class="center" style="font-size: 10px;">Sampai jumpa lagi!</div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div>
      <div ref={receiptRef} className="hidden print:block">
        {/* Hidden receipt for reference */}
      </div>
      <button
        onClick={handlePrint}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        🖨️ Cetak Struk
      </button>
    </div>
  );
}
