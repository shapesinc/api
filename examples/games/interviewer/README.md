# Python Technical Interview Simulator

A web application that simulates Python technical interviews using the Shapes API with Carmack. Practice your Python interview skills with an AI interviewer that provides expert technical feedback.

## Demo

Watch the demo video:

[View Demo Video](https://drive.google.com/file/d/1SnbHBJd61DwKM5JMAEAytU_FgautJgNn/view?usp=sharing)

## Features

- Python technical interview with Carmack (John Carmack inspired personality)
- Structured 3-question interview format with pass/fail evaluation
- Code editor for solving coding problems (support for Python, C, C++, and JavaScript)
- Real-time interview simulation with typing indicators
- Voice mode with audio input/output support via Cloudinary
- Modern dark-themed user interface
- Responsive design

## Prerequisites

- Python 3.8 or higher
- Shapes API key (get one from https://shapes.inc/developer)
- Cloudinary account (for voice mode - get one from https://cloudinary.com/users/register/free)
- pip (Python package manager)

## Setup

1. Clone the repository and navigate to the interviewer directory:
   ```bash
   cd examples/education/interviewer
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   
   # On macOS/Linux
   source venv/bin/activate
   
   # On Windows
   venv\Scripts\activate
   ```

3. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the interviewer directory with your API keys:
   ```
   # Shapes API key (required)
   SHAPES_API_KEY=your_shapes_api_key_here
   
   # Cloudinary credentials (required for voice mode)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

## Running the Application

1. Make sure your virtual environment is activated
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open your web browser and navigate to `http://localhost:5000`

## Usage

1. Click "Start Interview" to begin
2. Respond to the interviewer's questions in the chat interface
3. Press Enter or click "Send" to submit your response
4. Use the code editor panel for coding challenges
5. Submit your code solutions with the "Send Code" button

## Interview Format

Each interview session follows a structured format:

1. A brief introduction from Carmack, the interviewer
2. 3 technical Python questions of increasing difficulty
3. A final evaluation after the 3rd question with feedback on your performance
4. A clear pass/fail judgment based on your responses
5. Option to start a new interview session

This format provides a realistic interview experience and helps you practice handling a complete technical interview scenario.

