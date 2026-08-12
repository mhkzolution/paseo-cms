-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `userName` VARCHAR(191) NULL,
    `userRole` ENUM('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'MARKETING', 'VIEWER') NULL,
    `action` ENUM('CREATE', 'UPDATE', 'DELETE', 'RESTORE', 'PUBLISH', 'UNPUBLISH', 'LOGIN', 'LOGOUT') NOT NULL,
    `module` ENUM('AUTH', 'POSTS', 'EVENTS', 'PROMOTIONS', 'PAGES', 'SETTINGS', 'LOCALIZATION', 'MEDIA', 'USERS') NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'INFO',
    `entityId` VARCHAR(191) NULL,
    `entityType` VARCHAR(191) NULL,
    `entityName` VARCHAR(191) NULL,
    `entitySlug` VARCHAR(191) NULL,
    `changes` JSON NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_userId_idx`(`userId`),
    INDEX `audit_logs_module_idx`(`module`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_severity_idx`(`severity`),
    INDEX `audit_logs_createdAt_idx`(`createdAt`),
    INDEX `audit_logs_module_createdAt_idx`(`module`, `createdAt`),
    INDEX `audit_logs_action_createdAt_idx`(`action`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
