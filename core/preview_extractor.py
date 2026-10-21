"""
StockMeta Pro - Preview Extractor Service (Python / PyQt6)
Generates in-memory JPEG/PNG preview buffers for Gemini Vision API.
"""

import io
import os
from typing import Optional, Tuple
try:
    from PIL import Image
except ImportError:
    Image = None

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from PyQt6.QtCore import QByteArray, QBuffer, QIODevice
    from PyQt6.QtGui import QImage, QPainter
    from PyQt6.QtSvg import QSvgRenderer
except ImportError:
    QSvgRenderer = None
    QImage = None


class PreviewExtractor:
    @staticmethod
    def extract_preview(file_path: str, companion_preview_path: Optional[str] = None, raw_bytes: Optional[bytes] = None) -> bytes:
        """
        Extracts or renders a 1024x1024 max JPEG buffer for Gemini/Grok Vision.
        1. If companion_preview_path is given, or if a matching .jpg/.png companion file exists
           in the same folder, uses it directly (zero-overhead).
        2. For .eps files without companion raster, automatically extracts the embedded TIFF preview
           from the binary DOS EPS header (bytes 20-28), embedded XMP thumbnail, or renders in memory
           with PIL.Image.open(eps_path) into an RGB JPEG byte stream.
        """
        # Check explicit or directory companion file
        companion = companion_preview_path or PreviewExtractor.find_companion_raster(file_path)
        if companion and os.path.exists(companion):
            return PreviewExtractor._resize_image(companion)

        ext = os.path.splitext(file_path)[1].lower()

        if ext in ('.jpg', '.jpeg', '.png'):
            return PreviewExtractor._resize_image(file_path)

        elif ext == '.svg':
            return PreviewExtractor._render_svg(file_path)

        elif ext in ('.eps', '.ai'):
            return PreviewExtractor._render_eps(file_path, eps_bytes=raw_bytes)

        elif ext in ('.mp4', '.mov'):
            return PreviewExtractor._extract_video_storyboard(file_path)

        # Fallback to standard resize
        return PreviewExtractor._resize_image(file_path)

    @staticmethod
    def find_companion_raster(file_path: str) -> Optional[str]:
        """Finds companion .jpg, .jpeg, or .png with identical base name in same directory."""
        directory, filename = os.path.split(file_path)
        base = os.path.splitext(filename)[0].lower()
        if not directory or not os.path.exists(directory):
            return None

        for entry in os.listdir(directory):
            entry_base, entry_ext = os.path.splitext(entry)
            if entry_ext.lower() in ('.jpg', '.jpeg', '.png') and entry_base.lower() == base:
                companion_path = os.path.join(directory, entry)
                if os.path.isfile(companion_path):
                    return companion_path
        return None

    @staticmethod
    def _render_eps(eps_path: str, eps_bytes: Optional[bytes] = None) -> bytes:
        """
        Automatic EPS In-Memory Preview Extractor (No JPG Required):
        1. When the user selects an .eps file, extracts embedded TIFF preview directly from
           the binary DOS EPS header (bytes 20-28 specify TIFF byte offset and length).
        2. OR extracts XMP embedded JPEG thumbnail (<xmpGImg:image>).
        3. OR uses PIL.Image.open(eps_path) to load the PostScript preview in memory.
        4. Converts to an RGB JPEG/PNG byte stream in memory (io.BytesIO) and returns the bytes
           to send directly to Gemini (gemini-2.5-flash) or Grok Vision API without ever needing
           a companion .jpg file.
        """
        data = eps_bytes
        if data is None and eps_path and os.path.exists(eps_path):
            try:
                with open(eps_path, 'rb') as f:
                    data = f.read()
            except Exception:
                data = None

        if not data and not eps_path:
            return b""

        # 1. Binary DOS EPS Header TIFF extraction (0xC5, 0xD0, 0xD3, 0xC6)
        # Bytes 20-27: 32-bit unsigned little-endian integers for tiff_offset and tiff_len
        if data and len(data) >= 30 and data[0:4] == b'\xc5\xd0\xd3\xc6':
            try:
                import struct
                tiff_offset, tiff_len = struct.unpack('<II', data[20:28])
                if tiff_offset > 0 and tiff_len > 0 and tiff_offset + tiff_len <= len(data):
                    tiff_bytes = data[tiff_offset:tiff_offset + tiff_len]
                    if Image is not None:
                        with Image.open(io.BytesIO(tiff_bytes)) as img:
                            img = img.convert('RGB')
                            img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                            buf = io.BytesIO()
                            img.save(buf, format='JPEG', quality=85)
                            return buf.getvalue()
            except Exception:
                pass

        # 2. XMP embedded JPEG thumbnail extraction (<xmpGImg:image>)
        if data:
            try:
                import re
                import base64
                match = re.search(b'<xmpGImg:image>([\\s\\S]*?)</xmpGImg:image>', data[:600000], re.IGNORECASE)
                if match and Image is not None:
                    raw_b64 = re.sub(b'[\\s\\r\\n&#xA;&#xD;]+', b'', match.group(1))
                    img_data = base64.b64decode(raw_b64)
                    with Image.open(io.BytesIO(img_data)) as img:
                        img = img.convert('RGB')
                        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                        buf = io.BytesIO()
                        img.save(buf, format='JPEG', quality=85)
                        return buf.getvalue()
            except Exception:
                pass

        # 3. Use PIL.Image.open to load PostScript vector in memory
        if Image is not None:
            try:
                if eps_path and os.path.exists(eps_path):
                    with Image.open(eps_path) as img:
                        img = img.convert('RGB')
                        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                        buf = io.BytesIO()
                        img.save(buf, format='JPEG', quality=85)
                        return buf.getvalue()
                elif data:
                    with Image.open(io.BytesIO(data)) as img:
                        img = img.convert('RGB')
                        img.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
                        buf = io.BytesIO()
                        img.save(buf, format='JPEG', quality=85)
                        return buf.getvalue()
            except Exception:
                pass

        # 4. Fallback placeholder
        if Image is not None:
            placeholder = Image.new('RGB', (512, 512), color=(30, 41, 59))
            buf = io.BytesIO()
            placeholder.save(buf, format='JPEG', quality=80)
            return buf.getvalue()

        return b""

    @staticmethod
    def _extract_video_storyboard(video_path: str) -> bytes:
        """Extracts 3 keyframes at 15%, 50%, and 85% duration, stitched horizontally."""
        if cv2 is None:
            # Fallback placeholder
            placeholder = Image.new('RGB', (1440, 270), color=(15, 23, 42))
            buf = io.BytesIO()
            placeholder.save(buf, format='JPEG', quality=80)
            return buf.getvalue()

        cap = cv2.VideoCapture(video_path)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        timestamps = [
            max(0, int(total_frames * 0.15)),
            max(0, int(total_frames * 0.50)),
            max(0, int(total_frames * 0.85)),
        ]

        frames = []
        for frame_idx in timestamps:
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if ret:
                rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                img = Image.fromarray(rgb)
                img = img.resize((480, 270), Image.Resampling.LANCZOS)
                frames.append(img)
        cap.release()

        if len(frames) == 3:
            # Stitch into 1440x270 horizontal sprite
            sprite = Image.new('RGB', (1440, 270))
            sprite.paste(frames[0], (0, 0))
            sprite.paste(frames[1], (480, 0))
            sprite.paste(frames[2], (960, 0))
            buf = io.BytesIO()
            sprite.save(buf, format='JPEG', quality=85)
            return buf.getvalue()

        # Fallback placeholder
        placeholder = Image.new('RGB', (1440, 270), color=(15, 23, 42))
        buf = io.BytesIO()
        placeholder.save(buf, format='JPEG', quality=80)
        return buf.getvalue()
