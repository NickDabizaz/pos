-- AlterTable
ALTER TABLE `session` ADD COLUMN `idperusahaan` INTEGER NULL;

-- CreateIndex
CREATE INDEX `session_idperusahaan_idx` ON `session`(`idperusahaan`);

-- AddForeignKey
ALTER TABLE `session` ADD CONSTRAINT `session_idperusahaan_fkey` FOREIGN KEY (`idperusahaan`) REFERENCES `perusahaan`(`idperusahaan`) ON DELETE SET NULL ON UPDATE CASCADE;
