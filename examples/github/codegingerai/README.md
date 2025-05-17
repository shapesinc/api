# CodeGingerAI - GitHub PR Review Bot 🤖

CodeGingerAI is an intelligent GitHub bot that automatically reviews pull requests and responds to mentions using the Shapes API. It helps maintain code quality and provides instant feedback on code changes.

## Demo Video
[Loom Link](https://www.loom.com/share/58829c0876c546cb834c40981507de6d?sid=d91bdc1c-7428-4bee-b762-7c4fae88036b)
## Screenshots
![pull_request.opened triggered](https://github.com/giteshsarvaiya/api/blob/main/examples/github/codegingerai/assets/Screenshot%202025-05-14%20190119.png)
*Figure 1: pull_request.opened triggered*
![issue_comment.created triggered](https://github.com/giteshsarvaiya/api/blob/main/examples/github/codegingerai/assets/Screenshot%202025-05-14%20143444.png)
*Figure 2: issue_comment.created triggered*

## Features ✨

- 🤖 **Automatic PR Reviews**: Automatically reviews new pull requests using Shapes API
- 💬 **Smart Responses**: Responds to mentions in PR comments
- 📝 **Detailed Reviews**: Provides comprehensive code reviews with suggestions
- 🔄 **Real-time Updates**: Instantly responds to PR events and mentions

## Installation 🚀

### From GitHub Marketplace

1. Visit the [CodeGingerAI GitHub App](https://github.com/marketplace/codegingerai) in the GitHub Marketplace (under review process now)
2. Click "Install it for free"
3. Choose the repositories where you want to install the bot
4. Click "Install"

### Manual Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/shapesinc/shapes-api
   cd examples/github/codegingerai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```
3. Go to https://github.com/settings/apps 
   and create a github app of your own

4. Set up environment variables:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   ```
   
   Then edit the `.env` file with your credentials:
   ```env
   SHAPES_API_KEY=your_shapes_api_key_here
   SHAPES_BASE_URL=https://api.shapes.inc/v1
   SHAPES_MODEL=shapesinc/codegingerai
   APP_ID=your_app_id
   WEBHOOK_SECRET=your_webhook_secret
   PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYOUR-PRIVATE-KEY-HERE\n-----END RSA PRIVATE KEY-----"
   ```

5. Set up GitHub App credentials:
   - Create a new GitHub App in your organization
   - Set the webhook URL to your deployment URL
   - Generate an RSA private key:
     ```bash
     # Generate a new RSA private key
     openssl genrsa -out private-key.pem 2048
     ```
   - Copy the contents of the private key file into the GIHUB_PRIVATE_KEY environment variable

6. Start the bot:
   ```bash
   npm start
   ```

## Usage 📝

### Automatic PR Reviews

The bot automatically reviews new pull requests when they are opened. It will:
1. Fetch the PR diff
2. Analyze the changes using Shapes API
3. Post a review comment with suggestions and feedback

### Responding to Mentions

To interact with the bot:
1. Mention `@codegingerai[bot]` in a PR comment
2. The bot will respond with:
   - PR title and description
   - List of existing comments
   - Context-aware responses

## Configuration ⚙️

The bot can be configured through environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `SHAPES_API_KEY` | Your Shapes API key | Required |
| `SHAPES_BASE_URL` | Shapes API base URL | https://api.shapes.inc/v1 |
| `SHAPES_MODEL` | Model to use for reviews | shapesinc/codegingerai |
| `APP_ID` | Your Github App Id
| `PRIVATE_KEY` | Your Github app's rsa private key
| `WEBHOOK_SECRET` | your server's webhook

## Development 🛠️

### Project Structure
```
codegingerai/
├── src/
│   ├── config/
│   │   └── config.js         # Configuration and environment variables
│   │   └── shapesService.js  # Shapes API service
│   └── index.js             # Main application file
├── .env                     # Environment variables
└── package.json            # Project configuration
```

### Running Tests
```bash
npm test
```

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License 📄

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## Support 💬

If you encounter any issues or have questions:
- Open an issue in this repository
- Contact us at support@codegingerai.com
- Visit our [documentation](https://docs.codegingerai.com)

## Acknowledgments 🙏

- [Probot](https://probot.github.io/) for the GitHub App framework
- [Shapes API](https://shapes.inc) for the AI review capabilities

## Contact Me 📬

- 📧 Email: [gitesh.sarvaiya28@gmail.com](mailto:gitesh.sarvaiya28@gmail.com)
- 🐦 X (Twitter): [@SarvaiyaGitesh](https://x.com/SarvaiyaGitesh)
- 💻 GitHub: [@giteshsarvaiya](https://github.com/giteshsarvaiya)
