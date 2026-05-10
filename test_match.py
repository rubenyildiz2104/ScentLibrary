import os
import csv
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def diagnostic():
    csv_path = 'fra_cleaned.csv'
    
    # Get 5 perfumes from DB
    response = supabase.table("Perfume").select("id, name, brand, image_url").limit(5).execute()
    db_perfumes = response.data
    
    print(f"📊 DB Examples:")
    for p in db_perfumes:
        print(f" - '{p['name']}' by '{p['brand']}' (Image: {p['image_url']})")
        
    print(f"\n📊 CSV Examples:")
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        count = 0
        for row in reader:
            print(f" - '{row['Perfume']}' by '{row['Brand']}'")
            count += 1
            if count >= 5: break

    print(f"\n🔍 Attempting match for first DB perfume...")
    p = db_perfumes[0]
    p_name = p['name'].lower().strip()
    p_brand = str(p['brand']).lower().strip()
    
    found = False
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            csv_name = row['Perfume'].lower().strip()
            csv_brand = row['Brand'].lower().strip()
            
            if csv_name == p_name:
                print(f"   ✅ Name match found for '{row['Perfume']}'")
                if csv_brand == p_brand:
                    print(f"   ✅ Brand match found for '{row['Brand']}'")
                    found = True
                    break
                else:
                    print(f"   ❌ Brand mismatch: '{csv_brand}' vs '{p_brand}'")
    
    if not found:
        print(f"   ❌ No full match found for '{p['name']}' by '{p['brand']}'")

if __name__ == "__main__":
    diagnostic()
