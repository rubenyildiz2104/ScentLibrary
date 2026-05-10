#!/usr/bin/env python3
"""
Script d'importation directe : lit un CSV de parfums populaires et les insère dans Supabase.
Utilise l'API Fragrantica pour récupérer les détails de chaque parfum.
"""

import sys
import os

# Force UTF-8 output for Windows console
sys.stdout.reconfigure(encoding='utf-8')

# Add parent dir to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from scraper.scrape import FragranticaScraper
import psycopg2
import json

# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────
DATABASE_URL = "postgresql://postgres:ScentLibrary2001.@db.zfihiworxbondkyxjgyy.supabase.co:5432/postgres"

# Popular brands to scrape (customisable)
BRANDS_TO_SCRAPE = [
    "Chanel", "Dior", "Guerlain", "Hermes", "Givenchy",
    "Yves Saint Laurent", "Lancome", "Jean Paul Gaultier",
    "Giorgio Armani", "Versace", "Prada", "Burberry", "Valentino",
    "Tom Ford", "Creed", "Maison Margiela", "Byredo",
    "Jo Malone", "Maison Francis Kurkdjian",
    "Thierry Mugler", "Gucci",
    "Dolce Gabbana", "Hugo Boss",
]

LIMIT_PER_BRAND = 30  # parfums par marque

# ──────────────────────────────────────────────
# DB
# ──────────────────────────────────────────────

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def upsert_perfume(conn, p: dict):
    sql = """
    INSERT INTO perfumes (name, brand, release_year, gender, notes_top, notes_middle, notes_base, accords,
                          rating, votes, description, longevity, sillage, perfumer, image_url, perfume_url)
    VALUES (%(name)s, %(brand)s, %(release_year)s, %(gender)s,
            %(notes_top)s, %(notes_middle)s, %(notes_base)s, %(accords)s,
            %(rating)s, %(votes)s, %(description)s, %(longevity)s, %(sillage)s, %(perfumer)s,
            %(image_url)s, %(perfume_url)s)
    ON CONFLICT (perfume_url) DO UPDATE SET
        rating = EXCLUDED.rating,
        votes = EXCLUDED.votes,
        notes_top = EXCLUDED.notes_top,
        notes_middle = EXCLUDED.notes_middle,
        notes_base = EXCLUDED.notes_base,
        accords = EXCLUDED.accords,
        description = EXCLUDED.description,
        perfumer = EXCLUDED.perfumer;
    """
    try:
        with conn.cursor() as cur:
            cur.execute(sql, {
                "name":         p.get("name", ""),
                "brand":        p.get("brand", ""),
                "release_year": p.get("release_year"),
                "gender":       p.get("gender"),
                "notes_top":    p.get("notes_top", []),
                "notes_middle": p.get("notes_middle", []),
                "notes_base":   p.get("notes_base", []),
                "accords":      p.get("accords", []),
                "rating":       p.get("rating"),
                "votes":        p.get("votes"),
                "description":  p.get("description"),
                "longevity":    str(p.get("longevity")) if p.get("longevity") else None,
                "sillage":      str(p.get("sillage")) if p.get("sillage") else None,
                "perfumer":     p.get("perfumer"),
                "image_url":    p.get("image_url"),
                "perfume_url":  p.get("perfume_url"),
            })
        conn.commit()
        return True
    except Exception as e:
        conn.rollback()
        print(f"   ❌ DB error: {e}")
        return False

# ──────────────────────────────────────────────
# MAIN
# ──────────────────────────────────────────────

def main():
    print("🔌 Connexion à Supabase...")
    conn = get_connection()
    print("✅ Connecté.\n")

    scraper = FragranticaScraper(delay=8.0)  # délai réduit pour aller plus vite
    total_inserted = 0

    for brand in BRANDS_TO_SCRAPE:
        print(f"\n{'='*50}")
        print(f"🏭 Scraping : {brand}")
        print(f"{'='*50}")

        perfumes = scraper.scrape_by_brand(brand, limit=LIMIT_PER_BRAND, save_to_file=False)
        inserted = 0

        for p in perfumes:
            ok = upsert_perfume(conn, p)
            if ok:
                inserted += 1
                total_inserted += 1
                print(f"   ✅ [{inserted}/{len(perfumes)}] {p.get('name')} inséré")

        print(f"   → {inserted}/{len(perfumes)} parfums insérés pour {brand}")

    conn.close()
    print(f"\n🎉 TERMINÉ — {total_inserted} parfums insérés au total")

if __name__ == "__main__":
    main()
