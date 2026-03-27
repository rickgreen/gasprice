# DECISIONS.md - Gasprice

Architectuurkeuzes met datum en motivatie.
Keuzes om iets expliciet _niet_ te doen worden ook vastgelegd.

---

## 2026-03-27 - Vanilla JS, geen framework

**Keuze:** Geen React, Vue of vergelijkbaar framework.

**Motivatie:** De app heeft één pagina, geen state management complexiteit, en geen componenten
die hergebruikt worden buiten dit project. Een framework voegt alleen buildcomplexiteit toe.
D3 werkt het prettigst zonder virtual DOM tussenlaag.

---

## 2026-03-27 - IndexedDB als lokale opslag

**Keuze:** IndexedDB via de `idb` wrapper library, geen localStorage.

**Motivatie:** 20 jaar × 3 brandstoffen ≈ 22.000 records. localStorage heeft een harde limiet
van ~5MB en biedt geen queryopties. IndexedDB heeft geen praktische limiet voor deze dataset
en maakt het later eenvoudiger om vergelijkingen of extra datasets toe te voegen.

**Bewust niet gekozen:** localStorage (te beperkt), geen opslag / altijd alles ophalen
(te traag bij herhaald bezoek).

---

## 2026-03-27 - Offline werking niet ondersteund

**Keuze:** Geen Service Worker, geen offline fallback.

**Motivatie:** De app is een hulpmiddel voor periodieke raadpleging, niet een kritieke
applicatie. De complexiteit van een Service Worker weegt niet op tegen het marginale
gebruiksgemak. Kan in een later stadium alsnog worden toegevoegd.

---

## 2026-03-27 - D3.js v7, geen Highcharts of Highstock

**Keuze:** D3.js v7 voor alle visualisatie.

**Motivatie:** Highcharts/Highstock zijn commercieel gelicenseerd voor niet-persoonlijk gebruik.
D3 geeft volledige controle over het gedrag van de navigator en zoom, en is het primaire
leerdoel van dit project.

**Implementatie:** Twee SVG-elementen (hoofdgrafiek + navigator), D3 brush voor de sleepbare
selectie, automatisch schaalende tijdas op basis van het zichtbare tijdvenster.

---

## 2026-03-27 - CBS OData v4 API als databron

**Keuze:** CBS StatLine tabel 80416NED.

**Motivatie:** Officiële Nederlandse overheidsdata, gratis, geen API-key, CC BY 4.0 licentie,
stabiel endpoint, data beschikbaar vanaf 2006. Geen privacygevoelige data.

**Bewust niet gekozen:** ANWB API (niet officieel gedocumenteerd, kan zonder waarschuwing
verdwijnen), GlobalPetrolPrices (weekgemiddelden in plaats van dagprijzen).

---

## 2026-03-27 - Statische deploy via rsync, geen containerisatie

**Keuze:** Rsync naar Nginx op Hetzner VPS via GitHub Actions.

**Motivatie:** Er is geen backend, geen build-stap en geen runtime-dependency.
Een Docker container voegt alleen overhead toe voor wat statische bestanden zijn.
Rsync is eenvoudig, snel en transparant - ideaal voor het leren van CI/CD pipelines.

**Bewust niet gekozen:** Docker (overkill), Netlify/Vercel (US-cloud, data sovereignty principe),
GitHub Pages (beperkte controle over infrastructuur).

---

## 2026-03-27 - Schrijfacties niet via de app

**Keuze:** De app heeft geen schrijftoegang tot de CBS API of andere externe systemen.
Alle data is read-only.

**Motivatie:** Er valt hier simpelweg niets te schrijven - de CBS API ondersteunt alleen lezen.
