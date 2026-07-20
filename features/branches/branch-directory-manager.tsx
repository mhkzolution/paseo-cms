"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Layers, MapPin, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CoverImageField } from "@/features/media/cover-image-field";
import {
  getStoreFloorLabel,
  getStoreLocationLabel,
  getStoreZoneLabel,
} from "@/lib/store-zones/names";

type LocationRecord = {
  id: string;
  zoneId: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  sortOrder: number;
  _count: { stores: number };
};

type ZoneRecord = {
  id: string;
  floorId: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  sortOrder: number;
  floorPlanImage: string | null;
  locations: LocationRecord[];
  _count: { stores: number };
};

type FloorRecord = {
  id: string;
  branchId: string;
  name: string;
  nameTh: string | null;
  nameEn: string | null;
  sortOrder: number;
  floorPlanImage: string | null;
  zones: ZoneRecord[];
  _count: { zones: number };
};

type BranchDirectoryManagerProps = {
  branchId: string;
  branchLabel: string;
  initialFloors: FloorRecord[];
};

const inputClass =
  "w-full rounded-md border border-border bg-surface px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-accent";

const emptyFloorForm = { nameTh: "", nameEn: "", sortOrder: 0, floorPlanImage: "" };
const emptyZoneForm = { nameTh: "", nameEn: "", sortOrder: 0, floorPlanImage: "" };
const emptyLocationForm = { nameTh: "", nameEn: "", sortOrder: 0 };

export function BranchDirectoryManager({
  branchId,
  branchLabel,
  initialFloors,
}: BranchDirectoryManagerProps) {
  const router = useRouter();
  const [floors, setFloors] = useState(initialFloors);
  const [expandedFloorId, setExpandedFloorId] = useState<string | null>(initialFloors[0]?.id ?? null);
  const [expandedZoneId, setExpandedZoneId] = useState<string | null>(null);
  const [floorForm, setFloorForm] = useState(emptyFloorForm);
  const [zoneForms, setZoneForms] = useState<Record<string, typeof emptyZoneForm>>({});
  const [locationForms, setLocationForms] = useState<Record<string, typeof emptyLocationForm>>({});
  const [editingFloorId, setEditingFloorId] = useState<string | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editingLocationId, setEditingLocationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const sortedFloors = useMemo(
    () =>
      [...floors].sort(
        (a, b) =>
          a.sortOrder - b.sortOrder || getStoreFloorLabel(a).localeCompare(getStoreFloorLabel(b), "th"),
      ),
    [floors],
  );

  const refresh = () => router.refresh();

  const handleCreateFloor = async () => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/store-floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ branchId, ...floorForm }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถสร้างชั้นได้");
        return;
      }
      const body = (await response.json()) as { floor: FloorRecord };
      setFloors((current) => [
        ...current,
        { ...body.floor, floorPlanImage: body.floor.floorPlanImage ?? null, zones: [], _count: { zones: 0 } },
      ]);
      setFloorForm(emptyFloorForm);
      setExpandedFloorId(body.floor.id);
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateFloor = async (floor: FloorRecord) => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-floors/${floor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId,
          nameTh: floor.nameTh ?? floor.name,
          nameEn: floor.nameEn ?? "",
          sortOrder: floor.sortOrder,
          floorPlanImage: floor.floorPlanImage ?? "",
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถบันทึกชั้นได้");
        return;
      }
      setEditingFloorId(null);
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteFloor = async (floor: FloorRecord) => {
    if (!window.confirm(`ลบ "${getStoreFloorLabel(floor)}" พร้อมโซนและที่ตั้งทั้งหมด?`)) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-floors/${floor.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถลบชั้นได้");
        return;
      }
      setFloors((current) => current.filter((item) => item.id !== floor.id));
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateZone = async (floorId: string) => {
    const form = zoneForms[floorId] ?? emptyZoneForm;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/store-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorId, ...form }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถสร้างโซนได้");
        return;
      }
      const body = (await response.json()) as { zone: ZoneRecord };
      setFloors((current) =>
        current.map((floor) =>
          floor.id === floorId
            ? {
                ...floor,
                zones: [...floor.zones, { ...body.zone, locations: [], _count: { stores: 0 } }],
              }
            : floor,
        ),
      );
      setZoneForms((current) => ({ ...current, [floorId]: emptyZoneForm }));
      setExpandedZoneId(body.zone.id);
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateZone = async (floorId: string, zone: ZoneRecord) => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-zones/${zone.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          floorId,
          nameTh: zone.nameTh ?? zone.name,
          nameEn: zone.nameEn ?? "",
          sortOrder: zone.sortOrder,
          floorPlanImage: zone.floorPlanImage ?? "",
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถบันทึกโซนได้");
        return;
      }
      setEditingZoneId(null);
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteZone = async (floorId: string, zone: ZoneRecord) => {
    if (!window.confirm(`ลบโซน "${getStoreZoneLabel(zone)}"?`)) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-zones/${zone.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถลบโซนได้");
        return;
      }
      setFloors((current) =>
        current.map((floor) =>
          floor.id === floorId ? { ...floor, zones: floor.zones.filter((item) => item.id !== zone.id) } : floor,
        ),
      );
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateLocation = async (floorId: string, zoneId: string) => {
    const form = locationForms[zoneId] ?? emptyLocationForm;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/store-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId, ...form }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถสร้างที่ตั้งได้");
        return;
      }
      const body = (await response.json()) as { location: LocationRecord };
      setFloors((current) =>
        current.map((floor) =>
          floor.id === floorId
            ? {
                ...floor,
                zones: floor.zones.map((zone) =>
                  zone.id === zoneId
                    ? {
                        ...zone,
                        locations: [
                          ...zone.locations,
                          { ...body.location, _count: body.location._count ?? { stores: 0 } },
                        ],
                      }
                    : zone,
                ),
              }
            : floor,
        ),
      );
      setLocationForms((current) => ({ ...current, [zoneId]: emptyLocationForm }));
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateLocation = async (floorId: string, zoneId: string, location: LocationRecord) => {
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-locations/${location.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zoneId,
          nameTh: location.nameTh ?? location.name,
          nameEn: location.nameEn ?? "",
          sortOrder: location.sortOrder,
        }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถบันทึกที่ตั้งได้");
        return;
      }
      setEditingLocationId(null);
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteLocation = async (floorId: string, zoneId: string, location: LocationRecord) => {
    if (!window.confirm(`ลบที่ตั้ง "${getStoreLocationLabel(location)}"?`)) return;
    setError(null);
    setIsSaving(true);
    try {
      const response = await fetch(`/api/store-locations/${location.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "ไม่สามารถลบที่ตั้งได้");
        return;
      }
      setFloors((current) =>
        current.map((floor) =>
          floor.id === floorId
            ? {
                ...floor,
                zones: floor.zones.map((zone) =>
                  zone.id === zoneId
                    ? { ...zone, locations: zone.locations.filter((item) => item.id !== location.id) }
                    : zone,
                ),
              }
            : floor,
        ),
      );
      refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const updateFloorField = (floorId: string, field: keyof FloorRecord, value: string | number) => {
    setFloors((current) => current.map((floor) => (floor.id === floorId ? { ...floor, [field]: value } : floor)));
  };

  const updateZoneField = (floorId: string, zoneId: string, field: keyof ZoneRecord, value: string | number) => {
    setFloors((current) =>
      current.map((floor) =>
        floor.id === floorId
          ? {
              ...floor,
              zones: floor.zones.map((zone) => (zone.id === zoneId ? { ...zone, [field]: value } : zone)),
            }
          : floor,
      ),
    );
  };

  const updateLocationField = (
    floorId: string,
    zoneId: string,
    locationId: string,
    field: keyof LocationRecord,
    value: string | number,
  ) => {
    setFloors((current) =>
      current.map((floor) =>
        floor.id === floorId
          ? {
              ...floor,
              zones: floor.zones.map((zone) =>
                zone.id === zoneId
                  ? {
                      ...zone,
                      locations: zone.locations.map((location) =>
                        location.id === locationId ? { ...location, [field]: value } : location,
                      ),
                    }
                  : zone,
              ),
            }
          : floor,
      ),
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">เพิ่มชั้นใหม่</h2>
        <p className="mt-1 text-sm text-muted">กำหนดชั้นของ {branchLabel} เช่น ชั้น 1, ชั้น 2</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <input
            type="text"
            className={inputClass}
            value={floorForm.nameTh}
            onChange={(event) => setFloorForm((current) => ({ ...current, nameTh: event.target.value }))}
            placeholder="ชื่อภาษาไทย เช่น ชั้น 1"
          />
          <input
            type="text"
            className={inputClass}
            value={floorForm.nameEn}
            onChange={(event) => setFloorForm((current) => ({ ...current, nameEn: event.target.value }))}
            placeholder="ชื่อภาษาอังกฤษ เช่น Floor 1"
          />
          <input
            type="number"
            min={0}
            className={inputClass}
            value={floorForm.sortOrder}
            onChange={(event) =>
              setFloorForm((current) => ({ ...current, sortOrder: Number(event.target.value) || 0 }))
            }
            placeholder="ลำดับ"
          />
          <div className="md:col-span-3">
            <label className="text-sm font-medium text-foreground">รูปผังชั้น</label>
            <div className="mt-1.5">
              <CoverImageField
                value={floorForm.floorPlanImage}
                onChange={(value) => setFloorForm((current) => ({ ...current, floorPlanImage: value }))}
              />
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Button type="button" onClick={handleCreateFloor} isLoading={isSaving}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            เพิ่มชั้น
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {sortedFloors.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-surface px-6 py-10 text-center text-sm text-muted">
          ยังไม่มีชั้นในสาขานี้ — เพิ่มชั้นก่อน แล้วค่อยเพิ่มโซนและที่ตั้ง
        </div>
      ) : (
        <div className="space-y-4">
          {sortedFloors.map((floor) => {
            const isFloorExpanded = expandedFloorId === floor.id;
            const zoneForm = zoneForms[floor.id] ?? emptyZoneForm;

            return (
              <div key={floor.id} className="overflow-hidden rounded-lg border border-border bg-surface">
                <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedFloorId(isFloorExpanded ? null : floor.id)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
                    {isFloorExpanded ? (
                      <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                    )}
                    <span className="min-w-0">
                      <span className="flex items-center gap-2 text-base font-semibold text-foreground">
                        <Layers className="h-4 w-4 text-paseo-dark" aria-hidden="true" />
                        {getStoreFloorLabel(floor)}
                      </span>
                      <span className="mt-1 block text-xs text-muted">{floor.zones.length} โซน</span>
                    </span>
                  </button>
                  <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                    <Button
                      type="button"
                      variant="ghost"
                      className="px-2 py-1"
                      onClick={() => setEditingFloorId(editingFloorId === floor.id ? null : floor.id)}
                    >
                      {editingFloorId === floor.id ? "ปิด" : "แก้ไข"}
                    </Button>
                    <Button type="button" variant="ghost" className="px-2 py-1" onClick={() => handleDeleteFloor(floor)}>
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {floor.floorPlanImage ? (
                  <div className="border-b border-border px-4 py-4">
                    <div className="relative aspect-[4/3] max-h-48 overflow-hidden rounded-lg border border-border bg-background">
                      <Image
                        src={floor.floorPlanImage}
                        alt={`ผัง ${getStoreFloorLabel(floor)}`}
                        fill
                        className="object-contain p-2"
                        sizes="(max-width: 768px) 100vw, 480px"
                      />
                    </div>
                  </div>
                ) : null}

                {editingFloorId === floor.id ? (
                  <div className="border-b border-border px-4 py-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <input
                        type="text"
                        className={inputClass}
                        value={floor.nameTh ?? ""}
                        onChange={(event) => updateFloorField(floor.id, "nameTh", event.target.value)}
                      />
                      <input
                        type="text"
                        className={inputClass}
                        value={floor.nameEn ?? ""}
                        onChange={(event) => updateFloorField(floor.id, "nameEn", event.target.value)}
                      />
                      <input
                        type="number"
                        min={0}
                        className={inputClass}
                        value={floor.sortOrder}
                        onChange={(event) =>
                          updateFloorField(floor.id, "sortOrder", Number(event.target.value) || 0)
                        }
                      />
                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-foreground">รูปผังชั้น</label>
                        <div className="mt-1.5">
                          <CoverImageField
                            value={floor.floorPlanImage ?? ""}
                            onChange={(value) => updateFloorField(floor.id, "floorPlanImage", value)}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button type="button" onClick={() => handleUpdateFloor(floor)} isLoading={isSaving}>
                        บันทึกชั้น
                      </Button>
                    </div>
                  </div>
                ) : null}

                {isFloorExpanded ? (
                  <div className="space-y-4 px-4 py-4">
                    <div className="rounded-lg border border-dashed border-border p-4">
                      <p className="text-sm font-medium text-foreground">เพิ่มโซนในชั้นนี้</p>
                      <p className="mt-1 text-xs text-muted">เช่น โซน A, โซน B, Plaza</p>
                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <input
                          type="text"
                          className={inputClass}
                          value={zoneForm.nameTh}
                          onChange={(event) =>
                            setZoneForms((current) => ({
                              ...current,
                              [floor.id]: { ...zoneForm, nameTh: event.target.value },
                            }))
                          }
                          placeholder="ชื่อโซน เช่น Plaza"
                        />
                        <input
                          type="number"
                          min={0}
                          className={inputClass}
                          value={zoneForm.sortOrder}
                          onChange={(event) =>
                            setZoneForms((current) => ({
                              ...current,
                              [floor.id]: { ...zoneForm, sortOrder: Number(event.target.value) || 0 },
                            }))
                          }
                          placeholder="ลำดับ"
                        />
                        <div className="md:col-span-2">
                          <CoverImageField
                            value={zoneForm.floorPlanImage}
                            onChange={(value) =>
                              setZoneForms((current) => ({
                                ...current,
                                [floor.id]: { ...zoneForm, floorPlanImage: value },
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="mt-3">
                        <Button type="button" className="px-3 py-1.5" onClick={() => handleCreateZone(floor.id)} isLoading={isSaving}>
                          <Plus className="h-4 w-4" aria-hidden="true" />
                          เพิ่มโซน
                        </Button>
                      </div>
                    </div>

                    {floor.zones.length === 0 ? (
                      <p className="text-sm text-muted">ยังไม่มีโซนในชั้นนี้</p>
                    ) : (
                      floor.zones
                        .slice()
                        .sort((a, b) => a.sortOrder - b.sortOrder)
                        .map((zone) => {
                          const isZoneExpanded = expandedZoneId === zone.id;
                          const locationForm = locationForms[zone.id] ?? emptyLocationForm;

                          return (
                            <div key={zone.id} className="rounded-lg border border-border bg-background">
                              <div className="flex items-start justify-between gap-4 border-b border-border px-3 py-3">
                                <button
                                  type="button"
                                  onClick={() => setExpandedZoneId(isZoneExpanded ? null : zone.id)}
                                  className="flex min-w-0 flex-1 items-start gap-2 text-left"
                                >
                                  {isZoneExpanded ? (
                                    <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                                  )}
                                  <span>
                                    <span className="block text-sm font-semibold text-foreground">
                                      {getStoreZoneLabel(zone)}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-muted">
                                      {zone.locations.length} ที่ตั้ง · {zone._count?.stores ?? 0} ร้าน
                                    </span>
                                  </span>
                                </button>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="px-2 py-1"
                                    onClick={() => setEditingZoneId(editingZoneId === zone.id ? null : zone.id)}
                                  >
                                    แก้ไข
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="px-2 py-1"
                                    onClick={() => handleDeleteZone(floor.id, zone)}
                                  >
                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                  </Button>
                                </div>
                              </div>

                              {zone.floorPlanImage ? (
                                <div className="border-b border-border px-3 py-3">
                                  <div className="relative aspect-[4/3] max-h-36 overflow-hidden rounded-lg border border-border">
                                    <Image
                                      src={zone.floorPlanImage}
                                      alt={`ผัง ${getStoreZoneLabel(zone)}`}
                                      fill
                                      className="object-contain p-2"
                                      sizes="320px"
                                    />
                                  </div>
                                </div>
                              ) : null}

                              {editingZoneId === zone.id ? (
                                <div className="border-b border-border px-3 py-3">
                                  <div className="grid gap-3 md:grid-cols-2">
                                    <input
                                      type="text"
                                      className={inputClass}
                                      value={zone.nameTh ?? ""}
                                      onChange={(event) =>
                                        updateZoneField(floor.id, zone.id, "nameTh", event.target.value)
                                      }
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      className={inputClass}
                                      value={zone.sortOrder}
                                      onChange={(event) =>
                                        updateZoneField(
                                          floor.id,
                                          zone.id,
                                          "sortOrder",
                                          Number(event.target.value) || 0,
                                        )
                                      }
                                    />
                                    <div className="md:col-span-2">
                                      <CoverImageField
                                        value={zone.floorPlanImage ?? ""}
                                        onChange={(value) =>
                                          updateZoneField(floor.id, zone.id, "floorPlanImage", value)
                                        }
                                      />
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <Button
                                      type="button"
                                      className="px-3 py-1.5"
                                      onClick={() => handleUpdateZone(floor.id, zone)}
                                      isLoading={isSaving}
                                    >
                                      บันทึกโซน
                                    </Button>
                                  </div>
                                </div>
                              ) : null}

                              {isZoneExpanded ? (
                                <div className="px-3 py-3">
                                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                                    <MapPin className="h-4 w-4 text-paseo-dark" aria-hidden="true" />
                                    ที่ตั้ง (เลขห้อง / OFFICE)
                                  </div>

                                  {zone.locations.length > 0 ? (
                                    <ul className="divide-y divide-border rounded-lg border border-border">
                                      {zone.locations
                                        .slice()
                                        .sort((a, b) => a.sortOrder - b.sortOrder)
                                        .map((location) => (
                                          <li
                                            key={location.id}
                                            className="flex items-center justify-between gap-3 px-3 py-2"
                                          >
                                            {editingLocationId === location.id ? (
                                              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                                                <input
                                                  type="text"
                                                  className={inputClass}
                                                  value={location.nameTh ?? ""}
                                                  onChange={(event) =>
                                                    updateLocationField(
                                                      floor.id,
                                                      zone.id,
                                                      location.id,
                                                      "nameTh",
                                                      event.target.value,
                                                    )
                                                  }
                                                />
                                                <input
                                                  type="number"
                                                  min={0}
                                                  className={inputClass}
                                                  value={location.sortOrder}
                                                  onChange={(event) =>
                                                    updateLocationField(
                                                      floor.id,
                                                      zone.id,
                                                      location.id,
                                                      "sortOrder",
                                                      Number(event.target.value) || 0,
                                                    )
                                                  }
                                                />
                                                <Button
                                                  type="button"
                                                  className="px-3 py-1.5"
                                                  onClick={() => handleUpdateLocation(floor.id, zone.id, location)}
                                                  isLoading={isSaving}
                                                >
                                                  บันทึก
                                                </Button>
                                              </div>
                                            ) : (
                                              <>
                                                <span className="text-sm font-medium text-foreground">
                                                  {getStoreLocationLabel(location)}
                                                  <span className="ml-2 text-xs text-muted">
                                                    ({location._count?.stores ?? 0} ร้าน)
                                                  </span>
                                                </span>
                                                <div className="flex items-center gap-2">
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="px-2 py-1"
                                                    onClick={() => setEditingLocationId(location.id)}
                                                  >
                                                    แก้ไข
                                                  </Button>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    className="px-2 py-1"
                                                    onClick={() =>
                                                      handleDeleteLocation(floor.id, zone.id, location)
                                                    }
                                                  >
                                                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                                                  </Button>
                                                </div>
                                              </>
                                            )}
                                          </li>
                                        ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-muted">ยังไม่มีที่ตั้งในโซนนี้</p>
                                  )}

                                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                    <input
                                      type="text"
                                      className={inputClass}
                                      value={locationForm.nameTh}
                                      onChange={(event) =>
                                        setLocationForms((current) => ({
                                          ...current,
                                          [zone.id]: { ...locationForm, nameTh: event.target.value },
                                        }))
                                      }
                                      placeholder="เช่น A101, OFFICE"
                                    />
                                    <input
                                      type="number"
                                      min={0}
                                      className={inputClass}
                                      value={locationForm.sortOrder}
                                      onChange={(event) =>
                                        setLocationForms((current) => ({
                                          ...current,
                                          [zone.id]: {
                                            ...locationForm,
                                            sortOrder: Number(event.target.value) || 0,
                                          },
                                        }))
                                      }
                                      placeholder="ลำดับ"
                                    />
                                    <Button
                                      type="button"
                                      className="px-3 py-1.5"
                                      onClick={() => handleCreateLocation(floor.id, zone.id)}
                                      isLoading={isSaving}
                                    >
                                      <Plus className="h-4 w-4" aria-hidden="true" />
                                      เพิ่มที่ตั้ง
                                    </Button>
                                  </div>
                                </div>
                              ) : null}
                            </div>
                          );
                        })
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
