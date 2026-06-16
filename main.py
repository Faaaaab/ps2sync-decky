#!/usr/bin/env python3
import os
import subprocess
import json
import time
import threading
from pathlib import Path

# Paths
PS2SYNC_SCRIPT = "/home/deck/SD2PSX/ps2sync.sh"
MMCE_MOUNT_PATH = "/run/media/deck/MMCE"
SD_DEVICE_PATTERNS = ["sda1", "sdb1", "mmcblk0p1", "nvme0n1p1"]  # Common SD card devices

# Global state for streaming logs
command_output = {"lines": [], "status": "idle"}  # idle, running, success, error
command_lock = threading.Lock()

def find_sd_device():
    """Find the SD card device"""
    try:
        result = subprocess.run(
            ["lsblk", "-rno", "NAME,TYPE,SIZE,FSTYPE"],
            capture_output=True,
            text=True,
            timeout=5
        )
        # Look for FAT32 devices
        for line in result.stdout.strip().split('\n'):
            if 'part' in line and 'vfat' in line:
                device = line.split()[0]
                return f"/dev/{device}"
    except Exception as e:
        print(f"Error finding SD device: {e}")
    return None

def mount_sd_card():
    """Mount the SD card if not already mounted"""
    with command_lock:
        command_output["lines"] = []
        command_output["status"] = "running"
    
    try:
        # Check if already mounted
        if os.path.ismount(MMCE_MOUNT_PATH):
            log("✓ SD card is already mounted at " + MMCE_MOUNT_PATH)
            with command_lock:
                command_output["status"] = "success"
            return True
        
        # Find SD device
        log("🔍 Searching for SD card device...")
        sd_device = find_sd_device()
        
        if not sd_device:
            log("❌ Error: Could not find SD card device")
            log("Try inserting the SD card or check lsblk output")
            with command_lock:
                command_output["status"] = "error"
            return False
        
        log(f"📱 Found SD device: {sd_device}")
        
        # Create mount point if needed
        os.makedirs(MMCE_MOUNT_PATH, exist_ok=True)
        log(f"📂 Created mount point: {MMCE_MOUNT_PATH}")
        
        # Mount the SD card
        log("🔧 Mounting SD card...")
        result = subprocess.run(
            ["sudo", "mount", "-t", "vfat", sd_device, MMCE_MOUNT_PATH],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0:
            log("✓ SD card mounted successfully")
            log(f"   Path: {MMCE_MOUNT_PATH}")
            with command_lock:
                command_output["status"] = "success"
            return True
        else:
            log(f"❌ Mount failed: {result.stderr}")
            with command_lock:
                command_output["status"] = "error"
            return False
    
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        with command_lock:
            command_output["status"] = "error"
        return False

def run_ps2sync(action, verbose=True):
    """Run ps2sync.sh with the specified action (pull or push)"""
    with command_lock:
        command_output["lines"] = []
        command_output["status"] = "running"
    
    try:
        # Check if script exists
        if not os.path.isfile(PS2SYNC_SCRIPT):
            log(f"❌ Error: ps2sync.sh not found at {PS2SYNC_SCRIPT}")
            with command_lock:
                command_output["status"] = "error"
            return False
        
        # Check if SD is mounted
        if not os.path.ismount(MMCE_MOUNT_PATH):
            log(f"❌ Error: SD card not mounted at {MMCE_MOUNT_PATH}")
            log("   Please mount the SD card first")
            with command_lock:
                command_output["status"] = "error"
            return False
        
        # Build command
        cmd = ["bash", PS2SYNC_SCRIPT, action]
        if verbose:
            cmd.append("-v")
        
        log(f"🚀 Starting {action.upper()}...")
        log(f"   Command: {' '.join(cmd)}")
        log("-" * 50)
        
        # Run the script with streaming output
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )
        
        # Stream output line by line
        for line in iter(process.stdout.readline, ''):
            if line:
                log(line.rstrip())
        
        process.wait()
        
        log("-" * 50)
        if process.returncode == 0:
            log(f"✓ {action.upper()} completed successfully")
            with command_lock:
                command_output["status"] = "success"
            return True
        else:
            log(f"❌ {action.upper()} failed with exit code {process.returncode}")
            with command_lock:
                command_output["status"] = "error"
            return False
    
    except Exception as e:
        log(f"❌ Error: {str(e)}")
        with command_lock:
            command_output["status"] = "error"
        return False

def log(message):
    """Add a message to the command output"""
    with command_lock:
        command_output["lines"].append(message)
        # Keep only last 500 lines to avoid memory bloat
        if len(command_output["lines"]) > 500:
            command_output["lines"] = command_output["lines"][-500:]

def get_status():
    """Get current command status and output"""
    with command_lock:
        return json.dumps({
            "status": command_output["status"],
            "lines": command_output["lines"],
            "count": len(command_output["lines"])
        })

def execute_pull(verbose=True):
    """Execute pull command in background"""
    thread = threading.Thread(target=run_ps2sync, args=("pull", verbose), daemon=True)
    thread.start()
    return get_status()

def execute_push(verbose=True):
    """Execute push command in background"""
    thread = threading.Thread(target=run_ps2sync, args=("push", verbose), daemon=True)
    thread.start()
    return get_status()

def execute_mount():
    """Execute mount in background"""
    thread = threading.Thread(target=mount_sd_card, daemon=True)
    thread.start()
    return get_status()

def clear_logs():
    """Clear the command output"""
    with command_lock:
        command_output["lines"] = []
    return get_status()
