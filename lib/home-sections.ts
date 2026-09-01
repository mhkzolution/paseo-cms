export const HOME_SECTION_IDS = [
  "events",
  "news",
  "introduction",
  "directory",
  "membership",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];

/** @deprecated Use HOME_SECTION_IDS + translations; kept for any static consumers. */
export const HOME_SECTIONS = [
  { id: "events", label: "กิจกรรมน่าสนใจ" },
  { id: "news", label: "บทความน่าสนใจ" },
  { id: "introduction", label: "Introduction" },
  { id: "directory", label: "Directory" },
  { id: "membership", label: "MEMBERSHIP PASEO LIFE" },
] as const;

export const HOME_INTRO_IMAGE = "/images/paseo-frontviewmail.jpg";

export const HOME_INTRO_PREVIEW_LENGTH = 280;
