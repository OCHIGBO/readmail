const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// If modifying these SCOPES, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

// Load client secrets from a file
const credentials = require('./credentials.json');
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

// Set up the Gmail API
const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

app.get('/list-labels', async (req, res) => {
    try {
        const labels = await listLabels();
        res.json({ labels });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/read-emails', async (req, res) => {
    try {
        const emails = await readEmails();
        res.json({ emails });
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function listLabels() {
    const { data } = await gmail.users.labels.list({
        userId: 'me',
    });
    return data.labels.map(label => label.name);
}

async function readEmails() {
    const { data } = await gmail.users.messages.list({
        userId: 'me',
    });
    return data.messages.map(message => message.id);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
