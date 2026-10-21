"""
StockMeta Pro - ExifTool Helper & Verification Utility
Ensures exiftool.exe is available in the local directory or system PATH.
"""

import os
import sys
import shutil
import urllib.request
import zipfile
import io

def find_exiftool() -> str:
    """Finds exiftool.exe in local directory, node_modules, or system PATH."""
    project_root = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.join(project_root, "exiftool.exe"),
        os.path.join(project_root, "bin", "exiftool.exe"),
        os.path.join(project_root, "node_modules", "exiftool-vendored.exe", "bin", "exiftool.exe"),
        os.path.join(project_root, "..", "Dusk Meta App", "assets", "exiftool", "exiftool.exe"),
    ]
    for c in candidates:
        if os.path.exists(c):
            return os.path.abspath(c)

    system_path = shutil.which("exiftool") or shutil.which("exiftool.exe")
    if system_path:
        return system_path

    return ""

def ensure_exiftool() -> str:
    """Ensures exiftool is available, downloading or copying if necessary."""
    existing = find_exiftool()
    if existing:
        print(f"✓ ExifTool found at: {existing}")
        return existing

    project_root = os.path.dirname(os.path.abspath(__file__))
    target_path = os.path.join(project_root, "exiftool.exe")

    # 1. Try copying from local node_modules vendored build
    vendored = os.path.join(project_root, "node_modules", "exiftool-vendored.exe", "bin", "exiftool.exe")
    if os.path.exists(vendored):
        print(f"Copying ExifTool from vendored packages: {vendored} -> {target_path}")
        shutil.copyfile(vendored, target_path)
        return target_path

    # 2. Download standalone Windows build
    print("ExifTool executable not found. Downloading official Windows binary...")
    url = "https://sourceforge.net/projects/exiftool/files/latest/download"
    try:
        print(f"Fetching from {url}...")
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            with zipfile.ZipFile(io.BytesIO(data)) as zf:
                for name in zf.namelist():
                    if name.lower().endswith("exiftool(-k).exe") or name.lower().endswith("exiftool.exe"):
                        with open(target_path, "wb") as out_f:
                            out_f.write(zf.read(name))
                        print(f"✓ Successfully installed ExifTool to {target_path}")
                        return target_path
    except Exception as e:
        print(f"Automatic download note: {e}")
        print("To install ExifTool manually:")
        print("1. Download from https://exiftool.org (Windows Executable)")
        print(f"2. Rename 'exiftool(-k).exe' to 'exiftool.exe' and place in:\n   {project_root}")

    return ""

if __name__ == "__main__":
    path = ensure_exiftool()
    if path:
        import subprocess
        res = subprocess.run([path, "-ver"], capture_output=True, text=True)
        print(f"ExifTool version: {res.stdout.strip()}")
    else:
        sys.exit(1)
