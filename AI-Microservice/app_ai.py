import os
import sys
import base64
import io
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import traceback
import requests
import logging
import torch

sys.stdout.reconfigure(line_buffering=True)

from utils.model_loader import get_face_model      
from utils import anti_spoofing
from utils.face_utils import *                    
from utils.face_register import register_face_auto, register_instructor_face 
from utils.face_login import recognize_face
from utils.face_utils import get_face_embedding
from utils.anti_spoofing import check_real_or_spoof

app = Flask(__name__)
CORS(app)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

RAILWAY_BACKEND_URL = os.getenv(
    "RAILWAY_BACKEND_URL",
    "http://127.0.0.1:8080",
)

def check_railway_backend():
    """Check if the Railway backend is reachable."""
    try:
        resp = requests.get(f"{RAILWAY_BACKEND_URL}/healthz", timeout=8)
        if resp.status_code == 200:
            logging.info(f"Railway backend reachable: {RAILWAY_BACKEND_URL}")
            logging.info(f"Response: {resp.json()}")
        else:
            logging.warning(f"Railway backend responded but not healthy: {resp.status_code}")
    except Exception as e:
        logging.error(f"Could not reach Railway backend: {e}")

print("Initializing ArcFace model...")
face_model = get_face_model()
print("ArcFace model loaded successfully!")

import numpy as np
print("Warming up ArcFace model for faster first detection...")
dummy = np.zeros((112, 112, 3), dtype=np.uint8)
_ = face_model.get(dummy)
print("ArcFace warm-up complete!")

print("Preloading ResNet-34 Anti-Spoof model...")
try:
    anti_spoofing._ensure_loaded()
    if anti_spoofing._anti_spoof_model is None:
        raise RuntimeError("Anti-Spoof model failed to load!")
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    anti_spoofing._anti_spoof_model.to(device)
    anti_spoofing._anti_spoof_model.eval()
    print("Loaded anti-spoof model successfully!")
    print("Model device:", next(anti_spoofing._anti_spoof_model.parameters()).device)

    with torch.no_grad():
        dummy_tensor = torch.randn(1, 3, 224, 224).to(device)
        _ = anti_spoofing._anti_spoof_model(dummy_tensor)

    print("Anti-Spoof model warm-up complete!")
    print("ResNet-34 Anti-Spoof model ready!")

except Exception as e:
    raise RuntimeError(f"Failed to initialize Anti-Spoof model: {e}")

check_railway_backend()

def read_b64_to_bgr(b64: str) -> np.ndarray:
    try:
        if "," in b64:
            b64 = b64.split(",")[1]
        img_bytes = base64.b64decode(b64)
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print("Failed to decode base64 image:", e, flush=True)
        return None

@app.get("/")
def home():
    return jsonify({
        "status": "ok",
        "message": "FRAMS AI Microservice running",
        "endpoints": ["/embed", "/antispoof", "/register-auto", "/register-instructor", "/recognize", "/recognize-multi", "/warmup"],
        "railway_backend": RAILWAY_BACKEND_URL,
    })

@app.get("/healthz")
def healthz():
    return jsonify({"ready": True, "service": "frams-ai"}), 200

@app.get("/warmup")
def warmup():
    try:
        dummy = np.zeros((224, 224, 3), np.uint8)
        face_model.get(dummy) 
        check_real_or_spoof(dummy)
        logging.info("Warm-up completed successfully.")
        return jsonify({"warmup": "ok"}), 200
    except Exception as e:
        logging.error(f"Warm-up failed: {e}")
        return jsonify({"warmup": "failed", "error": str(e)}), 500

@app.post("/embed")
def get_embedding():
    try:
        data = request.get_json(force=True, silent=True) or {}
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"error": "Missing 'image' field"}), 400

        img = read_b64_to_bgr(image_b64)
        if img is None:
            return jsonify({"error": "Failed to decode image"}), 400

        faces = face_model.get(img)
        if not faces:
            return jsonify({"faces": 0, "embeddings": [], "bboxes": []})

        embeddings, boxes = [], []
        for f in faces:
            if hasattr(f, "embedding"):
                emb = np.array(f.embedding, dtype=np.float32)
                norm = np.linalg.norm(emb)
                if norm > 1e-3:
                    embeddings.append((emb / norm).tolist())
                boxes.append([float(v) for v in f.bbox])

        print(f"/embed → generated {len(embeddings)} embeddings", flush=True)
        return jsonify({"faces": len(embeddings), "embeddings": embeddings, "bboxes": boxes})

    except Exception:
        print("Error in /embed:", traceback.format_exc(), flush=True)
        return jsonify({"error": "Internal server error"}), 500

@app.post("/antispoof")
def antispoof():
    try:
        data = request.get_json(force=True, silent=True) or {}
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"error": "Missing 'image' field"}), 400

        img = read_b64_to_bgr(image_b64)
        if img is None:
            return jsonify({"error": "Invalid base64 image"}), 400

        is_real, confidence, probs = check_real_or_spoof(img)
        print(f"/antispoof → real={probs['real']:.3f}, spoof={probs['spoof']:.3f}", flush=True)

        return jsonify({"is_real": bool(is_real), "confidence": float(confidence), "probs": probs})

    except Exception:
        print("Error in /antispoof:", traceback.format_exc(), flush=True)
        return jsonify({"error": "Internal server error"}), 500

@app.post("/register-auto")
def register_auto_route():
    try:
        data = request.get_json(force=True, silent=True) or {}
        print(f"/register-auto → student={data.get('student_id')}", flush=True)
        result = register_face_auto(data)
        print(f"/register-auto result → {result.get('angle', '?')} | success={result.get('success')}", flush=True)
        return jsonify(result), 200
    except Exception:
        print("Error in /register-auto:", traceback.format_exc(), flush=True)
        return jsonify({"error": "Internal server error"}), 500
    
@app.post("/register-instructor")
def register_instructor():
    try:
        data = request.get_json(silent=True) or {}
        print(f"/register-instructor → instructor={data.get('instructor_id')}", flush=True)
        result = register_instructor_face(data)
        print(f"/register-instructor result → {result.get('angle', '?')} | success={result.get('success')}", flush=True)
        # Return the result from the face registration
        return jsonify(result), 200

    except Exception as e:
        logging.error(f"/register-instructor error: {traceback.format_exc()}")
        return jsonify({"error": "Internal server error"}), 500

@app.post("/recognize")
def recognize_route():
    try:
        data = request.get_json(force=True, silent=True) or {}
        base64_image = data.get("image")
        registered_faces = data.get("registered_faces", [])

        if not base64_image:
            return jsonify({"success": False, "error": "Missing image field"}), 400

        print(f"/recognize → {len(registered_faces)} embeddings received", flush=True)
        result = recognize_face({"image": base64_image, "registered_faces": registered_faces})
        print(f"/recognize result → success={result.get('success')} match={result.get('student_id')} score={result.get('match_score')}", flush=True)

        return jsonify(result), 200

    except Exception:
        print("Error in /recognize:", traceback.format_exc(), flush=True)
        return jsonify({"success": False, "error": "Internal server error"}), 500
    
@app.post("/extract-features")
def extract_features_route():
    """
    Optimized Feature Extraction Pipeline for Batch Faces.
    Performs fast anti-spoof checks first before generating embeddings.
    """
    try:
        data = request.get_json(force=True, silent=True) or {}
        faces = data.get("faces", [])

        if not faces:
            return jsonify({"success": False, "error": "Missing faces list"}), 400

        extracted_features = []

        for base64_image in faces:
            img_bgr = read_b64_to_bgr(base64_image)
            
            # Validation: Filter out completely empty or broken crops
            if img_bgr is None or img_bgr.size == 0 or np.mean(img_bgr) < 5:
                logging.warning("Skipping invalid or low-contrast face crop.")
                continue

            # 1. RUN ANTI-SPOOFING FIRST (Fail-fast optimization mechanism)
            is_real, confidence, probs = check_real_or_spoof(img_bgr)
            spoof_status = "Real" if is_real else "Spoof"
            
            if spoof_status == "Spoof":
                logging.info("Spoof signature intercepted. Skipping heavy computation matrix pass.")
                extracted_features.append({
                    "spoof_status": "Spoof",
                    "embedding": None,
                    "spoof_confidence": float(confidence),
                    "real_prob": float(probs["real"]),
                    "spoof_prob": float(probs["spoof"])
                })
                continue

            # 2. RUN EMBEDDING EXTRACTION (Only for legitimate live human streams)
            emb = get_face_embedding(img_bgr)
            if emb is None:
                logging.warning("No face embedding structural parameters extracted.")
                continue

            emb = np.squeeze(np.array(emb, dtype=np.float32))
            if emb.shape != (512,):
                logging.warning(f"Invalid dimensional layout found: {emb.shape}")
                continue

            # Ensure unit normalization prior to network transit
            norm = np.linalg.norm(emb)
            if norm > 1e-3:
                emb = emb / norm

            extracted_features.append({
                "spoof_status": "Real",
                "embedding": emb.tolist(),
                "spoof_confidence": float(confidence),
                "real_prob": float(probs["real"]),
                "spoof_prob": float(probs["spoof"])
            })

        logging.info(f"/extract-features → Processed {len(extracted_features)} valid payload targets.")
        return jsonify({"success": True, "features": extracted_features}), 200

    except Exception:
        logging.error(f"Critical crash inside execution context loop: {traceback.format_exc()}")
        return jsonify({"success": False, "error": "Internal server error"}), 500


if __name__ == "__main__":
    port = int(os.getenv("PORT", 7860))
    print(f"Starting Flask server on port {port}...", flush=True)
    app.run(host="0.0.0.0", port=port, debug=True)

application = app
