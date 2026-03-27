# ROADMAP.md - Gasprice

Bouwvolgorde voor Claude Code. Eén fase per sessie, tenzij anders aangegeven.
Status: [ ] = open, [x] = klaar, [~] = in uitvoering.

---

## Fase 1 - Project fundament

- [x] `package.json` aanmaken met alle dev dependencies
      (jest, eslint, prettier, husky, lint-staged, better-npm-audit, idb)
- [x] ESLint config (`.eslintrc.json`) - ES2022, browser globals
- [x] Prettier config (`.prettierrc`)
- [x] Jest config (`jest.config.js`) met jsdom environment en coverage threshold 80%
- [x] Husky installeren en pre-commit hook configureren
- [x] `.gitignore` aanmaken (node_modules, coverage, .env)
- [x] `.env.example` aanmaken
- [x] GitHub repository aanmaken via GitHub CLI en initiële commit pushen
- [x] GitHub Secrets instellen (SSH_PRIVATE_KEY, VPS_HOST, VPS_USER, VPS_PATH)
      **Let op:** SSH_PRIVATE_KEY en VPS_HOST zijn nog niet beschikbaar - overgeslagen.
      VPS_USER en VPS_PATH ingesteld als placeholders.

## Fase 2 - Data laag

- [x] `js/db.js` - IndexedDB wrapper (open, lees, schrijf, lastFetchedDate)
- [x] `js/api.js` - CBS OData fetch met paginering en voortgangscallback
- [x] `js/data.js` - orchestratie: bepaal wat ontbreekt, haal op, sla op
- [x] Unit tests voor db.js, api.js en data.js (45 tests, 100% line coverage)
- [ ] Handmatig testen in browser: eerste load (20 jaar), tweede load (incrementeel)

## Fase 3 - Visualisatie

- [x] `index.html` - basisstructuur met loader, prijskaarten, grafiekcontainers
- [x] `css/style.css` - donker thema, kleurcodering per brandstof
- [x] `js/chart.js` - D3 hoofdgrafiek met automatisch schaalende tijdas
- [x] `js/navigator.js` - D3 mini-overview met D3 brush (sleepbare selectie)
- [x] `js/prices.js` - huidige prijskaarten bijwerken vanuit IndexedDB
- [x] `js/app.js` - initialisatie, loader met voortgang (jaar + maand), alles samenbrengen
- [x] Loader toont per API-pagina: "Ophalen: januari 2006..."
- [x] Brandstofsoorten individueel aan/uitzetten

## Fase 4 - CI pipeline (zonder deploy)

**Dit is de stop voor vanavond. Deploy volgt morgen na VPS setup.**

- [x] `.github/workflows/ci.yml` - lint, test, security scan op elke push en pull request
- [x] `.github/workflows/deploy.yml` - zelfde checks + rsync deploy op push naar `main`
      De deploy-stap staat er al in maar faalt bewust totdat VPS_HOST en SSH_PRIVATE_KEY
      zijn ingesteld. De CI-stappen (lint/test/security) slagen.
- [x] Verifiëren dat CI slaagt op GitHub zonder actieve deploy

---

## Fase 5 - Deploy (morgen)

**Vereiste voorbereiding op de VPS (handmatig):**

- Hetzner VPS aanmaken (Ubuntu 24.04)
- Nginx installeren en configureren
- Deploy-gebruiker aanmaken met beperkte rechten
- SSH keypair aanmaken, public key op VPS plaatsen
- GitHub Secrets SSH_PRIVATE_KEY en VPS_HOST instellen

**Dan:**

- [ ] Eerste volledige deploy via GitHub Actions
- [ ] Smoke test: pagina bereikbaar, data laadt, grafiek toont
- [ ] Coverage rapport controleren (> 80%)
- [ ] README.md bijwerken met lokale setup en deploy instructies
- [ ] Obsidian-note bijwerken met definitieve architectuur
- [ ] DECISIONS.md aanvullen met eventuele wijzigingen tijdens bouw

---

## Latere uitbreidingen (buiten scope v1)

- Vergelijking met andere landen (BE, DE)
- Prijsalert bij overschrijden drempelwaarde
- Export naar CSV
- Service Worker voor offline werking
