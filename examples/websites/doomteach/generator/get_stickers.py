import os
import requests
from PIL import Image
from io import BytesIO
from rembg import remove
from duckduckgo_search import DDGS

# output_dir = "/media/stickers"
output_dir = os.path.join(os.path.dirname(__file__), "../media/stickers")


def download_character_stickers(characters, output_dir=output_dir):
    os.makedirs(output_dir, exist_ok=True)
    character_paths = {}

    with DDGS() as ddgs:
        for character in characters:
            filename = f"{''.join(c for c in character.lower() if c.isalnum() or c == '_').replace(' ', '_')}.png"
            path = os.path.join(output_dir, filename)

            # Check if file already exists
            if os.path.exists(path):
                print(f"✅ Image already exists for: {character} -> {path}")
                character_paths[character] = path
                continue

            print(f"\n🔍 Searching for: {character}")
            query = f"{character} transparent background png"
            results = ddgs.images(keywords=query, max_results=5)

            found = False
            for i, result in enumerate(results):
                try:
                    img_url = result["image"]
                    print(f"📥 Downloading image {i + 1} from: {img_url[:80]}...")

                    response = requests.get(img_url, timeout=10)
                    response.raise_for_status()

                    img = Image.open(BytesIO(response.content)).convert("RGBA")
                    # img_no_bg = remove(img)

                    # img_no_bg.save(path, "PNG")
                    img.save(path, "PNG")
                    print(f"✅ Saved: {path}")
                    character_paths[character] = path
                    found = True
                    break
                except Exception as e:
                    print(f"⚠️ Failed to process image {i + 1}: {e}")

            if not found:
                print(f"❌ No usable image found for: {character}")
                character_paths[character] = None

    print("\n🎉 Sticker generation complete!")
    return character_paths

if __name__ == "__main__":
    characters = ["mickey mouse"]
    paths = download_character_stickers(characters)
    print("\n📁 Final Paths:")
    for character, path in paths.items():
        print(f"{character}: {path}")
