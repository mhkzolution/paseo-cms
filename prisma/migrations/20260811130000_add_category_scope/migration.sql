-- Add scope to distinguish store categories from post categories.
ALTER TABLE `categories`
  ADD COLUMN `scope` ENUM('STORE', 'POST') NOT NULL DEFAULT 'STORE' AFTER `slug`;

CREATE INDEX `categories_scope_sortOrder_idx` ON `categories`(`scope`, `sortOrder`);
