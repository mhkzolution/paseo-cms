-- CreateTable
CREATE TABLE `localization_settings` (
    `id` VARCHAR(191) NOT NULL,
    `defaultLanguage` VARCHAR(191) NOT NULL DEFAULT 'th',
    `supportedLanguages` JSON NOT NULL,
    `dateLocale` VARCHAR(191) NOT NULL DEFAULT 'th-TH',
    `timeLocale` VARCHAR(191) NOT NULL DEFAULT 'th-TH',
    `numberLocale` VARCHAR(191) NOT NULL DEFAULT 'th-TH',
    `calendarSystem` VARCHAR(191) NOT NULL DEFAULT 'buddhist',
    `weekStartsOn` VARCHAR(191) NOT NULL DEFAULT 'monday',
    `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Bangkok',
    `dateFormat` VARCHAR(191) NOT NULL DEFAULT 'DD/MM/YYYY',
    `timeFormat` VARCHAR(191) NOT NULL DEFAULT '24h',
    `currency` VARCHAR(191) NOT NULL DEFAULT 'THB',
    `currencyPosition` VARCHAR(191) NOT NULL DEFAULT 'before',
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
