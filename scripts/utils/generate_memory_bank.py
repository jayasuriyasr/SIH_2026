import argparse
from pathlib import Path
import sys
import cv2
import glob

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.services.anomaly import AnomalyDetector

def extract_patches(image_path: str, patch_size: int = 224, stride: int = 112):
    """Extract multiple patches from a single normal seabed image"""
    img = cv2.imread(image_path)
    if img is None:
        print(f"Warning: Could not read {image_path}")
        return []
    
    h, w = img.shape[:2]
    patches = []
    
    # Simple sliding window
    for y in range(0, h - patch_size + 1, stride):
        for x in range(0, w - patch_size + 1, stride):
            patch = img[y:y+patch_size, x:x+patch_size]
            patches.append(patch)
            
    return patches

def generate_memory_bank(normal_data_dir: str, coreset_size: int = 500):
    print(f"Generating Anomaly Memory Bank from {normal_data_dir}")
    
    search_path = Path(normal_data_dir)
    image_paths = []
    for ext in ["*.jpg", "*.png", "*.jpeg"]:
        image_paths.extend(glob.glob(str(search_path / ext)))
        image_paths.extend(glob.glob(str(search_path / "**" / ext), recursive=True))
        
    if not image_paths:
        print(f"Error: No images found in {normal_data_dir}")
        return
        
    print(f"Found {len(image_paths)} images. Extracting patches...")
    
    all_patches = []
    for img_path in image_paths:
        patches = extract_patches(img_path)
        all_patches.extend(patches)
        
    print(f"Extracted {len(all_patches)} patches total.")
    
    if len(all_patches) == 0:
        print("Error: No valid patches extracted. Images might be too small.")
        return
        
    print(f"Building memory bank (coreset size: {coreset_size})...")
    
    detector = AnomalyDetector()
    detector.build_memory_bank(all_patches, coreset_size=coreset_size)
    
    print("Memory bank generated successfully!")
    print(f"Saved to: backend/weights/patchcore_bank.npy")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Anomaly Detection Memory Bank")
    parser.add_argument("--normal-data", required=True, help="Directory containing normal seabed images")
    parser.add_argument("--coreset", type=int, default=500, help="Number of features to keep in the memory bank")
    args = parser.parse_args()
    
    generate_memory_bank(args.normal_data, args.coreset)
