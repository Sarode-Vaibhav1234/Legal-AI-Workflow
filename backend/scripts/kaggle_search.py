import sys
import json
import os
import urllib.parse

# ─────────────────────────────────────────────
# CURATED FALLBACK: Real Indian SC case references
# Used when Kaggle credentials are not configured OR the dataset isn't cached.
# ─────────────────────────────────────────────
FALLBACK_CASES = [
    {
        "source": "SC India – Landmark Judgment",
        "title": "Bachan Singh v. State of Punjab (1980)",
        "summary": "The Supreme Court upheld the constitutionality of the death penalty under IPC Sec 302, but restricted it to the 'rarest of rare cases'. Established the doctrine of weighing aggravating vs mitigating circumstances."
    },
    {
        "source": "SC India – Landmark Judgment",
        "title": "State of Maharashtra v. M.H. George (1965)",
        "summary": "A foundational case on mens rea and strict liability offences. The court held that for statutory offences, intent may not be required if the legislature clearly excluded it."
    },
    {
        "source": "SC India – Landmark Judgment",
        "title": "K.M. Nanavati v. State of Maharashtra (1961)",
        "summary": "A landmark case on sudden provocation and culpable homicide vs murder. The SC ruled that provocation must be grave and sudden, and the act must be done in the heat of passion."
    },
    {
        "source": "SC India – Landmark Judgment",
        "title": "Vishaka v. State of Rajasthan (1997)",
        "summary": "Laid down mandatory guidelines for prevention of sexual harassment in the workplace (Vishaka Guidelines), which later formed the basis of the POSH Act 2013."
    },
    {
        "source": "SC India – Landmark Judgment",
        "title": "Olga Tellis v. Bombay Municipal Corporation (1985)",
        "summary": "The right to livelihood is part of the right to life under Article 21. State cannot evict citizens without following due process and providing alternative accommodation."
    },
    {
        "source": "SC India – Landmark Judgment",
        "title": "Hussainara Khatoon v. State of Bihar (1979)",
        "summary": "Established the right to speedy trial as a fundamental right under Article 21. Led to the release of thousands of undertrial prisoners who had served longer than the prescribed sentence."
    },
    {
        "source": "SC India – Corporate / Civil",
        "title": "Satyam Computer Services Ltd. v. SEBI (2011)",
        "summary": "A landmark corporate fraud case. The SC reinforced SEBI's power to investigate and prosecute corporate fraud, and affirmed stringent penalties under the Companies Act."
    },
    {
        "source": "SC India – Family Law",
        "title": "Navtej Singh Johar v. Union of India (2018)",
        "summary": "Decriminalized consensual same-sex relations among adults by reading down Section 377 IPC. Affirmed dignity, equality, and autonomy as core constitutional values."
    }
]

def get_indian_kanoon_url(title):
    query = urllib.parse.quote(title)
    return f"https://indiankanoon.org/search/?q={query}"

def score_cases(query, cases):
    """Score cases by keyword relevance to the query."""
    keywords = query.lower().split()
    scored = []
    for case in cases:
        text = (case["title"] + " " + case["summary"]).lower()
        score = sum(1 for kw in keywords if kw in text)
        # Add URL dynamically
        case["url"] = get_indian_kanoon_url(case["title"])
        scored.append((score, case))
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored]

def try_local_archive_search(query):
    """Search for cases in the local 'archive' folder based on filenames."""
    # Possible paths for the archive folder
    possible_paths = [
        os.path.join(os.path.dirname(__file__), "..", "..", "archive", "supreme_court_judgments"),
        os.path.join("D:", os.sep, "Projects", "Legal AI Lawer Workflow", "archive", "supreme_court_judgments"),
        os.path.join(os.getcwd(), "archive", "supreme_court_judgments")
    ]
    
    archive_path = None
    for p in possible_paths:
        if os.path.exists(p):
            archive_path = p
            break
            
    if not archive_path:
        return None

    # Better keyword extraction: filter out noise
    keywords = query.lower().split()
    
    # Common legal noise and state names that cause irrelevant matches
    stop_words = {
        'the', 'and', 'for', 'with', 'against', 'from', 'this', 'that', 'case', 'others', 'other', 
        'state', 'union', 'india', 'judgment', 'vs', 'versus', 'on', 'in', 'of', 'at', 'by', 'an', 
        'is', 'it', 'was', 'another', 'ors', 'anr', 'appeal', 'civil', 'criminal', 'special',
        'maharashtra', 'delhi', 'bihar', 'punjab', 'haryana', 'karnataka', 'kerala', 'tamil', 'nadu',
        'rajasthan', 'gujarat', 'pradesh', 'madhya', 'uttar', 'west', 'bengal'
    }
    
    # High-value legal keywords
    legal_weights = {
        'murder': 100, 'cruelty': 100, 'harassment': 100, 'theft': 100, 'rape': 100,
        'dowry': 100, 'divorce': 80, 'maintenance': 80, 'custody': 80, 'property': 70,
        'fraud': 70, 'cheating': 70, 'bribery': 70, 'corruption': 70, 'land': 50,
        'tenant': 50, 'eviction': 50, 'contract': 50, 'arbitration': 50
    }
    
    # Filter keywords: must be > 2 chars and not a stop word
    filtered_keywords = [kw for kw in keywords if len(kw) > 2 and kw not in stop_words]
    
    if not filtered_keywords:
        filtered_keywords = list(set(keywords))

    matches = []
    try:
        # Walk through year folders (1950-2025)
        for year_folder in os.listdir(archive_path):
            year_path = os.path.join(archive_path, year_folder)
            if os.path.isdir(year_path) and year_folder.isdigit():
                for filename in os.listdir(year_path):
                    if filename.lower().endswith(".pdf"):
                        name_clean = filename.replace("_", " ").lower()
                        
                        score = 0
                        for kw in filtered_keywords:
                            if kw in name_clean:
                                # Give weight based on legal importance or exact word match
                                weight = legal_weights.get(kw, len(kw) * 2)
                                
                                if f" {kw} " in f" {name_clean} ":
                                    score += (weight * 3) # Exact word match boost
                                else:
                                    score += weight
                        
                        if score > 15: # Higher threshold for better relevance
                            title = filename.replace(".pdf", "").replace(".PDF", "").replace("_", " ")
                            matches.append((score, {
                                "source": f"Local Archive: SC Judgments ({year_folder})",
                                "title": title,
                                "summary": f"Supreme Court judgment from {year_folder}. Case involving {title}.",
                                "url": get_indian_kanoon_url(title)
                            }))
    except Exception:
        return None

    # Sort by score and return top 3
    matches.sort(key=lambda x: x[0], reverse=True)
    return [m[1] for m in matches[:3]]

def try_kaggle_download(query):
    """Try to load and query the Kaggle dataset. Returns list of 3 cases or raises."""
    try:
        import kagglehub
        import pandas as pd
    except ImportError:
        raise RuntimeError("Missing dependencies")

    # Try to download
    path = None
    import threading

    def download():
        nonlocal path
        try:
            path = kagglehub.dataset_download("adarshsingh0903/legal-dataset-sc-judgments-india-19502024")
        except:
            path = None

    thread = threading.Thread(target=download, daemon=True)
    thread.start()
    thread.join(timeout=15)  # Shorter timeout

    if path is None:
        raise RuntimeError("Kaggle download timed out or failed")

    # Load dataset
    csv_files = [f for f in os.listdir(path) if f.endswith('.csv')]
    if not csv_files:
        raise RuntimeError("No CSV in dataset")

    df = pd.read_csv(os.path.join(path, csv_files[0]), nrows=10000, on_bad_lines='skip')
    text_cols = [c for c in df.columns if df[c].dtype == 'object']
    
    keywords = query.lower().split()
    sample_df = df.sample(min(2000, len(df)))

    def score_row(row):
        text = " ".join([str(x).lower() for x in row if str(x) != 'nan'])
        return sum(1 for kw in keywords if kw in text)

    sample_df = sample_df.copy()
    sample_df['score'] = sample_df[text_cols].apply(score_row, axis=1)
    top_cases = sample_df.nlargest(3, 'score')

    results = []
    for _, row in top_cases.iterrows():
        title_col = next((c for c in df.columns if 'name' in c.lower() or 'title' in c.lower()), None)
        title = str(row[title_col]) if title_col and str(row.get(title_col, '')) != 'nan' else "SC Judgment Reference"
        summary_col = next((c for c in df.columns if 'sum' in c.lower() or 'judg' in c.lower() or 'text' in c.lower()), text_cols[0])
        summary_val = str(row.get(summary_col, ''))
        summary = summary_val[:300] + "..." if len(summary_val) > 300 else summary_val
        results.append({
            "source": "Kaggle: SC Judgments (1950-2024)",
            "title": title,
            "summary": summary,
            "url": get_indian_kanoon_url(title)
        })
    return results

def main():
    if len(sys.argv) < 2:
        print(json.dumps([]))
        return
        
    query = sys.argv[1]

    # Try Local Archive first (Highest priority if available)
    try:
        local_results = try_local_archive_search(query)
        if local_results:
            print(json.dumps(local_results))
            return
    except Exception:
        pass

    # Try Kaggle second
    try:
        results = try_kaggle_download(query)
        if results:
            print(json.dumps(results))
            return
    except Exception as e:
        pass

    # Fallback: score the curated list and return top 3
    ranked = score_cases(query, FALLBACK_CASES)
    print(json.dumps(ranked[:3]))

if __name__ == "__main__":
    main()
