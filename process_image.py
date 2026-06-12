from rembg import remove
from PIL import Image

input_path = r"C:\Users\David\.gemini\antigravity-ide\brain\46c53872-7062-405e-9266-21118fe66ba8\saved_jobs_illustration_1781245626972.png"
output_path = r"C:\Users\David\Desktop\QOUTA HIRE\public\images\saved_jobs_illustration.png"

with open(input_path, "rb") as f:
    input_data = f.read()

print("Removing background...")
output_data = remove(input_data)

with open(output_path, "wb") as f:
    f.write(output_data)

print("Done")
