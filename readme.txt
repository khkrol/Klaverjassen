==============================================================================
 PROJECT: KLAAS KLAVERJAS
 Versie: 3.2 (Februari 2026)
 Type: Progressive Web App (PWA)
==============================================================================

Dit is de hoofd-documentatie voor de Klaas Klaverjas applicatie.
De app is een volledig client-side kaartspel dat offline kan werken,
met een optionele koppeling naar Firebase voor de highscores.

------------------------------------------------------------------------------
 1. MAPPENSTRUCTUUR & BESTANDEN
------------------------------------------------------------------------------

(root)/
 [cite_start]├── index.html             -> Het startpunt van de app[cite: 1].
 [cite_start]├── manifest.json          -> Configuratie voor installatie als App (PWA)[cite: 2].
 [cite_start]├── sw.js                  -> Service Worker (regelt offline caching & updates)[cite: 3].
 ├── README.txt             -> Dit bestand.
 │
 ├── assets/                -> Statische media bestanden.
 │   └── img/               -> Afbeeldingen & Iconen.
 │       ├── icon-192.png   -> App icoon (klein).
 │       ├── icon-512.png   -> App icoon (groot).
 │       ├── logo.png       -> Logo in het menu.
 │       └── hoofdstijl.jpg -> Achtergrondafbeelding (kroeg sfeer).
 │
 ├── css/                   -> Opmaak & Stijlen.
 [cite_start]│   ├── global.css         -> Algemene layout & kleuren[cite: 46].
 [cite_start]│   ├── klaverjas.css           -> Specifieke spel-elementen[cite: 47].
 [cite_start]│   └── css-readme.txt     -> Gedetailleerde uitleg over de CSS[cite: 5].
 │
 └── js/                    -> Logica & Functionaliteit.
     ├── firebase-config.js -> Database connectie gegevens.
     [cite_start]├── klaverjas-config.js-> Spelregels & punten configuratie[cite: 4].
     [cite_start]├── klaverjas-core.js  -> De spel-engine (regels, AI, validatie)[cite: 5].
     [cite_start]├── klaverjas-ui.js    -> Tekent het spel op het scherm[cite: 6].
     [cite_start]├── klaverjas-main.js  -> De controller die alles aanstuurt[cite: 7].
     [cite_start]├── leaderboard-service.js -> Highscores ophalen/opslaan[cite: 8].
     [cite_start]└── js-readme.txt      -> Gedetailleerde uitleg over de JS[cite: 4].

------------------------------------------------------------------------------
 2. INSTALLATIE & SETUP
------------------------------------------------------------------------------

A. LOKAAL DRAAIEN
   Omdat dit een moderne web-app is (ES6 Modules), kun je `index.html` NIET
   direct openen vanuit de verkenner. Je hebt een lokale webserver nodig.
   
   Opties:
   1. VS Code: Installeer de extensie "Live Server" en klik op "Go Live".
   2. Python: Run `python -m http.server` in deze map.
   3. Node: Run `npx serve` in deze map.

B. ONLINE ZETTEN (DEPLOY)
   Upload de gehele map naar een statische host zoals:
   - Firebase Hosting (Aanbevolen ivm database).
   - GitHub Pages.
   - Netlify / Vercel.

C. DATABASE KOPPELING
   Om de highscores te laten werken:
   1. Maak een project aan op https://console.firebase.google.com.
   2. Maak een Firestore Database aan.
   3. Kopieer de config-gegevens naar `/js/firebase-config.js`.

------------------------------------------------------------------------------
 3. FEATURES & MOGELIJKHEDEN
------------------------------------------------------------------------------

1. VARIANTEN
   - [cite_start]Rotterdams (Verplicht troeven) of Amsterdams (Maat slag = Vrij)[cite: 52].
   - [cite_start]Utrechts (Zelf troef kiezen) of Drents (Gedraaide kaart + verplicht)[cite: 52].

2. PWA (PROGRESSIVE WEB APP)
   - [cite_start]Dankzij `manifest.json` [cite: 2] [cite_start]en `sw.js` [cite: 3] is de app installeerbaar
     op Android, iOS en Desktop.
   - [cite_start]Werkt volledig offline (behalve het leaderboard)[cite: 40].

3. RESPONSIVE DESIGN
   - Geoptimaliseerd voor mobiel (rechtopstaand) maar werkt ook op desktop.
   - [cite_start]Gebruikt `100dvh` om problemen met mobiele adresbalken te voorkomen[cite: 52].

------------------------------------------------------------------------------
 4. ONDERHOUD
------------------------------------------------------------------------------

- Wil je de styling aanpassen?
  [cite_start]Lees `css/css-readme.txt` voor uitleg over lagen (z-index) en animaties[cite: 5].

- Wil je de spelregels of logica aanpassen?
  [cite_start]Lees `js/js-readme.txt` voor uitleg over de Core en Config bestanden[cite: 4].

- Nieuwe afbeeldingen?
  Plaats ze in `assets/img/` en update de verwijzingen in `css/global.css`,
  `index.html` en `manifest.json`.

==============================================================================