from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, Response
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from table_extractor import TableExtractor

app = FastAPI(title="Table Extractor AI API")

# Basic Rate Limiting
from collections import defaultdict
import time
from fastapi import Request

RATE_LIMIT = 10 # 10 requests per minute
request_times = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host
    now = time.time()
    
    # Clean up old requests (older than 60s)
    request_times[client_ip] = [t for t in request_times[client_ip] if now - t < 60]
    
    if len(request_times[client_ip]) >= RATE_LIMIT:
        return Response(content="Rate limit exceeded. Try again in a minute.", status_code=429)
    
    request_times[client_ip].append(now)
    response = await call_next(request)
    return response

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For production, restrict this to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

extractor = TableExtractor()

class ExtractRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    data: List[Dict[str, Any]]
    columns: List[str]

@app.post("/extract")
async def extract_tables(req: ExtractRequest):
    if not req.url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    result = extractor.fetch_tables(req.url)
    return result

@app.post("/download")
async def download_csv(req: DownloadRequest):
    try:
        csv_content = extractor.export_csv(req.data, req.columns)
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": "attachment; filename=extracted_table.csv"
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
