-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(36) NOT NULL,
    `name` TEXT NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `image` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `session` (
    `id` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `ipAddress` TEXT NULL,
    `userAgent` TEXT NULL,
    `iduser` VARCHAR(36) NOT NULL,

    INDEX `session_iduser_idx`(`iduser`),
    UNIQUE INDEX `session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `issuer` VARCHAR(191) NOT NULL,
    `accountId` TEXT NOT NULL,
    `providerId` TEXT NOT NULL,
    `iduser` VARCHAR(36) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `account_issuer_accountId_key`(`issuer`, `accountId`(191)),
    INDEX `account_iduser_idx`(`iduser`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` TEXT NOT NULL,
    `value` TEXT NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `verification_identifier_idx`(`identifier`(191)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `menu` (
    `kodemenu` VARCHAR(10) NOT NULL,
    `kodeinduk` VARCHAR(10) NULL,
    `namamenu` VARCHAR(100) NOT NULL,
    `jenis` VARCHAR(10) NOT NULL,
    `urutan` VARCHAR(20) NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,

    INDEX `kodeinduk`(`kodeinduk`),
    PRIMARY KEY (`kodemenu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- SeedData
INSERT INTO `menu` (`kodemenu`, `kodeinduk`, `namamenu`, `jenis`, `urutan`, `status`) VALUES
    ('KASIR-POS', NULL,    'Kasir POS',   'DETAIL', '1', 1),
    ('MDATA',     NULL,    'Master Data', 'HEADER', '2', 1),
    ('MDATA-BRG', 'MDATA', 'Barang',      'DETAIL', '2.1', 1),
    ('MDATA-CUS', 'MDATA', 'Customer',    'DETAIL', '2.2', 1),
    ('MDATA-SUP', 'MDATA', 'Supplier',    'DETAIL', '2.3', 1),
    ('MDATA-LOK', 'MDATA', 'Lokasi',      'DETAIL', '2.4', 1),
    ('TRANS',     NULL,    'Transaksi',   'HEADER', '3', 1),
    ('TRANS-JUL', 'TRANS', 'Penjualan',   'DETAIL', '3.1', 1),
    ('TRANS-BEL', 'TRANS', 'Pembelian',   'DETAIL', '3.2', 1),
    ('TRANS-KAS', 'TRANS', 'Kas',         'DETAIL', '3.3', 1),
    ('KASIR-TTP', NULL,    'Tutup Kasir', 'DETAIL', '4', 1),
    ('LANGGANAN', NULL,    'Subscription',   'DETAIL', '5', 1),
    ('PENGGUNA',  NULL,    'Manajemen User', 'DETAIL', '6', 1);

-- CreateTable
CREATE TABLE `perusahaan` (
    `idperusahaan` INTEGER NOT NULL AUTO_INCREMENT,
    `kodeperusahaan` VARCHAR(20) NOT NULL,
    `namaperusahaan` VARCHAR(100) NOT NULL,
    `namadatabase` VARCHAR(64) NOT NULL,
    `status` SMALLINT NOT NULL DEFAULT 0,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `perusahaan_kodeperusahaan_key`(`kodeperusahaan`),
    UNIQUE INDEX `perusahaan_namadatabase_key`(`namadatabase`),
    PRIMARY KEY (`idperusahaan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscription` (
    `idsubscription` INTEGER NOT NULL AUTO_INCREMENT,
    `idperusahaan` INTEGER NOT NULL,
    `orderid` VARCHAR(100) NOT NULL,
    `namapaket` VARCHAR(100) NOT NULL,
    `hargapaket` DECIMAL(14, 2) NOT NULL,
    `masaberlakuhari` INTEGER NOT NULL,
    `tglmulai` DATE NOT NULL,
    `tglselesai` DATE NOT NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `subscription_orderid_key`(`orderid`),
    INDEX `idperusahaan`(`idperusahaan`),
    PRIMARY KEY (`idsubscription`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subscriptiondtl` (
    `idsubscription` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `keterangan` VARCHAR(100) NOT NULL,
    `nominal` DECIMAL(14, 2) NOT NULL,

    PRIMARY KEY (`idsubscription`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usermenu` (
    `iduser` VARCHAR(36) NOT NULL,
    `idperusahaan` INTEGER NOT NULL,
    `kodemenu` VARCHAR(10) NOT NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,

    INDEX `kodemenu`(`kodemenu`),
    PRIMARY KEY (`iduser`, `idperusahaan`, `kodemenu`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `userperusahaan` (
    `iduser` VARCHAR(36) NOT NULL,
    `idperusahaan` INTEGER NOT NULL,
    `isowner` BOOLEAN NOT NULL DEFAULT false,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`iduser`, `idperusahaan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitationperusahaan` (
    `token` VARCHAR(64) NOT NULL,
    `idperusahaan` INTEGER NOT NULL,
    `expiresat` DATETIME(3) NOT NULL,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `invitationperusahaan_idperusahaan_key`(`idperusahaan`),
    PRIMARY KEY (`token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_iduser_fkey` FOREIGN KEY (`iduser`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_iduser_fkey` FOREIGN KEY (`iduser`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptiondtl` ADD CONSTRAINT `subscriptiondtl_idsubscription_fkey` FOREIGN KEY (`idsubscription`) REFERENCES `subscription`(`idsubscription`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenu` ADD CONSTRAINT `usermenu_iduser_fkey` FOREIGN KEY (`iduser`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenu` ADD CONSTRAINT `usermenu_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenu` ADD CONSTRAINT `usermenu_kodemenu_fkey` FOREIGN KEY (`kodemenu`) REFERENCES `menu`(`kodemenu`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userperusahaan` ADD CONSTRAINT `userperusahaan_iduser_fkey` FOREIGN KEY (`iduser`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userperusahaan` ADD CONSTRAINT `userperusahaan_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitationperusahaan` ADD CONSTRAINT `invitationperusahaan_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE CASCADE ON UPDATE CASCADE;
