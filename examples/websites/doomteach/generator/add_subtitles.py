from faster_whisper import WhisperModel
from moviepy.editor import TextClip, CompositeVideoClip
import os

# === Path Helpers ===

def get_project_root():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def resolve_path(path):
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    abs_path = os.path.join(project_root, path) if not os.path.isabs(path) else path
    return abs_path

# === Constants ===

AUDIO_PATH = resolve_path("media/generated/audio/final_audio.mp3")
SRT_PATH = resolve_path("subtitles.srt")
LOG_FILE = resolve_path("generator/pipeline2.log")

# === Logging ===

def log_line(line):
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")

# === Subtitle Generation ===

def generate_subtitles(audio_path=AUDIO_PATH, srt_path=SRT_PATH, group_size=3):
    model = WhisperModel("base", compute_type="float32")
    segments, _ = model.transcribe(audio_path, word_timestamps=True)
    chunks = []

    for segment in segments:
        words = segment.words
        for i in range(0, len(words), group_size):
            group = words[i:i + group_size]
            start = group[0].start
            end = group[-1].end
            text = ' '.join([w.word for w in group])
            chunks.append((start, end, text))

    def seconds_to_srt_time(seconds):
        hrs, remainder = divmod(seconds, 3600)
        mins, secs = divmod(remainder, 60)
        millis = int((secs % 1) * 1000)
        return f"{int(hrs):02}:{int(mins):02}:{int(secs):02},{millis:03}"

    with open(srt_path, "w") as f:
        for i, (start, end, text) in enumerate(chunks, 1):
            f.write(f"{i}\n")
            f.write(f"{seconds_to_srt_time(start)} --> {seconds_to_srt_time(end)}\n")
            f.write(f"{text}\n\n")

    print("✅ Subtitles written to:", srt_path)
    log_line(f"Subtitles generated and saved to {srt_path}")
    return chunks

# === Subtitle Overlay ===

def overlay_subtitles_on_video(video, subtitle_chunks, output_path, log_line=print):
    output_path = resolve_path(output_path)
    clips = [video]

    for start, end, subtitle_text in subtitle_chunks:
        duration = end - start
        if subtitle_text:
            try:
                log_line(f"Creating subtitle for '{subtitle_text}'")
                print(f"Creating subtitle: '{subtitle_text}' at {start:.2f}s for {duration:.2f}s")
                subtitle = (
                    TextClip(
                        txt=subtitle_text,
                        fontsize=50,
                        color='white',
                        font='Helvetica-Bold',
                        stroke_color='black',
                        stroke_width=3,
                    )
                    .set_duration(duration)
                    .set_start(start)
                    .set_position('center')
                )
                clips.append(subtitle)
                log_line(f"✅ Created subtitle for '{subtitle_text}' at {start:.2f}s with duration {duration:.2f}s")
            except Exception as e:
                log_line(f"❌ Subtitle creation failed for '{subtitle_text}': {e}")

    log_line(f"Total clips to composite: {len(clips)} (1 video + {len(clips)-1} overlays)")
    final_video = CompositeVideoClip(clips, size=video.size).set_duration(video.duration)
    log_line("Compositing complete, finalizing video...")

    final_video.write_videofile(output_path, codec="libx264", audio_codec="aac")
    log_line(f"Subtitled video saved to {output_path}")
    return output_path

# === Example Usage (Commented) ===

# if __name__ == "__main__":
#     chunks = generate_subtitles()
#     from moviepy.editor import VideoFileClip
#     video_path = resolve_path("media/generated/video/doom_video.mp4")
#     video = VideoFileClip(video_path)
#     output_path = "media/generated/video/doom_video_with_subs.mp4"
#     overlay_subtitles_on_video(video, chunks, output_path)
