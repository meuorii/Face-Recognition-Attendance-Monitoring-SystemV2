import os
import cv2
import numpy as np
import torch
import torch.nn as nn
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
from collections import OrderedDict
from typing import Tuple, Dict

# ======================== CONFIG ===========================
DEFAULT_MODEL_PATH = "models/mobilenetV3_large_best_anti_spoof_model.pth"
DEFAULT_BACKBONE = "mobilenet_v3_large"
IMG_SIZE = 224
PRINT_DEBUG = True

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
if PRINT_DEBUG:
    print(f"Anti-Spoofing running on device: {device}")

# ======================== MODEL HELPERS ====================
def _build_backbone(name: str = DEFAULT_BACKBONE, out_dim: int = 2) -> nn.Module:
    """Build a MobileNetV3 or ResNet backbone with a custom binary head."""
    if name == "mobilenet_v3_large":
        # Initialize architecture frame
        m = models.mobilenet_v3_large(weights=None)
        num_ftrs = m.classifier[3].in_features
        m.classifier[3] = nn.Linear(num_ftrs, out_dim)
    elif name == "resnet18":
        m = models.resnet18(weights=None)
        m.fc = nn.Linear(m.fc.in_features, out_dim)
    elif name == "resnet34":
        m = models.resnet34(weights=None)
        m.fc = nn.Linear(m.fc.in_features, out_dim)
    else:
        raise ValueError(f"Unsupported backbone framework configuration: {name}")
    return m

def _strip_prefix(state: dict, prefixes=("module.", "model.")) -> OrderedDict:
    """Strip common prefixes from state_dict keys (multi-GPU checkpoints)."""
    new_state = OrderedDict()
    for k, v in state.items():
        nk = k
        for p in prefixes:
            if nk.startswith(p):
                nk = nk[len(p):]
        new_state[nk] = v
    return new_state

def _infer_head(state: dict) -> Tuple[int, str]:
    """Detect the output head type: sigmoid or softmax."""
    candidates = ["fc.weight", "classifier.weight", "classifier.3.weight", 
                  "head.weight", "last_linear.weight", "final.weight"]
    for k in state.keys():
        for base in candidates:
            if k.endswith(base):
                w = state[k]
                if getattr(w, "ndim", 0) == 2 and w.shape[0] in (1, 2):
                    return int(w.shape[0]), ("sigmoid" if w.shape[0] == 1 else "softmax")
    return 2, "softmax"  # Default fallback sa trained setup natit

# ======================== LOAD MODEL =======================
def load_anti_spoof_model(
    model_path: str = DEFAULT_MODEL_PATH,
    backbone: str = DEFAULT_BACKBONE,
    img_size: int = IMG_SIZE,
    device: torch.device = device
) -> Tuple[nn.Module, transforms.Compose, str]:
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Anti-spoof checkpoint target matrix not found: {model_path}")

    ckpt = torch.load(model_path, map_location="cpu")
    state = ckpt.get("model_state", ckpt)
    state = _strip_prefix(state)

    out_dim, head_type = _infer_head(state)
    model = _build_backbone(backbone, out_dim=out_dim)
    
    missing, unexpected = model.load_state_dict(state, strict=False)
    if PRINT_DEBUG and (missing or unexpected):
        print("[AntiSpoof] load_state_dict non-strict | missing weights layers:", len(missing), "| unexpected keys:", len(unexpected))

    model = model.to(device)
    model.eval()

    tf = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                             std =[0.229, 0.224, 0.225]),
    ])

    if PRINT_DEBUG:
        print(f"Loaded anti-spoof model successfully: {backbone} | head={head_type} | out_dim={out_dim} | location={model_path}")

    # Microservice Warm-up sequence run logic
    with torch.no_grad():
        dummy = torch.randn(1, 3, img_size, img_size, device=device)
        _ = model(dummy)

    if PRINT_DEBUG:
        print("Anti-Spoof model warm-up validation pass complete! Ready for live stream pipeline execution.")

    return model, tf, head_type

# ======================== GLOBALS ==========================
_anti_spoof_model: nn.Module | None = None
_preprocess_tf: transforms.Compose | None = None
_head_type: str | None = None

def _ensure_loaded():
    global _anti_spoof_model, _preprocess_tf, _head_type
    if _anti_spoof_model is None:
        _anti_spoof_model, _preprocess_tf, _head_type = load_anti_spoof_model(
            DEFAULT_MODEL_PATH, DEFAULT_BACKBONE, IMG_SIZE
        )

# ======================== PREPROCESS =======================
def preprocess_img(img_bgr: np.ndarray) -> torch.Tensor:
    _ensure_loaded()
    img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)
    pil = Image.fromarray(img_rgb)
    return _preprocess_tf(pil).unsqueeze(0).to(device)

# ======================== INFERENCE ========================
def _forward_prob_real(x: torch.Tensor) -> float:
    """Return prob_real ∈ [0,1] using the detected head type mapping arrangement."""
    with torch.no_grad():
        logits = _anti_spoof_model(x)
        if _head_type == "sigmoid":
            return float(torch.sigmoid(logits).item())
        else:
            probs = torch.softmax(logits, dim=1)[0].cpu().numpy()
            # Folder classification mapping standard optimization alignment:
            # Index 0 -> fake | Index 1 -> real
            return float(probs[1])

def check_real_or_spoof(
    img_bgr: np.ndarray,
    threshold: float = 0.85,
    use_heuristics: bool = True,
    double_check: bool = False
) -> Tuple[bool, float, Dict[str, float]]:
    """Check if the frame array feed is REAL or SPOOF with physical texture validations."""
    try:
        _ensure_loaded()
        
        # Apply CLAHE structural stabilization filter to reduce glare variance
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        img_bgr = cv2.cvtColor(cv2.merge((l, a, b)), cv2.COLOR_LAB2BGR)

        gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        brightness = np.mean(gray)
        
        # Environmental Adaptive Luminescence Adjustments
        if brightness < 60: 
            threshold -= 0.05
        elif brightness > 150: 
            threshold += 0.05

        x = preprocess_img(img_bgr)

        p1 = _forward_prob_real(x)
        prob_real = 0.5 * (p1 + _forward_prob_real(x)) if double_check else p1
        prob_spoof = 1.0 - prob_real

        # Base Deep Learning Node Decision Verification
        is_real = prob_real >= threshold
        
        # Heuristic Structural Safety Verification Core Run
        if use_heuristics:
            heuristics_pass = _heuristics_ok(img_bgr, prob_real)
            if not is_real and prob_real > 0.60: 
                is_real = heuristics_pass 
            elif is_real and not heuristics_pass:
                is_real = False # Hard reject triggered by edge feature texture warning

        confidence = prob_real if is_real else prob_spoof

        if PRINT_DEBUG:
            status = "REAL" if is_real else "SPOOF"
            print(f"Anti-Spoof Matrix Verification → p_real={prob_real:.3f} | p_spoof={prob_spoof:.3f} | applied_thresh={threshold:.2f} | Result state: {status}")

        return bool(is_real), float(confidence), {"real": prob_real, "spoof": prob_spoof}

    except Exception as e:
        if PRINT_DEBUG:
            print("System operational warning during inference validation pass:", e)
        return False, 0.0, {"real": 0.0, "spoof": 0.0}

# ======================== HEURISTICS =======================
def _heuristics_ok(img_bgr: np.ndarray, prob_real: float, margin_min: float = 0.20) -> bool:
    """Apply signal validation safety constraints against screen reflections."""
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)
    sat = float(hsv[:, :, 1].mean())
    mean_bgr = np.mean(img_bgr, axis=(0, 1))

    # Signal safety boundaries
    texture_ok = lap_var >= 100.0  
    saturation_ok = sat < 165.0
    color_ok = not (mean_bgr[1] > 200 and mean_bgr[2] > 200)
    margin_ok = abs(2.0 * prob_real - 1.0) >= margin_min

    if PRINT_DEBUG:
        print(f"[Physical Heuristics Engine] Laplacian Sharpness Score={lap_var:.1f} | Color Saturation Mean={sat:.1f} | Signal Variance Margin OK={margin_ok} "
              f"| Flags: tex={texture_ok}, sat={saturation_ok}, color={color_ok}")

    return texture_ok and saturation_ok and color_ok and margin_ok