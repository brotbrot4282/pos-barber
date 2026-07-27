"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Search,
  ShoppingCart,
  X,
  Minus,
  Plus,
  Scissors,
  Package,
  Check,
  Loader2,
} from "lucide-react";

interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  category?: { name: string };
}

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: { name: string };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  itemType: "service" | "product";
  serviceId?: string;
  productId?: string;
}

interface Member {
  id: string;
  name: string;
  phone: string;
  level: string;
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function KasirPage() {
  const [activeTab, setActiveTab] = useState<"service" | "product">("service");
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "QRIS">("CASH");
  const [member, setMember] = useState<Member | null>(null);
  const [memberSearch, setMemberSearch] = useState("");
  const [memberResults, setMemberResults] = useState<Member[]>([]);
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState("");

  const amountPaidRef = useRef<HTMLInputElement>(null);
  const memberSearchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.id) setUserId(data.id);
      })
      .catch(() => {});

    fetch("/api/services")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
      })
      .catch(() => {});

    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (showPaymentDialog && paymentMethod === "CASH") {
      setTimeout(() => amountPaidRef.current?.focus(), 100);
    }
  }, [showPaymentDialog, paymentMethod]);

  const handleMemberSearch = useCallback((value: string) => {
    setMemberSearch(value);
    if (memberSearchTimeout.current) {
      clearTimeout(memberSearchTimeout.current);
    }
    if (!value.trim()) {
      setMemberResults([]);
      setShowMemberDropdown(false);
      return;
    }
    memberSearchTimeout.current = setTimeout(() => {
      fetch(`/api/members?search=${encodeURIComponent(value)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMemberResults(data);
            setShowMemberDropdown(data.length > 0);
          }
        })
        .catch(() => {});
    }, 300);
  }, []);

  const addToCart = (item: Service | Product, type: "service" | "product") => {
    const existingIndex = cart.findIndex(
      (c) =>
        c.id === item.id && c.itemType === type
    );
    if (existingIndex >= 0) {
      setCart((prev) =>
        prev.map((c, i) =>
          i === existingIndex ? { ...c, quantity: c.quantity + 1 } : c
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
          itemType: type,
          serviceId: type === "service" ? item.id : undefined,
          productId: type === "product" ? item.id : undefined,
        },
      ]);
    }
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c, i) =>
          i === index ? { ...c, quantity: c.quantity + delta } : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const calculateSubtotal = () =>
    cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const calculateTotal = () => Math.max(0, calculateSubtotal() - discount);

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePayment = async () => {
    const total = calculateTotal();
    const paid = paymentMethod === "QRIS" ? total : amountPaid;
    const change = paymentMethod === "QRIS" ? 0 : Math.max(0, paid - total);

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subtotal: calculateSubtotal(),
          discount,
          total,
          paymentMethod,
          amountPaid: paid,
          change,
          memberId: member?.id || null,
          userId,
          items: cart.map((item) => ({
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            subtotal: item.price * item.quantity,
            itemType: item.itemType,
            serviceId: item.serviceId || null,
            productId: item.productId || null,
          })),
        }),
      });

      if (res.ok) {
        setShowPaymentDialog(false);
        setShowSuccessDialog(true);
      } else {
        alert("Gagal memproses transaksi");
      }
    } catch {
      alert("Terjadi kesalahan saat memproses transaksi");
    } finally {
      setLoading(false);
    }
  };

  const resetTransaction = () => {
    setCart([]);
    setMember(null);
    setMemberSearch("");
    setDiscount(0);
    setAmountPaid(0);
    setPaymentMethod("CASH");
    setShowSuccessDialog(false);
  };

  const kembalian =
    paymentMethod === "CASH"
      ? Math.max(0, amountPaid - calculateTotal())
      : 0;
  const isInsufficient =
    paymentMethod === "CASH" && amountPaid > 0 && amountPaid < calculateTotal();

  return (
    <div className="flex h-full gap-4">
      {/* LEFT PANEL */}
      <div className="flex-1 overflow-y-auto pr-2">
        <h1 className="mb-4 text-2xl font-bold tracking-tight">
          Pilih Layanan/Produk
        </h1>

        <div className="mb-4 flex gap-2">
          <Button
            variant={activeTab === "service" ? "default" : "outline"}
            size="lg"
            onClick={() => {
              setActiveTab("service");
              setSearchQuery("");
            }}
          >
            <Scissors className="mr-1.5 size-4" />
            Layanan
          </Button>
          <Button
            variant={activeTab === "product" ? "default" : "outline"}
            size="lg"
            onClick={() => {
              setActiveTab("product");
              setSearchQuery("");
            }}
          >
            <Package className="mr-1.5 size-4" />
            Produk
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9"
          />
        </div>

        {activeTab === "service" ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {filteredServices.map((service) => (
              <Card
                key={service.id}
                className="cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98]"
                onClick={() => addToCart(service, "service")}
              >
                <CardContent className="p-4">
                  <p className="font-medium leading-tight">{service.name}</p>
                  {service.category && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {service.category.name}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {formatRupiah(service.price)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {service.duration} menit
                  </p>
                </CardContent>
              </Card>
            ))}
            {filteredServices.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Tidak ada layanan ditemukan.
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`cursor-pointer transition-all hover:border-primary hover:shadow-md active:scale-[0.98] ${
                  product.stock === 0 ? "pointer-events-none opacity-50" : ""
                }`}
                onClick={() => product.stock > 0 && addToCart(product, "product")}
              >
                <CardContent className="p-4">
                  <p className="font-medium leading-tight">{product.name}</p>
                  {product.category && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {product.category.name}
                    </p>
                  )}
                  <p className="mt-2 text-sm font-semibold text-primary">
                    {formatRupiah(product.price)}
                  </p>
                  <Badge
                    variant={product.stock > 0 ? "secondary" : "destructive"}
                    className="mt-1"
                  >
                    Stok: {product.stock}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                Tidak ada produk ditemukan.
              </div>
            )}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="sticky top-0 flex h-full w-[400px] shrink-0 flex-col lg:w-[420px]">
        <Card className="flex flex-1 flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center gap-2 border-b pb-4">
            <ShoppingCart className="size-5" />
            <CardTitle>Keranjang</CardTitle>
            {cartItemCount > 0 && (
              <Badge variant="default" className="ml-auto">
                {cartItemCount} item
              </Badge>
            )}
          </CardHeader>

          <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
            {/* Cart Items */}
            <div className="max-h-64 flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <ShoppingCart className="mb-2 size-8 opacity-40" />
                  <p className="text-sm">Keranjang kosong</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, index) => (
                    <div
                      key={`${item.itemType}-${item.id}-${index}`}
                      className="flex flex-col gap-2 rounded-lg border p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="flex-1 truncate text-sm font-medium">
                          {item.name}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => removeFromCart(index)}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {formatRupiah(item.price)}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(index, -1)}
                          >
                            <Minus className="size-3" />
                          </Button>
                          <span className="w-6 text-center text-sm font-medium">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon-xs"
                            onClick={() => updateQuantity(index, 1)}
                          >
                            <Plus className="size-3" />
                          </Button>
                        </div>
                        <p className="w-24 text-right text-sm font-semibold">
                          {formatRupiah(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Member Section */}
            <div className="p-4">
              <p className="mb-2 text-sm font-medium">Member</p>
              {member ? (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.name}</p>
                    <Badge variant="secondary" className="mt-0.5 text-[10px]">
                      {member.level}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => {
                      setMember(null);
                      setMemberSearch("");
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari member (nama/no HP)..."
                    value={memberSearch}
                    onChange={(e) => handleMemberSearch(e.target.value)}
                    onFocus={() =>
                      memberResults.length > 0 && setShowMemberDropdown(true)
                    }
                    className="h-8 pl-8 text-sm"
                  />
                  {showMemberDropdown && memberResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-lg border bg-popover shadow-md">
                      {memberResults.map((m) => (
                        <button
                          key={m.id}
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                          onClick={() => {
                            setMember(m);
                            setMemberSearch("");
                            setShowMemberDropdown(false);
                          }}
                        >
                          <div>
                            <p className="font-medium">{m.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.phone}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {m.level}
                          </Badge>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Discount */}
            <div className="p-4">
              <p className="mb-2 text-sm font-medium">Diskon (Rp)</p>
              <Input
                type="number"
                min={0}
                placeholder="0"
                value={discount || ""}
                onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                className="h-8 text-sm"
              />
            </div>

            <Separator />

            {/* Summary */}
            <div className="space-y-2 p-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(calculateSubtotal())}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="font-medium text-destructive">
                    -{formatRupiah(discount)}
                  </span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Total</span>
                <span>{formatRupiah(calculateTotal())}</span>
              </div>
            </div>

            {/* Payment Method */}
            <div className="flex gap-2 px-4 pb-2">
              <Button
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                className="flex-1"
                size="lg"
                onClick={() => setPaymentMethod("CASH")}
              >
                💵 Tunai
              </Button>
              <Button
                variant={paymentMethod === "QRIS" ? "default" : "outline"}
                className="flex-1"
                size="lg"
                onClick={() => setPaymentMethod("QRIS")}
              >
                📱 QRIS
              </Button>
            </div>

            {/* Pay Button */}
            <div className="p-4 pt-2">
              <Button
                className="h-12 w-full text-base font-bold"
                size="lg"
                disabled={cart.length === 0 || loading}
                onClick={() => setShowPaymentDialog(true)}
              >
                BAYAR
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PAYMENT DIALOG */}
      <Dialog
        open={showPaymentDialog}
        onOpenChange={(open) => {
          if (!open) setShowPaymentDialog(false);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Pembayaran</DialogTitle>
            <DialogDescription>
              Selesaikan transaksi pembayaran
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground">Total yang harus dibayar</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {formatRupiah(calculateTotal())}
              </p>
            </div>

            {paymentMethod === "CASH" ? (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Bayar
                  </label>
                  <Input
                    ref={amountPaidRef}
                    type="number"
                    min={0}
                    placeholder="Masukkan jumlah bayar"
                    value={amountPaid || ""}
                    onChange={(e) =>
                      setAmountPaid(Math.max(0, Number(e.target.value)))
                    }
                    className="h-10 text-lg"
                  />
                </div>
                {amountPaid > 0 && (
                  <div className="rounded-lg border p-3">
                    <p className="text-sm text-muted-foreground">Kembalian</p>
                    <p
                      className={`text-xl font-bold ${
                        isInsufficient ? "text-destructive" : ""
                      }`}
                    >
                      {isInsufficient
                        ? `Kurang ${formatRupiah(calculateTotal() - amountPaid)}`
                        : formatRupiah(kembalian)}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8">
                  <div className="flex size-32 items-center justify-center rounded-lg border bg-white">
                    <p className="text-center text-sm text-muted-foreground">
                      Scan QR Code
                      <br />
                      QRIS
                    </p>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Tunjukkan QR ini ke pelanggan
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Jumlah</p>
                  <p className="text-xl font-bold">
                    {formatRupiah(calculateTotal())}
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              onClick={handlePayment}
              disabled={
                loading ||
                cart.length === 0 ||
                (paymentMethod === "CASH" && amountPaid < calculateTotal())
              }
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi Bayar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SUCCESS DIALOG */}
      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          if (!open) setShowSuccessDialog(false);
        }}
      >
        <DialogContent className="sm:max-w-sm" showCloseButton={false}>
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Check className="size-8" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-lg">
                Transaksi Berhasil!
              </DialogTitle>
              <DialogDescription className="mt-1">
                Pembayaran telah diproses dengan sukses
              </DialogDescription>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full"
              variant="outline"
              onClick={() => alert("Struk akan dicetak")}
            >
              Cetak Struk
            </Button>
            <Button className="w-full" onClick={resetTransaction}>
              Transaksi Baru
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
