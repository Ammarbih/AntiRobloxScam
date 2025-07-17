const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

console.log('Loaded GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Loaded GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const app = express();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.static('pictures')); // Serveer ook de 'pictures' map

// CORS Middleware
app.use(cors({
    origin: 'http://localhost:5000', // De server serveert nu zelf de frontend, dus de origin is ook de server zelf
    credentials: true
}));

// Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: 'auto' }
}));

// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

// Google OAuth Strategie
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "http://localhost:5000/auth/google/callback" // Aangepast naar de nieuwe server URL
},
(accessToken, refreshToken, profile, done) => {
    console.log('Google OAuth authentication successful.');
    console.log('Google Profile:', profile);
    return done(null, profile);
}
));

// Serialize user into the session
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user.id);
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((obj, done) => {
    console.log('Deserializing user:', obj.id);
    done(null, obj);
});

// Google OAuth Routes
app.get('/auth/google', (req, res, next) => {
    console.log('Attempting Google OAuth authentication...');
    next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        res.redirect('/index.html'); // Leid direct om naar de homepage
    });

// Nieuwe endpoint om de ingelogde gebruiker te controleren
app.get('/api/user', (req, res) => {
    if (req.isAuthenticated()) {
        // Stuur alleen de benodigde profielinformatie
        res.json({
            loggedIn: true,
            user: {
                displayName: req.user.displayName,
                email: req.user.emails && req.user.emails.length > 0 ? req.user.emails[0].value : null,
                avatar: req.user.photos && req.user.photos.length > 0 ? req.user.photos[0].value : null
            }
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// Logout endpoint
app.get('/auth/logout', (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.session.destroy((err) => {
            if (err) {
                console.log('Error destroying session:', err);
                return next(err);
            }
            res.redirect('/index.html'); // Omleiden naar homepage na uitloggen
        });
    });
});

// Stel de poort in
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT}`)); 