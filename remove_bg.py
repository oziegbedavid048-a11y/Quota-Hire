from PIL import Image

def remove_white_background(input_path, output_path):
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    newData = []
    # Make white (and near-white) pixels transparent
    for item in datas:
        # Check if the pixel is near white
        if item[0] > 230 and item[1] > 230 and item[2] > 230:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)

    img.putdata(newData)
    img.save(output_path, "PNG")
    print(f"Saved transparent logo to {output_path}")

remove_white_background(
    r"c:\Users\David\Desktop\QOUTA HIRE\download.png", 
    r"c:\Users\David\Desktop\QOUTA HIRE\public\europass_logo.png"
)
