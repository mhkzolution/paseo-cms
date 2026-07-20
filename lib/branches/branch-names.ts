type BranchNameFields = {
  name?: string | null;
  nameTh?: string | null;
  nameEn?: string | null;
};

export function getBranchEnglishName(branch: BranchNameFields) {
  return branch.nameEn?.trim() || branch.name?.trim() || "";
}

export function getBranchThaiName(branch: BranchNameFields) {
  return branch.nameTh?.trim() || branch.name?.trim() || "";
}

export function getBranchAdminLabel(branch: BranchNameFields) {
  const th = getBranchThaiName(branch);
  const en = getBranchEnglishName(branch);
  if (th && en && th !== en) return `${th} / ${en}`;
  return th || en || branch.name || "";
}

export function toBranchPersistence<T extends { nameTh: string; nameEn: string }>(input: T) {
  return {
    ...input,
    name: input.nameEn,
  };
}
