import { createHash } from "node:crypto";

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import {
  createSnapTransaction,
  handleMidtransNotification,
  isLanggananAktif,
  PAKET_SUBSCRIPTION,
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
      namaperusahaan: `Toko Subscription ${idCounter}`,
      namadatabase  : `pos_test_subscription_${idCounter}`,
      status,
    },
  });
  return perusahaan.idperusahaan;
}

function tglRelatifHariIni(selisihHari: number): Date {
  const hariIni = new Date(new Date().toISOString().slice(0, 10));
  hariIni.setUTCDate(hariIni.getUTCDate() + selisihHari);

  return hariIni;
}

async function buatSubscription(
  idperusahaan: number,
  tglmulai    : Date,
  tglselesai  : Date,
): Promise<void> {
  idCounter += 1;
  await prisma.subscription.create({
    data: {
      idperusahaan,
      orderid        : `SEED-${idperusahaan}-${idCounter}`,
      namapaket      : "Paket Bulanan",
      hargapaket     : 150_000,
      masaberlakuhari: 30,
      tglmulai,
      tglselesai,
    },
  });
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

describe("Pengguna melihat daftar Paket Subscription beserta harga dan masa berlakunya", () => {
  it('katalog berisi "Paket Bulanan" Rp150.000/30 hari dan "Paket Tahunan" Rp1.500.000/365 hari', () => {
    const katalog = PAKET_SUBSCRIPTION;

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
      /Paket Subscription/,
    );
    expect(midtransClient.createTransaction).not.toHaveBeenCalled();
  });

  it("memilih paket untuk Perusahaan yang sudah aktif berhasil membuat transaksi Snap baru (perpanjangan dini), tidak ditolak", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-29), tglRelatifHariIni(1));
    const midtransClient = buatMidtransClient();

    const hasil = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    expect(midtransClient.createTransaction).toHaveBeenCalledWith({
      transaction_details: { order_id: hasil.orderid, gross_amount: 150_000 },
    });
  });
});

describe("Konfirmasi lunas membuat Subscription baru dan mengaktifkan Perusahaan", () => {
  it('notifikasi settlement dengan signature sah untuk order_id yang dikenal membuat satu baris Subscription dan mengubah perusahaan.status menjadi 1', async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    const hasil = await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

    expect(hasil.activated).toBe(true);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(1);
    const subscription = await prisma.subscription.findMany({ where: { idperusahaan } });
    expect(subscription).toHaveLength(1);
  });

  it("paket 30 hari dibeli tanggal 2026-08-22 menghasilkan tglmulai=2026-08-22 dan tglselesai=2026-09-21", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(0);
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

      const subscription = await prisma.subscription.findFirstOrThrow({ where: { idperusahaan } });
      expect(subscription.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-22");
      expect(subscription.tglselesai.toISOString().slice(0, 10)).toBe("2026-09-21");
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

      const subscription = await prisma.subscription.findFirstOrThrow({ where: { idperusahaan } });
      expect(subscription.tglselesai.toISOString().slice(0, 10)).toBe("2027-08-22");
    } finally {
      vi.useRealTimers();
    }
  });

  it("notifikasi untuk order_id yang tidak pernah dibuat lewat createSnapTransaction diabaikan, tidak membuat Subscription apa pun", async () => {
    const orderidPalsu = "ORDER-BUKAN-DARI-SNAP-123";

    await expect(
      handleMidtransNotification(prisma, notifikasiSettlement(orderidPalsu, "150000")),
    ).rejects.toThrow(/tidak pernah dibuat/);

    expect(await prisma.subscription.count()).toBe(0);
  });
});

describe("Notifikasi ganda tidak menghasilkan Subscription ganda", () => {
  it("notifikasi settlement untuk order_id yang sama diterima dua kali berturut-turut hanya menghasilkan satu baris Subscription", async () => {
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

  it("dua notifikasi settlement untuk order_id yang sama diterima bersamaan tetap hanya menghasilkan satu baris Subscription", async () => {
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
  it("notifikasi dengan signature_key yang tidak cocok ditolak, perusahaan.status tidak berubah, tidak ada Subscription tercipta", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = { ...notifikasiSettlement(snap.orderid, "150000"), signature_key: "signature-ngawur" };

    await expect(handleMidtransNotification(prisma, payload)).rejects.toThrow(/Signature notifikasi/);

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

    await expect(handleMidtransNotification(prisma, payloadDiubah)).rejects.toThrow(/Signature notifikasi/);
  });
});

describe("Pembayaran gagal, kedaluwarsa, atau dibatalkan tidak mengaktifkan Perusahaan", () => {
  it.each(["deny", "expire", "cancel"])('notifikasi transaction_status="%s" tidak mengubah perusahaan.status dan tidak membuat Subscription', async (status) => {
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
  it("pembayaran pertama yang lunas menambah tepat satu baris Subscription lewat INSERT, tidak ada baris lain yang terhapus atau tertimpa", async () => {
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
  it("PAKET_SUBSCRIPTION selalu berupa array, tidak pernah melempar", () => {
    expect(Array.isArray(PAKET_SUBSCRIPTION)).toBe(true);
  });
});

describe("Jumlah tidak sesuai (defense in depth)", () => {
  it("notifikasi dengan gross_amount valid secara signature tapi tidak cocok harga paket ditolak", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = notifikasiSettlement(snap.orderid, "999999");

    await expect(handleMidtransNotification(prisma, payload)).rejects.toThrow(/tidak sesuai harga/);
  });
});

describe("syncSnapTransaction mengaktifkan Subscription lewat status Midtrans langsung, tanpa menunggu webhook", () => {
  it("order_id yang statusnya settlement di Midtrans membuat Subscription aktif, sama seperti lewat webhook", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    midtransClient.getStatus = vi.fn(async () => notifikasiSettlement(snap.orderid, "150000"));

    const hasil = await syncSnapTransaction(prisma, snap.orderid, midtransClient);

    expect(hasil.activated).toBe(true);
    const perusahaan = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(perusahaan.status).toBe(1);
  });

  it("dipanggil ulang setelah webhook sudah lebih dulu mengaktifkan tidak membuat Subscription ganda (idempoten)", async () => {
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

describe("Status Langganan ditentukan dari tanggal selesai, bukan flag statis", () => {
  it("Perusahaan dengan Langganan yang tglselesai besok dianggap sedang aktif", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-29), tglRelatifHariIni(1));

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(true);
  });

  it("Perusahaan dengan Langganan yang tglselesai kemarin dianggap kedaluwarsa", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-31), tglRelatifHariIni(-1));

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(false);
  });

  it("Perusahaan yang belum pernah punya Langganan sama sekali dianggap belum aktif", async () => {
    const idperusahaan = await buatPerusahaan(0);

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(false);
  });

  it("Perusahaan dengan tglselesai persis hari ini masih dianggap aktif (batas hari terakhir termasuk)", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-30), tglRelatifHariIni(0));

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(true);
  });

  it("Perusahaan dengan tglselesai persis kemarin (H+1 setelah batas) sudah dianggap kedaluwarsa", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-31), tglRelatifHariIni(-1));

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(false);
  });
});

describe("Membuat transaksi Snap baru tidak lagi ditolak karena Perusahaan sedang aktif", () => {
  it("Perusahaan dengan Langganan yang sudah kedaluwarsa seminggu tetap berhasil membuat transaksi Snap baru", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-37), tglRelatifHariIni(-7));
    const midtransClient = buatMidtransClient();

    const hasil = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    expect(hasil.orderid).toBeTruthy();
    expect(midtransClient.createTransaction).toHaveBeenCalled();
  });

  it("Perusahaan yang belum pernah punya Langganan sama sekali berhasil membuat transaksi Snap pertama", async () => {
    const idperusahaan = await buatPerusahaan(0);
    const midtransClient = buatMidtransClient();

    const hasil = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    expect(hasil.orderid).toBeTruthy();
  });
});

describe("Memperpanjang sebelum kedaluwarsa dihitung dari tanggal selesai lama", () => {
  it("Langganan aktif ber-tglselesai besok diperpanjang Paket Bulanan: tglmulai = tglselesai lama, tglselesai baru = tglselesai lama + 30 hari", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(1);
      const tglselesaiLama = new Date("2026-08-23T00:00:00Z");
      await buatSubscription(idperusahaan, new Date("2026-07-24T00:00:00Z"), tglselesaiLama);
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

      const baru = await prisma.subscription.findFirstOrThrow({ where: { orderid: snap.orderid } });
      expect(baru.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-23");
      expect(baru.tglselesai.toISOString().slice(0, 10)).toBe("2026-09-22");
    } finally {
      vi.useRealTimers();
    }
  });

  it("Langganan aktif ber-tglselesai persis hari ini diperpanjang: tetap dihitung dari tglselesai lama (hari ini), bukan dari besok", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(1);
      const tglselesaiLama = new Date("2026-08-22T00:00:00Z");
      await buatSubscription(idperusahaan, new Date("2026-07-23T00:00:00Z"), tglselesaiLama);
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

      const baru = await prisma.subscription.findFirstOrThrow({ where: { orderid: snap.orderid } });
      expect(baru.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-22");
      expect(baru.tglselesai.toISOString().slice(0, 10)).toBe("2026-09-21");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Memperpanjang setelah kedaluwarsa dihitung dari hari pembayaran", () => {
  it("Langganan yang tglselesai sudah lewat seminggu diperpanjang Paket Tahunan: tglmulai = tanggal notifikasi diproses, tglselesai = tanggal itu + 365 hari", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(1);
      await buatSubscription(idperusahaan, new Date("2026-07-16T00:00:00Z"), new Date("2026-08-15T00:00:00Z"));
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "tahunan", midtransClient);

      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "1500000"));

      const baru = await prisma.subscription.findFirstOrThrow({ where: { orderid: snap.orderid } });
      expect(baru.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-22");
      expect(baru.tglselesai.toISOString().slice(0, 10)).toBe("2027-08-22");
    } finally {
      vi.useRealTimers();
    }
  });

  it("notifikasi pembayaran untuk perpanjangan yang telat diproses sehari setelah tglselesai lama tetap dihitung dari hari notifikasi benar-benar diproses", async () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-08-22T03:00:00Z"));
      const idperusahaan = await buatPerusahaan(1);
      await buatSubscription(idperusahaan, new Date("2026-07-23T00:00:00Z"), new Date("2026-08-21T00:00:00Z"));
      const midtransClient = buatMidtransClient();
      const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

      vi.setSystemTime(new Date("2026-08-23T03:00:00Z"));
      await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

      const baru = await prisma.subscription.findFirstOrThrow({ where: { orderid: snap.orderid } });
      expect(baru.tglmulai.toISOString().slice(0, 10)).toBe("2026-08-23");
      expect(baru.tglselesai.toISOString().slice(0, 10)).toBe("2026-09-22");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("Setiap perpanjangan menambah Langganan baru, riwayat tetap utuh", () => {
  it("Perusahaan dengan dua riwayat Langganan sebelumnya melakukan perpanjangan ketiga menghasilkan tiga baris total, dua baris lama tidak berubah", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-395), tglRelatifHariIni(-366));
    await buatSubscription(idperusahaan, tglRelatifHariIni(-365), tglRelatifHariIni(1));
    const sebelum = await prisma.subscription.findMany({ where: { idperusahaan }, orderBy: { idsubscription: "asc" } });
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

    const sesudah = await prisma.subscription.findMany({ where: { idperusahaan } });
    expect(sesudah).toHaveLength(3);
    const duaLama = await prisma.subscription.findMany({
      where  : { idsubscription: { in: sebelum.map((row) => row.idsubscription) } },
      orderBy: { idsubscription: "asc" },
    });
    expect(duaLama).toEqual(sebelum);
  });

  it("dua notifikasi pembayaran sukses dengan order_id yang sama untuk perpanjangan diproses bersamaan hanya menghasilkan satu Langganan baru", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-29), tglRelatifHariIni(1));
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const payload = notifikasiSettlement(snap.orderid, "150000");

    await Promise.allSettled([
      handleMidtransNotification(prisma, payload),
      handleMidtransNotification(prisma, payload),
    ]);

    expect(await prisma.subscription.count({ where: { orderid: snap.orderid } })).toBe(1);
  });

  it("dua transaksi Snap perpanjangan dengan order_id berbeda untuk Perusahaan yang sama, diproses nyaris bersamaan, menghasilkan dua Langganan berurutan", async () => {
    const idperusahaan = await buatPerusahaan(1);
    const tglselesaiLama = tglRelatifHariIni(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-29), tglselesaiLama);
    const midtransClient = buatMidtransClient();
    const snapA = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);
    const snapB = await createSnapTransaction(prisma, idperusahaan, "bulanan", midtransClient);

    await Promise.all([
      handleMidtransNotification(prisma, notifikasiSettlement(snapA.orderid, "150000")),
      handleMidtransNotification(prisma, notifikasiSettlement(snapB.orderid, "150000")),
    ]);

    const baruA = await prisma.subscription.findFirstOrThrow({ where: { orderid: snapA.orderid } });
    const baruB = await prisma.subscription.findFirstOrThrow({ where: { orderid: snapB.orderid } });
    const tglmulaiSet = new Set([baruA.tglmulai.getTime(), baruB.tglmulai.getTime()]);
    expect(tglmulaiSet.size).toBe(2);
    expect(tglmulaiSet.has(tglselesaiLama.getTime())).toBe(true);
    const urutMulai = [baruA, baruB].sort((a, b) => a.tglmulai.getTime() - b.tglmulai.getTime());
    expect(urutMulai[1].tglmulai.getTime()).toBe(urutMulai[0].tglselesai.getTime());
  });

  it("memperpanjang Langganan Perusahaan A tidak membuat atau mengubah baris Langganan milik Perusahaan B", async () => {
    const idperusahaanA = await buatPerusahaan(1);
    const idperusahaanB = await buatPerusahaan(1);
    await buatSubscription(idperusahaanA, tglRelatifHariIni(-29), tglRelatifHariIni(1));
    await buatSubscription(idperusahaanB, tglRelatifHariIni(-29), tglRelatifHariIni(1));
    const subscriptionBSebelum = await prisma.subscription.findMany({ where: { idperusahaan: idperusahaanB } });
    const midtransClient = buatMidtransClient();
    const snap = await createSnapTransaction(prisma, idperusahaanA, "bulanan", midtransClient);

    await handleMidtransNotification(prisma, notifikasiSettlement(snap.orderid, "150000"));

    const subscriptionBSesudah = await prisma.subscription.findMany({ where: { idperusahaan: idperusahaanB } });
    expect(subscriptionBSesudah).toEqual(subscriptionBSebelum);
    expect(await prisma.subscription.count({ where: { idperusahaan: idperusahaanA } })).toBe(2);
  });
});

describe("Data Perusahaan tidak pernah terhapus karena kedaluwarsa", () => {
  it("setelah Langganan Perusahaan kedaluwarsa dan tidak diperpanjang, baris Perusahaan tetap ada dan kolomnya tidak berubah", async () => {
    const idperusahaan = await buatPerusahaan(1);
    await buatSubscription(idperusahaan, tglRelatifHariIni(-37), tglRelatifHariIni(-7));
    const sebelum = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });

    await expect(isLanggananAktif(prisma, idperusahaan)).resolves.toBe(false);

    const sesudah = await prisma.perusahaan.findUniqueOrThrow({ where: { idperusahaan } });
    expect(sesudah).toEqual(sebelum);
  });
});
