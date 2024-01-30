const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

// Replace these values with your credentials
const CLIENT_ID = 'YOUR_CLIENT_ID';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const REDIRECT_URI = 'YOUR_REDIRECT_URI';

// The file token.json stores the user's access and refresh tokens
const TOKEN_PATH = 'token.json';

// Load client secrets from a file, and set up the OAuth2 client
// fs.readFile('credentials.json', (err, content) => {
//   if (err) return console.log('Error loading client secret file:', err);
//   authorize(JSON.parse(content), listLabels);
// });


const express = require('express');
const bodyParser = require('body-parser');
const app = express();


app.use(bodyParser.json());
app.get('/authorize', (req, res) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return res.status(500).json({ error: 'Error loading client secret file' });
      const { client_secret, client_id, redirect_uris } = JSON.parse(content).web;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
      });
        res.redirect(authUrl);
    });
  });
  
  app.get('/getAccessToken', (req, res) => {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ error: 'Authorization code is required.' });
    }
  
    fs.readFile('credentials.json', (err, content) => {
      if (err) return res.status(500).json({ error: 'Error loading client secret file' });
  
      const credentials = JSON.parse(content);
      const { client_secret, client_id, redirect_uris } = credentials.installed;
      const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);
  
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return res.status(400).json({ error: 'Error retrieving access token' });
  
        oAuth2Client.setCredentials(token);
        res.json({ message: 'Access token retrieved successfully.' });
      });
    });
  });
function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getAccessToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

function getAccessToken(oAuth2Client, callback) {
  
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

function listLabels(auth) {
  const gmail = google.gmail({ version: 'v1', auth });
  gmail.users.labels.list({
    userId: 'me',
  }, (err, res) => {
    if (err) return console.log('The API returned an error:', err.message);
    const labels = res.data.labels;
    if (labels.length) {
      console.log('Labels:');
      labels.forEach((label) => {
        console.log(`- ${label.name}`);
      });
    } else {
      console.log('No labels found.');
    }
  });
}


app.get('/', (req, res) => {
    res.send('Welcome to the Gmail API Example. Use /emails to fetch emails.');
  });
  
  app.get('/emails', (req, res) => {
    fs.readFile('credentials.json', (err, content) => {
      if (err) return res.status(500).json({ error: 'Error loading client secret file' });
  
      authorize(JSON.parse(content), (auth) => {
        listEmails(auth, (emails) => {
          res.json(emails);
        });
      });
    });
  });
  
  function listEmails(auth, callback) {
    const gmail = google.gmail({ version: 'v1', auth });
    gmail.users.messages.list({
      userId: 'me',
      maxResults: 10, // Adjust as needed
    }, (err, res) => {
      if (err) return console.log('The API returned an error:', err.message);
  
      const messages = res.data.messages;
      if (messages && messages.length) {
        const emailPromises = messages.map((message) => {
          return new Promise((resolve, reject) => {
            gmail.users.messages.get({
              userId: 'me',
              id: message.id,
            }, (err, res) => {
              if (err) reject(err);
              resolve(res.data);
            });
          });
        });
  
        Promise.all(emailPromises)
          .then((emails) => callback(emails))
          .catch((error) => console.error('Error fetching emails:', error));
      } else {
        console.log('No emails found.');
        callback([]);
      }
    });
  }
  
  const PORT = process.env.PORT || 3000;
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });