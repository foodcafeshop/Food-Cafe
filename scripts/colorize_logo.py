from PIL import Image

def colorize_logo():
    input_path = "public/FC logo white on transparent.png"
    output_path = "public/fc_logo_orange_transparent.png"
    
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()
        
        new_data = []
        target_color = (234, 88, 12) # #ea580c
        
        for item in datas:
            # item is (R, G, B, A)
            if item[3] > 0: # If not transparent
                # Check if it's white-ish (since original is white)
                # Or just force everything non-transparent to orange
                new_data.append((target_color[0], target_color[1], target_color[2], item[3]))
            else:
                new_data.append(item)
        
        img.putdata(new_data)
        img.save(output_path)
        print(f"Saved transparent orange logo to {output_path}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    colorize_logo()
