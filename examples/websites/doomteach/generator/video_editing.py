import moviepy.config as mpy_conf
mpy_conf.change_settings({"textclip_backend": "imagemagick"})

import os
import json
import subprocess
from moviepy.editor import VideoFileClip, AudioFileClip, CompositeVideoClip, ImageClip
from moviepy.video.fx.all import loop

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def convert_mp3_to_wav(mp3_path, wav_path):
    subprocess.run([
        "ffmpeg", "-y", "-i", mp3_path, wav_path
    ], check=True)

LOG_FILE = os.path.join(get_project_root(), "generator", "pipeline2.log")

def log_line(line):
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

def resolve_path(path):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    abs_path = os.path.join(project_root, path) if not os.path.isabs(path) else path
    return abs_path

def create_video_with_stickers(tts_output, character_img_paths, char_list, bg_video_path, audio_path=None, output_dir="media/generated/video"):
    output_dir = resolve_path(output_dir)
    bg_video_path = resolve_path(bg_video_path)
    if audio_path:
        audio_path = resolve_path(audio_path)
    else:
        if "audio_path" in tts_output:
            audio_path = resolve_path(tts_output["audio_path"])

    os.makedirs(output_dir, exist_ok=True)
    output_filename = "doom_video.mp4"
    output_path = os.path.join(output_dir, output_filename)

    if not os.path.exists(bg_video_path):
        raise FileNotFoundError(f"Background video not found: {bg_video_path}")

    # Load background video
    bg_video = VideoFileClip(bg_video_path)

    # Load audio to get the target duration
    if audio_path and os.path.exists(audio_path):
        audio = AudioFileClip(audio_path)
        target_duration = audio.duration
    else:
        target_duration = bg_video.duration
        audio = None

    # Prepare background video to match audio duration
    if bg_video.duration < target_duration:
        video = loop(bg_video, duration=target_duration)
    else:
        video = bg_video.subclip(0, target_duration)

    video = video.set_duration(target_duration)
    clips = [video]

    # Position stickers
    position_map = {}
    if len(char_list) >= 2:
        position_map = {
            char_list[0]: ("left", 0.05),
            char_list[1]: ("right", 0.75),
        }

    # Add stickers (no subtitles)
    for entry in tts_output["timestamps"]:
        speaker = entry["speaker"]
        start = entry["start"]
        duration = entry["duration"]

        if start >= target_duration:
            continue
        if start + duration > target_duration:
            duration = target_duration - start

        img_path = character_img_paths.get(speaker)
        if img_path:
            img_path = resolve_path(img_path)

        if img_path and os.path.exists(img_path) and speaker in position_map:
            x_frac = position_map[speaker][1]
            try:
                sticker = (
                    ImageClip(img_path)
                    .set_start(start)
                    .set_duration(duration)
                    .resize(height=350)
                    .set_position((x_frac * video.w, video.h - 350))
                )
                clips.append(sticker)
            except Exception as e:
                print(f"Warning: Could not load sticker image {img_path}: {e}")

        log_line(f"Total clips to composite: {len(clips)} (1 video + {len(clips)-1} overlays)")

    final_video = CompositeVideoClip(clips, size=video.size).set_duration(target_duration)

    if audio:
        final_video = final_video.set_audio(audio)

    try:
        print("Starting video export...")
        final_video.write_videofile(
            output_path,
            codec="libx264",
            audio_codec="aac" if audio else None,
            temp_audiofile="temp-audio.m4a" if audio else None,
            remove_temp=True,
            fps=bg_video.fps,
            verbose=True,
            logger='bar'
        )
        print("✅ Video export completed successfully")
    except Exception as e:
        print(f"Error during video export: {e}")
        raise

    bg_video.close()
    if audio:
        audio.close()
    final_video.close()

    for clip in clips:
        if hasattr(clip, 'close'):
            clip.close()

    return output_path

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Create video with stickers overlay.")
    parser.add_argument("--tts_output", type=str, help="Path to TTS output JSON file")
    parser.add_argument("--character_img_paths", type=str, help="Path to character image paths JSON file")
    parser.add_argument("--char_list", type=str, help="Comma-separated list of character names")
    parser.add_argument("--bg_video_path", type=str, default="media/bg_videos/vid1.mp4", help="Path to background video")
    parser.add_argument("--audio_path", type=str, help="Path to audio file (optional)")
    parser.add_argument("--output_dir", type=str, default="media/generated/video", help="Folder where video will be saved")

    args = parser.parse_args()

    if args.tts_output and args.character_img_paths and args.char_list:
        with open(args.tts_output, "r") as f:
            tts_output = json.load(f)
        with open(args.character_img_paths, "r") as f:
            character_img_paths = json.load(f)
        char_list = [c.strip() for c in args.char_list.split(",") if c.strip()]
        audio_path = args.audio_path
    else:
        # Fallback sample
        tts_output = {
            "audio_path": "media/generated/audio/final_audio.mp3",
            "timestamps": [
                {"speaker": "Stewie", "start": 0.0, "duration": 1.51, "text": "Hello!"},
                {"speaker": "Barbie", "start": 1.51, "duration": 5.32, "text": "Hi there!"},
                {"speaker": "Stewie", "start": 6.84, "duration": 4.54, "text": "How are you?"},
                {"speaker": "Barbie", "start": 11.38, "duration": 7.88, "text": "I'm great, thanks!"}
            ]
        }
        character_img_paths = {
            "Stewie": "media/stickers/stewiegriffin.png",
            "Barbie": "media/stickers/barbie.png"
        }
        char_list = ["Stewie", "Barbie"]
        audio_path = tts_output["audio_path"]

    out_path = create_video_with_stickers(
        tts_output,
        character_img_paths,
        char_list,
        args.bg_video_path,
        audio_path=audio_path,
        output_dir=args.output_dir
    )
    print(f"✅ Video created at: {out_path}")
