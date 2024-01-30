const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
const TOKEN_PATH = 'token.json';

const credentials = require('./credentials.json');
const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((obj, done) => {
    done(null, obj);
});

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.use(new GoogleStrategy({
    clientID: client_id,
    clientSecret: client_secret,
    callbackURL: redirect_uris[0],
},
(token, tokenSecret, profile, done) => {
    return done(null, profile);
}));

app.get('/login', passport.authenticate('google', { scope: SCOPES }),(req,res)=>{
    console.log(res)
});

app.get('/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/');
    });

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

app.get('/', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.redirect('/login');
    }

    // The user is authenticated, you can now use req.user to access their profile data
    res.json({ user: req.user });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
