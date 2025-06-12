# Roblox Interactive NPC Setup Guide using Shapes API

This guide will walk you through the process of setting up an interactive NPC character in Roblox Studio that uses an external API to generate responses.

## Prerequisites

- Roblox Studio installed on your computer
- Basic understanding of Roblox Studio interface
- A platform to host your API (e.g., Render, Glitch, or local setup with ngrok)

## Setup Steps

### 1. Install and Launch Roblox Studio

- Download and install Roblox Studio from the [Roblox website](https://www.roblox.com/create)
- Launch Roblox Studio and sign in with your Roblox account

### 2. Create a New Project

- Select a template (Baseplate is recommended for beginners)
- Save your project with a descriptive name

### 3. Set Up Your NPC Character

- In the Explorer panel, right-click on "Workspace"
- Select `Avatar > Rig builder > Select R6 and Block Avatar` or create a character model manually
- Position your NPC character in your game world
- Customize the NPC appearance in the Properties panel

### 4. Name Your Character

- Select your NPC model in the Explorer panel
- In the Properties panel, change the "Name" field to your desired NPC name

### 5. Implement the Promise Library

- In the Explorer panel, right-click on "ServerScriptService"
- Select `Insert > Script`
- Rename the script to "Promise"
- Open the script and replace the content with the code from `shapes-roblox/main/promises.lua`
- Save the script

### 6. Add the Main Script

- In the Explorer panel, right-click on "ServerScriptService"
- Select `Insert > Script`
- Rename the script to "NPCController/ShapesBot"
- Open the script and replace the content with the code from `shapes-roblox/main/script.lua`
- Save the script

### 7. Set Up Your API Endpoint

- Download the API server code from `shapes-roblox/main/main.js`
- Choose one of the hosting options:
  
  **Option A: Local Development with ngrok**
  - Install Node.js on your computer
  - Navigate to the directory containing `main.js`
  - Run `npm install express cors` to install dependencies
  - Start your server with `node main.js`
  - Install and set up ngrok
  - Run `ngrok http 3000` to expose your local server
  - Copy the https URL provided by ngrok
  
  **Option B: Host on Render**
  - Create a new account or sign in to [Render](https://render.com/)
  - Create a new Web Service
  - Connect your GitHub repository containing the API code
  - Set the start command to `node main.js`
  - Deploy your service and copy the URL
  
  **Option C: Host on Glitch**
  - Create a new account or sign in to [Glitch](https://glitch.com/)
  - Create a new project
  - Upload or paste the `main.js` file
  - Add a `package.json` file with express and cors dependencies
  - Your project will automatically deploy
  - Copy the project URL

### 8. Configure the API URL in Your Script

- Open the "NPCController" script in Roblox Studio
- Locate the API URL variable (something like `local apiUrl = ""`)
- Replace the empty string with your hosted API URL (e.g., `local apiUrl = "https://your-api-url.ngrok.io"`) make sure to add the /processshape after the url
eg - `url+/processshape`
- Save the script

### 9. Test Your Implementation

- Click the "Play" button in Roblox Studio to test your game
- Approach the NPC character
- Interact with the NPC according to your script's interaction mechanism
- Verify that the NPC responds with messages from your API

### 10. Troubleshooting

- Check the Output window in Roblox Studio for any script errors
- Verify that your API endpoint is accessible
- Make sure CORS is properly configured in your API service
- Test the API independently using a tool like Postman

## Notes

- Remember to secure your API endpoint if you plan to deploy your game publicly
- Consider adding rate limiting to prevent abuse
- The NPC character will only respond when your API endpoint is accessible

## Advanced Customization

After the basic setup is complete, you can customize your NPC further by:
- Adding animations
- Creating dialogue UI elements
- Implementing more complex conversation flows
- Adding proximity detection for automatic engagement

## Troubleshooting

- **API Connection Issues**: Make sure your API key is set correctly and you have internet connectivity
- **Promise**: Make sure to add the promise under the ServerScriptService Script/ModuleScript on the roblox Studio.

## Test a build roblox project
- Download the examples/social/shape-roblox/shapesrobloxdemo.rbxl and just open!
- Might need to host the api endpoint locally and expose it using ngrok and then update it on the shape-roblox/script.lua --under your project folder
  
## License

MIT LICENSE

## Acknowledgments

- Shapes.inc for providing the AI API
- Lua community for the excellent modules used in this project
