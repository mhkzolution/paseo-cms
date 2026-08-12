/** Truncate display text with a spaced ellipsis when over max length. */
export function truncateDirectoryText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trimEnd()} ...`;
}

export const DIRECTORY_NAME_MAX = 100;
export const DIRECTORY_CATEGORY_MAX = 20;
export const DIRECTORY_TIME_MAX = 20;
