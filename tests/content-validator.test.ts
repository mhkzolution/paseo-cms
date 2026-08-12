import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  contactSchema,
  leasingSchema,
  postSchema,
  recaptchaSchema,
  searchSchema,
  seoSchema,
  settingsSchema,
} from "@/validators/content.validator";

describe("content validators", () => {
  it("requires a non-empty search query", () => {
    assert.equal(searchSchema.safeParse({ q: "branches" }).success, true);
    assert.equal(searchSchema.safeParse({ q: "   " }).success, false);
  });

  it("accepts enterprise post SEO and taxonomy fields", () => {
    const parsed = postSchema.parse({
      title: "Grand Opening",
      slug: "",
      kind: "NEWS",
      categoryId: "",
      branchIds: ["branch-1"],
      tagIds: ["tag-1"],
      newTags: "community, mall",
      relatedPostIds: [],
      h1: "",
      excerpt: "",
      content: "Welcome to The Paseo",
      featuredImage: "",
      coverImageAlt: "",
      coverImageCaption: "",
      showOnHome: true,
      status: "PUBLISHED",
      publishedAt: "",
      reviewedAt: "",
      expiresAt: "",
      seo: {
        seoTitle: "Grand Opening",
        seoDescription: "The Paseo grand opening update.",
        keywords: "paseo, mall",
        focusKeyword: "grand opening",
        secondaryKeywords: "",
        canonicalUrl: "",
        ogTitle: "",
        ogDescription: "",
        ogImage: "",
        twitterTitle: "",
        twitterDescription: "",
        twitterImage: "",
        twitterCard: "SUMMARY_LARGE_IMAGE",
        noindex: false,
        nofollow: false,
        noarchive: false,
        nosnippet: false,
        maxSnippet: "",
        maxImagePreview: "large",
        maxVideoPreview: "",
        schemaType: "NEWS_ARTICLE",
        customJsonLd: "",
        includeInSitemap: true,
        includeInNewsSitemap: true,
        includeInImageSitemap: true,
        sitemapPriority: "0.8",
        changeFrequency: "DAILY",
      },
      alternates: [],
      faqs: [],
      images: [],
    });

    assert.equal(parsed.slug, null);
    assert.equal(parsed.showOnHome, true);
    assert.equal(parsed.seo.sitemapPriority, 0.8);
    assert.deepEqual(parsed.images, []);
  });

  it("accepts post banners and album images", () => {
    const parsed = postSchema.parse({
      title: "Album Post",
      content: "Body",
      status: "DRAFT",
      bannerDesktop: "/uploads/banner-desktop.jpg",
      bannerMobile: "/uploads/banner-mobile.jpg",
      images: [
        { url: "/uploads/a.jpg", alt: "A", caption: "Caption A" },
        { url: "/uploads/b.jpg", alt: "", caption: "" },
      ],
      seo: {},
    });

    assert.equal(parsed.bannerDesktop, "/uploads/banner-desktop.jpg");
    assert.equal(parsed.bannerMobile, "/uploads/banner-mobile.jpg");
    assert.equal(parsed.images.length, 2);
    assert.equal(parsed.images[0]?.url, "/uploads/a.jpg");
  });

  it("allows creating a post without filling SEO fields", () => {
    const parsed = postSchema.safeParse({
      title: "New Post",
      slug: null,
      kind: "NEWS",
      h1: null,
      categoryId: null,
      branchIds: [],
      tagIds: [],
      newTags: null,
      relatedPostIds: [],
      excerpt: null,
      content: "Post body",
      featuredImage: null,
      coverImageAlt: null,
      coverImageCaption: null,
      showOnHome: false,
      status: "DRAFT",
      publishedAt: null,
      reviewedAt: null,
      expiresAt: null,
      seo: null,
      alternates: [],
      faqs: [],
    });

    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.seo.seoTitle, null);
      assert.equal(parsed.data.seo.twitterCard, "SUMMARY_LARGE_IMAGE");
      assert.equal(parsed.data.seo.schemaType, "ARTICLE");
      assert.equal(parsed.data.publishedAt, null);
    }
  });

  it("accepts null SEO field values from form submissions", () => {
    const parsed = postSchema.safeParse({
      title: "New Post",
      content: "Post body",
      status: "DRAFT",
      seo: {
        seoTitle: null,
        seoDescription: null,
        keywords: null,
        focusKeyword: null,
        secondaryKeywords: null,
        canonicalUrl: null,
        ogTitle: null,
        ogDescription: null,
        ogImage: null,
        twitterTitle: null,
        twitterDescription: null,
        twitterImage: null,
        twitterCard: null,
        schemaType: null,
        customJsonLd: null,
        maxImagePreview: null,
        maxSnippet: null,
        maxVideoPreview: null,
        sitemapPriority: null,
        changeFrequency: "",
        includeInSitemap: null,
        includeInImageSitemap: null,
      },
    });

    assert.equal(parsed.success, true);
  });

  it("validates public contact submissions", () => {
    const parsed = contactSchema.safeParse({
      name: "Paseo Visitor",
      email: "visitor@example.com",
      phone: "",
      subject: "Store hours",
      message: "What time do you open?",
    });

    assert.equal(parsed.success, true);
  });

  it("rejects invalid SEO select values", () => {
    const parsed = seoSchema.safeParse({
      metaTitle: "The Paseo",
      metaDescription: "Shopping, events, news, and promotions.",
      ogImage: "",
      twitterCard: "photo",
      canonicalUrl: "",
      jsonLd: "",
      robots: "index,follow",
    });

    assert.equal(parsed.success, false);
  });

  it("validates required production settings", () => {
    const parsed = settingsSchema.safeParse({
      siteName: "The Paseo",
      siteTagline: "ระบบจัดการเว็บไซต์",
      siteUrl: "https://thepaseo.co.th",
      siteLogo: "",
      favicon: "",
      contactEmail: "info@thepaseo.co.th",
      contactPhone: "",
      address: "",
      businessHours: "",
      facebookUrl: "",
      instagramUrl: "",
      tiktokUrl: "",
      lineUrl: "",
      aboutLogo: "",
      aboutDetail1: "",
      aboutDetail2: "",
      aboutDetail3: "",
      aboutDetail4: "",
      aboutMission: "",
      aboutVision: "",
    });

    assert.equal(parsed.success, true);
  });

  it("accepts optional reCAPTCHA keys", () => {
    assert.equal(
      recaptchaSchema.safeParse({
        recaptchaSiteKey: "6LcSiteKeyExample",
        recaptchaSecretKey: "6LcSecretKeyExample",
      }).success,
      true,
    );
    assert.equal(
      recaptchaSchema.safeParse({
        recaptchaSiteKey: "",
        recaptchaSecretKey: "",
      }).success,
      true,
    );
  });

  it("validates leasing form fields", () => {
    const valid = leasingSchema.safeParse({
      name: "สมชาย ใจดี",
      email: "test@example.com",
      phone: "0812345678",
      details: "สนใจพื้นที่ชั้น 1",
      branchId: "branch-1",
      productCategory: "แฟชั่น",
      productDetails: "ขายเสื้อผ้าสตรี",
      recaptchaToken: "token",
    });
    assert.equal(valid.success, true);

    const missingBranch = leasingSchema.safeParse({
      name: "สมชาย",
      email: "test@example.com",
      phone: "0812345678",
      branchId: "",
      productCategory: "อาหาร",
      productDetails: "ร้านกาแฟ",
      recaptchaToken: "token",
    });
    assert.equal(missingBranch.success, false);
  });
});
