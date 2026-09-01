-- CreateTable
CREATE TABLE `thepaseolife_posts` (
    `id` VARCHAR(191) NOT NULL,
    `image` VARCHAR(1024) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `linkUrl` VARCHAR(2048) NOT NULL,
    `openInNewTab` BOOLEAN NOT NULL DEFAULT false,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `deletedAt` DATETIME(3) NULL,

    INDEX `thepaseolife_posts_isActive_sortOrder_idx`(`isActive`, `sortOrder`),
    INDEX `thepaseolife_posts_deletedAt_isActive_idx`(`deletedAt`, `isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
