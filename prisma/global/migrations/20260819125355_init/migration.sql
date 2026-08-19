-- CreateTable
CREATE TABLE `user` (
    `id` VARCHAR(191) NOT NULL,
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
    `userId` VARCHAR(191) NOT NULL,

    INDEX `session_userId_idx`(`userId`),
    UNIQUE INDEX `session_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `account` (
    `id` VARCHAR(191) NOT NULL,
    `accountId` TEXT NOT NULL,
    `providerId` TEXT NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `idToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` TEXT NULL,
    `password` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `account_userId_idx`(`userId`),
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
    `namapaket` VARCHAR(100) NOT NULL,
    `hargapaket` DECIMAL(14, 2) NOT NULL,
    `masaberlakuhari` INTEGER NOT NULL,
    `tglmulai` DATE NOT NULL,
    `tglselesai` DATE NOT NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

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

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `account` ADD CONSTRAINT `account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscription` ADD CONSTRAINT `subscription_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `subscriptiondtl` ADD CONSTRAINT `subscriptiondtl_idsubscription_fkey` FOREIGN KEY (`idsubscription`) REFERENCES `subscription`(`idsubscription`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenu` ADD CONSTRAINT `usermenu_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usermenu` ADD CONSTRAINT `usermenu_kodemenu_fkey` FOREIGN KEY (`kodemenu`) REFERENCES `menu`(`kodemenu`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `userperusahaan` ADD CONSTRAINT `userperusahaan_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE RESTRICT ON UPDATE CASCADE;
