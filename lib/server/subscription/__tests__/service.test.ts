import { createHash } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import {
  createSnapTransaction,
  handleMidtransNotification,
  JumlahTidakSesuaiError,
  listPaketLangganan,
  OrderTidakDikenalError,
  PaketTidakDitemukanError,
  PerusahaanSudahAktifError,
  SignatureTidakValidError,
  syncSnapTransaction,
} from "@/lib/server/subscription/service";
import type { MidtransClient, MidtransNotificationPayload } from "@/lib/server/subscription/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

const SERVER_KEY = "test-server-key";
process.env.MIDTRANS_SERVER_KEY = SERVER_KEY;

let prisma: PrismaClient;
let tearDown: () => Promise<void>;
let idCounter = 0;

function buatMidtransClient(): MidtransClient {
  return {
    createTransaction: vi.fn(async ({ transaction_details }) => ({
      token       : `snap-token-${transaction_details.order_id}`,
      redirect_url: `https://app.sandbox.midtrans.com/snap/v4/redirection/${transaction_details.order_id}`,
    })),
    getStatus: vi.fn(async () => {
      throw new Error("getStatus tidak dipakai di test ini");
    }),
  };
}

async function buatPerusahaan(status: number): Promise<number> {
  idCounter += 1;
  const perusahaan = await prisma.perusahaan.create({
    data: {
      kodeperusahaan: `LGN${idCounter}`,
      namaperusahaan: `Toko Langganan ${idCounter}`,
      namadatabase  : `pos_test_langganan_${idCounter}`,
      status,
    },
  });
  return perusahaan.idperusahaan;
}

function signaturePayload(order_id: string, status_code: string, gross_amount: string, serverKey = SERVER_KEY): string {
  return createHash("sha512").update(`${order_id}${status_code}${gross_amount}${serverKey}`).digest("hex");
}

function notifikasiSettlement(order_id: string, gross_amount: string): MidtransNotificationPayload {
  const status_code = "200";
  return {
    order_id,
    status_code,
    gross_amount,
    transaction_status: "settlement",
    signature_key      : signaturePayload(order_id, status_code, gross_amount),
  };
}

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterEach(async () => {
  await prisma.$transaction([
    prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`,
    prisma.subscriptiondtl.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.userperusahaan.deleteMany(),
    prisma.perusahaan.deleteMany(),
    prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`,
  ]);
});

afterAll(async () => {
  await tearDown();
});

describe("Pengguna melihat daftar Paket Langganan beserta harga dan masa berlakunya", () => {
  it('katalog berisi "Paket Bulanan" Rp150.000/30 hari dan "Paket Tahunan" Rp1.500.000/365 hari', () => {
    const katalog = listPaketLangganan(prisma);

    const bulanan = katalog.find((paket) => paket.kodepaket === "bulanan");
    const tahunan = katalog.find((paket) => paket.kodepaket === "tahunan");

    expect(bulanan).toMatchObject({ namapaket: "Paket Bulanan", hargapaket: 150_000, masaberlakuhari: 30 });
    expect(tahunan).toMatchObject({ namapaket: "Paket Tahunan", hargapaket: 1_500_000, masaberlakuhari: 365 });
  });
});

describe("Memilih paket membuka pembayaran Snap di mode sandbox", () => {
  it('memilih "Paket Bulanan" untuk Perusahaan belum bayar membuat transaksi Snap dengan order_id unik dan gross_amount Rp150.000', async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();

    const hasil = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    expect(midtransClient.createTransaction).toHaveBeenCalledWith({
      transaction_details: { order_id: hasil.orderid, gross_amount: 150_000 },
    });
    expect(hasil.token).toContain(hasil.orderid);
  });

  it("memilih kode paket yang tidak ada di katalog ditolak, tidak ada transaksi Snap yang dibuat", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();

    await expect(createSnapTransaction(prisma, idperusahaan, "tidak-ada", midtransClient)).rejects.toThrow(
      PaketTidakDitemukanError,
    );
    expect(midtransClient.createTransaction).not.toHaveBeenCalled();
  });

  it("memilih paket untuk Perusahaan yang sudah aktif ditolak", async () => {
    const idperusahaan = await buatPerusahaan(1);
    const midtransClient = buatMidtransClient();

    await expect(createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient)).rejects.toThrow(
      PerusahaanSudahAktifError,
    );
  });
});

describe("Konfirmasi lunas membuat Langganan baru dan mengaktifkan Perusahaan", () => {
  it('notifikasi settlement dengan signature sah untuk order_id yang dikenal membuat satu baris Langganan dan mengubah perusahaan.status menjadi 1', async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    const hasil = await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

    expect(hasil.activated).toBe(true);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(1);
    const langganan = await prisma.subscription.findMany({ where: { idperusahaan } });
    expect(langganan).toHaveLength(1);
  });

  it("paket 30 hari dibeli tanggal 2026-08-22 menghasilkan tglmulai=2026-08-22 dan tglselesai=2026-09-21", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(0);
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

      const langganan = await prisma.subscription.findFirstOrThrow({ where: { idperusahaan } });
      expect(langganan.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-22");
      expect(langganan.tglselesai.toISOString().slice(0, 10)).toBe("2026-09-21");
    } finally {
      vi.useRealTimers();
    }
  });

  it("paket 365 hari dibeli tanggal 2026-08-22 menghasilkan tglselesai=2027-08-22", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(0);
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "tahunan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "1500000"));

      const langganan = await prisma.subscription.findFirstOrThrow({ where: { idperusahaan } });
      expect(langganan.tglselesai.toISOString().slice(0, 10)).toBe("2027-08-22");
    } finally {
      vi.useRealTimers();
    }
  });

  it("notifikasi untuk order_id yang tidak pernah dibuat lewat createSnapTransaction diabaikan, tidak membuat Langganan apa pun", async () => {
    const orderidPalsu = "ORDER-BUKAN-DARI-SNAP-123";

    await expect(
      handleMidtransNotification(prisma, notifikasiSettlement(orderidPalsu, "150000")),
    ).rejects.toThrow(OrderTidakDikenalError);

    expect(await prisma.subscription.count()).toBe(0);
  });
});

describe("Notifikasi ganda tidak menghasilkan Langganan ganda", () => {
  it("notifikasi settlement untuk order_id yang sama diterima dua kali berturut-turut hanya menghasilkan satu baris Langganan", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = notifikasiSettlement(snap.orderid, "150000");

    const pertama = await handleMidtransNotification(prisma, payload);
    const kedua = await handleMidtransNotification(prisma, payload);

    expect(pertama.activated).toBe(true);
    expect(kedua.activated).toBe(false);
    expect(await prisma.subscription.count({ where: { idperusahaan } })).toBe(1);
  });

  it("dua notifikasi settlement untuk order_id yang sama diterima bersamaan tetap hanya menghasilkan satu baris Langganan", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = notifikasiSettlement(snap.orderid, "150000");

    await Promise.allSettled([
      handleMidtransNotification(prisma, payload),
      handleMidtransNotification(prisma, payload),
    ]);

    expect(await prisma.subscription.count({ where: { idperusahaan } })).toBe(1);
  });
});

describe("Notifikasi dengan signature tidak sah ditolak", () => {
  it("notifikasi dengan signature_key yang tidak cocok ditolak, perusahaan.status tidak berubah, tidak ada Langganan tercipta", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = { ...notifikasiSettlement(snap.orderid, "150000"), signature_key: "signature-ngawur" };

    await expect(handleMidtransNotification(prisma, payload)).rejects.toThrow(SignatureTidakValidError);

    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(0);
    expect(await prisma.subscription.count()).toBe(0);
  });

  it("notifikasi dengan signature dari gross_amount lama tapi field gross_amount di payload sudah diubah ditolak sebagai signature tidak sah", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    const payload = notifikasiSettlement(snap.orderid, "150000");
    const payloadDiubah = { ...payload, gross_amount: "1" };

    await expect(handleMidtransNotification(prisma, payloadDiubah)).rejects.toThrow(
      SignatureTidakValidError,
    );
  });
});

describe("Pembayaran gagal, kedaluwarsa, atau dibatalkan tidak mengaktifkan Perusahaan", () => {
  it.each(["deny", "expire", "cancel"])('notifikasi transaction_status="%s" tidak mengubah perusahaan.status dan tidak membuat Langganan', async (status) => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = { ...notifikasiSettlement(snap.orderid, "150000"), transaction_status: status };
    payload.signature_key = signaturePayload(payload.order_id, payload.status_code, payload.gross_amount);

    const hasil = await handleMidtransNotification(prisma, payload);

    expect(hasil.activated).toBe(false);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(0);
    expect(await prisma.subscription.count()).toBe(0);
  });

  it("notifikasi transaction_status=pending tidak mengubah apa pun", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = { ...notifikasiSettlement(snap.orderid, "150000"), transaction_status: "pending" };
    payload.signature_key = signaturePayload(payload.order_id, payload.status_code, payload.gross_amount);

    const hasil = await handleMidtransNotification(prisma, payload);

    expect(hasil.activated).toBe(false);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(0);
  });
});

describe("Riwayat pembelian tersimpan utuh", () => {
  it("pembayaran pertama yang lunas menambah tepat satu baris Langganan lewat INSERT, tidak ada baris lain yang terhapus atau tertimpa", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

    const rows = await prisma.subscription.findMany({ where: { idperusahaan } });
    expect(rows).toHaveLength(1);
    expect(rows[0].orderid).toBe(snap.orderid);
  });
});

describe("Katalog paket kosong menampilkan daftar kosong tanpa error", () => {
  it("listPaketLangganan selalu mengembalikan array, tidak pernah melempar", () => {
    expect(() => listPaketLangganan(prisma)).not.toThrow();
    expect(Array.isArray(listPaketLangganan(prisma))).toBe(true);
  });
});

describe("Jumlah tidak sesuai (defense in depth)", () => {
  it("notifikasi dengan gross_amount valid secara signature tapi tidak cocok harga paket ditolak", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = notifikasiSettlement(snap.orderid, "999999");

    await expect(handleMidtransNotification(prisma, payload)).rejects.toThrow(JumlahTidakSesuaiError);
  });
});

describe("syncSnapTransaction mengaktifkan Langganan lewat status Midtrans langsung, tanpa menunggu webhook", () => {
  it("order_id yang statusnya settlement di Midtrans membuat Langganan aktif, sama seperti lewat webhook", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    midtransClient.getStatus = vi.fn(async () => notifikasiSettlement(snap.orderid, "150000"));

    const hasil = await syncSnapTransaction(prisma, snap.orderid, midtransClient);

    expect(hasil.activated).toBe(true);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(1);
  });

  it("dipanggil ulang setelah webhook sudah lebih dulu mengaktifkan tidak membuat Langganan ganda (idempoten)", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    midtransClient.getStatus = vi.fn(async () => notifikasiSettlement(snap.orderid, "150000"));

    await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));
    const hasil = await syncSnapTransaction(prisma, snap.orderid, midtransClient);

    expect(hasil.activated).toBe(false);
    expect(await prisma.subscription.count({ where: { idperusahaan } })).toBe(1);
  });

  it("order_id yang masih pending di Midtrans tidak mengaktifkan apa pun", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    midtransClient.getStatus = vi.fn(async () => ({ ...notifikasiSettlement(snap.orderid, "150000"), transaction_status: "pending" }));

    const hasil = await syncSnapTransaction(prisma, snap.orderid, midtransClient);

    expect(hasil.activated).toBe(false);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(0);
  });
});
