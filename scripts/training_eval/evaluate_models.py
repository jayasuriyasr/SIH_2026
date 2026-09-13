import argparse
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ultralytics import YOLO
import torch

DEVICE_ARG = 0 if torch.cuda.is_available() else "cpu"

def evaluate_model(data_yaml: str, model_path: str, imgsz: int = 640):
    print(f"Evaluating {model_path} on {data_yaml}")
    print(f"  Image size: {imgsz}, Device: {DEVICE_ARG}")
    
    if not Path(model_path).exists() and not model_path.startswith("yolo"):
        print(f"Error: Model weights not found at {model_path}")
        return

    try:
        model = YOLO(model_path)
    except Exception as e:
        print(f"Failed to load model {model_path}: {e}")
        return

    print("Running validation...")
    results = model.val(
        data=data_yaml,
        imgsz=imgsz,
        device=DEVICE_ARG,
        workers=0
    )
    
    print("\n--- Evaluation Results ---")
    if hasattr(results, 'box') and results.box is not None:
        print("Detection Metrics:")
        print(f"  mAP@50:    {results.box.map50:.4f}")
        print(f"  mAP@50-95: {results.box.map:.4f}")
        print(f"  Precision: {results.box.p.mean():.4f}")
        print(f"  Recall:    {results.box.r.mean():.4f}")
        
    if hasattr(results, 'seg') and results.seg is not None:
        print("\nSegmentation Metrics:")
        print(f"  mAP@50:    {results.seg.map50:.4f}")
        print(f"  mAP@50-95: {results.seg.map:.4f}")
        print(f"  Precision: {results.seg.p.mean():.4f}")
        print(f"  Recall:    {results.seg.r.mean():.4f}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate YOLO models for Sonaris AI")
    parser.add_argument("--data", required=True, help="Path to data.yaml")
    parser.add_argument("--mode", choices=["detect", "segment", "both"], default="both")
    parser.add_argument("--imgsz", type=int, default=640)
    args = parser.parse_args()

    detect_weights = "backend/weights/yolov8n_sss.pt"
    segment_weights = "backend/weights/yolov8n_seg_sss.pt"

    if args.mode in ("detect", "both"):
        weights = detect_weights if Path(detect_weights).exists() else "yolov8n.pt"
        evaluate_model(args.data, weights, args.imgsz)

    if args.mode in ("segment", "both"):
        weights = segment_weights if Path(segment_weights).exists() else "yolov8n-seg.pt"
        evaluate_model(args.data, weights, args.imgsz)
