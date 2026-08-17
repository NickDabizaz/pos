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
import { cancelCloseShift, openShift, recordShiftTransaction } from "@/lib/client/shift";
import { useShiftSession } from "@/lib/client/useShiftSession";
import type { OpenShiftInput } from "@/lib/server/shift/types";

async function fetchBarangCatalog(): Promise<Barang[]> {
  try {
    const list = await fetchBarangList();
    return list.filter((b) => b.status === 1);
  } catch {
    return [];
  }
}

export default function PosPage() {
  const { isLoading: isShiftLoading, loadError: shiftLoadError, setShift: setSession, shift: session } =
    useShiftSession();
  const [isOpeningShift, setIsOpeningShift]     = useState(false);
  const [shiftError, setShiftError]             = useState<string | null>(null);
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

  async function handleOpenShift(input: OpenShiftInput) {
    setIsOpeningShift(true);
    setShiftError(null);

    try {
      setSession(await openShift(input));
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
      setSession(await cancelCloseShift());
    } catch (error) {
      setShiftError(error instanceof Error ? error.message : "Gagal membatalkan penutupan shift");
    } finally {
      setIsOpeningShift(false);
    }
  }

  // Keyboard Shortcuts (F2: focus search, F4: pay, Esc: cancel modal)
  usePosKeyboardShortcuts({
    onEscape: () => {
      if (isPaymentOpen) setIsPaymentOpen(false);
    },
    onFocusSearch: () => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    },
    onTriggerPayment: () => {
      if (cart.items.length > 0 && !isPaymentOpen && !completedTx) {
        setIsPaymentOpen(true);
      }
    },
  });

  // Barcode / Exact match scan handler
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

  // Handle successful checkout
  async function handleCompletePayment(paymentData: {
    amountPaid    : number;
    change        : number;
    paymentMethod : PaymentMethod;
  }) {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;

    const summary: TransactionSummary = {
      amountPaid   : paymentData.amountPaid,
      change       : paymentData.change,
      date         : today,
      discount     : cart.discount,
      grandTotal   : cart.grandTotal,
      id           : invoiceNumber,
      invoiceNumber: invoiceNumber,
      items        : [...cart.items],
      kasirName    : session?.kasirName ?? "Kasir",
      paymentMethod: paymentData.paymentMethod,
      subtotal     : cart.subtotal,
    };

    setCompletedTx(summary);
    setIsPaymentOpen(false);

    try {
      const updatedShift = await recordShiftTransaction({
        paymentMethod: paymentData.paymentMethod,
        grandTotal   : cart.grandTotal,
      });
      setSession(updatedShift);
    } catch {
      // Shift totals will resync the next time the active shift is (re)loaded.
    }
  }

  function handleNewOrder() {
    cart.clearCart();
    setCompletedTx(null);
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background">
      {/* Top Header */}
      <PosHeader
        onBarcodeScanAction  = {handleBarcodeScan}
        onSearchChangeAction = {setSearchQuery}
        searchQuery          = {searchQuery}
        searchRef            = {searchInputRef}
        session              = {session}
      />

      {/* Main Split Body: Catalog (Left) + Cart (Right) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Product Catalog Grid */}
        <main className="flex flex-1 flex-col overflow-hidden">
          <ProductGrid
            isLoading      = {isLoading}
            onSelectAction = {(barang) => cart.addItem(barang, 1)}
            products       = {products}
            searchQuery    = {searchQuery}
          />
        </main>

        {/* Right Side: Order Cart Panel */}
        <CartPanel
          discount            = {cart.discount}
          grandTotal          = {cart.grandTotal}
          items               = {cart.items}
          onClearCartAction   = {cart.clearCart}
          onPayAction         = {() => setIsPaymentOpen(true)}
          onRemoveItemAction  = {cart.removeItem}
          onSetDiscountAction = {cart.setDiscount}
          onUpdateQtyAction   = {cart.updateQty}
          subtotal            = {cart.subtotal}
          totalQty            = {cart.totalQty}
        />
      </div>

      {/* Modal Awal (Blocking Shift Gate) */}
      <ModalAwalDialog
        closedShift         = {session?.status === "CLOSED" ? session : null}
        errorMessage        = {shiftError ?? shiftLoadError}
        isOpen              = {!isShiftLoading && session?.status !== "OPEN"}
        isSubmitting        = {isOpeningShift}
        onCancelCloseAction = {handleCancelCloseShift}
        onSubmitAction      = {handleOpenShift}
      />

      {/* Payment Multi-Method Modal */}
      <PaymentModal
        grandTotal       = {cart.grandTotal}
        isOpen           = {isPaymentOpen}
        onCancelAction   = {() => setIsPaymentOpen(false)}
        onCompleteAction = {handleCompletePayment}
      />

      {/* Thermal Receipt Modal */}
      <ReceiptModal
        isOpen           = {Boolean(completedTx)}
        onNewOrderAction = {handleNewOrder}
        transaction      = {completedTx}
      />
    </div>
  );
}
