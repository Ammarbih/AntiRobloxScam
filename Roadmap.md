# Roadmap voor Roblox Scam Detectie Website

## Fase 1: Planning & Voorbereiding ✅
- [x] Idee en concept uitwerken
- [x] Doelgroep bepalen (Roblox spelers die scammed zijn)
- [x] Domeinnaam kiezen & hosting regelen (bijv. via Vercel, Netlify of eigen VPS)
- [x] Tech stack kiezen (Frontend: React of Next.js, Backend: Node.js met Express of Firebase, Database: MongoDB of Firestore)
- [x] Betaalprovider kiezen (bijv. Stripe voor abonnementsbetalingen)

## Fase 2: Basisfunctionaliteit ontwikkelen 🛠️
- [ ] **Login/registratie:**
  - [ ] E-mail + wachtwoord of social login (bijv. Discord, Google)
  - [ ] Authenticatie en sessiebeheer
- [ ] **Abonnementssysteem:**
  - [ ] Integratie met Stripe of Mollie
  - [ ] €0.99/maand plan opzetten
  - [ ] Alleen leden met actief abonnement krijgen toegang tot de lijst en kunnen scams uploaden
- [ ] **Scammerlijst:**
  - [ ] Database-model maken (bijv. gebruikersnaam, scamtype, bewijslink, datum)
  - [ ] Alleen zichtbaar voor ingelogde leden
  - [ ] Zoek- en filtermogelijkheden
- [ ] **Admin-paneel:**
  - [ ] Inloggen als admin
  - [ ] Scams toevoegen/bewerken/verwijderen
  - [ ] Gebruikers beheren

## Fase 3: Uploadsysteem voor gebruikers 📤
- [ ] **Meldformulier maken:**
  - [ ] Roblox gebruikersnaam scammer
  - [ ] Beschrijving van de scam (min. aantal tekens)
  - [ ] Upload van bewijs (foto/video, max. 50MB)
  - [ ] CAPTCHA bescherming (bijv. Google reCAPTCHA)
- [ ] **Upload management:**
  - [ ] Bestanden uploaden naar veilige opslag (bijv. Firebase Storage, S3)
  - [ ] Validatie van bestandstype (.jpg, .png, .mp4)
  - [ ] Entry wordt als "in afwachting" opgeslagen in de database

## Fase 4: Verificatie en Beloningen ✅/❌🎁
- [ ] **Adminverificatie systeem:**
  - [ ] Admin kan scam beoordelen als "echt" of "nep"
  - [ ] Commentaarveld voor interne notities
- [ ] **Acties op basis van beoordeling:**
  - [ ] Bij "echte scam":
    - [ ] Gebruiker krijgt een notificatie + e-mail
    - [ ] Giftcard (handmatig of automatisch via partner/API)
  - [ ] Bij "nep scam":
    - [ ] Gebruiker krijgt afwijzing met reden

## Fase 5: Extra functies & beveiliging 🔐
- [ ] **CAPTCHA bescherming op formulieren**
- [ ] **Rate limiting tegen spam of brute force aanvallen**
- [ ] **Beveiliging uploads:**
  - [ ] Viruscontrole (indien mogelijk)
  - [ ] Bestandsgrootte- en typebeperkingen
- [ ] **Rapportagesysteem voor bestaande scammers:**
  - [ ] Gebruikers kunnen verdachte entries rapporteren
- [ ] **Audit logs:**
  - [ ] Bewaar log van wie wat geüpload/veranderd heeft

## Fase 6: UI/UX Design 🎨
- [ ] **Ontwerpstijl kiezen:** Clean, modern, mobielvriendelijk
- [ ] **Pagina’s ontwerpen:**
  - [ ] Homepagina met uitleg
  - [ ] Dashboard voor leden
  - [ ] Formulier voor nieuwe scams
  - [ ] Scam database met filters
  - [ ] Admin-dashboard
- [ ] **Responsiviteit:**
  - [ ] Alle pagina's moeten goed werken op mobiel en desktop

## Fase 7: Launch 🚀
- [ ] **Testen:**
  - [ ] Functionele tests (formulieren, uploads, betalingen)
  - [ ] Security tests (authenticatie, bestandsuploads)
- [ ] **Feedback verzamelen van testers**
- [ ] **Livegang:**
  - [ ] Domein koppelen
  - [ ] Hosting activeren
- [ ] **Marketing:**
  - [ ] Discord server maken
  - [ ] TikTok/YouTube korte filmpjes maken
  - [ ] Samenwerken met bekende Roblox creators

## Fase 8: Onderhoud en updates 🔁
- [ ] **Bugfixes en optimalisaties**
- [ ] **Nieuwe features (op basis van feedback)**
  - [ ] Chatfunctie tussen mods/admins en melder
  - [ ] Automatische scam-detectie op basis van tags en patronen
- [ ] **Systeem voor automatische verlenging abonnement**
- [ ] **Maandelijkse rapporten genereren (bijv. aantal scams)**

---

**Belangrijke aandachtspunten:**
- Zorg dat de website voldoet aan de AVG (gebruikersdata, uploads, betalingen)
- Maak duidelijke gebruikersvoorwaarden en privacybeleid
- Leg in de FAQ uit hoe het systeem werkt en wat wel/niet wordt goedgekeurd

**Benodigdheden:**
- Stripe account
- Firebase account of eigen backend server
- Cloud storage voor uploads
- Admins/mods om inzendingen te controleren
- E-mailverzendservice (bijv. SendGrid)

**Volgende stap:** Begin met het bouwen van een MVP (Minimal Viable Product) met alleen de basis: registratie, betaling, lijst en meldformulier.
