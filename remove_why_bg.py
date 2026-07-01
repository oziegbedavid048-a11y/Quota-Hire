import os
from rembg import remove
from PIL import Image

images = [
    (r"C:\Users\David\.gemini\antigravity-ide\brain\05ca35cc-a1c9-4ddf-88ec-4806d580c3b3\why_problem_v2_1782832592927.png", r"c:\Users\David\Desktop\QOUTA HIRE\public\assets\why_problem.png"),
    (r"C:\Users\David\.gemini\antigravity-ide\brain\05ca35cc-a1c9-4ddf-88ec-4806d580c3b3\why_vision_v2_1782832601882.png", r"c:\Users\David\Desktop\QOUTA HIRE\public\assets\why_vision.png")
]

for input_path, output_path in images:
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    try:
        print(f"Removing background from {input_path}...")
        input_image = Image.open(input_path)
        output_image = remove(input_image)
        output_image.save(output_path, format="PNG")
        print(f"Background successfully removed and saved to {output_path}")
    except Exception as e:
        print(f"Failed to remove background for {input_path}: {e}")
