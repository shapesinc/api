const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const http = require('http'); // Node.js built-in HTTP module
const url = require('url'); // Node.js built-in URL module
const open = require('open'); // Install this package: npm install open

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/calendar'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';
// The port the local server will listen on
const REDIRECT_PORT = 3000;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;


/**
 * Authorize the application using Google OAuth2.
 * If a token exists, use it. Otherwise, initiate the web-based authorization flow
 * with a local redirect server.
 * @param {function} callback The callback function to call with the authorized client.
 */
function authorize(callback) {
  // Load client secrets from a local file.
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with the loaded credentials, then call the API.
    const credentials = JSON.parse(content);
    const authData = credentials.installed || credentials.web;
    const { client_secret, client_id } = authData;
    // Ensure the redirect_uris in credentials.json includes http://localhost:3000
    const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, REDIRECT_URI); // Use the local redirect URI

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) {
        // No token found, initiate the authorization flow
        console.log('No token found, initiating authorization...');
        getNewToken(oAuth2Client, callback);
      } else {
        // Use the existing token
        oAuth2Client.setCredentials(JSON.parse(token));
        console.log('Using existing token from', TOKEN_PATH);
        callback(oAuth2Client);
      }
    });
  });
}

/**
 * Get a new access token through the web-based authorization flow.
 * Starts a local server to capture the redirect.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client.
 * @param {function} callback The callback function to call with the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('🔐 Authorize this app by visiting this url (opening in your browser):');

  // Start a temporary server to listen for the redirect
  const server = http.createServer(async (req, res) => {
    try {
      const requestUrl = url.parse(req.url, true);
      const code = requestUrl.query.code; // Extract the authorization code from the query parameters

      if (code) {
        console.log('Received authorization code:', code);

        // Exchange the authorization code for tokens
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        // Save the tokens to the file
        fs.writeFile(TOKEN_PATH, JSON.stringify(tokens), (err) => {
          if (err) return console.error('Error storing token', err);
          console.log('✅ Token stored to', TOKEN_PATH);
        });

        // Close the server
        server.close(() => {
          console.log('Local server closed.');
          // Respond to the browser
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end('Authorization successful! You can close this tab.');
          // Call the callback with the authorized client
          callback(oAuth2Client);
        });
      } else {
        // Handle cases where code is not present (e.g., user denied access)
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Authorization failed. No code received.');
        console.error('Authorization failed: No code received.');
        server.close(); // Close the server on failure
      }
    } catch (e) {
      console.error('Error during token exchange:', e);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('An error occurred during authorization.');
      server.close(); // Close the server on error
    }
  }).listen(REDIRECT_PORT, () => {
    console.log(`Local server listening on port ${REDIRECT_PORT}`);
    // Open the authorization URL in the user's default browser
    open(authUrl).catch(err => {
      console.error('Failed to open browser:', err);
      console.log('Please manually visit this URL:', authUrl);
    });
  });

  // Handle server errors
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${REDIRECT_PORT} is already in use. Please close the application using that port or change REDIRECT_PORT.`);
    } else {
      console.error('Server error:', e);
    }
    server.close(); // Ensure server is closed on error
  });
}


module.exports = { authorize };
