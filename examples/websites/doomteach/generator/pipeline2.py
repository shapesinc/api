#####################################################
#   IMPORTANT
#####################################################

#this is for using voices of shapes doomvoice2 and doomvoice3 and ONLY these voices

import sys
import json
import os
import glob

def get_project_root():
    # Returns the doomteach/ directory (one level up from this file)
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

from script_generator import generate_script, identify_characters
from tts2 import TTSPipeline
from get_stickers import download_character_stickers
from video_editing import create_video_with_stickers  # <-- import the new function
from add_subtitles import generate_subtitles, overlay_subtitles_on_video
from moviepy.editor import VideoFileClip

LOG_FILE = os.path.join(get_project_root(), "generator", "pipeline2.log")
AUDIO_FOLDER = os.path.join(get_project_root(), "media", "generated", "audio")
VIDEO_FOLDER = os.path.join(get_project_root(), "media", "generated", "video")

def log_line(line):
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def call_script_generator(user_prompt):
    script = generate_script(user_prompt)
    characters = identify_characters(user_prompt)
    return script, characters

def my_pipeline_function(char_list, script):
    """
    char_list: list of character names, e.g. ["Optimus Prime", "Elon Musk"]
    script: list of (speaker, line) tuples
    Returns:
        dict with keys:
            - "audio_path": str
            - "timestamps": list of dicts
    """
    speakers = [c.strip() for c in char_list]

    tts = TTSPipeline()
    final_audio, timeline = tts.run(script)
    log_line(f"Final audio path: {final_audio}")
    log_line(f"Timeline: {json.dumps(timeline)}")

    return {
        "audio_path": final_audio,
        "timestamps": timeline
    }

def empty_audio_folder():
    files = glob.glob(os.path.join(AUDIO_FOLDER, "*"))
    for f in files:
        try:
            os.remove(f)
        except Exception as e:
            log_line(f"ERROR: Could not remove {f}: {e}")

def empty_video_folder():
    files = glob.glob(os.path.join(VIDEO_FOLDER, "*"))
    for f in files:
        try:
            os.remove(f)
        except Exception as e:
            log_line(f"ERROR: Could not remove {f}: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        log_line("STATUS: No prompt provided.")
        sys.exit(1)

    user_prompt = sys.argv[1]

    log_line("STATUS: Generating script...")

    script, characters = call_script_generator(user_prompt)
    log_line(script)
    log_line("STATUS: Script generated.")

    char_list = [c.strip() for c in characters.split(',') if c.strip()] if characters else []
    tokens = []
    indices = []
    for character in char_list:
        log_line(f"STATUS: Converting text to voice for {character}...")

    empty_audio_folder()
    log_line("STATUS: emptied audio folder")

    parsed_script = []
    try:
        if isinstance(script, str):
            # Use object_pairs_hook to preserve order in dict
            script_pairs = json.loads(script, object_pairs_hook=list)
            if isinstance(script_pairs, list):
                parsed_script = [(k, v.strip().rstrip(":")) for k, v in script_pairs if isinstance(k, str) and isinstance(v, str)]
        elif isinstance(script, dict):
            # Convert to list but order is not guaranteed
            parsed_script = [(k, v.strip().rstrip(":")) for k, v in script.items()]
        elif isinstance(script, list) and all(isinstance(item, (list, tuple)) and len(item) == 2 for item in script):
            parsed_script = [(item[0], item[1].strip().rstrip(":")) for item in script]
    except Exception as e:
        log_line(f"ERROR: Failed to parse script JSON: {e}")
        parsed_script = []

    log_line(f"Parsed script: {parsed_script}")

    tts_output = my_pipeline_function(char_list, parsed_script)
    log_line(json.dumps(tts_output))

    # Download stickers for the characters after TTS is done
    character_img_paths = {}
    if char_list:
        try:
            character_img_paths = download_character_stickers(char_list)
            log_line("STATUS: Sticker images downloaded.")
        except Exception as e:
            log_line(f"ERROR: Failed to download stickers: {e}")

    empty_video_folder()
    log_line("STATUS: emptied video folder")

    # Call video editing after TTS and stickers
    try:
        # Always use relative paths from doomteach/ root
        output_video_path = os.path.join("media/generated/video", "doom_video.mp4")
        create_video_with_stickers(
            tts_output,
            character_img_paths,
            char_list,
            bg_video_path="media/bg_videos/vid1.mp4",
            audio_path=tts_output["audio_path"],
            output_dir="media/generated/video"
        )
        log_line("STATUS: Video created with stickers.")

        log_line("adding subtitles...")

        # === Add subtitles ===
        # Generate subtitle chunks and SRT
        subtitle_chunks = generate_subtitles()
        log_line("STATUS: Subtitles generated.")
        # Load the video just created
        video_clip = VideoFileClip(output_video_path)
        # Overlay subtitles and get output path
        output_with_subs = os.path.join("media/generated/video", "final_video_with_subs.mp4")
        final_video_path = overlay_subtitles_on_video(video_clip, subtitle_chunks, output_with_subs, log_line=log_line)
        log_line(f"STATUS: Subtitled video saved to {final_video_path}")

    except Exception as e:
        log_line(f"ERROR: Failed to create video: {e}")




