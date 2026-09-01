#!/usr/bin/env python3
"""Extract published WordPress posts and Event projects for a given year."""

from __future__ import annotations

import json
import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SQL_PATH = ROOT / "thepaseo_wordpress" / "thepaseo_database.sql"
UPLOADS_DIR = ROOT / "thepaseo_wordpress" / "wordpress" / "wp-content" / "uploads"
OUT_DIR = Path(__file__).resolve().parent / "wordpress-import"

YEAR = os.environ.get("WP_IMPORT_YEAR", "2026")

POST_COLS = [
    "ID",
    "post_author",
    "post_date",
    "post_date_gmt",
    "post_content",
    "post_title",
    "post_excerpt",
    "post_status",
    "comment_status",
    "ping_status",
    "post_password",
    "post_name",
    "to_ping",
    "pinged",
    "post_modified",
    "post_modified_gmt",
    "post_content_filtered",
    "post_parent",
    "guid",
    "menu_order",
    "post_type",
    "post_mime_type",
    "comment_count",
]


def unescape_mysql(value: str) -> str:
    return (
        value.replace("\\0", "\0")
        .replace("\\b", "\b")
        .replace("\\n", "\n")
        .replace("\\r", "\r")
        .replace("\\t", "\t")
        .replace("\\Z", "\x1a")
        .replace("\\'", "'")
        .replace('\\"', '"')
        .replace("\\\\", "\\")
    )


def parse_sql_tuples(block: str):
    i = 0
    n = len(block)
    while i < n:
        while i < n and block[i] in " \t\r\n,;":
            i += 1
        if i >= n or block[i] != "(":
            return
        i += 1
        fields: list[str | None] = []
        current: list[str] = []
        in_string = False
        escaped = False
        while i < n:
            ch = block[i]
            if in_string:
                if escaped:
                    current.append(ch)
                    escaped = False
                elif ch == "\\":
                    current.append(ch)
                    escaped = True
                elif ch == "'":
                    if i + 1 < n and block[i + 1] == "'":
                        current.append("'")
                        i += 1
                    else:
                        in_string = False
                else:
                    current.append(ch)
            else:
                if ch == "'":
                    in_string = True
                    current = []
                elif ch == ",":
                    raw = "".join(current).strip()
                    if raw.upper() == "NULL" and not fields or raw.upper() == "NULL":
                        fields.append(None if raw.upper() == "NULL" else unescape_mysql(raw))
                    if current and current[0] == "'" or False:
                        pass
                    if raw.upper() == "NULL":
                        fields.append(None)
                    else:
                        fields.append(unescape_mysql(raw) if raw.startswith("'") is False else unescape_mysql(raw.strip("'")))
                    # Fix: the above is messy. Rebuild properly below via a cleaner path.
                    current = []
                elif ch == ")":
                    raw = "".join(current).strip()
                    if raw.upper() == "NULL":
                        fields.append(None)
                    else:
                        fields.append(raw)
                    yield fields
                    i += 1
                    break
                else:
                    current.append(ch)
            i += 1


def iter_insert_rows(sql_path: Path, table: str):
    marker = f"INSERT INTO `{table}` VALUES"
    in_insert = False
    buf: list[str] = []
    with sql_path.open("r", encoding="utf-8", errors="replace") as handle:
        for line in handle:
            if not in_insert:
                if line.startswith(marker) or line.startswith(f"INSERT INTO `{table}` VALUES\n"):
                    in_insert = True
                    after = line.split("VALUES", 1)[1]
                    buf = [after]
                    if after.rstrip().endswith(";"):
                        yield from parse_tuples_from_values("".join(buf))
                        in_insert = False
                        buf = []
                continue

            buf.append(line)
            if line.rstrip().endswith(";"):
                yield from parse_tuples_from_values("".join(buf))
                in_insert = False
                buf = []


def parse_tuples_from_values(block: str):
    i = 0
    n = len(block)
    while i < n:
        while i < n and block[i] not in "(":
            if block[i] == ";":
                return
            i += 1
        if i >= n:
            return
        i += 1  # skip (
        fields: list[str | None] = []
        while True:
            while i < n and block[i] in " \t\r\n":
                i += 1
            if i >= n:
                return
            if block[i] == "'":
                i += 1
                chars: list[str] = []
                while i < n:
                    ch = block[i]
                    if ch == "\\":
                        if i + 1 < n:
                            chars.append(block[i : i + 2])
                            i += 2
                            continue
                    if ch == "'":
                        if i + 1 < n and block[i + 1] == "'":
                            chars.append("''")
                            i += 2
                            continue
                        i += 1
                        break
                    chars.append(ch)
                    i += 1
                fields.append(unescape_mysql("".join(chars).replace("''", "'")))
            else:
                start = i
                while i < n and block[i] not in ",)":
                    i += 1
                raw = block[start:i].strip()
                fields.append(None if raw.upper() == "NULL" else raw)
            while i < n and block[i] in " \t\r\n":
                i += 1
            if i >= n:
                return
            if block[i] == ",":
                i += 1
                continue
            if block[i] == ")":
                i += 1
                yield fields
                break


def decode_html(value: str) -> str:
    replacements = {
        "&nbsp;": " ",
        "&amp;": "&",
        "&lt;": "<",
        "&gt;": ">",
        "&#8217;": "’",
        "&#8220;": "“",
        "&#8221;": "”",
        "&quot;": '"',
    }
    for src, dst in replacements.items():
        value = value.replace(src, dst)
    return value


SHORTCODE_RE = re.compile(r"\[/?(?:cmsmasters_[^\]]+|/?cmsmasters_[^\]]+)[^\]]*\]", re.I)
GALLERY_RE = re.compile(r"\[cmsmasters_gallery[^\]]*\](.*?)\[/cmsmasters_gallery\]", re.I | re.S)
IMG_RE = re.compile(r"(https?://[^\s\"'<>]+|/wp-content/uploads/[^\s\"'<>]+)", re.I)
TAG_RE = re.compile(r"<[^>]+>")


def wp_content_to_html(content: str) -> str:
    text = decode_html(content or "")
    text = GALLERY_RE.sub("", text)
    text = SHORTCODE_RE.sub("", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if not text:
        return "<p></p>"
    if "<" not in text:
        paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        return "".join(f"<p>{p}</p>" for p in paragraphs) or f"<p>{text}</p>"
    return text


def excerpt_from(content_html: str, fallback: str, limit: int = 240) -> str:
    plain = TAG_RE.sub(" ", fallback or content_html)
    plain = re.sub(r"\s+", " ", plain).strip()
    if len(plain) <= limit:
        return plain
    return plain[: limit - 1].rstrip() + "…"


def local_upload_path(attached_file: str | None, guid: str | None) -> str | None:
    candidates: list[Path] = []
    if attached_file:
        candidates.append(UPLOADS_DIR / attached_file)
        # WordPress sometimes stores scaled names; keep original too.
        stem, ext = os.path.splitext(attached_file)
        for suffix in ("", "-scaled"):
            candidates.append(UPLOADS_DIR / f"{stem}{suffix}{ext}")
    if guid:
        marker = "/wp-content/uploads/"
        if marker in guid:
            rel = guid.split(marker, 1)[1]
            candidates.append(UPLOADS_DIR / rel)
    for path in candidates:
        if path.is_file():
            return str(path)
    return None


def main() -> None:
    print(f"Parsing {SQL_PATH} for year {YEAR}...")

    terms: dict[str, dict] = {}
    for row in iter_insert_rows(SQL_PATH, "lvsy_terms"):
        term_id, name, slug, _group = row[:4]
        terms[term_id] = {"id": term_id, "name": name, "slug": slug}

    taxonomies: dict[str, dict] = {}
    event_tt_ids: set[str] = set()
    for row in iter_insert_rows(SQL_PATH, "lvsy_term_taxonomy"):
        tt_id, term_id, taxonomy, _desc, parent, _count = row[:6]
        term = terms.get(term_id, {})
        taxonomies[tt_id] = {
            "term_taxonomy_id": tt_id,
            "term_id": term_id,
            "taxonomy": taxonomy,
            "parent": parent,
            "name": term.get("name"),
            "slug": term.get("slug"),
        }
        name = (term.get("name") or "").lower()
        slug = (term.get("slug") or "").lower()
        if taxonomy == "pj-categs" and (
            name == "event" or slug == "cinema" or name.startswith("event ") or slug.startswith("event-")
        ):
            event_tt_ids.add(tt_id)

    print("Event term_taxonomy ids:", sorted(event_tt_ids, key=int))
    for tt_id in sorted(event_tt_ids, key=int):
        print(" ", taxonomies[tt_id])

    object_terms: dict[str, list[dict]] = defaultdict(list)
    event_object_ids: set[str] = set()
    for row in iter_insert_rows(SQL_PATH, "lvsy_term_relationships"):
        object_id, tt_id = row[0], row[1]
        info = taxonomies.get(tt_id)
        if not info:
            continue
        object_terms[object_id].append(info)
        if tt_id in event_tt_ids:
            event_object_ids.add(object_id)

    posts: dict[str, dict] = {}
    attachments: dict[str, dict] = {}
    year_counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))

    for row in iter_insert_rows(SQL_PATH, "lvsy_posts"):
        mapped = {POST_COLS[i]: (row[i] if i < len(row) else None) for i in range(len(POST_COLS))}
        post_id = mapped["ID"]
        post_type = mapped["post_type"]
        post_date = mapped["post_date"] or ""
        year = post_date[:4]
        if post_type in {"post", "project", "attachment"}:
            year_counts[year][post_type] += 1
        if post_type == "attachment":
            attachments[post_id] = mapped
            continue
        if post_type not in {"post", "project"}:
            continue
        if mapped["post_status"] not in {"publish", "future"}:
            continue
        if not post_date.startswith(YEAR):
            continue
        posts[post_id] = mapped

    print("Year counts (all statuses for types):")
    for year in sorted(year_counts):
        if year >= "2020":
            print(f"  {year}: {dict(year_counts[year])}")

    needed_ids = set(posts)
    needed_ids.update(event_object_ids)
    thumbnail_of: dict[str, str] = {}
    attached_file: dict[str, str] = {}
    extra_meta: dict[str, dict[str, str]] = defaultdict(dict)

    meta_keys = {
        "_thumbnail_id",
        "_wp_attached_file",
        "cmsmasters_project_date",
        "cmsmasters_project_location",
        "cmsmasters_project_link",
        "_event_start_date",
        "_EventStartDate",
        "_event_end_date",
        "_EventEndDate",
    }

    for row in iter_insert_rows(SQL_PATH, "lvsy_postmeta"):
        _meta_id, post_id, meta_key, meta_value = row[:4]
        if meta_key not in meta_keys:
            continue
        if post_id in posts and meta_key == "_thumbnail_id" and meta_value:
            thumbnail_of[post_id] = meta_value
        if meta_key == "_wp_attached_file" and meta_value:
            attached_file[post_id] = meta_value
        if post_id in posts and meta_key not in {"_thumbnail_id", "_wp_attached_file"} and meta_value:
            extra_meta[post_id][meta_key] = meta_value

    posts_out = []
    events_out = []

    for post_id, post in posts.items():
        cats = object_terms.get(post_id, [])
        thumb_id = thumbnail_of.get(post_id)
        thumb_post = attachments.get(thumb_id) if thumb_id else None
        file_rel = attached_file.get(thumb_id) if thumb_id else None
        guid = thumb_post["guid"] if thumb_post else None
        source_path = local_upload_path(file_rel, guid)
        record = {
            "wpId": int(post_id),
            "title": post["post_title"] or "",
            "slug": post["post_name"] or "",
            "excerpt": excerpt_from(wp_content_to_html(post["post_content"] or ""), post["post_excerpt"] or ""),
            "content": wp_content_to_html(post["post_content"] or ""),
            "status": "PUBLISHED" if post["post_status"] == "publish" else "DRAFT",
            "publishedAt": post["post_date"],
            "modifiedAt": post["post_modified"],
            "guid": post["guid"],
            "featuredImageRel": file_rel,
            "featuredImageGuid": guid,
            "featuredImageSource": source_path,
            "categories": [{"name": c["name"], "slug": c["slug"], "taxonomy": c["taxonomy"]} for c in cats],
            "meta": extra_meta.get(post_id, {}),
        }

        if post["post_type"] == "post":
            posts_out.append(record)
        elif post_id in event_object_ids:
            branch_slugs = []
            for cat in cats:
                slug = (cat.get("slug") or "").lower()
                if slug == "event-mall":
                    branch_slugs.append("mall")
                elif slug == "event-park":
                    branch_slugs.append("park")
                elif slug == "event-town":
                    branch_slugs.append("town")
            record["branchSlugs"] = sorted(set(branch_slugs))
            record["eventDate"] = extra_meta.get(post_id, {}).get("cmsmasters_project_date") or post["post_date"]
            record["location"] = extra_meta.get(post_id, {}).get("cmsmasters_project_location")
            events_out.append(record)

    posts_out.sort(key=lambda item: item["publishedAt"], reverse=True)
    events_out.sort(key=lambda item: item["publishedAt"], reverse=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    (OUT_DIR / "posts.json").write_text(json.dumps(posts_out, ensure_ascii=False, indent=2), encoding="utf-8")
    (OUT_DIR / "events.json").write_text(json.dumps(events_out, ensure_ascii=False, indent=2), encoding="utf-8")

    missing_post_images = sum(1 for item in posts_out if not item["featuredImageSource"])
    missing_event_images = sum(1 for item in events_out if not item["featuredImageSource"])
    print(f"Extracted {len(posts_out)} posts ({missing_post_images} missing images)")
    print(f"Extracted {len(events_out)} event projects ({missing_event_images} missing images)")
    print(f"Wrote {OUT_DIR / 'posts.json'} and {OUT_DIR / 'events.json'}")


if __name__ == "__main__":
    main()
