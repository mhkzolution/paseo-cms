type LocalizedNameFields = {
  name?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
};

export function getStoreFloorThaiName(floor: LocalizedNameFields) {
  return floor.nameTh?.trim() || floor.name?.trim() || "";
}

export function getStoreFloorEnglishName(floor: LocalizedNameFields) {
  return floor.nameEn?.trim() || floor.name?.trim() || "";
}

export function getStoreFloorLabel(floor: LocalizedNameFields) {
  const th = getStoreFloorThaiName(floor);
  const en = getStoreFloorEnglishName(floor);
  if (th && en && th !== en) return `${th} / ${en}`;
  return th || en || floor.name || "";
}

export function getStoreZoneThaiName(zone: LocalizedNameFields) {
  return zone.nameTh?.trim() || zone.name?.trim() || "";
}

export function getStoreZoneEnglishName(zone: LocalizedNameFields) {
  return zone.nameEn?.trim() || zone.name?.trim() || "";
}

export function getStoreZoneLabel(zone: LocalizedNameFields) {
  const th = getStoreZoneThaiName(zone);
  const en = getStoreZoneEnglishName(zone);
  if (th && en && th !== en) return `${th} / ${en}`;
  return th || en || zone.name || "";
}

export function getStoreLocationThaiName(location: LocalizedNameFields) {
  return location.nameTh?.trim() || location.name?.trim() || "";
}

export function getStoreLocationEnglishName(location: LocalizedNameFields) {
  return location.nameEn?.trim() || location.name?.trim() || "";
}

export function getStoreLocationLabel(location: LocalizedNameFields) {
  const th = getStoreLocationThaiName(location);
  const en = getStoreLocationEnglishName(location);
  if (th && en && th !== en) return `${th} / ${en}`;
  return th || en || location.name || "";
}

function toLocalizedPersistence<T extends { nameTh: string; nameEn?: string | null }>(input: T) {
  const nameTh = input.nameTh.trim();
  const nameEn = input.nameEn?.trim() || nameTh;

  return {
    ...input,
    name: nameEn,
    nameTh,
    nameEn,
  };
}

export function toStoreFloorPersistence<T extends { nameTh: string; nameEn?: string | null }>(input: T) {
  return toLocalizedPersistence(input);
}

export function toStoreZonePersistence<T extends { nameTh: string; nameEn?: string | null }>(input: T) {
  return toLocalizedPersistence(input);
}

export function toStoreLocationPersistence<T extends { nameTh: string; nameEn?: string | null }>(input: T) {
  return toLocalizedPersistence(input);
}
