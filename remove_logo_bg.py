from rembg import remove
from PIL import Image
import sys
import os

input_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\logo.jpeg"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\logo.png"

print(f"Loading image from: {input_path}")
with open(input_path, "rb") as f:
    input_data = f.read()

print("Removing background...")
output_data = remove(input_data)

print(f"Saving to: {output_path}")
with open(output_path, "wb") as f:
    f.write(output_data)

print("Done! Background removed successfully.")
