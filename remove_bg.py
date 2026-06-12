from rembg import remove
from PIL import Image
import sys

input_path = r"C:\Users\David\.gemini\antigravity-ide\brain\0fe577e2-4f68-4ec1-9980-70d1b546e704\tracker_3d_illustration_1781177116779.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\tracker_illustration.png"

print(f"Loading image from: {input_path}")
with open(input_path, "rb") as f:
    input_data = f.read()

print("Removing background...")
output_data = remove(input_data)

print(f"Saving to: {output_path}")
with open(output_path, "wb") as f:
    f.write(output_data)

print("Done! Background removed successfully.")
