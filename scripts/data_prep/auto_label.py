import os
from pathlib import Path
import shutil
from ultralytics import YOLO

def setup_directories(base_dir):
    base_path = Path(base_dir)
    img_dir = base_path / 'images' / 'train'
    lbl_dir = base_path / 'labels' / 'train'
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)
    return base_path, img_dir, lbl_dir

def auto_label_dataset(base_dir, model_path, class_id=3):
    """
    class_id=3 maps to artificial_object in Sonaris AI.
    """
    base_path, img_dir, lbl_dir = setup_directories(base_dir)
    
    # Load trained model
    print(f"Loading model {model_path}...")
    model = YOLO(model_path)
    
    # Find all images in plane-real and ship-real
    src_dirs = [
        base_path / 'plane-real' / 'plane-real',
        base_path / 'ship-real'
    ]
    
    total_processed = 0
    total_labels_generated = 0
    
    for src in src_dirs:
        if not src.exists():
            continue
            
        print(f"Processing images in {src}...")
        for ext in ['*.png', '*.jpg', '*.jpeg']:
            for img_path in src.rglob(ext):
                dest_img = img_dir / img_path.name
                # Move image to standard YOLO structure
                if not dest_img.exists():
                    shutil.copy2(img_path, dest_img)
                    
                # Run inference
                results = model(dest_img, verbose=False)
                
                # Write YOLO format txt
                dest_lbl = lbl_dir / f"{dest_img.stem}.txt"
                boxes = results[0].boxes
                
                with open(dest_lbl, 'w') as f:
                    for box in boxes:
                        # Ensure box coordinates are normalized xywh
                        x, y, w, h = box.xywhn[0].tolist()
                        f.write(f"{class_id} {x:.6f} {y:.6f} {w:.6f} {h:.6f}\n")
                        total_labels_generated += 1
                        
                total_processed += 1

    print(f"\nAuto-Labeling Complete!")
    print(f"Processed {total_processed} images.")
    print(f"Generated {total_labels_generated} pseudo-labels.")

if __name__ == '__main__':
    dataset_dir = r"D:\Hackathon\SIH\SIH\data\raw\Dataset"
    model_weights = r"D:\Hackathon\SIH\SIH\backend\weights\yolov8n_sss.pt"
    auto_label_dataset(dataset_dir, model_weights)
