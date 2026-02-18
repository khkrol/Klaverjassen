==============================================================================
 DOCUMENTATIE CSS - KLAAS KLAVERJAS
 Versie: 3.2 (Februari 2026)
 Thema: "Bruine Kroeg" (Dark Wood & Gold)
==============================================================================

Dit document beschrijft de opbouw van de stylesheets. De styling is opgesplitst
in twee bestanden om globale instellingen te scheiden van specifieke spel-elementen.

------------------------------------------------------------------------------
 1. BESTANDEN OVERZICHT
------------------------------------------------------------------------------

1. global.css  -> De basis. Kleurenpalet, lettertypes, algemene layout en knoppen.
2. game.css    -> De details. Alles wat specifiek is voor het spel (kaarten, tafel, popups).

------------------------------------------------------------------------------
 2. GLOBAL.CSS - DE BASIS
------------------------------------------------------------------------------
Dit bestand definieert de "look & feel" van de hele applicatie.

A. CSS Variabelen (:root)
   Hier passen we het kleurenschema aan.
   - --bg-dark / --bg-wood: De donkerbruine tinten voor de achtergrond.
   - --accent-gold: De gouden kleur voor winnaars en highlights.
   - --accent-red: De rode kleur voor tegenstanders en Harten/Ruiten.
   - --font-heading: 'Crete Round' (voor titels en cijfers).
   - --font-body: 'Roboto' (voor leesbare teksten).

B. Layout Structuur
   - body: Gebruikt `100dvh` (Dynamic Viewport Height) om te voorkomen dat
     adresbalken op mobiel de layout verpesten.
   - .glass-container: De hoofdcontainer. Op mobiel is dit fullscreen, op desktop
     wordt dit een smal paneel (max-width: 480px) om een telefoon na te bootsen.

C. Knoppen (.btn-primary, .btn-secondary)
   - Generieke stijlen voor alle knoppen in de app.
   - Bevatten 3D-effecten (border-bottom) en gradients.

------------------------------------------------------------------------------
 3. GAME.CSS - HET SPEL
------------------------------------------------------------------------------
Dit bestand is opgedeeld in genummerde secties.

1. MENU
   De startpagina met het logo en de navigatieknoppen.

2. GAME VIEW (De interface)
   - .top-bar: De balk bovenin met scores en knoppen.
   - .trump-display: De "Gouden Munt" die de troefkleur toont.
   - .score-pill: De scorebordjes voor Wij/Zij.

3. TAFEL & SPELERS
   - .table-container: De ruimte waar de tafel staat (met perspectief).
   - .klaverjas-table: De ronde tafel. Let op: deze is groter op mobiel gemaakt.
   - .avatar: De rondjes voor de spelers (Noord, Zuid, etc.).

4. KAARTEN (.card-modern)
   De visuele opbouw van een speelkaart.
   - De kaarten zijn opgebouwd uit CSS (geen plaatjes!), met symbolen en tekst.

5. SPELER HAND
   - .player-hand: De container onderin.
   - .hand-card: De individuele kaarten in je hand.
   - .card-disabled: Stijl voor kaarten die je niet mag gooien (donkerder/grijs).
   *Let op:* De rotatie (waaier-effect) wordt berekend in JS, maar de styling staat hier.

6. OVERLAYS & POPUPS
   Stijlen voor alle schermen die over het spel heen komen:
   - #last-trick-overlay: Vorige slag bekijken.
   - #game-over-overlay: Eindscherm met confetti.
   - #round-end-overlay: Tussenstand na 8 slagen (Pit/Nat).
   - #bid-card-overlay: De kaart die gedraaid wordt bij Drents bieden.

7. ANIMATIES
   - Keyframes voor het invliegen van kaarten (.fly-in-bottom, etc.).
   - Confetti canvas positionering.

8. MOBIELE OPTIMALISATIE (Onderaan bestand)
   Een speciale @media (max-width: 600px) blok.
   Hierin worden elementen aangepast voor kleine schermen:
   - Topbalk wordt compacter.
   - Tafel schuift iets naar beneden.
   - Kaarten in de hand krijgen meer overlap zodat ze op het scherm passen.

------------------------------------------------------------------------------
 4. Z-INDEX HIERARCHIE (LAGEN)
------------------------------------------------------------------------------
Om te zorgen dat popups altijd bovenop liggen, gebruiken we deze lagen:

0      -> Uitgeschakelde kaarten (card-disabled)
10     -> De Tafel & Top Bar basis
20     -> Speler Avatars
40     -> Speler Hand (Kaarten onderin)
90     -> Statusbalk (Tekstbalk onder topbar)
100    -> Top Bar (Scores) & Zwevende kaarten (Hover)
150    -> Kaarten die over tafel vliegen (Animaties)
1500   -> Gedraaide kaart (Bieden)
2000   -> Confetti effect
2500   -> Standaard Overlays (Rules, Settings, Round End)
3000   -> Game Over Scherm & Troef Selectie Balk (Moet ALTIJD bovenaan)

------------------------------------------------------------------------------
 5. AANPASSINGEN DOEN
------------------------------------------------------------------------------
- Wil je de groene achtergrond veranderen?
  -> Ga naar global.css -> :root -> --bg-chalk

- Wil je de kaarten groter/kleiner maken?
  -> Ga naar game.css -> .card-modern (pas width/height aan).
  -> Let op: Pas ook de overlap aan in .hand-card en de @media query onderaan.

- Past de hand niet op een iPhone mini?
  -> Ga naar game.css -> @media (max-width: 600px) -> .hand-card.
  -> Verhoog de negatieve margin (bijv. van -40px naar -45px).

==============================================================================