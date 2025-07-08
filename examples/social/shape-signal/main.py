import os
from dotenv import load_dotenv
from openai import OpenAI
from signalbot import SignalBot, Command, Context

# Load environment variables
load_dotenv()

class ShapesCommand(Command):
    def __init__(self):
        super().__init__()
        self.shapes_client = OpenAI(
            api_key=os.getenv("SHAPESINC_API_KEY"),
            base_url="https://api.shapes.inc/v1/",
        )
        self.model = f"shapesinc/{os.getenv('SHAPESINC_SHAPE_USERNAME')}"
        
    async def handle(self, c: Context):
        if not c.message.text:
            return
            
        user_message = c.message.text.strip()
        
        # Handle reset command
        if user_message.lower() == "!reset":
            await self.handle_reset(c)
            return
            
        # Handle regular chat
        try:
            await c.start_typing()
            
            response = self.shapes_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": user_message}],
                extra_headers={"X-User-Id": c.message.source}
            )
            
            if response.choices:
                await c.send(response.choices[0].message.content)
            else:
                await c.send("Sorry, I didn't get a response. Try again!")
                
        except Exception as e:
            print(f"Error: {e}")
            await c.send("Oops! Something went wrong. Please try again.")
        finally:
            await c.stop_typing()
    
    async def handle_reset(self, c: Context):
        try:
            await c.start_typing()
            response = self.shapes_client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "!reset"}],
                extra_headers={"X-User-Id": c.message.source}
            )
            await c.send(response.choices[0].message.content if response.choices else "Memory reset!")
        except Exception as e:
            print(f"Reset error: {e}")
            await c.send("Error resetting memory.")
        finally:
            await c.stop_typing()

if __name__ == "__main__":
    # Create signal bot
    bot = SignalBot({
        "signal_service": os.getenv("SIGNAL_SERVICE"),
        "phone_number": os.getenv("PHONE_NUMBER")
    })
    
    # Register command
    bot.register(ShapesCommand())
    
    print(f"Starting bot with shape: {os.getenv('SHAPESINC_SHAPE_USERNAME')}")
    bot.start()