import csv
CSV_PATH = r"c:\Users\Ruben\Desktop\ScentLibrary\fra_cleaned.csv"
with open(CSV_PATH, mode='r', encoding='latin-1') as f:
    reader = csv.DictReader(f, delimiter=';')
    first_row = next(reader)
    print("Keys:", list(first_row.keys()))
    print("Values:", list(first_row.values()))
