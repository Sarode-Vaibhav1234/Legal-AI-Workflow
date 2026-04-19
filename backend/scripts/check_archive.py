import os
path = r"D:\Projects\Legal AI Lawer Workflow\archive\supreme_court_judgments"
if os.path.exists(path):
    print(f"Path exists: {path}")
    years = os.listdir(path)
    print(f"Found {len(years)} items in archive")
    if len(years) > 0:
        first_year = years[0]
        year_path = os.path.join(path, first_year)
        if os.path.isdir(year_path):
            files = os.listdir(year_path)
            print(f"Found {len(files)} files in {first_year}")
else:
    print(f"Path DOES NOT exist: {path}")
