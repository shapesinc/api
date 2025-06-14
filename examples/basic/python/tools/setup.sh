#!/bin/bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

echo "Setup complete."
echo "Activate the virtual environment with 'source venv/bin/activate'"
echo "Copy .env.example to .env and add your API keys"
echo "Run shape to test Shapes API."
