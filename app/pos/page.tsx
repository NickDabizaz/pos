"use client";

import { useEffect, useRef, useState } from "react";

import CartPanel from "@/app/pos/components/CartPanel";
import ModalAwalDialog from "@/app/pos/components/ModalAwalDialog";
import PaymentModal from "@/app/pos/components/PaymentModal";
import PosHeader from "@/app/pos/components/PosHeader";
import ProductGrid from "@/app/pos/components/ProductGrid";
import ReceiptModal from "@/app/pos/components/ReceiptModal";
import { usePosCart } from "@/app/pos/lib/usePosCart";
import { usePosKeyboardShortcuts } from "@/app/pos/lib/usePosKeyboardShortcuts";
import type { Barang, PaymentMethod, TransactionSummary } from "@/app/pos/lib/types";
import { fetchBarangList } from "@/lib/client/barang";
import { createPenjualan } from "@/lib/client/penjualan";
import { cancelCloseShift, openShift } from "@/lib/client/shift";
import { useShiftSession } from "@/lib/client/useShiftSession";

const POS_KODELOKASI = "TOKO";
const POS_KODECUSTOMER = "CASH";

async function fetchBarangCatalog(): Promise<Barang[]> {
  try {
    const list = await fetchBarangList();
    return list.filter((b) => b.status === 1);
  } catch {
    return [];
  }
}

export default function PosPage() {
  const { isLoading: isShiftLoading, loadError: shiftLoadError, refresh: refreshShift, setShift: setSession, shift: session } =
    useShiftSession();
  const [isOpeningShift, setIsOpeningShift]     = useState(false);
  const [shiftError, setShiftError]             = useState<string | null>(null);
  const [isShiftGateOpen, setIsShiftGateOpen]   = useState(false);
  const [products, setProducts]                 = useState<Barang[]>([]);
  const [isLoading, setIsLoading]               = useState(true);
  const [searchQuery, setSearchQuery]           = useState("");
  const [isPaymentOpen, setIsPaymentOpen]       = useState(false);
  const [completedTx, setCompletedTx]           = useState<TransactionSummary | null>(null);
  const searchInputRef                          = useRef<HTMLInputElement>(null);

  const cart = usePosCart();

  useEffect(() => {
    let isMounted = true;

    fetchBarangCatalog().then((data) => {
      if (isMounted) {
        setProducts(data);
        setIsLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function handlePayClick() {
    if (isShiftLoading) return;

    if (!session || session.status !== "TERBUKA") {
      setShiftError(null);
      setIsShiftGateOpen(true);
      return;
    }

    setIsPaymentOpen(true);
  }

  async function handleOpenShift(input: { modalawal: number }) {
    setIsOpeningShift(true);
    setShiftError(null);

    try {
      setSession(await openShift({ kodelokasi: POS_KODELOKASI, modalawal: input.modalawal }));
      setIsShiftGateOpen(false);
      setIsPaymentOpen(true);
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Gagal membuka shift");
    } finally {
      setIsOpeningShift(false);
    }
  }

  async function handleCancelCloseShift() {
    setIsOpeningShift(true);
    setShiftError(null);

    try {
      setSession(await cancelCloseShift(POS_KODELOKASI));
      setIsShiftGateOpen(false);
      setIsPaymentOpen(true);
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Gagal membatalkan penutupan shift");
    } finally {
      setIsOpeningShift(false);
    }
  }

  usePosKeyboardShortcuts({
    onEscape: () => {
      if (isPaymentOpen) setIsPaymentOpen(false);
      if (isShiftGateOpen) setIsShiftGateOpen(false);
    },
    onFocusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onTriggerPayment: () => {
      if (cart.items.length > 0 && !isPaymentOpen && !completedTx) {
        handlePayClick();
      }
    },
  });

  function handleBarcodeScan(code: string) {
    const normalized = code.toLowerCase().trim();
    const matched = products.find(
      (p) => p.kodebarang.toLowerCase() === normalized,
    );

    if (matched) {
      cart.addItem(matched, 1);
      setSearchQuery("");
    }
  }

  async function handleCompletePayment(paymentData: {
    amountPaid    : number;
    change        : number;
    paymentMethod : PaymentMethod;
  }) {
    const tanggal = new Date().toISOString().slice(0, 10);

    const created = await createPenjualan({
      tanggal,
      jenistransaksi: "POS",
      kodecustomer  : POS_KODECUSTOMER,
      kodelokasi    : POS_KODELOKASI,
      items: cart.items.map((item, index) => ({
        kodebarang: item.barang.kodebarang,
        qty       : item.qty,
        harga     : item.barang.hargajual,
        pakaiPpn  : "TIDAK",
        diskon    : index === 0 ? cart.discount : 0,
      })),
      pembayaran: paymentData.paymentMethod === "TUNAI"
        ? { tunai: paymentData.amountPaid, nontunai: 0 }
        : { tunai: 0, nontunai: paymentData.amountPaid },
    });

    const summary: TransactionSummary = {
      amountPaid   : paymentData.amountPaid,
      change       : created.pembayaran.kembalian,
      date         : new Date(created.tanggal),
      discount     : cart.discount,
      grandTotal   : created.grandtotal,
      id           : created.kodejual,
      invoiceNumber: created.kodejual,
      items        : [...cart.items],
      kasirName    : session?.namakasir ?? "Kasir",
      paymentMethod: paymentData.paymentMethod,
      subtotal     : cart.subtotal,
    };

    setCompletedTx(summary);
    setIsPaymentOpen(false);

    try {
      await refreshShift();
    } catch {
    }
  }

  function handleNewOrder() {
    cart.clearCart();
    setCompletedTx(null);
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      <PosHeader
        onBarcodeScanAction  = {handleBarcodeScan}
        onSearchChangeAction = {setSearchQuery}
        searchQuery          = {searchQuery}
        searchRef            = {searchInputRef}
        session              = {session}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-1 flex-col overflow-hidden">
          <ProductGrid
            isLoading      = {isLoading}
            onSelectAction = {(barang) => cart.addItem(barang, 1)}
            products       = {products}
            searchQuery    = {searchQuery}
          />
        </main>

        <CartPanel
          discount            = {cart.discount}
          grandTotal          = {cart.grandTotal}
          items               = {cart.items}
          onClearCartAction   = {cart.clearCart}
          onPayAction         = {handlePayClick}
          onRemoveItemAction  = {cart.removeItem}
          onSetDiscountAction = {cart.setDiscount}
          onUpdateQtyAction   = {cart.updateQty}
          subtotal            = {cart.subtotal}
          totalQty            = {cart.totalQty}
        />
      </div>

      <ModalAwalDialog
        closedShift         = {session?.status === "TERTUTUP" ? session : null}
        errorMessage        = {shiftError ?? shiftLoadError}
        isOpen              = {isShiftGateOpen}
        isSubmitting        = {isOpeningShift}
        onCancelCloseAction = {handleCancelCloseShift}
        onCloseAction       = {() => setIsShiftGateOpen(false)}
        onSubmitAction      = {handleOpenShift}
      />

      <PaymentModal
        grandTotal       = {cart.grandTotal}
        isOpen           = {isPaymentOpen}
        onCancelAction   = {() => setIsPaymentOpen(false)}
        onCompleteAction = {handleCompletePayment}
      />

      <ReceiptModal
        isOpen           = {Boolean(completedTx)}
        onNewOrderAction = {handleNewOrder}
        transaction      = {completedTx}
      />
    </div>
  );
}
