"""
StockMeta Pro - Dual AI Worker (Google Gemini Free API & xAI Grok API)
Generates 100% microstock-compliant SEO metadata for Adobe Stock, Shutterstock, Freepik, Vecteezy, and Getty Images.
Features structured JSON outputs, 4-second rate-limiting pacing, exponential backoff on HTTP 429,
and automatic companion raster detection for EPS files.
"""

import json
import time
import os
import base64
import urllib.request
import urllib.error
from typing import List, Optional, Dict, Any

try:
    from pydantic import BaseModel, Field
except ImportError:
    class BaseModel: pass
    def Field(*args, **kwargs): return None

try:
    from PyQt6.QtCore import QObject, QRunnable, pyqtSignal, pyqtSlot
except ImportError:
    class QObject: pass
    class QRunnable: pass
    def pyqtSignal(*args): return None
    def pyqtSlot(*args): return lambda fn: fn

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None

from core.preview_extractor import PreviewExtractor


MICROSTOCK_SEO_SYSTEM_PROMPT = """You are an elite Microstock SEO Specialist for Adobe Stock, Shutterstock, and Freepik. Analyze the provided image and return ONLY a valid JSON object with the following keys:
1. `title`: 
   - Length: 55 to 70 characters maximum.
   - Format: [Primary Niche/Subject] + [Visual Style, e.g., Line Icons Set / Silhouette / Vector] + [Commercial Context].
   - Use Title Case. Do NOT use workflow words ('upscaled', 'isolated', 'ember', 'AI generated', 'set of').
2. `description`:
   - Length: 120 to 150 characters.
   - Write one natural, grammatically complete sentence describing the core subject, specific visible elements, and commercial use cases (e.g., 'for packaging, web UI, and branding design').
3. `keywords`:
   - Array of exactly 45 single words or natural 2-word phrases, all lowercase.
   - SLOTS 1-10 (CRITICAL PRIORITY): Must contain the exact primary niche phrase, core subject nouns, and visual style (`line icon`, `icon set`, `outline`, `vector`).
   - SLOTS 11-30 (LITERAL OBJECTS): List the exact physical objects or symbols visible in the artwork (e.g., specific tools, items, icons).
   - SLOTS 31-45 (CONCEPT & USE CASE): Industry categories, commercial uses (`branding`, `packaging`, `infographic`, `symbol`, `pictogram`).
   - STRICT BAN: Never invert two-word phrases (e.g., never output both 'soap making' and 'making soap'). No spam, no random adjectives.
4. `seo_filename`:
   - Lowercase, hyphen-separated slug based on the title (max 50 characters, no stop words)."""


class MicrostockMetadataSchema(BaseModel):
    title: str = Field(description="55 to 70 characters Title Case without workflow words")
    description: str = Field(description="120 to 150 characters single complete sentence")
    keywords: List[str] = Field(description="Strictly 45 keywords ordered by microstock priority")
    seo_filename: str = Field(description="Lowercase hyphen-separated slug max 50 chars")


class WorkerSignals(QObject):
    started = pyqtSignal(str) # file_id
    finished = pyqtSignal(str, dict) # file_id, result_dict
    error = pyqtSignal(str, str) # file_id, error_message
    progress = pyqtSignal(int, int) # completed, total


class DualAiWorker(QRunnable):
    def __init__(
        self,
        file_id: str,
        file_path: str,
        image_bytes: Optional[bytes] = None,
        provider: str = "gemini",  # "gemini" or "grok"
        gemini_api_key: Optional[str] = None,
        grok_api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        is_vector: bool = False,
        is_video: bool = False,
    ):
        super().__init__()
        self.file_id = file_id
        self.file_path = file_path
        self.image_bytes = image_bytes
        self.provider = (provider or "gemini").lower()
        self.gemini_api_key = gemini_api_key or os.getenv("GEMINI_API_KEY", "")
        self.grok_api_key = grok_api_key or os.getenv("GROK_API_KEY", os.getenv("XAI_API_KEY", ""))
        self.model_name = model_name or ("gemini-2.5-flash" if self.provider == "gemini" else "grok-2-vision-latest")
        self.is_vector = is_vector
        self.is_video = is_video
        self.signals = WorkerSignals()

    @pyqtSlot()
    def run(self):
        self.signals.started.emit(self.file_id)

        # EPS Vision Preview Handling: Ensure visual raster bytes exist
        if not self.image_bytes:
            self.image_bytes = PreviewExtractor.extract_preview(self.file_path)

        # Call with dual provider failover: Primary -> Secondary
        if self.provider == "grok":
            pipeline = [("grok", self._call_grok), ("gemini", self._call_gemini)]
        else:
            pipeline = [("gemini", self._call_gemini), ("grok", self._call_grok)]

        last_error = "No API keys configured"
        for prov_name, call_fn in pipeline:
            try:
                data = call_fn()
                if data:
                    self.signals.finished.emit(self.file_id, data)
                    return
            except Exception as e:
                last_error = f"{prov_name} error: {e}"
                time.sleep(1.0)
                continue

        self.signals.error.emit(self.file_id, last_error)

    def _call_gemini(self) -> Dict[str, Any]:
        """Calls Google Gemini 2.5 Flash Free Tier with 4s rate-limiting & backoff"""
        if not self.gemini_api_key:
            raise ValueError("Missing GEMINI_API_KEY")

        retries = 4
        delays = [4.0, 8.0, 12.0, 16.0]

        for attempt in range(retries):
            try:
                # 4-second rate-limiting pacing delay for Gemini Free Tier (15 RPM limit)
                time.sleep(4.0)

                client = genai.Client(api_key=self.gemini_api_key)
                response = client.models.generate_content(
                    model=self.model_name if "gemini" in self.model_name else "gemini-2.5-flash",
                    contents=[
                        types.Part.from_bytes(data=self.image_bytes, mime_type="image/jpeg"),
                        f"Analyze this image ({os.path.basename(self.file_path)}) and return structured microstock SEO metadata.",
                    ],
                    config=types.GenerateContentConfig(
                        system_instruction=MICROSTOCK_SEO_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=MicrostockMetadataSchema,
                        temperature=0.2,
                    ),
                )

                return json.loads(response.text)

            except Exception as e:
                err_str = str(e)
                if ("429" in err_str or "quota" in err_str.lower() or "503" in err_str or "RESOURCE_EXHAUSTED" in err_str) and attempt < retries - 1:
                    time.sleep(delays[attempt])
                    continue
                raise e

    def _call_grok(self) -> Dict[str, Any]:
        """Calls xAI Grok 2 Vision endpoint (https://api.x.ai/v1/chat/completions) with json_object format"""
        if not self.grok_api_key:
            raise ValueError("Missing GROK_API_KEY or XAI_API_KEY")

        b64_img = base64.b64encode(self.image_bytes).decode('utf-8')
        data_url = f"data:image/jpeg;base64,{b64_img}"

        payload = {
            "model": "grok-2-vision-latest",
            "messages": [
                {"role": "system", "content": MICROSTOCK_SEO_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Analyze this image ({os.path.basename(self.file_path)}) and output strictly valid JSON matching the schema."},
                        {"type": "image_url", "image_url": {"url": data_url}},
                    ],
                },
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
        }

        req = urllib.request.Request(
            "https://api.x.ai/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.grok_api_key}",
            },
            method="POST",
        )

        with urllib.request.urlopen(req, timeout=45) as resp:
            resp_body = resp.read().decode("utf-8")
            res_json = json.loads(resp_body)
            raw_text = res_json["choices"][0]["message"]["content"]
            return json.loads(raw_text)


# Backwards compatibility alias
GeminiWorker = DualAiWorker
