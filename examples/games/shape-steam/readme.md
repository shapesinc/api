

# Steam Shapes Bot

this is a steam bot that uses the shapes.inc api to chat with users, analyze images/audio, and respond to commands via dms.
[![image](https://i.imgur.com/qES28n4.png)](https://shapes.inc/slack)

## features

steam chat integration with auto-login + persona status

forwards user messages (text/image/audio) to shapes

supports long/short-term memory mgmt, image gen, web search, dashboard access, etc.

automatic friend acceptance

.env config with secure api + steam login handling


commands

you can send these via dm to the bot:

!help – show all available commands

!reset – reset the shape's long-term memory

!sleep – trigger a long-term memory snapshot

!dashboard – get a link to your shape's config dashboard

!info – display info about the current shape model

!web <query> – do a web search using the shape’s tools

!imagine <prompt> – generate an image from text

!wack – wipe short-term memory (context reset)


login setup

steam will prompt for a code on first login if your account has steam guard enabled. do this:

1. run the bot

2. watch console for steam_guard_code required

3. input the code in the terminal

setup

1. clone the repo
2. install dependencies
```
npm install
```
3. create .env
```
STEAM_USERNAME=your_username
STEAM_PASSWORD=your_password
SHAPES_API_KEY=your_shapes_api_key
SHAPES_MODEL=shapesinc/your_model
```
4. start the bot
```
node index.js
```
supported message types

text

normal dm text messages are forwarded to shapes.

image url

send/upload an image url and shapes will describe it.

https://example.com/image.jpg

audio url

send an mp3/wav/ogg url and shapes will transcribe + respond.

https://example.com/audio.mp3

known issues

steam image upload errors: steam limits image sending for new/limited accounts. not a bug in the bot.

shapes 500 internal errors: means shapes.inc itself is having problems. not your fault. wait it out.

bot not responding? check if your steam account is logged in and not rate-limited.


license

MIT. do what you want but don't be annoying.
