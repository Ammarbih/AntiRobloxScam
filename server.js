const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const cors = require('cors');
const { Pool } = require('pg'); // Importeer pg
const multer = require('multer'); // Importeer multer
const path = require('path'); // Nodig voor paden
require('dotenv').config();

console.log('Loaded GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);
console.log('Loaded GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET);

const app = express();

// PostgreSQL database initialiseren met Pool voor connection management
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT, 10),
});

// Test de databaseverbinding
pool.query('SELECT NOW()', (err, queryResult) => {
    if (err) {
        console.error('Fout bij verbinden met PostgreSQL database:', err.stack);
    } else {
        console.log('Verbonden met PostgreSQL database op:', queryResult.rows[0].now);
        // Creëer tabellen als ze niet bestaan
        pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                googleId TEXT UNIQUE,
                displayname TEXT,
                email TEXT UNIQUE,
                avatar TEXT,
                isadmin INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS scammers (
                id SERIAL PRIMARY KEY,
                robloxUsername TEXT UNIQUE NOT NULL,
                scamType TEXT,
                description TEXT,
                reportedBy TEXT,
                reportDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS reports (
                id SERIAL PRIMARY KEY,
                reportedBy TEXT,
                scammerUsername TEXT NOT NULL,
                gameScammed TEXT,
                reportDetails TEXT NOT NULL,
                mediaEvidence TEXT,
                reportDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                status TEXT DEFAULT 'pending'
            );
        `, (err, createTableResult) => {
            if (err) {
                console.error('Fout bij creëren tabellen:', err.stack);
            } else {
                console.log('Database tabellen gecontroleerd/aangemaakt.');
            }
        });
    }
});

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(express.static('pictures')); // Serveer ook de 'pictures' map

// CORS Middleware
app.use(cors({
    origin: 'https://anti-roblox-scam-68023991678.europe-west1.run.app', // De server serveert nu zelf de frontend, dus de origin is ook de server zelf
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
    callbackURL: "https://anti-roblox-scam-68023991678.europe-west1.run.app/auth/google/callback"
},
(accessToken, refreshToken, profile, done) => {
    console.log('Google OAuth authentication successful.');
    // console.log('Google Profile:', profile); // Commented out to reduce log spam

    const userEmail = profile.emails && profile.emails.length > 0 ? profile.emails[0].value : null;
    const isAdmin = (userEmail === process.env.ADMIN_EMAIL) ? 1 : 0;

    pool.query(`SELECT * FROM users WHERE googleId = $1`, [profile.id], (err, userQueryResult) => {
        if (err) return done(err);

        if (userQueryResult.rows.length > 0) {
            // Gebruiker bestaat, update informatie
            pool.query(`UPDATE users SET displayname = $1, email = $2, avatar = $3, isadmin = $4 WHERE googleId = $5`,
                [profile.displayName, userEmail, profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null, isAdmin, profile.id],
                (err, updateResult) => {
                    if (err) return done(err);
                    console.log('Gebruiker bijgewerkt in DB:', profile.displayName);
                    // Haal de bijgewerkte gebruiker op om zeker te zijn dat we de isAdmin flag krijgen
                    pool.query(`SELECT * FROM users WHERE googleId = $1`, [profile.id], (err, updatedUserQueryResult) => {
                        if (err) return done(err);
                        console.log('GoogleStrategy: updatedUser before done:', updatedUserQueryResult.rows[0]);
                        done(null, updatedUserQueryResult.rows[0]);
                    });
                });
        } else {
            // Nieuwe gebruiker, voeg toe aan database
            pool.query(`INSERT INTO users (id, googleId, displayname, email, avatar, isadmin) VALUES ($1, $2, $3, $4, $5, $6)`,
                [profile.id, profile.id, profile.displayName, userEmail, profile.photos && profile.photos.length > 0 ? profile.photos[0].value : null, isAdmin],
                (err, insertResult) => {
                    if (err) return done(err);
                    console.log('Nieuwe gebruiker toegevoegd aan DB:', profile.displayName);
                    // Haal de zojuist toegevoegde gebruiker op
                    pool.query(`SELECT * FROM users WHERE googleId = $1`, [profile.id], (err, newuserQueryResult) => {
                        if (err) return done(err);
                        console.log('GoogleStrategy: newUser before done:', newuserQueryResult.rows[0]);
                        done(null, newuserQueryResult.rows[0]);
                    });
                });
        }
    });
}
));

// Serialize user into the session
passport.serializeUser((user, done) => {
    console.log('Serializing user:', user); // Log het user object hier
    done(null, user.googleid); // Gebruik user.googleid (kleine letters)
});

// Deserialize user from the session
passport.deserializeUser((googleId, done) => {
    console.log('Deserializing googleId:', googleId); // Log de googleId hier
    pool.query(`SELECT * FROM users WHERE googleId = $1`, [googleId], (err, userQueryResult) => {
        if (err) return done(err);
        console.log('Deserialized user from DB:', userQueryResult.rows[0]); // Log de gedeserialiseerde gebruiker hier
        done(null, userQueryResult.rows[0]); // Stuur het volledige gebruikersobject door
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
        const userEmail = req.user.email; // Gebruik req.user.email

        // Gebruik req.user.isadmin van de gedeserialiseerde gebruiker
        if (req.user && req.user.isadmin === 1) {
            console.log('Admin user logged in. Redirecting to admin dashboard.');
            res.redirect('/admin_dashboard.html');
        } else {
            const redirectUrl = req.session.returnTo || '/dashboard.html'; // Veranderd van /index.html naar /dashboard.html
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
                displayname: req.user.displayname,
                email: req.user.email,
                avatar: req.user.avatar
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
    const reportedBy = req.user.displayname; // Gebruik nu displayname in plaats van googleid
    const mediaEvidencePath = req.file ? '/uploads/' + req.file.filename : null; // Pad naar geüploade bestand

    if (!scammerUsername || !reportDetails || !gameScammed) {
        // Geef een specifieke melding als verplichte velden ontbreken
        return res.status(400).json({ message: 'De velden Roblox Gebruikersnaam, Game en Details zijn verplicht.' });
    }

    pool.query(
        `INSERT INTO reports (reportedBy, scammerUsername, reportDetails, gameScammed, mediaEvidence, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [reportedBy, scammerUsername, reportDetails, gameScammed, mediaEvidencePath, 'pending'],
        (err, result) => {
            if (err) {
                console.error('Fout bij opslaan rapportage:', err.message);
                console.error('Ontvangen rapportage data:', req.body);
                console.error('Bestand:', req.file);
                return res.status(500).json({ message: 'Er is een fout opgetreden bij het indienen van de rapportage.' });
            }
            res.status(201).json({ message: 'Rapportage succesvol ingediend! We zullen dit zo snel mogelijk beoordelen.', reportId: result.rows[0].id });
        }
    );
});

// NIEUW: Endpoint om rapportages van de ingelogde gebruiker op te halen
app.get('/api/my-reports', (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ message: 'U moet ingelogd zijn om uw rapportages te bekijken.' });
    }

    const userDisplayName = req.user.displayname; // Gebruik displayname om te filteren

    pool.query(`SELECT id, reportedBy AS reportedByName, scammerUsername, gameScammed, reportDetails, mediaEvidence, reportDate, status FROM reports WHERE reportedBy = $1 ORDER BY reportDate DESC`, [userDisplayName], (err, queryResult) => {
        if (err) {
            console.error('Fout bij ophalen gebruikersrapporten:', err.message);
            return res.status(500).json({ message: 'Er is een fout opgetreden bij het ophalen van uw rapportages.' });
        }
        res.json(queryResult.rows);
    });
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
    if (req.isAuthenticated() && req.user && req.user.isadmin === 1) {
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
    pool.query("SELECT COUNT(*) AS totalUsers FROM users", (err, countUsersResult) => {
        if (err) { console.error(err.stack); return res.status(500).send('Server error'); }
        data.totalusers = parseInt(countUsersResult.rows[0].totalusers); // Verwijder || 0 om zeker te zijn van parsing

        // Actieve scammers
        pool.query("SELECT COUNT(*) AS activeScammers FROM scammers", (err, countScammersResult) => {
            if (err) { console.error(err.stack); return res.status(500).send('Server error'); }
            data.activescammers = parseInt(countScammersResult.rows[0].activescammers); // Verwijder || 0

            // Nieuwe rapportages (pending)
            pool.query("SELECT COUNT(*) AS newReports FROM reports WHERE status = 'pending'", (err, countNewReportsResult) => {
                if (err) { console.error(err.stack); return res.status(500).send('Server error'); }
                data.newreports = parseInt(countNewReportsResult.rows[0].newreports); // Verwijder || 0

                // Afgehandelde rapportages (resolved)
                pool.query("SELECT COUNT(*) AS resolvedReports FROM reports WHERE status = 'resolved'", (err, countResolvedReportsResult) => {
                    if (err) { console.error(err.stack); return res.status(500).send('Server error'); }
                    data.resolvedreports = parseInt(countResolvedReportsResult.rows[0].resolvedreports); // Verwijder || 0

                    console.log('Sending dashboard data:', data); // Voeg deze log toe
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
        SELECT 'user' as type, CURRENT_TIMESTAMP as timestamp, 'Nieuwe gebruiker aangemeld: ' || displayname as activity, NULL as status FROM users
        UNION ALL
        SELECT 'scammer' as type, reportDate as timestamp, 'Nieuwe scammer toegevoegd: ' || robloxUsername as activity, NULL as status FROM scammers
        ORDER BY timestamp DESC
        LIMIT 10
    `;

    pool.query(query, [], (err, activityQueryResult) => {
        if (err) { console.error(err.stack); return res.status(500).send('Server error'); }
        res.json(activityQueryResult.rows);
    });
});

// NIEUW: API endpoint om alle rapportages op te halen voor de admin
app.get('/api/admin/reports', ensureAdmin, (req, res) => {
    const statusFilter = req.query.status; // Kan 'all', 'pending', 'resolved', 'dismissed' zijn
    let query = `
        SELECT
            id, scammerUsername, gameScammed, reportDetails, mediaEvidence, reportDate, status,
            reportedBy AS reportedByName
        FROM reports
    `;
    const params = [];

    if (statusFilter && statusFilter !== 'all') {
        query += ` WHERE status = $1`;
        params.push(statusFilter);
    }

    query += ` ORDER BY reportDate DESC`;

    pool.query(query, params, (err, adminReportsQueryResult) => {
        if (err) {
            console.error('Fout bij ophalen rapportages voor admin:', err.stack);
            return res.status(500).json({ message: 'Fout bij laden rapportages.' });
        }
        res.json(adminReportsQueryResult.rows);
    });
});

// NIEUW: API endpoint om de status van een rapportage bij te werken
app.put('/api/admin/reports/:id/status', ensureAdmin, (req, res) => {
    const reportId = req.params.id;
    const { status } = req.body; // De nieuwe status (e.g., 'resolved', 'dismissed')

    if (!status || !['pending', 'resolved', 'dismissed'].includes(status)) {
        return res.status(400).json({ message: 'Ongeldige status opgegeven.' });
    }

    pool.query(
        `UPDATE reports SET status = $1 WHERE id = $2`,
        [status, reportId],
        (err, result) => {
            if (err) {
                console.error('Fout bij bijwerken rapportagestatus:', err.stack);
                return res.status(500).json({ message: 'Fout bij bijwerken van de rapportagestatus.' });
            }
            if (result.rowCount === 0) {
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
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server draait op poort ${PORT}`)); 