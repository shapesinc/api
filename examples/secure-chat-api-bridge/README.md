# SecureChat API Bridge

A secure messaging platform that integrates with Shapes API to provide encrypted chat functionality with AI capabilities.

## Features

- Secure user authentication with JWT
- Multi-factor authentication support
- Message encryption
- Channel-based messaging
- Integration with Shapes API for AI-powered chat
- Role-based access control
- Rate limiting and security protections

## Tech Stack

- Node.js & Express
- PostgreSQL with Knex.js
- JWT for authentication
- bcrypt for password hashing
- Winston for logging
- Helmet, CORS, and other security middleware

## Prerequisites

- Node.js (v16+)
- PostgreSQL
- Shapes API access credentials

## Getting Started

### Environment Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd secure-chat-api-bridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   USE_HTTPS=false
   
   # Database Configuration
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=securechat
   DB_USER=dbuser
   DB_PASSWORD=dbpassword
   
   # Authentication
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRY=24h
   
   # Shapes API Configuration
   SHAPES_API_KEY=your_shapes_api_key
   SHAPES_API_URL=https://api.shapes.studio
   SHAPES_USER_ID=shape-user
   
   # CORS
   CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
   
   # Encryption
   ENCRYPTION_KEY=your_encryption_key
   ```

4. Set up the database:
   ```bash
   # Create the database
   createdb securechat
   
   # Run migration
   npx knex migrate:latest
   
   # Seed the database (optional)
   npm run seed
   ```

### Running the Application

#### Development Mode

```bash
npm run dev
```

#### Production Mode

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login a user
- `POST /api/v1/auth/mfa/setup` - Set up multi-factor authentication
- `POST /api/v1/auth/mfa/verify` - Verify MFA token during login
- `GET /api/v1/auth/me` - Get current user information

### Channels

- `POST /api/v1/channels` - Create a new channel
- `GET /api/v1/channels` - Get all channels for the current user
- `GET /api/v1/channels/:channelId` - Get a specific channel
- `PUT /api/v1/channels/:channelId` - Update a channel
- `DELETE /api/v1/channels/:channelId` - Delete a channel
- `GET /api/v1/channels/:channelId/members` - Get all members of a channel
- `POST /api/v1/channels/:channelId/members` - Add a member to a channel
- `DELETE /api/v1/channels/:channelId/members/:userId` - Remove a member from a channel
- `PUT /api/v1/channels/:channelId/members/:userId/role` - Update a member's role

### Messages

- `POST /api/v1/messages` - Send a message
- `GET /api/v1/messages/channel/:channelId` - Get messages for a channel
- `GET /api/v1/messages/:messageId` - Get a specific message
- `PUT /api/v1/messages/:messageId` - Update a message
- `DELETE /api/v1/messages/:messageId` - Delete a message
- `POST /api/v1/messages/shapes` - Send a message to Shapes API
- `POST /api/v1/messages/shapes/image` - Send an image to Shapes API
- `POST /api/v1/messages/shapes/tool` - Use a Shapes tool

## Security Features

- Password hashing with bcrypt
- JWT for stateless authentication
- Multi-factor authentication
- Message encryption
- HTTPS support
- Rate limiting
- Security headers with Helmet
- CORS protection
- SQL injection protection with parameterized queries

## License

MIT
