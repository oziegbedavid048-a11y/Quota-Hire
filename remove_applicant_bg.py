from rembg import remove
import os

input_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\applicant_reviewer.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\applicant_reviewer_nobg.png"

print(f"Loading image from: {input_path}")
with open(input_path, "rb") as f:
    input_data = f.read()

print("Removing background...")
output_data = remove(input_data)

print(f"Saving to: {output_path}")
with open(output_path, "wb") as f:
    f.write(output_data)

# Replace the original image with the background-removed version
print("Replacing original image...")
os.replace(output_path, input_path)

print("Done! Background removed successfully.")
