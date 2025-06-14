from shapesinc import (
  AsyncShape,
  ShapeChannel,
  ShapeUser,
  Tool,
  StrParameter,
  ToolChoice
)
from dotenv import load_dotenv
import webbrowser
import asyncio
import os

load_dotenv()

API_KEY = os.environ.get("SHAPESINC_API_KEY")
SHAPE_USERNAME = os.environ.get("SHAPESINC_SHAPE_USERNAME")
APP_ID = os.environ.get("SHAPESINC_APP_ID")

assert API_KEY, RuntimeError("SHAPESINC_API_KEY not found in .env")
assert SHAPE_USERNAME, RuntimeError("SHAPESINC_SHAPE_USERNAME not found in .env")

kw={}
if APP_ID:
  kw["app_id"] = APP_ID

shape = AsyncShape(
  API_KEY,
  SHAPE_USERNAME,
  **kw
)

def open_site(site_url: StrParameter(format="url")):
  """Opens the {site_url} in browser of {user}"""
  webbrowser.open(site_url)
  return "success"
  
tools = [Tool.from_function(open_site)]

async def main():
  user = ShapeUser("u0")
  channel = ShapeChannel("cli0")
  while True:
    inp = input(" >>> ")
    if inp.lower() in ("exit", "quit", "q"):
      return
    op = await shape.prompt(
      inp,
      tools = tools,
      tool_choice = ToolChoice.auto,
      user = user,
      channel = channel
    )
    print(op.choices[0].message)
    
asyncio.run(main())