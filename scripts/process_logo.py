from PIL import Image
import os

def process_logo():
    input_path = "public/fc_logo_orange.png"
    output_path = "public/fc_logo_orange.webp"
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    try:
        img = Image.open(input_path)
        img = img.convert("RGBA")
        
        width, height = img.size
        print(f"Original size: {width}x{height}")
        
        # Calculate crop box (zoom in)
        # Keeping center 85% means cropping 7.5% from each side
        zoom_factor = 0.9
        margin_w = width * (1 - zoom_factor) / 2
        margin_h = height * (1 - zoom_factor) / 2
        
        box = (margin_w, margin_h, width - margin_w, height - margin_h)
        print(f"Cropping to: {box}")
        
        cropped_img = img.crop(box)
        
        # Resize back to original resolution (optional, but good for consistency)
        # Using separate resize to ensure high quality
        zoomed_img = cropped_img.resize((width, height), Image.Resampling.LANCZOS)
        
        zoomed_img.save(output_path, "WEBP", quality=100)
        print(f"Saved zoomed logo to {output_path}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    process_logo()
