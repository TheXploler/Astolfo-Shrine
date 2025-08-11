import os  
import argparse  
from PIL import Image  
import pillow_avif  
from concurrent.futures import ThreadPoolExecutor  
from tqdm import tqdm  

def convert_image(image_path, force=False):  
    try:  
        # Open image  
        img = Image.open(image_path)    
        img = img.convert("RGB")  

        # Create new filename for AVIF
        avif_filename = f"{os.path.splitext(image_path)[0]}.avif"  

        # Check if file exists  
        if os.path.exists(avif_filename) and not force:  
            print(f"File {avif_filename} already exists. Use --force to overwrite.")  
            return   

        # Save image  
        img.save(avif_filename, "AVIF")  
        
        # Calculate original n converted file sizes  
        original_size = os.path.getsize(image_path)  
        converted_size = os.path.getsize(avif_filename)  
        savings = original_size - converted_size  
          
        return (image_path, avif_filename, original_size, converted_size, savings)  

    except Exception as e:  
        print(f"Error converting {image_path}: {e}")  
        return None  

def convert_directory(directory_path, force=False):  
    image_paths = [os.path.join(directory_path, filename)   
                   for filename in os.listdir(directory_path)   
                   if filename.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif', '.tiff', '.webp', '.svg'))]  

    results = []  
    
    # Convert images in parallel  
    with ThreadPoolExecutor() as executor:  
        with tqdm(total=len(image_paths), unit='image') as pbar:  
            futures = {executor.submit(convert_image, image_path, force): image_path for image_path in image_paths}  
            for future in futures:  
                result = future.result()  
                if result:  
                    results.append(result)  
                pbar.update(1)   

    return results 

def main():  
    parser = argparse.ArgumentParser(description='Convert images to AVIF format.')  
    group = parser.add_mutually_exclusive_group(required=True)  
    group.add_argument('-i', '--image', type=str, help='Path to a single image file.')  
    group.add_argument('-d', '--directory', type=str, help='Path to a directory of images.')  
    parser.add_argument('--force', action='store_true', help='Overwrite existing AVIF files.')  

    args = parser.parse_args()  

    if args.image:  
        convert_image(args.image, args.force)  
    elif args.directory:  
        results = convert_directory(args.directory, args.force)  

        # Individual Summary  
        total_original_size = total_converted_size = total_savings = 0  
        for original, converted, orig_size, conv_size, save in results:  
            total_original_size += orig_size  
            total_converted_size += conv_size  
            total_savings += save  
            print(f"Converted {original} to {converted} | Original size: {orig_size / 1024:.2f} KB | Converted size: {conv_size / 1024:.2f} KB | Savings: {save / 1024:.2f} KB")  

        # Total Summary
        print("\nTotal Summary:")  
        print(f"Total Original Size: {total_original_size / 1024:.2f} KB")  
        print(f"Total Converted Size: {total_converted_size / 1024:.2f} KB")  
        print(f"Total Savings: {total_savings / 1024:.2f} KB")  

if __name__ == "__main__":  
    main()  