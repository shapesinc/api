#Using Shapes API for voices instead of character specific voices
# works like tts.py in everything else




# tts.py

import os
import asyncio
import tempfile
from pydub import AudioSegment
import requests
from dotenv import load_dotenv
from openai import OpenAI
from aiolimiter import AsyncLimiter  # Added rate limiter

load_dotenv()
SHAPES_API_KEY = os.environ.get("SHAPES_API_KEY")
if not SHAPES_API_KEY:
    raise EnvironmentError("SHAPES_API_KEY not found in .env file")

shapes_client = OpenAI(
    api_key=SHAPES_API_KEY,
    base_url="https://api.shapes.inc/v1/",
)

# Replace these if you want to default them here; or pass them in.
LOG_FILE = os.path.join(os.path.dirname(__file__), "pipeline2.log")
out_dir = "/media/generated/audio"

class TTSPipeline:

    def log_line(self, line):
        with open(LOG_FILE, "a") as f:
            f.write(line)
            f.write("\n")

    async def _ensure_login(self):
        # No-op for Shapes API, but kept for compatibility
        return

    async def _synthesize(self, text: str, out_path: str, model: str = "shapesinc/doomvoice5"):
        """Generate speech for a single line and save to out_path using Shapes API."""
        await self._ensure_login()
        self.log_line(f"Synthesizing text: {text} to {out_path} using model: {model}")

        # Ensure output directory exists
        os.makedirs(os.path.dirname(out_path), exist_ok=True)

        # Call Shapes API for TTS
        try:
            response = shapes_client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": f"{text}"}]
            )
            audio_url = response.choices[0].message.content
            self.log_line(f"Audio URL: {audio_url}")
        except Exception as e:
            self.log_line(f"ERROR: Shapes API call failed: {e}")
            return 0.0

        # Download the MP3 file
        try:
            res = requests.get(audio_url)
            if res.status_code == 200:
                with open(out_path, "wb") as f:
                    f.write(res.content)
            else:
                self.log_line(f"ERROR: Failed to download audio. Status code: {res.status_code}")
                return 0.0
        except Exception as e:
            self.log_line(f"ERROR: Downloading audio failed: {e}")
            return 0.0

        # Get duration in seconds using pydub
        try:
            audio = AudioSegment.from_file(out_path, format="mp3")
            duration = audio.duration_seconds
            self.log_line(f"Audio duration: {duration:.2f}s")
        except Exception as e:
            self.log_line(f"ERROR: Failed to read MP3 file '{out_path}': {e}")
            return 0.0
        return duration

    def run(self, script_lines, out_dir="media/generated/audio"):
        self.log_line("entered run")

        tempdir = out_dir or tempfile.mkdtemp(prefix="tts_")
        timeline = []
        current_start = 0.0
        audio_files = []

        # Determine speaker order for model assignment
        speakers = []
        for speaker, _ in script_lines:
            if speaker not in speakers:
                speakers.append(speaker)
        speaker_model = {}
        if len(speakers) > 0:
            speaker_model[speakers[0]] = "shapesinc/doomvoice5"
        if len(speakers) > 1:
            speaker_model[speakers[1]] = "shapesinc/doomvoice6"

        rate_limiter = AsyncLimiter(20, 60)  # 20 requests per 60 seconds

        async def _process_all():
            nonlocal current_start
            for idx, (speaker, text) in enumerate(script_lines, start=1):
                fname = f"{speaker.lower().replace(' ', '_')}_{idx}.mp3"
                path = os.path.join(tempdir, fname)

                # Pick model for speaker
                model = speaker_model.get(speaker, "shapesinc/doomvoice5")

                async with rate_limiter:
                    duration = await self._synthesize(text, path, model=model)

                if duration > 0:
                    self.log_line(f"Processed {speaker}: {text} -> {fname} ({duration:.2f}s)")
                    timeline.append({
                        "speaker": speaker,
                        "start": current_start,
                        "duration": duration,
                        "filename": fname
                    })
                    audio_files.append(path)
                    current_start += duration

        try:
            asyncio.run(_process_all())
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(_process_all())
            loop.close()

        # Merge final audio (MP3)
        combined = AudioSegment.empty()
        for path in audio_files:
            clip = AudioSegment.from_file(path, format="mp3")
            combined += clip

        final_path = os.path.join(tempdir, "final_audio.mp3")
        combined.export(final_path, format="mp3")

        return final_path, timeline
