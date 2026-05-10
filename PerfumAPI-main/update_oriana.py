import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from scraper.scrape import FragranticaScraper
import psycopg2

DATABASE_URL = "postgresql://postgres:ScentLibrary2001.@db.zfihiworxbondkyxjgyy.supabase.co:5432/postgres"

def main():
    scraper = FragranticaScraper()
    # Oriana URL (from screenshot data or guessed)
    url = "https://www.fragrantica.com/perfume/Parfums-de-Marly/Oriana-69134.html"
    print(f"Scraping {url}...")
    data = scraper.extract_perfume_details(url)
    
    if data:
        print(f"Found accords: {data['accords']}")
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("UPDATE perfumes SET accords = %s WHERE perfume_url = %s", (data['accords'], url))
        conn.commit()
        print("Updated!")
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
