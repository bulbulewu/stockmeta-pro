"""
StockMeta Pro - 26-Marketplace CSV Exporter (Python)
Generates RFC-compliant CSV files for microstock agencies.
"""

import csv
import os
from datetime import datetime
from typing import List, Dict, Any


MARKETPLACE_SPECS = {
    "adobe_stock": {
        "name": "Adobe Stock",
        "headers": ["Filename", "Title", "Keywords", "Category", "Releases"],
        "delimiter": ",",
        "max_title": 200,
        "max_keywords": 49,
    },
    "shutterstock": {
        "name": "Shutterstock",
        "headers": ["Filename", "Description", "Keywords", "Categories", "Editorial", "Mature content", "Illustration"],
        "delimiter": ",",
        "max_title": 200,
        "max_keywords": 50,
    },
    "freepik": {
        "name": "Freepik",
        "headers": ["File name", "Title", "Keywords", "Prompt", "Model"],
        "delimiter": ";",  # Semicolon delimited!
        "max_title": 100,
        "max_keywords": 50,
    },
    "vecteezy": {
        "name": "Vecteezy",
        "headers": ["Filename", "Title", "Description", "Keywords", "License"],
        "delimiter": ",",
        "max_title": 200,
        "max_keywords": 50,
    },
    "getty_istock": {
        "name": "Getty Images / iStock",
        "headers": ["file name", "created date", "description", "country", "brief code", "title", "keywords"],
        "delimiter": ",",
        "max_title": 250,
        "max_keywords": 50,
    },
    "pond5": {
        "name": "Pond5",
        "headers": ["OriginalFilename", "Title", "Description", "Keywords", "Copyright", "Price"],
        "delimiter": ",",
        "max_title": 150,
        "max_keywords": 50,
    },
    "envato": {
        "name": "Envato Elements",
        "headers": ["File Name", "Name", "Description", "Tags", "Category", "Files Included"],
        "delimiter": ",",
        "max_title": 100,
        "max_keywords": 30,
    },
}


class CsvExporter:
    @staticmethod
    def export_marketplace(marketplace_key: str, items: List[Dict[str, Any]], output_dir: str) -> str:
        spec = MARKETPLACE_SPECS.get(marketplace_key, MARKETPLACE_SPECS["adobe_stock"])
        delimiter = spec.get("delimiter", ",")
        headers = spec["headers"]
        date_str = datetime.now().strftime("%Y%m%d")
        filename = f"{spec['name'].replace(' ', '_')}_Metadata_{date_str}.csv"
        file_path = os.path.join(output_dir, filename)

        with open(file_path, mode="w", newline="", encoding="utf-8") as f:
            writer = csv.writer(f, delimiter=delimiter, quoting=csv.QUOTE_MINIMAL)
            writer.writerow(headers)

            for item in items:
                title = item.get("title", "")[:spec.get("max_title", 200)]
                keywords_list = item.get("keywords", [])[:spec.get("max_keywords", 49)]
                keywords_str = ", ".join(keywords_list)
                desc = item.get("description", "")[:200]
                fname = item.get("filename", "")

                if marketplace_key == "adobe_stock":
                    writer.writerow([fname, title, keywords_str, item.get("category_id", 8), ""])
                elif marketplace_key == "shutterstock":
                    cats = ", ".join(item.get("categories", ["Abstract", "Backgrounds"]))
                    writer.writerow([fname, desc or title, keywords_str, cats, "no", "no", "no"])
                elif marketplace_key == "freepik":
                    writer.writerow([fname, title[:100], keywords_str, "", ""])
                elif marketplace_key == "vecteezy":
                    writer.writerow([fname, title, desc, keywords_str, "Standard"])
                elif marketplace_key == "getty_istock":
                    writer.writerow([fname, date_str, desc, "Global", "", title, keywords_str])
                elif marketplace_key == "pond5":
                    writer.writerow([fname, title, desc, keywords_str, "Standard Contributor", ""])
                else:
                    writer.writerow([fname, title, keywords_str, desc, ""])

        return file_path
