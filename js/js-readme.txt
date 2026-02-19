==============================================================================
 DOCUMENTATIE JAVASCRIPT - KLAAS KLAVERJAS
 Versie: 3.2 (Februari 2026)
==============================================================================

Dit document beschrijft de architectuur en de werking van de JavaScript-bestanden
in de map /js. Het spel is opgebouwd volgens een losse MVC-structuur (Model-View-Controller)
om logica en weergave gescheiden te houden.

------------------------------------------------------------------------------
 1. BESTANDEN OVERZICHT
------------------------------------------------------------------------------

1. firebase-config.js      -> Verbinding met Google Firebase (Database).
2. klaverjas-config.js     -> Statische instellingen (kaarten, punten, regels).
3. klaverjas-core.js       -> De 'Motor'. Bevat alle spellogica en status.
4. klaverjas-ui.js         -> De 'Schilder'. Regelt alles wat je op het scherm ziet.
5. klaverjas-main.js       -> De 'Regelaar'. Verbindt Core en UI en regelt het spelverloop.
6. leaderboard-service.js  -> Apart script voor het ophalen/opslaan van scores.

------------------------------------------------------------------------------
 2. ARCHITECTUUR & DATA STROOM
------------------------------------------------------------------------------
De applicatie laadt in deze volgorde (zie index.html):
Config -> Core -> UI -> Service -> Main.

- KJConfig (Config) levert de data (welke kaarten bestaan er?).
- KJCore (Model) houdt de stand bij (wie is aan de beurt, welke kaarten in hand?).
- KJUI (View) tekent de kaarten en updates de scores op het scherm.
- KlaverjasMain (Controller) vangt klikken op, vraagt Core of het mag, en vertelt UI om te updaten.

------------------------------------------------------------------------------
 3. DETAILS PER BESTAND
------------------------------------------------------------------------------

### A. firebase-config.js
Verbindt de app met de Firestore database van het project 'oldboys'.
- Importeert Firebase SDK's via CDN.
- Bevat API Keys en Project ID's.
- Exporteert de variabele `db` die gebruikt wordt in `leaderboard-service.js`.

### B. klaverjas-config.js (Object: KJConfig)
Bevat statische data die nooit verandert tijdens het spel.
- `SUITS`: Definities van kleuren (Harten, Ruiten, etc.) en CSS-classes.
- `VALUES_NORMAL` & `VALUES_TRUMP`: Puntentelling per kaart.
- `ROEM`: Puntentelling voor roem (Stuk, Drieluik, Carré).
- `createDeck()`: Genereert een array van 32 kaart-objecten.

### C. klaverjas-core.js (Object: KJCore)
Dit is het hart van het spel. Hier worden geen HTML-elementen aangeraakt.
- `hands`, `currentTrick`, `points`: Variabelen die de actuele status bijhouden.
- `ruleSet`: Schakelt tussen 'amsterdam' en 'rotterdam'.
- `biddingMode`: Schakelt tussen 'normal' (Utrechts) en 'drents'.
- `init()`: Start een nieuw spel, schudt kaarten en deelt.
- `validateMove(card, player)`: De allerbelangrijkste functie. Bepaalt of een kaart gegooid mag worden
  op basis van kleur bekennen, introefplicht en ondertroef-regels.
- `calculateScore()` & `calculateRoem()`: Berekent punten na een slag.
- `resolveRound()`: Bepaalt aan het einde van 8 slagen wie er gewonnen heeft (inclusief Nat/Pit checks).

### D. klaverjas-ui.js (Object: KJUI)
Verantwoordelijk voor alle DOM-manipulatie en animaties.
- `renderHand()`: Tekent de kaarten van de speler (in een waaier).
- `playCardAnimation()`: Zorgt dat een kaart visueel van hand naar tafel vliegt.
- `clearTableAnimated()`: Ruimt de tafel op na een slag.
- `showTrumpSelection()`: Toont de juiste knoppen (Kies Troef / Pas / Drents).
- `renderLastTrick()`: Toont de popup met de vorige slag.
- `updateScoreSheet()`: Genereert de turflijst tabel.
- `showGameOverScreen()` & `startConfetti()`: Eindscherm logica.

### E. klaverjas-main.js (Object: KlaverjasMain)
De manager die alles aanstuurt.
- `init()`: Startpunt van de applicatie.
- `bindEvents()`: Koppelt klik-functies aan knoppen.
- `startGame()`: Reset de Core en UI voor een nieuw potje.
- `startBiddingPhase()`: Regelt het bieden (passen/kiezen).
- `computerBid()` & `computerMove()`: De AI-logica voor de tegenstanders.
  - De AI kijkt naar punten in de hand en beslist of hij speelt.
  - De AI probeert slagen te winnen of punten bij maat te gooien.
- `onCardClick()`: Wat er gebeurt als jij op een kaart klikt.
- `handleTurnResult()`: Verwerkt de afloop van een slag (wie wint, wie is nu?).

### F. leaderboard-service.js (Object: LeaderboardService)
Module voor communicatie met de database.
- `saveScore(name, score)`: Stuurt score naar Firestore.
- `getTopScores()`: Haalt scores op, filtert op de laatste 7 dagen en sorteert ze.
- Genereert de HTML-lijst (`<li>`) voor het leaderboard scherm.

------------------------------------------------------------------------------
 4. BELANGRIJKE DEPENDENCIES
------------------------------------------------------------------------------
- De applicatie draait volledig client-side (in de browser).
- Voor de database is een actieve internetverbinding nodig.
- Er worden geen NPM packages gebruikt; alles gaat via ES6 modules of script tags.

------------------------------------------------------------------------------
 5. ONDERHOUD & AANPASSINGEN
------------------------------------------------------------------------------
- **Spelsnelheid aanpassen:** In `klaverjas-main.js` -> variabele `gameSpeed`.
- **Nieuwe regels toevoegen:** Aanpassen in `klaverjas-core.js` -> `validateMove`.
- **Puntentelling wijzigen:** Aanpassen in `klaverjas-config.js`.
- **Layout wijzigingen:** Check `klaverjas.css` en `klaverjas-ui.js` (render functies).

==============================================================================