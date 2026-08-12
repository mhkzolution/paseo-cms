-- Add SEO to the audit module enum.
ALTER TABLE `audit_logs`
  MODIFY `module` ENUM('AUTH', 'POSTS', 'EVENTS', 'PROMOTIONS', 'PAGES', 'SETTINGS', 'LOCALIZATION', 'SEO', 'MEDIA', 'USERS') NOT NULL;
