import fitz
import os
from PIL import Image, ImageFilter

# Setup paths
mobile_dir = r"C:\Users\David\Desktop\QOUTA HIRE\mobile"
svg_path = os.path.join(mobile_dir, "assets", "expo.icon", "Assets", "expo-symbol 2.svg")
images_dir = os.path.join(mobile_dir, "assets", "images")

# Open SVG document
doc = fitz.open(svg_path)
page = doc.load_page(0)
rect = page.rect

def render_logo(width, height, scale_factor=1.0, is_monochrome=False, is_glow=False):
    # 1. Render SVG using PyMuPDF to a square pixmap
    base_size = int(min(width, height) * scale_factor)
    zoom_x = base_size / rect.width
    zoom_y = base_size / rect.height
    mat = fitz.Matrix(zoom_x, zoom_y)
    pix = page.get_pixmap(matrix=mat, alpha=True)
    
    # 2. Convert PyMuPDF pixmap to PIL Image
    logo_img = Image.frombytes("RGBA", [pix.width, pix.height], pix.samples)
    
    # If monochrome is requested, create a monochrome silhouette
    if is_monochrome:
        alpha = logo_img.split()[3]
        mono_img = Image.new("RGBA", logo_img.size, (255, 255, 255, 0))
        # Fill non-transparent pixels with gray
        for x in range(mono_img.width):
            for y in range(mono_img.height):
                a_val = alpha.getpixel((x, y))
                if a_val > 0:
                    mono_img.putpixel((x, y), (128, 128, 128, a_val))
        logo_img = mono_img
        
    if is_glow:
        logo_img = logo_img.filter(ImageFilter.GaussianBlur(radius=15))
        
    # 3. Create transparent canvas of final size WxH
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    
    # 4. Paste logo_img centered on canvas
    x_offset = (width - logo_img.width) // 2
    y_offset = (height - logo_img.height) // 2
    canvas.paste(logo_img, (x_offset, y_offset), logo_img)
    return canvas

# Definitions of output files
targets = [
    # (filename, width, height, scale_factor, is_monochrome, is_glow, is_solid_bg, bg_color)
    ("icon.png", 1024, 1024, 1.0, False, False, False, None),
    ("android-icon-foreground.png", 512, 512, 0.55, False, False, False, None),
    ("android-icon-background.png", 512, 512, 1.0, False, False, True, (255, 255, 255, 255)),
    ("android-icon-monochrome.png", 432, 432, 0.55, True, False, False, None),
    ("favicon.png", 48, 48, 1.0, False, False, False, None),
    ("splash-icon.png", 228, 213, 0.8, False, False, False, None),
    ("expo-logo.png", 228, 213, 0.8, False, False, False, None),
    ("logo-glow.png", 604, 604, 0.7, False, True, False, None),
    ("tabIcons/home.png", 24, 24, 1.0, False, False, False, None),
    ("tabIcons/home@2x.png", 48, 48, 1.0, False, False, False, None),
    ("tabIcons/home@3x.png", 72, 72, 1.0, False, False, False, None),
    ("tabIcons/explore.png", 25, 25, 1.0, False, False, False, None),
    ("tabIcons/explore@2x.png", 49, 49, 1.0, False, False, False, None),
    ("tabIcons/explore@3x.png", 73, 73, 1.0, False, False, False, None),
]

for filename, w, h, scale, mono, glow, solid, bg_color in targets:
    out_path = os.path.join(images_dir, filename)
    print(f"Generating {filename} ({w}x{h})...")
    
    if solid:
        img = Image.new("RGBA", (w, h), bg_color)
    else:
        img = render_logo(w, h, scale_factor=scale, is_monochrome=mono, is_glow=glow)
        
    img.save(out_path)
    print(f"Saved to {out_path}")

print("All logos successfully replaced!")
