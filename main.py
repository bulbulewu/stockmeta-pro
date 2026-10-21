"""
StockMeta Pro - Desktop Application Entry Point (Python 3.11+ / PyQt6)
"""

import sys
import os
from dotenv import load_dotenv

load_dotenv()

def main():
    try:
        from PyQt6.QtWidgets import QApplication
        from PyQt6.QtCore import Qt
        from ui.main_window import StockMetaMainWindow

        # Enable High-DPI scaling
        QApplication.setHighDpiScaleFactorRoundingPolicy(
            Qt.HighDpiScaleFactorRoundingPolicy.PassThrough
        )

        app = QApplication(sys.argv)
        app.setApplicationName("StockMeta Pro")
        app.setOrganizationName("StockMeta")

        window = StockMetaMainWindow()
        window.show()

        sys.exit(app.exec())
    except ImportError as e:
        print(f"PyQt6 or dependency not found in current environment: {e}")
        print("To run the native Python desktop app, install requirements:")
        print("  pip install -r requirements.txt")
        print("  python main.py")


if __name__ == "__main__":
    main()
