"""
Remove the white/light background from the hero black coat image,
preserving the subject and the subtle ground shadow beneath the feet.

Approach:
  1. Convert to RGBA.
  2. For each pixel, calculate how close it is to pure white.
  3. Pixels very close to white become fully transparent.
  4. Pixels in the mid-range (shadow zone) get partial transparency,
     preserving the soft ground shadow as a semi-transparent overlay.
  5. Subject pixels (dark clothing, skin, hair) stay fully opaque.
"""

from PIL import Image
import numpy as np

# Load original
img = Image.open("/vercel/share/v0-project/public/images/hero-black-coat.jpg").convert("RGBA")
data = np.array(img, dtype=np.float64)

r, g, b = data[:, :, 0], data[:, :, 1], data[:, :, 2]

# Calculate "whiteness" — how close each pixel is to pure white (255,255,255).
# Using luminance-weighted distance for perceptual accuracy.
luminance = 0.299 * r + 0.587 * g + 0.114 * b

# Also check saturation — truly white/grey pixels have low saturation
max_rgb = np.maximum(np.maximum(r, g), b)
min_rgb = np.minimum(np.minimum(r, g), b)
saturation = (max_rgb - min_rgb) / (max_rgb + 1e-6)

# Whiteness score: high luminance + low saturation = background
whiteness = luminance / 255.0  # 0..1

# Define thresholds:
#   - Above high_thresh: fully transparent (pure background)
#   - Between low_thresh and high_thresh: partial transparency (shadow zone)
#   - Below low_thresh: fully opaque (subject)
high_thresh = 0.92  # Pixels brighter than this → transparent
low_thresh = 0.72   # Pixels darker than this → opaque

# Build alpha channel
alpha = np.ones_like(luminance) * 255.0

# Pure background → transparent
bg_mask = (whiteness > high_thresh) & (saturation < 0.08)
alpha[bg_mask] = 0.0

# Shadow / transition zone → partial transparency
shadow_mask = (whiteness > low_thresh) & (whiteness <= high_thresh) & (saturation < 0.12)
# Linear ramp from opaque at low_thresh to transparent at high_thresh
shadow_alpha = 1.0 - (whiteness[shadow_mask] - low_thresh) / (high_thresh - low_thresh)
alpha[shadow_mask] = shadow_alpha * 255.0

# Edge feathering: apply a very slight gaussian blur to the alpha channel
# to soften hard edges (staircase artifacts from thresholding)
from PIL import ImageFilter

alpha_img = Image.fromarray(alpha.astype(np.uint8), mode='L')
alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=1.2))

# Compose final image
data[:, :, 3] = np.array(alpha_img, dtype=np.float64)
result = Image.fromarray(data.astype(np.uint8), mode='RGBA')

# Save as PNG with transparency
output_path = "/vercel/share/v0-project/public/images/hero-black-coat-cutout.png"
result.save(output_path, "PNG", optimize=True)

print(f"[v0] Saved transparent PNG to {output_path}")
print(f"[v0] Image size: {result.size}")
print(f"[v0] Transparent pixels: {np.sum(np.array(alpha_img) == 0)} / {alpha.size}")
