import os
import json
import uuid
import requests
import tempfile
from flask import Flask, render_template, jsonify, request, session, Response
from dotenv import load_dotenv
from extract_score import extract_score_from_response

# Import Cloudinary for audio upload
import cloudinary
import cloudinary.uploader
import cloudinary.api

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'interview-simulator-key')

SHAPES_API_KEY = os.getenv('SHAPES_API_KEY')
SHAPES_API_URL = "https://api.shapes.inc/v1/chat/completions"

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Define shape models to use
VOICE_SHAPE = "shapesinc/carmack"  # Shape for voice/audio interviews
TEXT_SHAPE = "shapesinc/linus-i7wn"  # Shape for text-only interviews

# Removed temporary audio directory references as we're using Cloudinary

# Define production URL for Render deployment
RENDER_URL = "https://api-gmzm.onrender.com"

@app.route('/')
def index():
    # Reset question counter when starting a new session
    session['question_count'] = 0
    # Reset the score when starting a new session
    session['total_score'] = 0
    return render_template('index.html')

@app.route('/start_interview', methods=['POST'])
def start_interview():
    try:
        # Reset the shape memory to ensure a clean state
        reset_shape_memory()
        
        # Initialize question counter
        session['question_count'] = 1
        
        # Initialize score counter
        session['total_score'] = 0
        
        if not SHAPES_API_KEY:
            return jsonify({"error": "Shapes API key not configured"}), 500
        
        # Get interview mode from request
        data = request.json
        interview_mode = data.get('interview_mode', 'text')
        
                # Select the appropriate model based on mode
        if interview_mode == 'voice':
            model = VOICE_SHAPE
            
            # Voice mode system prompt (without scoring)
            system_prompt = f"""You are Carmack, a Python technical interviewer. You have the following traits:
            - Expert in Python, data structures, algorithms, and computer science
            - Direct and technically precise in your communication
            - Focus on practical problem-solving and code efficiency
            - Ask one question at a time and wait for the response
            - Ask intermediate to advanced level questions which requires the candidate to write code.
            - Provide constructive feedback on code submissions
            - Keep responses concise and focused

            This is a conversational interview without a fixed number of questions or scoring.
            Continue asking technical questions as long as the candidate wishes to proceed.
            
            Begin the interview by introducing yourself briefly and asking your first technical question."""
        else:
            model = TEXT_SHAPE
            
            # Text mode system prompt (with scoring)
            system_prompt = f"""You are Carmack, a Python technical interviewer. You have the following traits:
            - Expert in Python, data structures, algorithms, and computer science
            - Direct and technically precise in your communication
            - Focus on practical problem-solving and code efficiency
            - Ask one question at a time and wait for the response
            - Ask intermediate to advanced level questions which requires the candidate to write code.
            - Provide constructive feedback on code submissions
            - Keep responses concise and focused
            - Provide a score for each response in the format "Score: X/10" where X is a number between 0 and 10

            This is an ongoing interview without a fixed number of questions. Continue asking technical questions as long as the candidate wishes to proceed.

            Begin the interview by introducing yourself briefly and asking your first technical question."""
        
        # Store the selected mode in session for future requests
        session['interview_mode'] = interview_mode
        
        response = requests.post(
            SHAPES_API_URL,
            headers={
                "Authorization": f"Bearer {SHAPES_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": "Let's begin the interview."}
                ]
            }
        )
        
        if response.status_code != 200:
            return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
            
        return jsonify(response.json())
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Removed upload_audio endpoint - using process_audio with Cloudinary instead

@app.route('/continue_interview', methods=['POST'])
def continue_interview():
    try:
        data = request.json
        
        # Get the interview mode from session
        interview_mode = session.get('interview_mode', 'text')
        
        # Check if this is an audio message in voice mode
        is_audio_message = data.get('is_audio_message', False)
        cloudinary_url = data.get('cloudinary_url', None)
        
        # Only allow audio input in voice mode
        if is_audio_message and interview_mode != 'voice':
            return jsonify({"error": "Audio input is only allowed in voice mode"}), 400
        
        # Only allow audio input if we have a Cloudinary URL
        if is_audio_message and not cloudinary_url:
            return jsonify({"error": "Missing Cloudinary URL for audio message"}), 400
            
        # Handle text message (non-audio input)
        if not is_audio_message:
            # Enforce text-only input - reject any audio requests with audio_url but no is_audio_message flag
            if 'audio_url' in data or 'cloudinary_url' in data:
                return jsonify({"error": "Invalid request format for text input"}), 400
            
            # Get the user's text message
            message = data.get('message')
            if not message:
                return jsonify({"error": "Missing text message in request"}), 400
                
            # Create user message for API
            api_user_message = {
                "role": "user", 
                "content": message
            }
        else:
            # This is an audio message with Cloudinary URL
            # Create message with audio URL content for the API
            api_user_message = {
                "role": "user",
                "content": [
                    {
                        "type": "audio_url",
                        "audio_url": {
                            "url": cloudinary_url
                        }
                    }
                ]
            }            
        
        if not SHAPES_API_KEY:
            return jsonify({"error": "Shapes API key not configured"}), 500

        # Increment question counter
        current_q_count = session.get('question_count', 0)
        session['question_count'] = current_q_count + 1
        
        # Construct messages for Shapes API
        messages_for_api = [
            api_user_message
        ]
        
        # Select model based on interview mode
        if interview_mode == 'voice':
            model = VOICE_SHAPE
        else:
            model = TEXT_SHAPE
            
        # Prepare request body
        request_body = {
            "model": model,
            "messages": messages_for_api
        }
        
        # If we're in voice mode, add a parameter to force audio output
        if interview_mode == 'voice':
            # Some models may support this parameter to encourage audio responses
            request_body["voice_mode"] = True

        # Make the API call
        response = requests.post(SHAPES_API_URL, headers={"Authorization": f"Bearer {SHAPES_API_KEY}", "Content-Type": "application/json"}, json=request_body)
        
        if response.status_code != 200:
            return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
        
        response_data = response.json()
        
        # Handle audio responses in voice mode
        if interview_mode == 'voice':
            try:
                # Print the entire response for debugging
                print(f"Voice mode response: {json.dumps(response_data)}")
                
                # Extract audio URL if present (same code as before)
                if (response_data.get("choices") and len(response_data["choices"]) > 0):
                    message = response_data["choices"][0].get("message", {})
                    content = message.get("content", "")
                    
                    # If content is a list, search for audio_url items
                    if isinstance(content, list):
                        for item in content:
                            if item.get("type") == "audio_url" and item.get("audio_url") and item.get("audio_url").get("url"):
                                # Add the audio URL to the response data
                                response_data["audio_url"] = item["audio_url"]["url"]
                                print(f"Extracted audio URL from content list: {response_data['audio_url']}")
                                break
                    
                    # For voice shapes, the content might directly be an audio URL string
                    elif isinstance(content, str):
                        # Check for common audio URL patterns
                        audio_url_patterns = [
                            r'https?://(?:files\.)?shapes\.inc/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)',
                            r'https?://[a-zA-Z0-9_-]+\.blob\.core\.windows\.net/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)'
                        ]
                        
                        for pattern in audio_url_patterns:
                            import re
                            match = re.search(pattern, content)
                            if match:
                                response_data["audio_url"] = match.group(0)
                                print(f"Extracted audio URL from content string: {response_data['audio_url']}")
                                break
                        
                        # If no match was found but content looks like a URL
                        if "audio_url" not in response_data and ("shapes.inc" in content and (".mp3" in content or ".wav" in content)):
                            response_data["audio_url"] = content.strip()
                            print(f"Content appears to be an audio URL: {response_data['audio_url']}")
                
                # If no audio URL found in content list, check other locations
                if "audio_url" not in response_data:
                    # Try to find the audio URL in the message object
                    if message.get("audio_url"):
                        response_data["audio_url"] = message["audio_url"]
                        print(f"Found audio URL in message object: {response_data['audio_url']}")
                    
                    # Check for audio URLs in any text content
                    elif isinstance(content, str):
                        # Try to extract any URL that might be an audio file
                        audio_ext_pattern = r'(https?://[^\s]+\.(mp3|wav|ogg))'
                        import re
                        match = re.search(audio_ext_pattern, content)
                        if match:
                            response_data["audio_url"] = match.group(0)
                            print(f"Found audio URL in text content: {response_data['audio_url']}")
                    
            except Exception as e:
                print(f"Error extracting audio URL: {str(e)}")
                
            # For voice mode, don't extract scores or end the interview after N questions
            # Just return the response with audio
            return jsonify(response_data)
        
        # For text mode, continue with score extraction and evaluation
        # Extract the AI response content
        ai_response_content = ""
        if response_data.get("choices") and len(response_data["choices"]) > 0:
            message = response_data["choices"][0].get("message", {})
            content = message.get("content", "")
            if isinstance(content, str):
                ai_response_content = content
            elif isinstance(content, list):
                # For multi-modal content, extract text parts
                text_parts = []
                for item in content:
                    if item.get("type") == "text" and item.get("text"):
                        text_parts.append(item["text"])
                ai_response_content = " ".join(text_parts)
                
        # Extract score if present in the response
        score, has_score = extract_score_from_response(ai_response_content)
        if has_score:
            print(f"Extracted score: {score}/10")
            # Update total score
            current_score = session.get('total_score', 0)
            session['total_score'] = current_score + score
            print(f"Updated total score: {session['total_score']}")
            
            # Add the score to the response data
            response_data["user_score"] = {
                "question_score": score,
                "total_score": session['total_score']
            }
        else:
            print("No score found in the response")
            response_data["user_score"] = {
                "question_score": 0,
                "total_score": session.get('total_score', 0)
            }
        
        # Check if we've reached 5 questions and should evaluate
        if session.get('question_count', 0) >= 5:
            # Determine if the user passed (30+ points) or failed
            passed = session.get('total_score', 0) >= 30
            status = "passed" if passed else "failed"
            
            # Add pass/fail status to the response
            response_data["interview_status"] = {
                "complete": True,
                "status": status,
                "total_score": session.get('total_score', 0),
                "threshold": 30,
                "questions_answered": session.get('question_count', 0)
            }
            
            # Add a congratulatory or encouraging message based on pass/fail status
            if passed:
                response_data["evaluation_message"] = f"Congratulations! You've completed 5 questions with a total score of {session.get('total_score', 0)}/50. You've passed the interview!"
            else:
                response_data["evaluation_message"] = f"You've completed 5 questions with a total score of {session.get('total_score', 0)}/50. The passing threshold is 30 points. Keep practicing and try again!"
        else:
            # Interview is still ongoing
            response_data["interview_status"] = {
                "complete": False,
                "questions_answered": session.get('question_count', 0),
                "questions_remaining": 5 - session.get('question_count', 0)
            }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/send_code', methods=['POST'])
def send_code():
    try:
        data = request.json
        code = data.get('code')
        language = data.get('language', 'python')
        if not code: return jsonify({"error": "Missing code"}), 400
        if not SHAPES_API_KEY: return jsonify({"error": "Shapes API key not configured"}), 500

        # Increment question counter
        current_q_count = session.get('question_count', 0)
        session['question_count'] = current_q_count + 1

        lang_names = {'python': 'Python','c': 'C','cpp': 'C++','javascript': 'JavaScript'}
        lang_name = lang_names.get(language, language.capitalize())
        
        # Get the interview mode from session
        interview_mode = session.get('interview_mode', 'text')
        
        if interview_mode == 'voice':
            # Voice mode prompt (without scoring)
            system_prompt = f"""You are Carmack, a {lang_name} technical interviewer. Review the submitted code and provide feedback on:
            - Code correctness and efficiency
            - {lang_name} best practices and conventions
            - Potential improvements or alternative approaches
            
            Provide constructive feedback and suggestions for improvement.
            Do not ask the next interview question - wait for the candidate's response.
            """
        else:
            # Text mode prompt (with scoring)
            system_prompt = f"""You are Carmack, a {lang_name} technical interviewer. Review the submitted code and provide feedback on:
            - Code correctness and efficiency
            - {lang_name} best practices and conventions
            - Potential improvements or alternative approaches
            
            Provide constructive feedback and suggestions for improvement.
            Do not ask the next interview question - wait for the candidate's response.
            Provide a score for each response in the format "Score: X/10" where X is a number between 0 and 10.
            """
            
        code_block_tag = language if language in ['python', 'c', 'cpp', 'javascript'] else 'python'
        code_for_review = f"Please review this code:\n\n```{code_block_tag}\n{code}\n```"

        messages_for_api = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": code_for_review}
        ]

        if interview_mode == 'voice':
            model = VOICE_SHAPE
        else:
            model = TEXT_SHAPE
            
        request_body = {"model": model, "messages": messages_for_api}
        
        # If we're in voice mode, add a special parameter to force audio output
        if interview_mode == 'voice':
            # Some models may support this parameter to encourage audio responses
            request_body["voice_mode"] = True
            
        response = requests.post(SHAPES_API_URL, headers={"Authorization": f"Bearer {SHAPES_API_KEY}", "Content-Type": "application/json"}, json=request_body)
        if response.status_code != 200: return jsonify({"error": f"Shapes API error: {response.text}"}), response.status_code
        
        response_data = response.json()
        
        # Handle audio responses in voice mode
        if interview_mode == 'voice':
            try:
                # Print the entire response for debugging
                print(f"Voice mode response from code review: {json.dumps(response_data)}")
                
                # Check if the content is a list (multi-modal content)
                if (response_data.get("choices") and len(response_data["choices"]) > 0):
                    message = response_data["choices"][0].get("message", {})
                    content = message.get("content", "")
                    
                    # If content is a list, search for audio_url items
                    if isinstance(content, list):
                        for item in content:
                            if item.get("type") == "audio_url" and item.get("audio_url") and item.get("audio_url").get("url"):
                                # Add the audio URL to the response data
                                response_data["audio_url"] = item["audio_url"]["url"]
                                print(f"Extracted audio URL from content list: {response_data['audio_url']}")
                                break
                    
                    # For voice shapes, the content might directly be an audio URL string
                    elif isinstance(content, str):
                        # Check for common audio URL patterns
                        audio_url_patterns = [
                            r'https?://(?:files\.)?shapes\.inc/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)',
                            r'https?://[a-zA-Z0-9_-]+\.blob\.core\.windows\.net/[a-zA-Z0-9_-]+/[a-zA-Z0-9_-]+\.(mp3|wav|ogg)'
                        ]
                        
                        for pattern in audio_url_patterns:
                            import re
                            match = re.search(pattern, content)
                            if match:
                                response_data["audio_url"] = match.group(0)
                                print(f"Extracted audio URL from content string: {response_data['audio_url']}")
                                break
                        
                        # If no match was found but content looks like a URL
                        if "audio_url" not in response_data and ("shapes.inc" in content and (".mp3" in content or ".wav" in content)):
                            response_data["audio_url"] = content.strip()
                            print(f"Content appears to be an audio URL: {response_data['audio_url']}")
                    
                    # If no audio URL found in content list, check other locations
                    if "audio_url" not in response_data:
                        # Try to find the audio URL in the message object
                        if message.get("audio_url"):
                            response_data["audio_url"] = message["audio_url"]
                            print(f"Found audio URL in message object: {response_data['audio_url']}")
                        
                        # Check for audio URLs in any text content
                        elif isinstance(content, str):
                            # Try to extract any URL that might be an audio file
                            audio_ext_pattern = r'(https?://[^\s]+\.(mp3|wav|ogg))'
                            import re
                            match = re.search(audio_ext_pattern, content)
                            if match:
                                response_data["audio_url"] = match.group(0)
                                print(f"Found audio URL in text content: {response_data['audio_url']}")
            except Exception as e:
                print(f"Error extracting audio URL: {str(e)}")
                
            # For voice mode, don't extract scores or end the interview after N questions
            # Just return the response with audio
            return jsonify(response_data)
        
        # For text mode, continue with score extraction and evaluation
        # Extract the AI response content
        ai_response_content = ""
        if response_data.get("choices") and len(response_data["choices"]) > 0:
            message = response_data["choices"][0].get("message", {})
            content = message.get("content", "")
            if isinstance(content, str):
                ai_response_content = content
            elif isinstance(content, list):
                # For multi-modal content, extract text parts
                text_parts = []
                for item in content:
                    if item.get("type") == "text" and item.get("text"):
                        text_parts.append(item["text"])
                ai_response_content = " ".join(text_parts)
                
        # Extract score if present in the response
        score, has_score = extract_score_from_response(ai_response_content)
        if has_score:
            print(f"Extracted score: {score}/10")
            # Update total score
            current_score = session.get('total_score', 0)
            session['total_score'] = current_score + score
            print(f"Updated total score: {session['total_score']}")
            
            # Add the score to the response data
            response_data["user_score"] = {
                "question_score": score,
                "total_score": session['total_score']
            }
        else:
            print("No score found in the response")
            response_data["user_score"] = {
                "question_score": 0,
                "total_score": session.get('total_score', 0)
            }
        
        # Check if we've reached 5 questions and should evaluate
        if session.get('question_count', 0) >= 5:
            # Determine if the user passed (30+ points) or failed
            passed = session.get('total_score', 0) >= 30
            status = "passed" if passed else "failed"
            
            # Add pass/fail status to the response
            response_data["interview_status"] = {
                "complete": True,
                "status": status,
                "total_score": session.get('total_score', 0),
                "threshold": 30,
                "questions_answered": session.get('question_count', 0)
            }
            
            # Add a congratulatory or encouraging message based on pass/fail status
            if passed:
                response_data["evaluation_message"] = f"Congratulations! You've completed 5 questions with a total score of {session.get('total_score', 0)}/50. You've passed the interview!"
            else:
                response_data["evaluation_message"] = f"You've completed 5 questions with a total score of {session.get('total_score', 0)}/50. The passing threshold is 30 points. Keep practicing and try again!"
        else:
            # Interview is still ongoing
            response_data["interview_status"] = {
                "complete": False,
                "questions_answered": session.get('question_count', 0),
                "questions_remaining": 5 - session.get('question_count', 0)
            }
            
        return jsonify(response_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_score', methods=['GET'])
def get_score():
    """Return the current total score"""
    return jsonify({
        "total_score": session.get('total_score', 0),
        "question_count": session.get('question_count', 0)
    })

@app.route('/proxy_audio')
def proxy_audio():
    audio_external_url = request.args.get('url')
    print(f"Proxy audio request for URL: {audio_external_url}")
    
    # Allow any Shapes.inc URLs, not just files.shapes.inc
    if not audio_external_url or not ('shapes.inc' in audio_external_url.lower()):
        return Response("Invalid or missing audio URL for proxy (not a Shapes.inc URL)", status=400, mimetype='text/plain')

    try:
        print(f"Proxying audio from: {audio_external_url}") # Log attempt
        r = requests.get(audio_external_url, stream=True, timeout=10) # Added timeout
        r.raise_for_status()

        # Determine content type, default to audio/mpeg for mp3
        content_type = r.headers.get('content-type', 'audio/mpeg')
        if 'audio' not in content_type:
            print(f"Warning: Proxied content-type is not audio: {content_type}")
            # If it's not clearly audio, perhaps it's an error page from origin, so don't stream it as audio
            # Or, if we are sure it *should* be audio, force it.
            # Forcing it might be risky if shapes.inc returns an HTML error page.
            # Let's assume for now if it's not audio, it's an issue.
            # Forcing to audio/mpeg if it was, for example, application/octet-stream for an mp3
            if audio_external_url.lower().endswith('.mp3') and content_type == 'application/octet-stream':
                content_type = 'audio/mpeg'
            elif 'audio' not in content_type: # If still not audio after specific mp3 check
                 return Response(f"Proxied content from {audio_external_url} was not audio. Content-Type: {content_type}", status=502, mimetype='text/plain')

        print(f"Streaming with Content-Type: {content_type}")
        response = Response(r.iter_content(chunk_size=8192), content_type=content_type)
        
        # Add cache control headers
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Access-Control-Allow-Origin'] = '*'
        return response

    except requests.exceptions.Timeout:
        print(f"Timeout when proxying audio from: {audio_external_url}")
        return Response("Timeout when fetching audio from origin server", status=504, mimetype='text/plain')
    except requests.exceptions.RequestException as e:
        print(f"Error proxying audio: {str(e)}")
        return Response(f"Could not proxy audio: {str(e)}", status=502, mimetype='text/plain')
    except Exception as e:
        print(f"Unexpected error in proxy_audio: {str(e)}")
        return Response("An unexpected error occurred", status=500, mimetype='text/plain')

# Removed serve_audio route - using Cloudinary URLs directly

def reset_shape_memory():
    # Reset both long-term and short-term memory for a clean slate
    # Reset both shapes (voice and text)
    shapes_to_reset = [VOICE_SHAPE, TEXT_SHAPE]
    
    for shape in shapes_to_reset:
        for cmd in ["!reset", "!wack"]:
            try:
                requests.post(
                    SHAPES_API_URL,
                    headers={
                        "Authorization": f"Bearer {SHAPES_API_KEY}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": shape,
                        "messages": [
                            {"role": "user", "content": cmd}
                        ]
                    }
                )
            except Exception:
                pass # Silently continue on errors

# Removed sample_audio endpoint - not needed

@app.route('/process_audio', methods=['POST'])
def process_audio():
    """
    Process audio uploaded from the browser.
    Uploads the audio directly to Cloudinary and returns the URL.
    """
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
            
        audio_file = request.files['audio']
        
        if not audio_file.filename:
            return jsonify({"error": "No audio file selected"}), 400
            
        # Generate a unique filename for the audio
        filename = f"user_audio_{uuid.uuid4().hex}"
        
        try:
            # Create a temp file for the uploaded audio
            temp = tempfile.NamedTemporaryFile(delete=False, suffix='.webm')
            temp_path = temp.name
            audio_file.save(temp_path)
            
            # Upload directly to Cloudinary with mp3 format and audio optimization
            upload_result = cloudinary.uploader.upload(
                temp_path,
                resource_type="auto",
                folder="interview_simulator/audio",
                public_id=filename,
                format="mp3",  # Force mp3 format conversion
                audio_codec="mp3",  # Use MP3 codec
                bit_rate="128k",   # Set reasonable bitrate for voice
                audio_frequency=44100  # CD quality
            )
            
            # Get the Cloudinary URL
            cloudinary_url = upload_result['secure_url']
            
            # Clean up the temporary file
            os.unlink(temp_path)
            
            return jsonify({
                "success": True,
                "audio_url": cloudinary_url,
                "cloudinary_url": cloudinary_url
            })
                
        except Exception as e:
            return jsonify({"error": f"Error processing audio: {str(e)}"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)