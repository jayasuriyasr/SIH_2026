import cv2
import numpy as np
from pathlib import Path
import glob

def mask_to_yolo_polygon(mask_path, out_txt_path, class_id=2):
    """
    Reads a binary/grayscale mask image and extracts the outer contours,
    converting them into YOLO normalized polygon format.
    class_id=2 corresponds to 'wreckage' in Sonaris AI.
    """
    mask = cv2.imread(mask_path, cv2.IMREAD_GRAYSCALE)
    if mask is None:
        print(f"Error reading mask: {mask_path}")
        return False
        
    h, w = mask.shape
    
    # Masks use 0 for background and 1 for foreground
    _, binary = cv2.threshold(mask, 0, 255, cv2.THRESH_BINARY)
    
    # Find contours
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    with open(out_txt_path, 'w') as f:
        for contour in contours:
            # Skip very small noise contours
            if cv2.contourArea(contour) < 10:
                continue
                
            # Flatten contour array and normalize coordinates
            # YOLO format: class_id x1 y1 x2 y2 ... xn yn
            coords = []
            for point in contour:
                x = point[0][0] / w
                y = point[0][1] / h
                coords.append(f"{x:.6f} {y:.6f}")
                
            if len(coords) >= 3:
                line = f"{class_id} " + " ".join(coords) + "\n"
                f.write(line)
                
    return True

def convert_dataset(base_dir):
    base_path = Path(base_dir)
    splits = ['train', 'test']
    
    total_converted = 0
    
    for split in splits:
        label_dir = base_path / split / 'labels'
        if not label_dir.exists():
            continue
            
        print(f"Processing {split} split...")
        mask_files = list(label_dir.glob('*.png')) + list(label_dir.glob('*.jpg'))
        
        for mask_file in mask_files:
            out_txt = label_dir / (mask_file.stem + '.txt')
            success = mask_to_yolo_polygon(str(mask_file), str(out_txt), class_id=2)
            if success:
                total_converted += 1
                
    print(f"Dataset conversion complete. Generated YOLO labels for {total_converted} images.")

if __name__ == '__main__':
    dataset_dir = r"D:\Hackathon\SIH\SIH\data\raw\AI4Shipwrecks"
    convert_dataset(dataset_dir)
