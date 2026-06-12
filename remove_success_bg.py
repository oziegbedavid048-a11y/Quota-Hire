from rembg import remove
import sys

input_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\success_plane_3d.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\success_plane_3d_nobg.png"

print(f"Loading image from: {input_path}")
try:
    with open(input_path, "rb") as f:
        input_data = f.read()

    print("Removing background...")
    output_data = remove(input_data)

    print(f"Saving to: {output_path}")
    with open(output_path, "wb") as f:
        f.write(output_data)

    print("Done! Background removed successfully.")
except Exception as e:
    print(f"Error: {e}")
