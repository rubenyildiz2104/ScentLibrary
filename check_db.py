import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
if not os.getenv("SUPABASE_URL"):
    load_dotenv("apps/backend/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def check_db():
    print("Checking database content...")
    
    try:
        # 1. Check total count
        response = supabase.table("perfumes").select("count", count="exact").limit(0).execute()
        print(f"Total perfumes in DB: {response.count}")
        
        # 2. Check a few entries
        response = supabase.table("perfumes").select("*").limit(10).execute()
        print("\nFirst 10 entries:")
        for p in response.data:
            img = p.get('image_url')
            print(f" - ID: {p['id']}, Name: {p['name']}, Brand: {p['brand']}, Image: '{img}' (Type: {type(img)})")
            
        # 3. Specifically check for Nulls
        null_res = supabase.table("perfumes").select("id").is_("image_url", "null").limit(5).execute()
        print(f"\nNull image_url count in batch: {len(null_res.data)}")

        empty_res = supabase.table("perfumes").select("id").eq("image_url", "").limit(5).execute()
        print(f"Empty string image_url count in batch: {len(empty_res.data)}")
        
    except Exception as e:
        print(f"Error during check: {e}")

if __name__ == "__main__":
    check_db()
