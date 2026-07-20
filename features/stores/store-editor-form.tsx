"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Resolver } from "react-hook-form";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import { OperatingHoursField } from "@/features/stores/operating-hours-field";
import { createDefaultOperatingHours } from "@/lib/stores/operating-hours";
import type {
  StoreFloorOption,
  StoreLocationOption,
  StoreZoneOption,
} from "@/lib/store-zones/queries";
import { storeSchema } from "@/validators/content.validator";

type StoreFormValues = z.input<typeof storeSchema>;

interface StoreEditorFormProps {
  mode: "create" | "edit";
  endpoint: string;
  returnHref: string;
  submitLabel: string;
  defaultValues: StoreFormValues;
  defaultFloorId?: string;
  branches: { id: string; label: string }[];
  categories: { id: string; label: string }[];
  floorsByBranch: Record<string, StoreFloorOption[]>;
  zonesByFloor: Record<string, StoreZoneOption[]>;
  locationsByZone: Record<string, StoreLocationOption[]>;
}

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

export function StoreEditorForm({
  mode,
  endpoint,
  returnHref,
  submitLabel,
  defaultValues,
  defaultFloorId = "",
  branches,
  categories,
  floorsByBranch,
  zonesByFloor,
  locationsByZone,
}: StoreEditorFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [floorId, setFloorId] = useState(defaultFloorId);
  const resolver = zodResolver(storeSchema) as Resolver<StoreFormValues>;

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<StoreFormValues>({
    resolver,
    defaultValues: {
      ...defaultValues,
      operatingHours: defaultValues.operatingHours ?? createDefaultOperatingHours(),
    },
  });

  const branchId = watch("branchId") ?? "";
  const zoneId = (watch("zoneId") as string | null | undefined) ?? "";
  const locationId = (watch("locationId") as string | null | undefined) ?? "";

  const availableFloors = useMemo(() => floorsByBranch[branchId] ?? [], [branchId, floorsByBranch]);
  const availableZones = useMemo(() => (floorId ? zonesByFloor[floorId] ?? [] : []), [floorId, zonesByFloor]);
  const availableLocations = useMemo(
    () => (zoneId ? locationsByZone[zoneId] ?? [] : []),
    [zoneId, locationsByZone],
  );

  useEffect(() => {
    if (!floorId) return;
    if (!availableFloors.some((floor) => floor.id === floorId)) {
      setFloorId("");
      setValue("zoneId", "");
      setValue("locationId", "");
    }
  }, [availableFloors, floorId, setValue]);

  useEffect(() => {
    if (!zoneId) return;
    if (!availableZones.some((zone) => zone.id === zoneId)) {
      setValue("zoneId", "");
      setValue("locationId", "");
    }
  }, [availableZones, zoneId, setValue]);

  useEffect(() => {
    if (!locationId) return;
    if (!availableLocations.some((location) => location.id === locationId)) {
      setValue("locationId", "");
    }
  }, [availableLocations, locationId, setValue]);

  const onSubmit = async (values: StoreFormValues) => {
    setServerError(null);

    const response = await fetch(endpoint, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      setServerError(body?.error ?? "Something went wrong. Please try again.");
      return;
    }

    router.push(returnHref);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 md:grid-cols-2">
      <div>
        <label htmlFor="nameTh" className="text-sm font-medium text-foreground">
          ชื่อภาษาไทย
        </label>
        <input id="nameTh" type="text" className={`mt-1.5 ${inputClass}`} {...register("nameTh")} />
        {errors.nameTh?.message ? <p className="mt-1 text-sm text-destructive">{errors.nameTh.message}</p> : null}
      </div>

      <div>
        <label htmlFor="nameEn" className="text-sm font-medium text-foreground">
          ชื่อภาษาอังกฤษ
        </label>
        <input id="nameEn" type="text" className={`mt-1.5 ${inputClass}`} {...register("nameEn")} />
        {errors.nameEn?.message ? <p className="mt-1 text-sm text-destructive">{errors.nameEn.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground">โลโก้</label>
        <div className="mt-1.5">
          <Controller
            name="logo"
            control={control}
            render={({ field }) => (
              <CoverImageField value={typeof field.value === "string" ? field.value : ""} onChange={field.onChange} />
            )}
          />
        </div>
        {errors.logo?.message ? <p className="mt-1 text-sm text-destructive">{errors.logo.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground">แบนเนอร์</label>
        <div className="mt-1.5">
          <Controller
            name="cover"
            control={control}
            render={({ field }) => (
              <CoverImageField value={typeof field.value === "string" ? field.value : ""} onChange={field.onChange} />
            )}
          />
        </div>
        {errors.cover?.message ? <p className="mt-1 text-sm text-destructive">{errors.cover.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label htmlFor="description" className="text-sm font-medium text-foreground">
          รายละเอียด
        </label>
        <textarea id="description" rows={4} className={`mt-1.5 ${inputClass}`} {...register("description")} />
        {errors.description?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="phone1" className="text-sm font-medium text-foreground">
          เบอร์โทรศัพท์ 1
        </label>
        <input id="phone1" type="text" className={`mt-1.5 ${inputClass}`} {...register("phone1")} />
        {errors.phone1?.message ? <p className="mt-1 text-sm text-destructive">{errors.phone1.message}</p> : null}
      </div>

      <div>
        <label htmlFor="phone2" className="text-sm font-medium text-foreground">
          เบอร์โทรศัพท์ 2
        </label>
        <input id="phone2" type="text" className={`mt-1.5 ${inputClass}`} {...register("phone2")} />
        {errors.phone2?.message ? <p className="mt-1 text-sm text-destructive">{errors.phone2.message}</p> : null}
      </div>

      <div className="md:col-span-2">
        <label className="text-sm font-medium text-foreground">เวลาเปิดทำการ</label>
        <div className="mt-1.5">
          <Controller
            name="operatingHours"
            control={control}
            render={({ field }) => (
              <OperatingHoursField
                value={Array.isArray(field.value) ? field.value : createDefaultOperatingHours()}
                onChange={field.onChange}
                error={errors.operatingHours?.message}
              />
            )}
          />
        </div>
      </div>

      <div>
        <label htmlFor="branchId" className="text-sm font-medium text-foreground">
          สาขา
        </label>
        <select
          id="branchId"
          className={`mt-1.5 ${inputClass}`}
          {...register("branchId", {
            onChange: () => {
              setFloorId("");
              setValue("zoneId", "");
              setValue("locationId", "");
            },
          })}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.label}
            </option>
          ))}
        </select>
        {errors.branchId?.message ? <p className="mt-1 text-sm text-destructive">{errors.branchId.message}</p> : null}
      </div>

      <div>
        <label htmlFor="categoryId" className="text-sm font-medium text-foreground">
          หมวดหมู่
        </label>
        <select id="categoryId" className={`mt-1.5 ${inputClass}`} {...register("categoryId")}>
          <option value="">ไม่ระบุหมวดหมู่</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
        {errors.categoryId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.categoryId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="floorId" className="text-sm font-medium text-foreground">
          ชั้น
        </label>
        <select
          id="floorId"
          className={`mt-1.5 ${inputClass}`}
          value={floorId}
          onChange={(event) => {
            setFloorId(event.target.value);
            setValue("zoneId", "");
            setValue("locationId", "");
          }}
          disabled={!availableFloors.length}
        >
          <option value="">{availableFloors.length ? "เลือกชั้น" : "ยังไม่มีชั้นในสาขานี้"}</option>
          {availableFloors.map((floor) => (
            <option key={floor.id} value={floor.id}>
              {floor.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="zoneId" className="text-sm font-medium text-foreground">
          โซน
        </label>
        <select
          id="zoneId"
          className={`mt-1.5 ${inputClass}`}
          {...register("zoneId", {
            onChange: () => setValue("locationId", ""),
          })}
          disabled={!floorId || !availableZones.length}
        >
          <option value="">
            {!floorId
              ? "เลือกชั้นก่อน"
              : availableZones.length
                ? "ไม่ระบุโซน"
                : "ยังไม่มีโซนในชั้นนี้"}
          </option>
          {availableZones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.label}
            </option>
          ))}
        </select>
        {errors.zoneId?.message ? <p className="mt-1 text-sm text-destructive">{errors.zoneId.message}</p> : null}
      </div>

      <div>
        <label htmlFor="locationId" className="text-sm font-medium text-foreground">
          ที่ตั้ง
        </label>
        <select
          id="locationId"
          className={`mt-1.5 ${inputClass}`}
          {...register("locationId")}
          disabled={!zoneId || !availableLocations.length}
        >
          <option value="">
            {!zoneId
              ? "เลือกโซนก่อน"
              : availableLocations.length
                ? "ไม่ระบุที่ตั้ง"
                : "ยังไม่มีที่ตั้งในโซนนี้"}
          </option>
          {availableLocations.map((location: StoreLocationOption) => (
            <option key={location.id} value={location.id}>
              {location.label}
            </option>
          ))}
        </select>
        {errors.locationId?.message ? (
          <p className="mt-1 text-sm text-destructive">{errors.locationId.message}</p>
        ) : null}
      </div>

      <div>
        <label htmlFor="storeType" className="text-sm font-medium text-foreground">
          ประเภทร้าน
        </label>
        <input
          id="storeType"
          type="text"
          placeholder="เช่น ร้านอาหาร, ร้านค้าปลีก"
          className={`mt-1.5 ${inputClass}`}
          {...register("storeType")}
        />
        {errors.storeType?.message ? <p className="mt-1 text-sm text-destructive">{errors.storeType.message}</p> : null}
      </div>

      <div>
        <label htmlFor="slug" className="text-sm font-medium text-foreground">
          Slug (URL)
        </label>
        <input id="slug" type="text" placeholder="brand-name" className={`mt-1.5 ${inputClass}`} {...register("slug")} />
        {errors.slug?.message ? <p className="mt-1 text-sm text-destructive">{errors.slug.message}</p> : null}
      </div>

      {serverError ? <p className="text-sm text-destructive md:col-span-2">{serverError}</p> : null}

      <div className="md:col-span-2">
        <Button type="submit" isLoading={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
