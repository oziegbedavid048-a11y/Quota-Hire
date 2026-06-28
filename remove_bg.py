import os
from rembg import remove
from PIL import Image

input_path = r"C:\Users\David\.gemini\antigravity-ide\brain\ebd66eb4-328b-4655-bc8b-394d26b48456\cv_3d_illustration_1782679710086.png"
output_path = r"c:\Users\David\Desktop\QOUTA HIRE\public\assets\resume_3d.png"

# Ensure the output directory exists
os.makedirs(os.path.dirname(output_path), exist_ok=True)

try:
    print(f"Removing background from {input_path}...")
    input_image = Image.open(input_path)
    output_image = remove(input_image)
    output_image.save(output_path, format="PNG")
    print(f"Background successfully removed and saved to {output_path}")
except Exception as e:
    print(f"Failed to remove background: {e}")
