const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose(); // SQLite3 importeren
const multer = require('multer'); // Importeer multer
const path = require('path'); // Nodig voor paden
require('dotenv').config();

console.log('Loaded GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Loaded GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const app = express();

// SQLite database initialiseren
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Fout bij openen database:', err.message);
    } else {
        console.log('Verbonden met de SQLite database.');
        // Creëer tabellen als ze niet bestaan
        db.serialize(() => {
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                googleId TEXT UNIQUE,
                displayName TEXT,
                email TEXT UNIQUE,
                avatar TEXT,
                isAdmin INTEGER DEFAULT 0
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS scammers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                robloxUsername TEXT UNIQUE NOT NULL,
                scamType TEXT,
                description TEXT,
                reportedBy TEXT,
                reportDate TEXT DEFAULT CURRENT_TIMESTAMP
            )`);

            db.run(`CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                reportedBy TEXT,
                scammerUsername TEXT NOT NULL,
                gameScammed TEXT,
                reportDetails TEXT NOT NULL,
                mediaEvidence TEXT, -- Kolom voor bestandspad of URL
                reportDate TEXT DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending'
            )`);
            console.log('Database tabellen gecontroleerd/aangemaakt.');
        });
    }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.static('pictures')); // Serveer ook de 'pictures' map

// CORS Middleware
app.use(cors({
    origin: 'http://localhost:5000', // De server serveert nu zelf de frontend, dus de origin is ook de server zelf
    credentials: true
}));

app.use(express.json()); // Voeg deze regel toe om JSON request bodies te parsen

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
    callbackURL: "http://localhost:5000/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    console.log('Google OAuth authentication successful.');
    // console.log('Google Profile:', profile); // Commented out to reduce log spam

    const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const isAdmin = (userEmail === process.env.ADMIN_EMAIL) ? 1 : 0;

    db.get(`SELECT * FROM users WHERE googleId = ?`, [profile.id], (err, user) => {
        if (err) return done(err);

        if (user) {
            // Gebruiker bestaat, update informatie
            db.run(`UPDATE users SET displayName = ?, email = ?, avatar = ?, isAdmin = ? WHERE googleId = ?`,
                [profile.displayName, userEmail, profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null, isAdmin, profile.id],
                function (err) {
                    if (err) return done(err);
                    console.log('Gebruiker bijgewerkt in DB:', profile.displayName);
                    // Haal de bijgewerkte gebruiker op om zeker te zijn dat we de isAdmin flag krijgen
                    db.get(`SELECT * FROM users WHERE googleId = ?`, [profile.id], (err, updatedUser) => {
                        if (err) return done(err);
                        done(null, updatedUser);
                    });
                });
        } else {
            // Nieuwe gebruiker, voeg toe aan database
            db.run(`INSERT INTO users (id, googleId, displayName, email, avatar, isAdmin) VALUES (?, ?, ?, ?, ?, ?)`,
                [profile.id, profile.id, profile.displayName, userEmail, profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null, isAdmin],
                function (err) {
                    if (err) return done(err);
                    console.log('Nieuwe gebruiker toegevoegd aan DB:', profile.displayName);
                    // Haal de zojuist toegevoegde gebruiker op
                    db.get(`SELECT * FROM users WHERE googleId = ?`, [profile.id], (err, newUser) => {
                        if (err) return done(err);
                        done(null, newUser);
                    });
                });
        }
    });
}
));

// Serialize user into the session
passport.serializeUser((user, done) => {
    // console.log('Serializing user:', user.id);
    done(null, user.googleId); // Sla alleen de googleId op
});

// Deserialize user from the session
passport.deserializeUser((googleId, done) => {
    // console.log('Deserializing user:', googleId);
    db.get(`SELECT * FROM users WHERE googleId = ?`, [googleId], (err, user) => {
        if (err) return done(err);
        done(null, user); // Stuur het volledige gebruikersobject door
    });
});

// Google OAuth Routes
app.get('/auth/google', (req, res, next) => {
    console.log('Attempting Google OAuth authentication...');
    // Store the desired redirect URL in the session if provided
    if (req.query.redirect) {
        req.session.returnTo = req.query.redirect;
        console.log('Stored redirect URL in session:', req.session.returnTo);
    } else {
        console.log('No redirect URL provided in query, or query.redirect is empty. Defaulting to dashboard.');
    }
    next();
}, passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
        console.log('Google OAuth callback. Session returnTo:', req.session.returnTo);
        const adminEmail = process.env.ADMIN_EMAIL; // Admin email to check against
        const userEmail = req.user.emails && req.user.emails.length > 0 ? req.user.emails[0].value : null;

        // Gebruik req.user.isAdmin van de gedeserialiseerde gebruiker
        if (req.user && req.user.isAdmin === 1) {
            console.log('Admin user logged in. Redirecting to admin dashboard.');
            res.redirect('/admin_dashboard.html');
        } else {
            const redirectUrl = req.session.returnTo || '/index.html'; // Use stored URL or default to dashboard
            delete req.session.returnTo; // Clean up the session
            res.redirect(redirectUrl);
        }
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

// Multer configuratie voor bestandsuploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/'); // Bestanden opslaan in de public/uploads map
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// NIEUW: Endpoint om rapportages in te dienen
app.post('/api/reports', upload.single('mediaEvidence'), (req, res) => { // Gebruik multer middleware
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'U moet ingelogd zijn om een rapportage in te dienen.' });
    }

    const { scammerUsername, reportDetails, gameScammed } = req.body; // scamType is verwijderd
    const reportedBy = req.user.displayName || req.user.email;
    const mediaEvidencePath = req.file ? '/uploads/' + req.file.filename : null; // Pad naar geüploade bestand

    if (!scammerUsername || !reportDetails || !gameScammed) {
        // Geef een specifieke melding als verplichte velden ontbreken
        return res.status(400).json({ message: 'De velden Roblox Gebruikersnaam, Game en Details zijn verplicht.' });
    }

    db.run(
        `INSERT INTO reports (reportedBy, scammerUsername, reportDetails, gameScammed, mediaEvidence, status) VALUES (?, ?, ?, ?, ?, ?)`,
        [reportedBy, scammerUsername, reportDetails, gameScammed, mediaEvidencePath, 'pending'], // mediaEvidencePath opslaan
        function (err) {
            if (err) {
                console.error('Fout bij opslaan rapportage:', err.message);
                console.error('Ontvangen rapportage data:', req.body);
                console.error('Bestand:', req.file);
                return res.status(500).json({ message: 'Er is een fout opgetreden bij het indienen van de rapportage.' });
            }
            res.status(201).json({ message: 'Rapportage succesvol ingediend! We zullen dit zo snel mogelijk beoordelen.', reportId: this.lastID });
        }
    );
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

// Middleware om te controleren of de gebruiker is ingelogd en een admin is
function ensureAdmin(req, res, next) {
    if (req.isAuthenticated() && req.user && req.user.isAdmin === 1) {
        return next();
    }
    console.log('Toegang geweigerd: Niet-admin probeert toegang te krijgen tot admin-route.');
    res.status(403).send('Toegang geweigerd. U bent geen beheerder.');
}

// Nieuwe endpoint voor scammerlijst (nog steeds dummy, zal later worden vervangen)
app.get('/api/scammers', (req, res) => {
    const scammers = [
    ];
    res.json(scammers);
});

// NIEUWE API-ENDPOINTS VOOR ADMIN DASHBOARD DATA
app.get('/api/admin/dashboard-data', ensureAdmin, (req, res) => {
    const data = {};

    // Totaal aantal gebruikers
    db.get("SELECT COUNT(*) AS totalUsers FROM users", (err, row) => {
        if (err) { console.error(err.message); return res.status(500).send('Server error'); }
        data.totalUsers = row.totalUsers;

        // Actieve scammers
        db.get("SELECT COUNT(*) AS activeScammers FROM scammers", (err, row) => {
            if (err) { console.error(err.message); return res.status(500).send('Server error'); }
            data.activeScammers = row.activeScammers;

            // Nieuwe rapportages (pending)
            db.get("SELECT COUNT(*) AS newReports FROM reports WHERE status = 'pending'", (err, row) => {
                if (err) { console.error(err.message); return res.status(500).send('Server error'); }
                data.newReports = row.newReports;

                // Afgehandelde rapportages (resolved)
                db.get("SELECT COUNT(*) AS resolvedReports FROM reports WHERE status = 'resolved'", (err, row) => {
                    if (err) { console.error(err.message); return res.status(500).send('Server error'); }
                    data.resolvedReports = row.resolvedReports;

                    res.json(data);
                });
            });
        });
    });
});

app.get('/api/admin/recent-activity', ensureAdmin, (req, res) => {
    // Haal de laatste 10 activiteiten op (rapporten, nieuwe gebruikers, nieuwe scammers)
    const query = `
        SELECT 'report' as type, reportDate as timestamp, 'Gebruiker ' || reportedBy || ' heeft een nieuw rapport ingediend voor ' || scammerUsername || '.' as activity, status FROM reports
        UNION ALL
        SELECT 'user' as type, '_rowid_' as timestamp, 'Nieuwe gebruiker aangemeld: ' || displayName as activity, NULL as status FROM users
        UNION ALL
        SELECT 'scammer' as type, reportDate as timestamp, 'Nieuwe scammer toegevoegd: ' || robloxUsername as activity, NULL as status FROM scammers
        ORDER BY timestamp DESC
        LIMIT 10
    `;

    db.all(query, [], (err, rows) => {
        if (err) { console.error(err.message); return res.status(500).send('Server error'); }
        res.json(rows);
    });
});

// NIEUW: API endpoint om alle rapportages op te halen voor de admin
app.get('/api/admin/reports', ensureAdmin, (req, res) => {
    const statusFilter = req.query.status; // Kan 'all', 'pending', 'resolved', 'dismissed' zijn
    let query = `SELECT * FROM reports`;
    const params = [];

    if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE status = ?`;
        params.push(statusFilter);
    }

    query += ` ORDER BY reportDate DESC`;

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Fout bij ophalen rapportages voor admin:', err.message);
            return res.status(500).json({ message: 'Fout bij laden rapportages.' });
        }
        res.json(rows);
    });
});

// NIEUW: API endpoint om de status van een rapportage bij te werken
app.put('/api/admin/reports/:id/status', ensureAdmin, (req, res) => {
    const reportId = req.params.id;
    const { status } = req.body; // De nieuwe status (e.g., 'resolved', 'dismissed')

    if (!status || !['pending', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Ongeldige status opgegeven.' });
    }

    db.run(
        `UPDATE reports SET status = ? WHERE id = ?`,
        [status, reportId],
        function (err) {
            if (err) {
                console.error('Fout bij bijwerken rapportagestatus:', err.message);
                return res.status(500).json({ message: 'Fout bij bijwerken van de rapportagestatus.' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ message: 'Rapportage niet gevonden.' });
            }
            res.json({ message: `Rapportage ${reportId} succesvol bijgewerkt naar status ${status}.` });
        }
    );
});

// Root route om door te verwijzen naar index.html
app.get('/', (req, res) => {
    res.redirect('/index.html');
});

// Stel de poort in
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT}`)); 