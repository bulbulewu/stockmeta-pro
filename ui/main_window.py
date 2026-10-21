"""
StockMeta Pro - Main Window (Python / PyQt6)
Sleek dark-mode 3-pane studio interface for batch microstock metadata management.
"""

import os
from typing import List, Dict, Any

try:
    from PyQt6.QtWidgets import (
        QMainWindow, QWidget, QHBoxLayout, QVBoxLayout, QDockWidget,
        QTableWidget, QTableWidgetItem, QHeaderView, QLabel, QPushButton,
        QLineEdit, QTextEdit, QSlider, QCheckBox, QComboBox, QFileDialog,
        QProgressBar, QSplitter, QFrame, QScrollArea
    )
    from PyQt6.QtCore import Qt, QThreadPool
    from PyQt6.QtGui import QIcon, QFont, QColor
except ImportError:
    QMainWindow = object

from core.preview_extractor import PreviewExtractor
from core.gemini_worker import GeminiWorker
from core.metadata_embedder import MetadataEmbedder
from core.csv_exporter import CsvExporter


DARK_QSS = """
QMainWindow, QWidget {
    background-color: #0b0f19;
    color: #e2e8f0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 12px;
}
QTableWidget {
    background-color: #0f172a;
    border: 1px solid #1e293b;
    gridline-color: #1e293b;
    border-radius: 8px;
}
QHeaderView::section {
    background-color: #1e293b;
    color: #94a3b8;
    padding: 6px;
    border: none;
    font-weight: bold;
}
QLineEdit, QTextEdit, QComboBox {
    background-color: #020617;
    border: 1px solid #1e293b;
    border-radius: 6px;
    padding: 6px;
    color: #f8fafc;
}
QLineEdit:focus, QTextEdit:focus, QComboBox:focus {
    border: 1px solid #6366f1;
}
QPushButton {
    background-color: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 14px;
    font-weight: bold;
}
QPushButton:hover {
    background-color: #4338ca;
}
QPushButton#secondaryBtn {
    background-color: #1e293b;
    color: #cbd5e1;
    border: 1px solid #334155;
}
QPushButton#secondaryBtn:hover {
    background-color: #334155;
}
QCheckBox {
    spacing: 6px;
}
QCheckBox::indicator {
    width: 14px;
    height: 14px;
    border-radius: 3px;
    border: 1px solid #475569;
    background-color: #0f172a;
}
QCheckBox::indicator:checked {
    background-color: #6366f1;
    border-color: #6366f1;
}
"""


class StockMetaMainWindow(QMainWindow if QMainWindow != object else object):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("StockMeta Pro - Desktop Studio v2.4")
        self.resize(1380, 850)
        self.setStyleSheet(DARK_QSS)

        self.threadpool = QThreadPool()
        self.batch_files: List[Dict[str, Any]] = []
        self.selected_file_index = -1

        self.init_ui()

    def init_ui(self):
        main_splitter = QSplitter(Qt.Orientation.Horizontal)

        # 1. Left Dock: Marketplace checkboxes & AI settings
        left_widget = self.create_left_panel()
        main_splitter.addWidget(left_widget)

        # 2. Center: Batch table and Dropzone
        center_widget = self.create_center_panel()
        main_splitter.addWidget(center_widget)

        # 3. Right: Live Inspector
        right_widget = self.create_right_panel()
        main_splitter.addWidget(right_widget)

        main_splitter.setStretchFactor(0, 2)
        main_splitter.setStretchFactor(1, 5)
        main_splitter.setStretchFactor(2, 3)

        # Root Layout with Bottom Bar
        root_widget = QWidget()
        root_layout = QVBoxLayout(root_widget)
        root_layout.setContentsMargins(0, 0, 0, 0)
        root_layout.setSpacing(0)
        root_layout.addWidget(main_splitter)

        bottom_bar = self.create_bottom_bar()
        root_layout.addWidget(bottom_bar)

        self.setCentralWidget(root_widget)

    def create_left_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)

        title = QLabel("Marketplaces & AI Config")
        title.setStyleSheet("font-weight: bold; font-size: 13px; color: #f8fafc;")
        layout.addWidget(title)

        # API Key
        layout.addWidget(QLabel("Gemini API Key:"))
        self.api_key_input = QLineEdit()
        self.api_key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.api_key_input.setPlaceholderText("Attached via AI Studio secrets")
        layout.addWidget(self.api_key_input)

        # Target Marketplaces Checkboxes
        layout.addWidget(QLabel("Target Marketplaces (26 Agencies):"))
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_content = QWidget()
        scroll_layout = QVBoxLayout(scroll_content)
        scroll_layout.setSpacing(6)

        self.marketplace_checks = {}
        agencies = [
            "Adobe Stock", "Shutterstock", "Getty Images / iStock", "Freepik",
            "Vecteezy", "Pond5", "Alamy", "Depositphotos", "123RF",
            "Dreamstime", "Envato Elements", "Motion Array", "Storyblocks",
            "Wirestock", "Displate", "Redbubble", "Creative Market",
            "Artgrid / Artlist", "Pixabay", "Unsplash", "Pexels", "Picfair"
        ]
        for agency in agencies:
            cb = QCheckBox(agency)
            cb.setChecked(True)
            self.marketplace_checks[agency] = cb
            scroll_layout.addWidget(cb)

        scroll.setWidget(scroll_content)
        layout.addWidget(scroll)

        # SEO Options
        self.cb_order_weight = QCheckBox("Order by search weight (Adobe Top 10)")
        self.cb_order_weight.setChecked(True)
        layout.addWidget(self.cb_order_weight)

        self.cb_format_tags = QCheckBox("Auto-append format tags (vector/4k)")
        self.cb_format_tags.setChecked(True)
        layout.addWidget(self.cb_format_tags)

        self.cb_shield = QCheckBox("Banned trademark & buzzword shield")
        self.cb_shield.setChecked(True)
        layout.addWidget(self.cb_shield)

        return panel

    def create_center_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)

        # Top Action Bar
        top_bar = QHBoxLayout()
        add_btn = QPushButton("Add Stock Files")
        add_btn.setObjectName("secondaryBtn")
        add_btn.clicked.connect(self.browse_files)
        top_bar.addWidget(add_btn)

        self.analyze_btn = QPushButton("Analyze Batch with Gemini Vision")
        self.analyze_btn.clicked.connect(self.start_batch_analysis)
        top_bar.addWidget(self.analyze_btn)
        layout.addLayout(top_bar)

        # Batch Table
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["Filename", "Format", "Title", "Keywords", "Status"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self.table.itemSelectionChanged.connect(self.on_table_selection_changed)
        layout.addWidget(self.table)

        return panel

    def create_right_panel(self) -> QWidget:
        panel = QWidget()
        layout = QVBoxLayout(panel)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(10)

        title = QLabel("Live Metadata Inspector")
        title.setStyleSheet("font-weight: bold; font-size: 13px; color: #f8fafc;")
        layout.addWidget(title)

        layout.addWidget(QLabel("Asset Title (max 200 chars):"))
        self.title_edit = QLineEdit()
        layout.addWidget(self.title_edit)

        layout.addWidget(QLabel("Description / Caption:"))
        self.desc_edit = QTextEdit()
        self.desc_edit.setMaximumHeight(90)
        layout.addWidget(self.desc_edit)

        layout.addWidget(QLabel("Keywords (Ranked by weight):"))
        self.keywords_edit = QTextEdit()
        layout.addWidget(self.keywords_edit)

        save_btn = QPushButton("Save & Update Asset")
        save_btn.clicked.connect(self.save_current_inspector)
        layout.addWidget(save_btn)

        layout.addStretch()
        return panel

    def create_bottom_bar(self) -> QWidget:
        bar = QFrame()
        bar.setStyleSheet("background-color: #0f172a; border-top: 1px solid #1e293b;")
        layout = QHBoxLayout(bar)
        layout.setContentsMargins(16, 8, 16, 8)

        self.status_label = QLabel("Ready • 0 files in batch")
        layout.addWidget(self.status_label)

        layout.addStretch()

        embed_btn = QPushButton("Embed Metadata into Files")
        embed_btn.setObjectName("secondaryBtn")
        embed_btn.clicked.connect(self.embed_files)
        layout.addWidget(embed_btn)

        export_csv_btn = QPushButton("Export Selected Marketplace CSVs")
        export_csv_btn.clicked.connect(self.export_csvs)
        layout.addWidget(export_csv_btn)

        return bar

    def browse_files(self):
        files, _ = QFileDialog.getOpenFileNames(
            self, "Select Microstock Files", "",
            "Stock Assets (*.jpg *.jpeg *.png *.svg *.eps *.mp4 *.mov)"
        )
        for f in files:
            ext = os.path.splitext(f)[1].lower().replace('.', '')
            self.batch_files.append({
                "path": f,
                "filename": os.path.basename(f),
                "format": ext,
                "title": "",
                "description": "",
                "keywords": [],
                "status": "Pending"
            })
        self.refresh_table()

    def refresh_table(self):
        self.table.setRowCount(len(self.batch_files))
        for row, item in enumerate(self.batch_files):
            self.table.setItem(row, 0, QTableWidgetItem(item["filename"]))
            self.table.setItem(row, 1, QTableWidgetItem(item["format"].upper()))
            self.table.setItem(row, 2, QTableWidgetItem(item["title"] or "—"))
            self.table.setItem(row, 3, QTableWidgetItem(f"{len(item['keywords'])} tags"))
            self.table.setItem(row, 4, QTableWidgetItem(item["status"]))
        self.status_label.setText(f"Batch: {len(self.batch_files)} assets ready")

    def on_table_selection_changed(self):
        rows = self.table.selectedIndexes()
        if rows:
            idx = rows[0].row()
            self.selected_file_index = idx
            item = self.batch_files[idx]
            self.title_edit.setText(item.get("title", ""))
            self.desc_edit.setText(item.get("description", ""))
            self.keywords_edit.setText(", ".join(item.get("keywords", [])))

    def save_current_inspector(self):
        if 0 <= self.selected_file_index < len(self.batch_files):
            item = self.batch_files[self.selected_file_index]
            item["title"] = self.title_edit.text()
            item["description"] = self.desc_edit.toPlainText()
            item["keywords"] = [k.strip() for k in self.keywords_edit.toPlainText().split(',') if k.strip()]
            self.refresh_table()

    def start_batch_analysis(self):
        self.status_label.setText("Analyzing assets with Gemini Vision...")

    def embed_files(self):
        self.status_label.setText("Embedding EXIF/IPTC/XMP into files via ExifTool...")

    def export_csvs(self):
        self.status_label.setText("Exporting 26-marketplace CSVs...")
