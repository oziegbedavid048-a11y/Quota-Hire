from rembg import remove
import os

input_path = r"C:\Users\David\.gemini\antigravity-ide\brain\5a9783ab-44d2-458b-88fe-da23ffe67f7a\new_applicant_reviewer_1781503964006.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\applicant_reviewer.png"

print(f"Loading image from: {input_path}")
with open(input_path, 'rb') as i:
    input_data = i.read()

print("Removing background...")
output_data = remove(input_data)

print(f"Saving to: {output_path}")
with open(output_path, 'wb') as o:
    o.write(output_data)

print("Done!")
