import requests
import pandas as pd
from bs4 import BeautifulSoup
import io
import json

class TableExtractor:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }

    def fetch_tables(self, url: str):
        try:
            # Add basic validation for scheme
            if not url.startswith("http://") and not url.startswith("https://"):
                url = "https://" + url

            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            html_content = response.text
            
            # Simple check if there are any table tags at all
            if "<table" not in html_content.lower():
                return {"success": False, "message": "No HTML tables found. This could be a dynamic JS-heavy website or simply contains no tables.", "tables": []}
            
            try:
                # Use pandas to extract tables
                tables = pd.read_html(io.StringIO(html_content))
            except ValueError:
                return {"success": False, "message": "Pandas could not parse tables from the HTML.", "tables": []}

            processed_tables = []
            
            for i, df in enumerate(tables):
                # Clean up the dataframe
                df = df.dropna(how='all') # drop completely empty rows
                df = df.dropna(axis=1, how='all') # drop completely empty columns
                df = df.drop_duplicates()
                df = df.fillna("") # Fill NaN with empty string
                
                # If dataframe is empty after cleaning, skip it
                if df.empty:
                    continue

                # Ensure columns are strings to avoid json serialization issues
                df.columns = [str(c) for c in df.columns]

                # Convert to dict
                records = df.to_dict(orient='records')
                
                # Get headers
                columns = df.columns.tolist()
                
                # Basic preview (first 10 rows)
                preview = records[:10]
                
                processed_tables.append({
                    "id": i,
                    "columns": columns,
                    "data": records,
                    "preview": preview,
                    "row_count": len(records),
                    "col_count": len(columns)
                })

            if not processed_tables:
                return {"success": False, "message": "Tables were found but contained no valid data after cleaning.", "tables": []}

            return {"success": True, "message": f"Successfully extracted {len(processed_tables)} tables.", "tables": processed_tables}
            
        except requests.exceptions.RequestException as e:
            return {"success": False, "message": f"Failed to fetch URL: {str(e)}", "tables": []}
        except Exception as e:
            return {"success": False, "message": f"An unexpected error occurred: {str(e)}", "tables": []}

    def export_csv(self, data: list, columns: list) -> str:
        df = pd.DataFrame(data, columns=columns)
        return df.to_csv(index=False)
