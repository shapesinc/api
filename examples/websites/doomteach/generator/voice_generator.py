from fakeyou.fakeyou import FakeYou
from dotenv import load_dotenv
import os
from openai import OpenAI
import sys


load_dotenv() 

fy = FakeYou()
fy.login("vedanshbvb", "Ved@fakeyou")
voices = fy.get_voices()

shapes_client = OpenAI(
    api_key= os.environ.get("SHAPES_API_KEY"),
    base_url="https://api.shapes.inc/v1/",
)

def get_token_for_character(character_name, voices):
    matches = []
    for i, title in enumerate(voices.title):
        if character_name.lower() in title.lower():
            matches.append((i, title))
    if not matches:
        print(f"Character '{character_name}' not found in voices.")
        return None, None
    if len(matches) == 1:
        i, title = matches[0]
        token = voices.modelTokens[i]
        print(f"Found one match for '{character_name}': {title}")
        return token, i
    match_list_text = "\n".join([f"{i}: {title}" for i, title in matches])
    prompt = f"""
    The user is trying to use a voice for the character '{character_name}'.
    Here are the available voice titles with their indices:

    {match_list_text}

    Based on the title descriptions, which one is the best match for a general, high-quality voice of '{character_name}'?
    Only return the index.
    """
    response = shapes_client.chat.completions.create(
        model="shapesinc/reelscripter",
        messages=[{"role": "user", "content": prompt}]
    )
    selected_index_str = response.choices[0].message.content.strip()
    try:
        selected_index = int(selected_index_str)
    except ValueError:
        print(f"AI response could not be interpreted as index: '{selected_index_str}'")
        return None, None
    token = voices.modelTokens[selected_index]
    title = voices.title[selected_index]
    print(f"AI selected voice: {title} (Index {selected_index})")
    return token, selected_index

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python voice_generator.py <character_name>")
        sys.exit(1)
    character_name = sys.argv[1]
    token, index = get_token_for_character(character_name, voices)
    if token is not None and index is not None:
        print(f"TOKEN:{token}")
        print(f"INDEX:{index}")
    else:
        print("TOKEN:")
        print("INDEX:")