"""
StockMeta Pro Studio - Hugging Face Spaces Runner
Dual AI Microstock Metadata Workstation
"""
import os
import subprocess
import sys

def main():
    port = os.environ.get("PORT", "7860")
    print(f"[StockMeta Pro] Launching server on port {port}...")
    try:
        # Run npm run dev (tsx server.ts)
        subprocess.run(["npm", "run", "dev"], check=True)
    except Exception as e:
        print(f"[StockMeta Pro] Server error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
