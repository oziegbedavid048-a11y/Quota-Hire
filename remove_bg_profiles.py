from rembg import remove

files = [
    (
        r"C:\Users\David\.gemini\antigravity-ide\brain\0fe577e2-4f68-4ec1-9980-70d1b546e704\employee_profile_3d_1781178165877.png",
        r"C:\Users\David\Desktop\QOUTA HIRE\public\images\employee_profile.png"
    ),
    (
        r"C:\Users\David\.gemini\antigravity-ide\brain\0fe577e2-4f68-4ec1-9980-70d1b546e704\company_profile_3d_1781178177270.png",
        r"C:\Users\David\Desktop\QOUTA HIRE\public\images\company_profile.png"
    ),
]

for input_path, output_path in files:
    print(f"Processing: {input_path}")
    with open(input_path, "rb") as f:
        data = f.read()
    result = remove(data)
    with open(output_path, "wb") as f:
        f.write(result)
    print(f"  -> Saved to: {output_path}")

print("\nAll done! Backgrounds removed successfully.")
