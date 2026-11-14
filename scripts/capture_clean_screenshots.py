import subprocess
import time
import os
import shutil
from PIL import Image

ADB = r"C:\Users\darsh\AppData\Local\Android\Sdk\platform-tools\adb.exe"
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, 'docs', 'screenshots')
ARTIFACT_DIR = r"C:\Users\darsh\.gemini\antigravity\brain\0dcfccd7-3dc6-4edf-9f6d-b6d8e26a651a"

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

def adb_cmd(cmd):
    full_cmd = f'"{ADB}" {cmd}'
    subprocess.run(full_cmd, shell=True, check=True)

def tap(x, y):
    adb_cmd(f"shell input tap {x} {y}")
    time.sleep(1.5)

def keyevent(k):
    adb_cmd(f"shell input keyevent {k}")
    time.sleep(1.5)

def capture(filename):
    remote = "/sdcard/screen_tmp.png"
    local = os.path.join(SCREENSHOTS_DIR, filename)
    adb_cmd(f"shell screencap -p {remote}")
    adb_cmd(f"pull {remote} \"{local}\"")
    # Verify PIL
    im = Image.open(local)
    print(f"[Captured] {filename} -> Size: {im.size}, Mode: {im.mode}")
    # Copy to artifact dir as well
    if os.path.exists(ARTIFACT_DIR):
        shutil.copy(local, os.path.join(ARTIFACT_DIR, filename))

print("=== CAPTURING CLEAN NATIVE SCREENSHOTS VIA ADB PULL ===")

# Screen 1: Currently on complaint timeline detail
capture("mobile_complaint_timeline_detail.png")

# Screen 2: Press back -> Complaints list showing CMP-2026-0005: Resolved
keyevent(4) # Back
capture("mobile_complaint_status_resolved.png")

# Screen 3: Tap Tab 1 (Home) at (135, 2261) -> Student Dashboard
tap(135, 2261)
capture("mobile_dashboard_verified.png")

# Screen 4: Tap QR Scan Hero button at (540, 680) -> Camera Viewfinder
tap(540, 680)
capture("mobile_camera_qr_active.png")

# Screen 5: Tap Demo Venue button at (540, 2103) -> Venue Selector Dialog
tap(540, 2103)
capture("mobile_venue_selection.png")

# Screen 6: Tap PU-ENGG-LH204 at (373, 1350) and tap Verify & Report at (540, 2138) -> Pre-filled form
tap(373, 1350)
tap(540, 2138)
capture("mobile_report_issue_prefilled.png")

print("=== ALL SCREENSHOTS CAPTURED AND VERIFIED SUCCESSFULLY ===")

