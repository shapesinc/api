#!/usr/bin/env python3

import os
import asyncio
import argparse
import json
from dotenv import load_dotenv
from shapesinc import AsyncShape, ShapeUser, ShapeChannel
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from colorama import Fore, Style, init

# Initialize colorama for cross-platform colored output
init()

load_dotenv()


async def run():
    # Set up argument parser
    parser = argparse.ArgumentParser(description='Interact with Shapes API')
    parser.add_argument('message', nargs='*', help='Message to send to the shape')
    parser.add_argument('--user-id', help='User ID for the request', required=True)
    parser.add_argument('--channel-id', help='Channel ID for the request')

    args = parser.parse_args()

    # If the user provided a message on the command line, use that one
    if args.message:
        message = " ".join(args.message)
    else:
        # Depending on the shape personality and the history, this messge might trigger various reactions
        message = "Hello. What's your name?"

    try:
        shape_api_key = os.getenv("SHAPESINC_API_KEY")
        shape_app_id = os.getenv("SHAPESINC_APP_ID")
        shape_username = os.getenv("SHAPESINC_SHAPE_USERNAME")

        if not shape_api_key:
            raise ValueError("SHAPESINC_API_KEY not found in .env")

        if not shape_app_id:
            raise ValueError("SHAPESINC_APP_ID not found in .env")

        if not shape_username:
            raise ValueError("SHAPESINC_SHAPE_USERNAME not found in .env")

        
        print(f"{Fore.MAGENTA}→ Model   :{Style.RESET_ALL} shapesinc/{shape_username}")
        print(f"{Fore.MAGENTA}→ App ID  :{Style.RESET_ALL} {shape_app_id}")
        print()

        # Create the client with the shape API key
        shape = AsyncShape(
          shape_api_key,
          shape_username,
          shape_app_id,
        )

        # User parameter
        user = ShapeUser(args.user_id)
        # Authorise user:
        url, authorise = user.auth(shape)
        print(f"{Fore.MAGENTA}→ Authorization URL :{Style.RESET_ALL} {url}")
        print()
        code = input("Enter the code: ")
        await authorise(code)
        # Channel parameter
        # Identifies the specific channel or conversation context for this message.
        # If not provided, the shape will think everything is coming from a big unified channel
        channel = ShapeChannel(args.channel_id) if args.channel_id else None

        # Send the message to the shape. This will use the shape configured model.
        # WARNING: If the shape is premium, this will also consume credits.
        resp = await shape.prompt(
            message,
            user = user,
            channel = channel
        )

        if resp.choices and len(resp.choices) > 0:
            final_response = resp.choices[0].message
            print(f"{Fore.GREEN}Reply:{Style.RESET_ALL} {final_response}")
        else:
            print(f"{Fore.RED}No choices in response:{Style.RESET_ALL} {resp}")

    except Exception as e:
        print(f"{Fore.RED}Error:{Style.RESET_ALL} {e}")


def main():
    asyncio.run(run())


if __name__ == "__main__":
    main()