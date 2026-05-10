import os
import csv
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client
from dotenv import load_dotenv
import time
import random
import re

# Load environment variables
# Try to load from root first, then from backend folder
load_dotenv()
if not os.getenv("SUPABASE_URL"):
    load_dotenv("apps/backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Supabase credentials missing in .env")
    exit()

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
]

def slugify(text):
    """Converts display name to Fragrantica-style slug (kebab-case)"""
    if not text: return ""
    # Remove special chars, replace spaces with hyphens
    text = text.lower().strip()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s]+', '-', text)
    return text

session = requests.Session()

def scrape_image_url(frag_url):
    try:
        headers = {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
            'Cache-Control': 'max-age=0',
        }
        
        # Randomly visit homepage first to get cookies
        if random.random() < 0.2:
            session.get("https://www.fragrantica.com/", headers=headers, timeout=10)
            time.sleep(random.uniform(2, 5))

        response = session.get(frag_url, headers=headers, timeout=15)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Itemprop image is usually the most stable
            img_tag = soup.find('img', {'itemprop': 'image'})
            if img_tag and img_tag.get('src'):
                return img_tag.get('src')
            
            # Fallback 1: look for the first image in the main content div
            main_img = soup.select_one('#main-content img')
            if main_img and main_img.get('src'):
                return main_img.get('src')
                
        elif response.status_code == 429:
            print("⚠️ Rate limited (429). Waiting 60s before stopping...")
            time.sleep(60)
            return "RETRY"
        else:
            print(f"📡 Status {response.status_code} for {frag_url}")
            
    except Exception as e:
        print(f"❌ Error scraping: {e}")
    return None

def update_images():
    print("🚀 Starting image update with SLUG matching...")
    
    csv_path = 'fra_cleaned.csv'
    if not os.path.exists(csv_path):
        print(f"❌ {csv_path} not found")
        return
        
    # Load CSV into a dict for faster lookup
    # Key: (slug_name, slug_brand), Value: url
    csv_data = {}
    with open(csv_path, 'r', encoding='latin-1') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            csv_data[(row['Perfume'].lower(), row['Brand'].lower())] = row['url']
            
    print(f"📖 Loaded {len(csv_data)} entries from CSV")

    # Get batch of perfumes without images (null or empty string)
    response = supabase.table("perfumes").select("id, name, brand").or_("image_url.is.null,image_url.eq.").limit(50).execute()
    db_perfumes = response.data
    
    if not db_perfumes:
        print("✅ No perfumes to update.")
        return

    # Shuffle to avoid hitting the same brand/sub-url too fast
    random.shuffle(db_perfumes)
    
    print(f"🔍 Processing batch of {len(db_perfumes)}...")

    updated_count = 0
    for p in db_perfumes:
        p_slug = slugify(p['name'])
        b_slug = slugify(p['brand'])
        
        # Try exact slug match
        url = csv_data.get((p_slug, b_slug))
        
        if url:
            print(f"📡 Found URL for {p['name']}: {url}")
            img_url = scrape_image_url(url)
            
            if img_url == "RETRY":
                print("🛑 Stopping batch due to rate limit.")
                break
                
            if img_url:
                supabase.table("perfumes").update({"image_url": img_url}).eq("id", p['id']).execute()
                print(f"✅ Updated image for {p['name']}")
                updated_count += 1
            
            # Increased wait to avoid ban
            delay = random.uniform(15, 25)
            print(f"⏳ Waiting {delay:.1f}s...")
            time.sleep(delay)
        else:
            print(f"❓ No CSV match for {p['name']} (slug: {p_slug})")

    print(f"🏁 Finished batch. Updated {updated_count} images.")

if __name__ == "__main__":
    update_images()
