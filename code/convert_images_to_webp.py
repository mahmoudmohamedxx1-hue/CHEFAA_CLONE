#!/usr/bin/env python3
import os
import subprocess
from pathlib import Path

# Directories
source_dir = Path("/workspace/imgs")
dest_dir = Path("/workspace/chefaa-clone/public/images")

# Create destination directory if it doesn't exist
dest_dir.mkdir(parents=True, exist_ok=True)

# Supported image formats
image_extensions = [".jpg", ".jpeg", ".png"]

print("Converting images to WebP format...")
print(f"Source: {source_dir}")
print(f"Destination: {dest_dir}")
print("-" * 60)

converted_count = 0
total_original_size = 0
total_webp_size = 0

for img_path in source_dir.glob("*"):
    if img_path.suffix.lower() in image_extensions:
        # Output WebP filename
        webp_name = img_path.stem + ".webp"
        webp_path = dest_dir / webp_name
        
        # Convert using cwebp
        try:
            result = subprocess.run(
                ["cwebp", "-q", "85", str(img_path), "-o", str(webp_path)],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and webp_path.exists():
                original_size = img_path.stat().st_size
                webp_size = webp_path.stat().st_size
                reduction = ((original_size - webp_size) / original_size) * 100
                
                total_original_size += original_size
                total_webp_size += webp_size
                
                print(f"✓ {img_path.name}")
                print(f"  {original_size/1024:.1f} KB → {webp_size/1024:.1f} KB ({reduction:.1f}% reduction)")
                converted_count += 1
            else:
                print(f"✗ Failed to convert {img_path.name}: {result.stderr}")
        except Exception as e:
            print(f"✗ Error converting {img_path.name}: {e}")

print("-" * 60)
print(f"\nConversion Summary:")
print(f"Images converted: {converted_count}")
print(f"Total original size: {total_original_size/1024/1024:.2f} MB")
print(f"Total WebP size: {total_webp_size/1024/1024:.2f} MB")
print(f"Overall reduction: {((total_original_size - total_webp_size) / total_original_size) * 100:.1f}%")
