#!/usr/bin/env python3

import os
import asyncio
import argparse
import json
import re
from dotenv import load_dotenv
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletion
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils import get_api_base_url
from colorama import Fore, Style, init

# Initialize colorama for cross-platform colored output
init()

load_dotenv()


def colorize_json(json_str):
    """Add syntax highlighting to JSON string"""
    # Color strings (including keys) - cyan for keys
    json_str = re.sub(r'"([^"]*)"(?=:)', f'{Fore.CYAN}"\\1"{Style.RESET_ALL}', json_str)
    
    # Color string values - green for values
    json_str = re.sub(r'(?<=: )"([^"]*)"', f'{Fore.GREEN}"\\1"{Style.RESET_ALL}', json_str)
    
    # Color numbers
    json_str = re.sub(r'(?<=: )(\d+)(?=[,\n\]\}])', f'{Fore.YELLOW}\\1{Style.RESET_ALL}', json_str)
    
    # Color null values
    json_str = re.sub(r'(?<=: )(null)(?=[,\n\]\}])', f'{Fore.LIGHTBLACK_EX}\\1{Style.RESET_ALL}', json_str)
    
    # Color boolean values
    json_str = re.sub(r'(?<=: )(true|false)(?=[,\n\]\}])', f'{Fore.BLUE}\\1{Style.RESET_ALL}', json_str)
    
    return json_str


async def run():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Interact with Shapes API')
    parser.add_argument('message', nargs='*', help='Message to send to the shape')
    parser.add_argument('--user-id', help='User ID for the request')
    parser.add_argument('--channel-id', help='Channel ID for the request')

    args = parser.parse_args()

    # If the user provided a message on the command line, use that one
    if args.message:
        messages = [
            {
                "role": "user",
                "content": " ".join(args.message),
            }
        ]
    else:
        # Depending on the shape personality and the history, this messge might trigger various reactions
        messages = [
            {
                "role": "user",
                "content": "Hello. What's your name?",
            }
        ]

    try:
        shape_api_key = os.getenv("SHAPESINC_API_KEY")
        shape_app_id = os.getenv("SHAPESINC_APP_ID")
        shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME")

        # Check for SHAPESINC_API_KEY in .env
        if not shape_api_key:
            raise ValueError("SHAPESINC_API_KEY not found in .env")

        # Check for SHAPESINC_APP_ID in .env
        if not shape_app_id:
            # Default app ID for Euclidian - the Shapes API testing app
            shape_app_id = "f6263f80-2242-428d-acd4-10e1feec44ee"

        # Check for SHAPESINC_SHAPE_USERNAME in .env
        if not shape_username:
            # Default shape username for Shape Robot - the Shapes API developer shape
            shape_username = "shaperobot"

        # Get the API base URL using autodiscovery
        api_url = await get_api_base_url()
        
        model = f"shapesinc/{shape_username}"
        
        print(f"{Fore.MAGENTA}→ API URL :{Style.RESET_ALL} {api_url}")
        print(f"{Fore.MAGENTA}→ Model   :{Style.RESET_ALL} {model}")
        print(f"{Fore.MAGENTA}→ App ID  :{Style.RESET_ALL} {shape_app_id}")
        print()

        # Create the client with the shape API key and the Shapes API base URL
        aclient_shape = AsyncOpenAI(
            api_key=shape_api_key,
            base_url=api_url,
        )

        # Setup extra headers for the API request
        extra_headers = {}

        # X-User-ID header
        # If not provided, all requests will be attributed to
        # the user who owns the API key. This will cause unexpected behavior if you are using the same API
        # key for multiple users. For production use cases, either provide this header or obtain a
        # user-specific API key for each user.
        if args.user_id:
            extra_headers["X-User-ID"] = args.user_id

        # X-Channel-ID header
        # Identifies the specific channel or conversation context for this message.
        # If not provided, the shape will think everything is coming from a big unified channel
        if args.channel_id:
            extra_headers["X-Channel-ID"] = args.channel_id

        # Send the message to the shape. This will use the shape configured model.
        # WARNING: If the shape is premium, this will also consume credits.
        resp: ChatCompletion = await aclient_shape.chat.completions.create(
            model=model,
            messages=messages,
            extra_headers=extra_headers,
        )
        json_output = json.dumps(resp.model_dump(), indent=2)
        colored_json = colorize_json(json_output)
        print(f"{Fore.LIGHTBLACK_EX}Raw response:{Style.RESET_ALL} {colored_json}")
        print()

        if resp.choices and len(resp.choices) > 0:
            final_response = resp.choices[0].message.content
            print(f"{Fore.GREEN}Reply:{Style.RESET_ALL} {final_response}")
        else:
            print(f"{Fore.RED}No choices in response:{Style.RESET_ALL} {resp}")

    except Exception as e:
        print(f"{Fore.RED}Error:{Style.RESET_ALL} {e}")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()
