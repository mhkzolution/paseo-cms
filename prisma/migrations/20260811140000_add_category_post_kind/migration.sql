-- Link post categories to archive grouping (PostKind).
ALTER TABLE `categories`
  ADD COLUMN `postKind` ENUM('NEWS', 'PUBLIC_RELATIONS', 'CENTER_UPDATE', 'ARTICLE') NULL AFTER `scope`;
