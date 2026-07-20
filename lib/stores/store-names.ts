type StoreNameFields = {
  name?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
};

export function getStoreEnglishName(store: StoreNameFields) {
  return store.nameEn?.trim() || store.name?.trim() || "";
}

export function getStoreThaiName(store: StoreNameFields) {
  return store.nameTh?.trim() || store.name?.trim() || "";
}

export function getStoreAdminLabel(store: StoreNameFields) {
  const th = getStoreThaiName(store);
  const en = getStoreEnglishName(store);
  if (th && en && th !== en) return `${th} / ${en}`;
  return th || en || store.name || "";
}

export function toStorePersistence<T extends { nameTh: string; nameEn: string }>(input: T) {
  return {
    ...input,
    name: input.nameEn,
  };
}
