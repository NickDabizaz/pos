-- CreateTable
CREATE TABLE `barang` (
    `idbarang` INTEGER NOT NULL AUTO_INCREMENT,
    `kodebarang` VARCHAR(20) NOT NULL,
    `namabarang` VARCHAR(100) NOT NULL,
    `barcode` VARCHAR(50) NULL,
    `satuan` VARCHAR(20) NOT NULL,
    `hargabeli` DECIMAL(14, 2) NOT NULL,
    `hargajual` DECIMAL(14, 2) NOT NULL,
    `pakaistok` BOOLEAN NOT NULL DEFAULT false,
    `status` SMALLINT NOT NULL DEFAULT 1,

    UNIQUE INDEX `barang_kodebarang_key`(`kodebarang`),
    PRIMARY KEY (`idbarang`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beli` (
    `idbeli` INTEGER NOT NULL AUTO_INCREMENT,
    `kodebeli` VARCHAR(30) NOT NULL,
    `tgltrans` DATE NOT NULL,
    `idsupplier` INTEGER NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `diskon` DECIMAL(14, 2) NOT NULL,
    `ppn` DECIMAL(14, 2) NOT NULL,
    `grandtotal` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(1) NOT NULL DEFAULT 'S',
    `alasanbatal` VARCHAR(255) NULL,

    UNIQUE INDEX `beli_kodebeli_key`(`kodebeli`),
    INDEX `idsupplier`(`idsupplier`),
    INDEX `idlokasi`(`idlokasi`),
    PRIMARY KEY (`idbeli`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `belidtl` (
    `idbeli` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `idbarang` INTEGER NOT NULL,
    `qty` DECIMAL(14, 2) NOT NULL,
    `harga` DECIMAL(14, 2) NOT NULL,
    `pakaippn` VARCHAR(10) NOT NULL,
    `diskon` DECIMAL(14, 2) NOT NULL,
    `ppn` DECIMAL(14, 2) NOT NULL,
    `subtotal` DECIMAL(14, 2) NOT NULL,

    INDEX `idbarang`(`idbarang`),
    PRIMARY KEY (`idbeli`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `config` (
    `modul` VARCHAR(30) NOT NULL,
    `config` VARCHAR(30) NOT NULL,
    `nilai` VARCHAR(255) NOT NULL,

    PRIMARY KEY (`modul`, `config`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `customer` (
    `idcustomer` INTEGER NOT NULL AUTO_INCREMENT,
    `kodecustomer` VARCHAR(20) NOT NULL,
    `namacustomer` VARCHAR(100) NOT NULL,
    `telepon` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `alamat` VARCHAR(255) NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,

    UNIQUE INDEX `customer_kodecustomer_key`(`kodecustomer`),
    PRIMARY KEY (`idcustomer`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jual` (
    `idjual` INTEGER NOT NULL AUTO_INCREMENT,
    `kodejual` VARCHAR(30) NOT NULL,
    `tgltrans` DATE NOT NULL,
    `jenistransaksi` VARCHAR(10) NOT NULL,
    `idcustomer` INTEGER NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `total` DECIMAL(14, 2) NOT NULL,
    `diskon` DECIMAL(14, 2) NOT NULL,
    `ppn` DECIMAL(14, 2) NOT NULL,
    `grandtotal` DECIMAL(14, 2) NOT NULL,
    `status` VARCHAR(1) NOT NULL DEFAULT 'S',
    `alasanbatal` VARCHAR(255) NULL,

    UNIQUE INDEX `jual_kodejual_key`(`kodejual`),
    INDEX `idcustomer`(`idcustomer`),
    INDEX `idlokasi`(`idlokasi`),
    PRIMARY KEY (`idjual`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jualdtl` (
    `idjual` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `idbarang` INTEGER NOT NULL,
    `qty` DECIMAL(14, 2) NOT NULL,
    `harga` DECIMAL(14, 2) NOT NULL,
    `pakaippn` VARCHAR(10) NOT NULL,
    `diskon` DECIMAL(14, 2) NOT NULL,
    `ppn` DECIMAL(14, 2) NOT NULL,
    `subtotal` DECIMAL(14, 2) NOT NULL,

    INDEX `idbarang`(`idbarang`),
    PRIMARY KEY (`idjual`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `jurnal` (
    `jenistransaksi` VARCHAR(15) NOT NULL,
    `idtrans` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `kodetrans` VARCHAR(30) NOT NULL,
    `tgltrans` DATE NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `saldo` VARCHAR(6) NOT NULL,
    `amount` DECIMAL(14, 2) NOT NULL,
    `catatan` VARCHAR(255) NOT NULL,

    INDEX `jurnal_tgltrans_idx`(`tgltrans`),
    PRIMARY KEY (`jenistransaksi`, `idtrans`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kartustok` (
    `jenistransaksi` VARCHAR(15) NOT NULL,
    `idtrans` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `kodetrans` VARCHAR(30) NOT NULL,
    `tgltrans` DATE NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `idbarang` INTEGER NOT NULL,
    `jml` DECIMAL(14, 2) NOT NULL,
    `mk` VARCHAR(1) NOT NULL,
    `catatan` VARCHAR(255) NOT NULL,

    INDEX `idbarang`(`idbarang`),
    INDEX `kartustok_idbarang_idlokasi_tgltrans_idx`(`idbarang`, `idlokasi`, `tgltrans`),
    PRIMARY KEY (`jenistransaksi`, `idtrans`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bayar` (
    `idbayar` INTEGER NOT NULL AUTO_INCREMENT,
    `idjual` INTEGER NOT NULL,
    `tunai` DECIMAL(14, 2) NOT NULL,
    `nontunai` DECIMAL(14, 2) NOT NULL,
    `kembalian` DECIMAL(14, 2) NOT NULL,

    INDEX `idjual`(`idjual`),
    PRIMARY KEY (`idbayar`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kas` (
    `idkas` INTEGER NOT NULL AUTO_INCREMENT,
    `kodekas` VARCHAR(30) NOT NULL,
    `tgltrans` DATE NOT NULL,
    `jenis` VARCHAR(10) NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `grandtotal` DECIMAL(14, 2) NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `status` VARCHAR(1) NOT NULL DEFAULT 'S',
    `alasanbatal` VARCHAR(255) NULL,

    UNIQUE INDEX `kas_kodekas_key`(`kodekas`),
    INDEX `idlokasi`(`idlokasi`),
    PRIMARY KEY (`idkas`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kasdtl` (
    `idkas` INTEGER NOT NULL,
    `urutan` INTEGER NOT NULL,
    `keterangan` VARCHAR(255) NOT NULL,
    `nominal` DECIMAL(14, 2) NOT NULL,

    PRIMARY KEY (`idkas`, `urutan`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lokasi` (
    `idlokasi` INTEGER NOT NULL AUTO_INCREMENT,
    `kodelokasi` VARCHAR(20) NOT NULL,
    `namalokasi` VARCHAR(100) NOT NULL,
    `keterangan` VARCHAR(255) NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,

    UNIQUE INDEX `lokasi_kodelokasi_key`(`kodelokasi`),
    PRIMARY KEY (`idlokasi`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `modalawal` (
    `idmodalawal` INTEGER NOT NULL AUTO_INCREMENT,
    `tgltrans` DATE NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `idkasir` VARCHAR(36) NOT NULL,
    `nominal` DECIMAL(14, 2) NOT NULL,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tgltrans_idlokasi`(`tgltrans`, `idlokasi`),
    PRIMARY KEY (`idmodalawal`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `setorankasir` (
    `idsetorankasir` INTEGER NOT NULL AUTO_INCREMENT,
    `tgltrans` DATE NOT NULL,
    `idlokasi` INTEGER NOT NULL,
    `totaltunai` DECIMAL(14, 2) NOT NULL,
    `totalnontunai` DECIMAL(14, 2) NOT NULL,
    `kasaktual` DECIMAL(14, 2) NOT NULL,
    `selisih` DECIMAL(14, 2) NOT NULL,
    `catatan` VARCHAR(255) NULL,
    `createdat` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tgltrans_idlokasi`(`tgltrans`, `idlokasi`),
    PRIMARY KEY (`idsetorankasir`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `supplier` (
    `idsupplier` INTEGER NOT NULL AUTO_INCREMENT,
    `kodesupplier` VARCHAR(20) NOT NULL,
    `namasupplier` VARCHAR(100) NOT NULL,
    `kontakperson` VARCHAR(100) NULL,
    `telepon` VARCHAR(20) NULL,
    `email` VARCHAR(100) NULL,
    `alamat` VARCHAR(255) NULL,
    `status` SMALLINT NOT NULL DEFAULT 1,

    UNIQUE INDEX `supplier_kodesupplier_key`(`kodesupplier`),
    PRIMARY KEY (`idsupplier`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `beli` ADD CONSTRAINT `beli_idsupplier_fkey` FOREIGN KEY (`idsupplier`) REFERENCES `supplier`(`idsupplier`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `beli` ADD CONSTRAINT `beli_idlokasi_fkey` FOREIGN KEY (`idlokasi`) REFERENCES `lokasi`(`idlokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `belidtl` ADD CONSTRAINT `belidtl_idbeli_fkey` FOREIGN KEY (`idbeli`) REFERENCES `beli`(`idbeli`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `belidtl` ADD CONSTRAINT `belidtl_idbarang_fkey` FOREIGN KEY (`idbarang`) REFERENCES `barang`(`idbarang`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jual` ADD CONSTRAINT `jual_idcustomer_fkey` FOREIGN KEY (`idcustomer`) REFERENCES `customer`(`idcustomer`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jual` ADD CONSTRAINT `jual_idlokasi_fkey` FOREIGN KEY (`idlokasi`) REFERENCES `lokasi`(`idlokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jualdtl` ADD CONSTRAINT `jualdtl_idjual_fkey` FOREIGN KEY (`idjual`) REFERENCES `jual`(`idjual`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `jualdtl` ADD CONSTRAINT `jualdtl_idbarang_fkey` FOREIGN KEY (`idbarang`) REFERENCES `barang`(`idbarang`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bayar` ADD CONSTRAINT `bayar_idjual_fkey` FOREIGN KEY (`idjual`) REFERENCES `jual`(`idjual`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kas` ADD CONSTRAINT `kas_idlokasi_fkey` FOREIGN KEY (`idlokasi`) REFERENCES `lokasi`(`idlokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kasdtl` ADD CONSTRAINT `kasdtl_idkas_fkey` FOREIGN KEY (`idkas`) REFERENCES `kas`(`idkas`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kartustok` ADD CONSTRAINT `kartustok_idbarang_fkey` FOREIGN KEY (`idbarang`) REFERENCES `barang`(`idbarang`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `modalawal` ADD CONSTRAINT `modalawal_idlokasi_fkey` FOREIGN KEY (`idlokasi`) REFERENCES `lokasi`(`idlokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `setorankasir` ADD CONSTRAINT `setorankasir_idlokasi_fkey` FOREIGN KEY (`idlokasi`) REFERENCES `lokasi`(`idlokasi`) ON DELETE RESTRICT ON UPDATE CASCADE;
