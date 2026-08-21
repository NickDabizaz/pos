import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { PrismaClient } from "@/lib/generated/prisma-global/client";
import {
  daftarPerusahaan,
  KodePerusahaanBentrokError,
  KodePerusahaanOtomatisHabisError,
  NamaPerusahaanSudahDipakaiError,
  NamaPerusahaanTidakValidError,
  ProvisioningGagalError,
  SudahMemilikiPerusahaanError,
} from "@/lib/server/perusahaan/service";
import type { DaftarPerusahaanInput } from "@/lib/server/perusahaan/types";
import { setUpMigratedDatabase } from "@/prisma/__tests__/testDatabase";

let prisma: PrismaClient;
let tearDown: () => Promise<void>;

beforeAll(async () => {
  ({ prisma, tearDown } = await setUpMigratedDatabase("global", (adapter) => new PrismaClient({ adapter })));
}, 60_000);

afterAll(async () => {
  await tearDown();
});

const GLOBAL_TABLES = ["usermenu", "userperusahaan", "subscriptiondtl", "subscription", "perusahaan", "account", "session", "verification", "user"];

afterEach(async () => {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 0");
    try {
      for (const table of GLOBAL_TABLES) {
        await tx.$executeRawUnsafe(`DELETE FROM \`${table}\``);
      }
    } finally {
      await tx.$executeRawUnsafe("SET FOREIGN_KEY_CHECKS = 1");
    }
  });
});

let userSeq = 0;

async function createUser(): Promise<string> {
  userSeq += 1;
  const id = `user-${userSeq}-${Date.now()}`;
  await prisma.user.create({ data: { id, name: `Pengguna ${userSeq}`, email: `${id}@norvyn.test`, emailVerified: false } });
  return id;
}

/** Membuat baris Perusahaan + Keanggotaan Owner langsung (bukan lewat service), dipakai untuk
 * menaruh state awal yang dibutuhkan satu skenario tanpa memanggil daftarPerusahaan lagi. */
async function seedPerusahaan(kodeperusahaan: string, namadatabase?: string): Promise<void> {
  const iduser = await createUser();
  const perusahaan = await prisma.perusahaan.create({
    data: { kodeperusahaan, namaperusahaan: `Seed ${kodeperusahaan}`, namadatabase: namadatabase ?? `pos_seed_${kodeperusahaan.toLowerCase()}` },
  });
  await prisma.userperusahaan.create({ data: { iduser, idperusahaan: perusahaan.idperusahaan, isowner: true } });
}

function buatDeps(impl?: (namadatabase: string) => Promise<unknown>) {
  const buatDatabase = vi.fn(impl ?? (async (namadatabase: string) => ({ namadatabase })));
  return { buatDatabase };
}

function inputFor(iduser: string, namaperusahaan: string, extra: Partial<DaftarPerusahaanInput> = {}): DaftarPerusahaanInput {
  return { iduser, namaperusahaan, generateKode: true, kodeperusahaan: "", ...extra };
}

describe("Kode Perusahaan digenerate berurutan", () => {
  it("pendaftaran pertama di Database Global yang masih kosong mendapat Kode Perusahaan P001", async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Pertama"), deps);

    expect(perusahaan.kodeperusahaan).toBe("P001");
  });

  it("pendaftaran berikutnya saat P001 sudah ada mendapat P002", async () => {
    await seedPerusahaan("P001");
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Kedua"), deps);

    expect(perusahaan.kodeperusahaan).toBe("P002");
  });

  it("saat satu-satunya Kode Perusahaan yang ada adalah kode ketikan SM tetap mendapat P001, karena deret otomatis tidak melihat kode di luar polanya", async () => {
    await seedPerusahaan("SM");
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Ketiga"), deps);

    expect(perusahaan.kodeperusahaan).toBe("P001");
  });

  it("saat P998 terpakai mendapat P999", async () => {
    await seedPerusahaan("P998");
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Keempat"), deps);

    expect(perusahaan.kodeperusahaan).toBe("P999");
  });

  it("saat P999 terpakai ditolak dengan pesan bahwa Kode Perusahaan otomatis sudah habis, dan tidak ada baris maupun database yang dibuat", async () => {
    await seedPerusahaan("P999");
    const iduser = await createUser();
    const deps = buatDeps();

    await expect(daftarPerusahaan(prisma, inputFor(iduser, "Toko Kelima"), deps)).rejects.toThrow(
      KodePerusahaanOtomatisHabisError,
    );

    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);
    expect(deps.buatDatabase).not.toHaveBeenCalled();
  });

  it("dua pendaftaran bersamaan yang sama-sama menghitung P002 berakhir sebagai P002 dan P003, bukan dua P002", async () => {
    await seedPerusahaan("P001");
    const iduserA = await createUser();
    const iduserB = await createUser();
    const depsA = buatDeps();
    const depsB = buatDeps();

    const [a, b] = await Promise.all([
      daftarPerusahaan(prisma, inputFor(iduserA, "Toko Balap A"), depsA),
      daftarPerusahaan(prisma, inputFor(iduserB, "Toko Balap B"), depsB),
    ]);

    expect(new Set([a.kodeperusahaan, b.kodeperusahaan])).toEqual(new Set(["P002", "P003"]));
  });
});

describe("Kode Perusahaan ketikan Pengguna", () => {
  it('kode ketikan " sm01 " tersimpan sebagai "SM01"', async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(
      prisma,
      inputFor(iduser, "Toko Manual", { generateKode: false, kodeperusahaan: " sm01 " }),
      deps,
    );

    expect(perusahaan.kodeperusahaan).toBe("SM01");
  });

  it("kode ketikan p001 saat P001 sudah ada ditolak sebagai bentrok, karena normalisasi menjadikan keduanya kode yang sama", async () => {
    await seedPerusahaan("P001");
    const iduser = await createUser();
    const deps = buatDeps();

    await expect(
      daftarPerusahaan(prisma, inputFor(iduser, "Toko Bentrok", { generateKode: false, kodeperusahaan: "p001" }), deps),
    ).rejects.toThrow(KodePerusahaanBentrokError);
  });

  it("kode ketikan yang bentrok ditolak tanpa memanggil buatDatabase sama sekali", async () => {
    await seedPerusahaan("P001");
    const iduser = await createUser();
    const deps = buatDeps();

    await expect(
      daftarPerusahaan(prisma, inputFor(iduser, "Toko Bentrok Lagi", { generateKode: false, kodeperusahaan: "p001" }), deps),
    ).rejects.toThrow();

    expect(deps.buatDatabase).not.toHaveBeenCalled();
  });

  it("dua pendaftaran bersamaan dengan kode ketikan yang sama persis berakhir satu berhasil, satu ditolak sebagai bentrok — bukan galat unique index mentah", async () => {
    const iduserA = await createUser();
    const iduserB = await createUser();
    const depsA = buatDeps();
    const depsB = buatDeps();

    const hasil = await Promise.allSettled([
      daftarPerusahaan(prisma, inputFor(iduserA, "Toko Rebutan A", { generateKode: false, kodeperusahaan: "RB01" }), depsA),
      daftarPerusahaan(prisma, inputFor(iduserB, "Toko Rebutan B", { generateKode: false, kodeperusahaan: "RB01" }), depsB),
    ]);

    const fulfilled = hasil.filter((r) => r.status === "fulfilled");
    const rejected = hasil.filter((r) => r.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect((rejected[0] as PromiseRejectedResult).reason).toBeInstanceOf(KodePerusahaanBentrokError);
  });
});

describe("Nama database diturunkan sistem", () => {
  it('Nama Perusahaan "Sumber Makmur" menghasilkan namadatabase "pos_sumbermakmur"', async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Sumber Makmur"), deps);

    expect(perusahaan.namadatabase).toBe("pos_sumbermakmur");
  });

  it('Nama Perusahaan "PT. Sumber Makmur & Co" menghasilkan "pos_ptsumbermakmurco"', async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "PT. Sumber Makmur & Co"), deps);

    expect(perusahaan.namadatabase).toBe("pos_ptsumbermakmurco");
  });

  it("Nama Perusahaan sepanjang 80 huruf menghasilkan nama database yang tetap 64 karakter atau kurang dan masih diterima MariaDB", async () => {
    const iduser = await createUser();
    const deps = buatDeps();
    const namaPanjang = "a".repeat(80);

    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, namaPanjang), deps);

    expect(perusahaan.namadatabase.length).toBeLessThanOrEqual(64);
    expect(perusahaan.namadatabase).toMatch(/^[a-z][a-z0-9_]*$/);
  });

  it("Nama Perusahaan yang setelah dibersihkan tidak menyisakan huruf maupun angka ditolak dengan pesan bahwa Nama Perusahaan harus memuat huruf atau angka", async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    await expect(daftarPerusahaan(prisma, inputFor(iduser, "!!! --- ***"), deps)).rejects.toThrow(
      NamaPerusahaanTidakValidError,
    );
  });

  it("input yang menyertakan namadatabase buatan Pengguna sendiri diabaikan: yang tersimpan tetap turunan dari Nama Perusahaan", async () => {
    const iduser = await createUser();
    const deps = buatDeps();
    const inputDenganNamadatabaseLiar = {
      ...inputFor(iduser, "Toko Aman"),
      namadatabase: "pos_hasil_suntikan_pengguna",
    } as DaftarPerusahaanInput;

    const perusahaan = await daftarPerusahaan(prisma, inputDenganNamadatabaseLiar, deps);

    expect(perusahaan.namadatabase).toBe("pos_tokoaman");
  });
});

describe("Nama Perusahaan yang sudah dipakai ditolak", () => {
  it('pendaftaran "sumber makmur" saat pos_sumbermakmur sudah ada ditolak dengan pesan bahwa Nama Perusahaan sudah dipakai, tanpa menambah baris atau memanggil buatDatabase', async () => {
    const pertama = await createUser();
    await daftarPerusahaan(prisma, inputFor(pertama, "Sumber Makmur"), buatDeps());

    const kedua = await createUser();
    const deps = buatDeps();

    await expect(daftarPerusahaan(prisma, inputFor(kedua, "sumber makmur"), deps)).rejects.toThrow(
      NamaPerusahaanSudahDipakaiError,
    );

    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);
    expect(deps.buatDatabase).not.toHaveBeenCalled();
  });
});

describe("Perusahaan dan Keanggotaan Owner tersimpan bersama", () => {
  it("pendaftaran yang berhasil meninggalkan satu baris perusahaan dan satu baris userperusahaan dengan isowner true", async () => {
    const iduser = await createUser();
    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Owner"), buatDeps());

    const memberships = await prisma.userperusahaan.findMany({ where: { idperusahaan: perusahaan.idperusahaan } });
    expect(memberships).toHaveLength(1);
    expect(memberships[0]).toMatchObject({ iduser, isowner: true });
  });

  it("kegagalan saat menulis Keanggotaan membatalkan baris perusahaan juga, sehingga tidak ada Perusahaan yang tidak dimiliki siapa pun", async () => {
    const idUserTidakAda = "user-tidak-terdaftar";

    await expect(daftarPerusahaan(prisma, inputFor(idUserTidakAda, "Toko Yatim"), buatDeps())).rejects.toThrow();

    expect(await prisma.perusahaan.count()).toBe(0);
  });
});

describe("Perusahaan baru belum bayar", () => {
  it("Perusahaan yang baru berdiri memiliki status 0 dan belum memiliki baris subscription sama sekali", async () => {
    const iduser = await createUser();
    const perusahaan = await daftarPerusahaan(prisma, inputFor(iduser, "Toko Belum Bayar"), buatDeps());

    expect(perusahaan.status).toBe(0);
    expect(await prisma.subscription.count({ where: { idperusahaan: perusahaan.idperusahaan } })).toBe(0);
  });
});

describe("Provisioning dipanggil dengan nama database turunan", () => {
  it("pendaftaran Sumber Makmur yang berhasil memanggil buatDatabase tepat sekali dengan nama pos_sumbermakmur", async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    await daftarPerusahaan(prisma, inputFor(iduser, "Sumber Makmur"), deps);

    expect(deps.buatDatabase).toHaveBeenCalledTimes(1);
    expect(deps.buatDatabase).toHaveBeenCalledWith("pos_sumbermakmur");
  });

  it("dua Perusahaan dengan nama berbeda menghasilkan dua pemanggilan dengan nama database masing-masing", async () => {
    const depsA = buatDeps();
    const depsB = buatDeps();

    await daftarPerusahaan(prisma, inputFor(await createUser(), "Toko Alpha"), depsA);
    await daftarPerusahaan(prisma, inputFor(await createUser(), "Toko Beta"), depsB);

    expect(depsA.buatDatabase).toHaveBeenCalledWith("pos_tokoalpha");
    expect(depsB.buatDatabase).toHaveBeenCalledWith("pos_tokobeta");
  });
});

describe("Pendaftaran kedua oleh Pengguna yang sama ditolak", () => {
  it("Pengguna yang sudah memiliki Keanggotaan dan mengirim form pendaftaran lagi (Perusahaan berbeda) ditolak, tanpa baris atau buatDatabase baru", async () => {
    const iduser = await createUser();
    await daftarPerusahaan(prisma, inputFor(iduser, "Toko Pertamanya"), buatDeps());

    const deps = buatDeps();
    await expect(daftarPerusahaan(prisma, inputFor(iduser, "Toko Keduanya"), deps)).rejects.toThrow(
      SudahMemilikiPerusahaanError,
    );

    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);
    expect(deps.buatDatabase).not.toHaveBeenCalled();
  });
});

describe("Kegagalan pembuatan database dapat diulang", () => {
  it("buatDatabase yang gagal membuat pendaftaran berakhir dengan pesan yang menyebut Perusahaan mana yang gagal disiapkan, baris tetap ada, dan mengulang memakai baris yang sama berhasil tanpa baris kedua", async () => {
    const iduser = await createUser();
    const namaperusahaan = "Toko Diulang";
    const depsGagal = buatDeps(async () => {
      throw new Error("MariaDB sedang padam (simulasi)");
    });

    await expect(daftarPerusahaan(prisma, inputFor(iduser, namaperusahaan), depsGagal)).rejects.toThrow(
      ProvisioningGagalError,
    );
    await expect(daftarPerusahaan(prisma, inputFor(iduser, namaperusahaan), depsGagal)).rejects.toThrow(
      new RegExp(namaperusahaan),
    );

    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);

    const depsUlang = buatDeps();
    const hasil = await daftarPerusahaan(prisma, inputFor(iduser, namaperusahaan), depsUlang);

    expect(depsUlang.buatDatabase).toHaveBeenCalledWith(hasil.namadatabase);
    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);
  });

  it("dua pengiriman form bersamaan dari Pengguna yang sama berakhir dengan satu Perusahaan, bukan dua", async () => {
    const iduser = await createUser();
    const deps = buatDeps();

    const [a, b] = await Promise.all([
      daftarPerusahaan(prisma, inputFor(iduser, "Toko Bersamaan"), deps),
      daftarPerusahaan(prisma, inputFor(iduser, "Toko Bersamaan"), deps),
    ]);

    expect(a.idperusahaan).toBe(b.idperusahaan);
    expect(await prisma.perusahaan.count()).toBe(1);
    expect(await prisma.userperusahaan.count()).toBe(1);
  });
});
