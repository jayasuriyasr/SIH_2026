import sys
import glob
from pathlib import Path
import random

from backend.app.models.database import init_db
from backend.app.services.ingestion import create_survey, add_images_to_survey
from backend.app.services.pipeline import process_survey

def ingest_real_dataset():
    print("Ingesting real dataset...")
    init_db()
    
    # 1. Find the real images
    dataset_dir = Path(r"D:\Hackathon\SIH\SIH\data\raw\Dataset\images\train")
    if not dataset_dir.exists():
        print(f"Directory not found: {dataset_dir}")
        return
        
    image_paths = glob.glob(str(dataset_dir / "*.png")) + glob.glob(str(dataset_dir / "*.jpg"))
    if not image_paths:
        print("No images found in dataset dir!")
        return
        
    # Shuffle and pick 15 images to avoid flooding the UI
    random.seed(42)
    random.shuffle(image_paths)
    selected_images = image_paths[:15]
    
    print(f"Found {len(image_paths)} images, selecting {len(selected_images)} for survey ingestion...")
    
    # 2. Create Survey
    survey_res = create_survey(
        name="Survey Delta: Real Shipwrecks & Planes Dataset",
        vessel_id="Autonomous Underwater Vehicle (AUV) - 01",
        area_name="Test Sector",
        sonar_type="High-Res Real Sonar",
        start_time="2026-09-13 00:00:00 UTC",
        end_time="2026-09-13 12:00:00 UTC",
    )
    sid = survey_res["survey_id"]
    print(f"Created Survey ID: {sid}")
    
    # 3. Add metadata
    metadata_list = []
    base_lat, base_lon = 15.4208, 72.5000
    for idx, path in enumerate(selected_images):
        metadata_list.append({
            "latitude": round(base_lat + idx * 0.001, 6),
            "longitude": round(base_lon - idx * 0.001, 6),
            "depth": round(35.0 + idx * 1.5, 1),
            "timestamp": f"2026-09-13T08:{15 + idx:02d}:00Z",
        })
        
    # 4. Ingest and Process
    add_images_to_survey(sid, selected_images, metadata_list)
    print("Added images to DB. Running processing pipeline (YOLO + PatchCore)...")
    process_survey(sid)
    print("Processing complete!")

if __name__ == '__main__':
    ingest_real_dataset()
