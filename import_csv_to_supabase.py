import csv
import psycopg2
import sys
import os

# Force UTF-8 output for Windows console
sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = "postgresql://postgres:ScentLibrary2001.@db.zfihiworxbondkyxjgyy.supabase.co:5432/postgres"
CSV_PATH = r"c:\Users\Ruben\Desktop\ScentLibrary\fra_cleaned.csv"

def get_connection():
    return psycopg2.connect(DATABASE_URL)

def clean_gender(g):
    if not g: return "Unisex"
    g = g.lower()
    if "women" in g and "men" in g: return "Unisex"
    if "women" in g: return "Women"
    if "men" in g: return "Men"
    return "Unisex"

def clean_notes(n):
    if not n or n.lower() == "unknown": return []
    return [x.strip() for x in n.split(",") if x.strip()]

def clean_accords(row):
    accords = []
    for i in range(1, 6):
        val = row.get(f"mainaccord{i}")
        if val and val.strip() and val.lower() != "unknown":
            accords.append(val.strip())
    return accords

def clean_rating(r):
    if not r: return None
    try:
        return float(r.replace(",", "."))
    except:
        return None

def clean_int(v):
    if not v: return None
    try:
        return int(v)
    except:
        return None

def clean_perfumer(p1, p2):
    parts = []
    if p1 and p1.lower() != "unknown": parts.append(p1.strip())
    if p2 and p2.lower() != "unknown": parts.append(p2.strip())
    return " & ".join(parts) if parts else None

def main():
    print("🔌 Connexion à Supabase...")
    conn = get_connection()
    cur = conn.cursor()
    print("✅ Connecté.")

    print(f"📖 Ouverture du CSV: {CSV_PATH}")
    
    with open(CSV_PATH, mode='r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        
        total = 0
        inserted = 0
        
        sql = """
        INSERT INTO perfumes (name, brand, release_year, gender, notes_top, notes_middle, notes_base, accords,
                              rating, votes, perfumer, perfume_url)
        VALUES (%(name)s, %(brand)s, %(release_year)s, %(gender)s,
                %(notes_top)s, %(notes_middle)s, %(notes_base)s, %(accords)s,
                %(rating)s, %(votes)s, %(perfumer)s, %(perfume_url)s)
        ON CONFLICT (perfume_url) DO UPDATE SET
            name = EXCLUDED.name,
            rating = EXCLUDED.rating,
            votes = EXCLUDED.votes,
            notes_top = EXCLUDED.notes_top,
            notes_middle = EXCLUDED.notes_middle,
            notes_base = EXCLUDED.notes_base,
            accords = EXCLUDED.accords,
            perfumer = EXCLUDED.perfumer;
        """

        print("🚀 Début de l'importation (avec accords et nettoyage noms)...")
        
        for row in reader:
            total += 1
            raw_name = row.get("Perfume", "Unknown")
            # Replace - with space and Title Case
            name = raw_name.replace("-", " ").title()
            
            p = {
                "name":         name,
                "brand":        row.get("Brand"),
                "release_year": clean_int(row.get("Year")),
                "gender":       clean_gender(row.get("Gender")),
                "notes_top":    clean_notes(row.get("Top")),
                "notes_middle": clean_notes(row.get("Middle")),
                "notes_base":   clean_notes(row.get("Base")),
                "accords":      clean_accords(row),
                "rating":       clean_rating(row.get("Rating Value")),
                "votes":        clean_int(row.get("Rating Count")),
                "perfumer":     clean_perfumer(row.get("Perfumer1"), row.get("Perfumer2")),
                "perfume_url":  row.get("url"),
            }

            try:
                cur.execute(sql, p)
                inserted += 1
                if inserted % 500 == 0:
                    conn.commit()
                    print(f"   ✅ {inserted} parfums importés/mis à jour...")
            except Exception as e:
                print(f"   ❌ Erreur sur {p['name']}: {e}")
                conn.rollback()

        conn.commit()
        print(f"\n🎉 TERMINÉ — {inserted}/{total} parfums traités.")

    cur.close()
    conn.close()

if __name__ == "__main__":
    main()
