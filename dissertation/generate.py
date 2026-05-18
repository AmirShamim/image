"""
Upscale Pro - Dissertation / Major Project Report Generator
============================================================
Generates a comprehensive IEEE-formatted .docx dissertation
following the BCA Project Format guidelines.

Usage:
    cd dissertation/
    python generate.py

Output: UpscalePro_Dissertation_Final.docx
"""
import sys
import os

# Ensure the dissertation directory is in the Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import doc

print("=" * 60)
print("  Upscale Pro - Dissertation Report Generator")
print("=" * 60)

# ── 1. Formal / Preliminary Pages ──
print("[1/5] Building formal pages (Title, Declaration, Certificate, etc.)...")
from formal_pages import build_all_formal_pages
build_all_formal_pages()

# ── 2. Chapters 1-3 ──
print("[2/5] Building Chapters 1-3 (Introduction, Objectives, Problem Analysis)...")
from chapters_1_3 import build_chapters_1_to_3
build_chapters_1_to_3()

# ── 3. Chapters 4-6 ──
print("[3/5] Building Chapters 4-6 (Feasibility, Technology, SRS)...")
from chapters_4_6 import build_chapters_4_to_6
build_chapters_4_to_6()

# ── 4. Chapters 7-8 ──
print("[4/5] Building Chapters 7-8 (System Design, Implementation & Walkthrough)...")
from chapters_7_8 import build_chapters_7_to_8
build_chapters_7_to_8()

# ── 5. Chapters 9-11 + References ──
print("[5/5] Building Chapters 9-11 + References (Testing, Conclusion, Bibliography)...")
from chapters_9_refs import build_chapters_9_to_refs
build_chapters_9_to_refs()

# ── Save ──
output_filename = "UpscalePro_Dissertation_Final.docx"
output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", output_filename)
doc.save(output_path)

print()
print("=" * 60)
print(f"  SUCCESS: '{output_filename}' generated!")
print(f"  Location: {os.path.abspath(output_path)}")
print("=" * 60)
print()
print("NEXT STEPS:")
print("  1. Open the .docx file in Microsoft Word")
print("  2. Replace all red [ INSERT SCREENSHOT HERE ] placeholders")
print("     with actual screenshots from your live application")
print("  3. Replace the DFD and ER diagram placeholders with your diagrams")
print("  4. Update page numbers in the Table of Contents")
print("  5. Print to PDF for final submission")
