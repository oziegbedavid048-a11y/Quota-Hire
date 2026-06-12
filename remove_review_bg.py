from rembg import remove
from PIL import Image
import sys

input_path = r"C:\Users\David\.gemini\antigravity-ide\brain\b3683a34-58c3-40fb-a479-042d31ee6d95\reviewing_app_3d_new_1781250411355.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\reviewing_app_3d.png"

print(f"Loading image from: {input_path}")
with open(input_path, "rb") as f:
    input_data = f.read()

print("Removing background...")
output_data = remove(input_data)

print(f"Saving to: {output_path}")
with open(output_path, "wb") as f:
    f.write(output_data)

print("Done! Background removed successfully.")
