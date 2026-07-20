"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

const PROMOTION_CATEGORIES = [
  {
    id: "food",
    label: "Dining",
    title: "Taste of Paseo",
    description: "Weekend dining offers from cafes, restaurants, and dessert shops across all branches.",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    items: ["Buy 1 Get 1 drinks", "Family set menus", "Dessert after dinner deals"],
  },
  {
    id: "shopping",
    label: "Shopping",
    title: "Retail Picks",
    description: "Selected fashion, beauty, lifestyle, and service promotions curated for the month.",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80",
    items: ["Member-only discounts", "New arrival rewards", "Seasonal clearance"],
  },
  {
    id: "family",
    label: "Family",
    title: "Family Weekend",
    description: "Activities and branch-wide offers for families spending time together at The Paseo.",
    image:
      "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1200&q=80",
    items: ["Kids workshop perks", "Cinema and meal bundles", "Pet-friendly store picks"],
  },
] as const;

type PromotionCategoryId = (typeof PROMOTION_CATEGORIES)[number]["id"];

export function PromotionTabs() {
  const [activeCategoryId, setActiveCategoryId] = useState<PromotionCategoryId>(PROMOTION_CATEGORIES[0].id);
  const activeCategory =
    PROMOTION_CATEGORIES.find((category) => category.id === activeCategoryId) ?? PROMOTION_CATEGORIES[0];

  return (
    <section id="promotions" className="bg-[#F8F4EC] py-16">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase text-paseo">Promotion</p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">Promotion by category</h2>
          </div>
          <div className="flex flex-wrap gap-2" role="tablist" aria-label="Promotion categories">
            {PROMOTION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                role="tab"
                aria-selected={category.id === activeCategory.id}
                onClick={() => setActiveCategoryId(category.id)}
                className={
                  category.id === activeCategory.id
                    ? "rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
                    : "rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-foreground hover:border-paseo"
                }
              >
                {category.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid overflow-hidden rounded-lg border border-border bg-white shadow-sm lg:grid-cols-[1.1fr_0.9fr]">
          <div className="relative min-h-[320px]">
            <Image
              src={activeCategory.image}
              alt={activeCategory.title}
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-6 p-6 sm:p-8 lg:p-10">
            <div>
              <h3 className="text-2xl font-semibold text-foreground">{activeCategory.title}</h3>
              <p className="mt-3 text-sm leading-6 text-muted">{activeCategory.description}</p>
            </div>
            <ul className="grid gap-2">
              {activeCategory.items.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-foreground">
                  <span className="h-2 w-2 rounded-full bg-paseo" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <Link href="/promotions" className="inline-flex items-center gap-2 text-sm font-semibold text-paseo">
              View all promotions
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
