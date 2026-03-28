# ROADMAP.md - Gasprice

Bouwvolgorde voor Claude Code. Eén fase per sessie, tenzij anders aangegeven.
Status: [ ] = open, [x] = klaar, [~] = in uitvoering.

---

## Fase 1 - Project fundament ✓

- [x] `package.json` met alle dev dependencies
      (jest, eslint, prettier, husky, lint-staged, better-npm-audit, idb)
- [x] ESLint config (`.eslintrc.json`) - ES2022, browser globals
- [x] Prettier config (`.prettierrc`)
- [x] Jest config (`jest.config.js`) met jsdom environment en coverage threshold 80%
- [x] Husky installeren en pre-commit hook configureren
- [x] `.gitignore` aanmaken (node_modules, coverage, .env)
- [x] `.env.example` aanmaken
- [x] GitHub repository aanmaken: rickgreen/gasprice (public)
- [x] GitHub Secrets VPS_USER en VPS_PATH ingesteld (placeholders)
      SSH_PRIVATE_KEY en VPS_HOST volgen na VPS setup (Fase 5)

## Fase 2 - Data laag ✓

- [x] `js/db.js` - IndexedDB wrapper (open, CRUD, lastFetchedDate)
- [x] `js/api.js` - CBS OData v4 client met paginering en voortgangscallback
- [x] `js/data.js` - orchestratie: bepaal wat ontbreekt, haal op, sla op
- [x] 45 tests, 100% line coverage

## Fase 3 - Visualisatie ✓

- [x] `index.html` - loader, prijskaarten, grafiekcontainers
- [x] `css/style.css` - donker thema, kleurcodering per brandstof, responsive
- [x] `js/chart.js` - D3 hoofdgrafiek met auto-schaalende tijdas en tooltip
- [x] `js/navigator.js` - D3 mini-overview met D3 brush
- [x] `js/prices.js` - prijskaarten updater
- [x] `js/app.js` - initialisatie, loader voortgang, fuel toggles

## Fase 4 - CI pipeline ✓

- [x] `.github/workflows/ci.yml` - lint, test, security op elke push/PR
- [x] `.github/workflows/deploy.yml` - zelfde checks + rsync deploy op push naar `main`
- [x] CI slaagt op GitHub (deploy faalt bewust tot VPS klaar is)

---

## Fase 5 - Deploy ✓

**VPS voorbereiding (door Rick):**

- [x] Hetzner VPS aanmaken (Ubuntu 24.04)
- [x] SSH keypair aanmaken (ed25519)
- [x] Public key op VPS plaatsen
- [x] Nginx installeren en configureren
- [x] Webroot aanmaken (`/var/www/gasprice`)
- [x] GitHub Secrets `SSH_PRIVATE_KEY` en `VPS_HOST` instellen

**Door Claude Code:**

- [x] Eerste volledige deploy getriggerd via push naar `main` (2026-03-28)
- [x] Smoke test: pagina bereikbaar (200 OK), CSS/JS correct geserveerd
- [x] README.md bijgewerkt met lokale setup en live URL
- [x] Obsidian-note bijgewerkt met definitieve architectuur en URL
- [x] DECISIONS.md aangevuld (ESM+Jest keuze, deploy zonder domein)

**Nginx vhost (minimaal):**

```nginx
server {
    listen 80;
    server_name <VPS_HOST>;
    root /var/www/gasprice;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

---

## Latere uitbreidingen (buiten scope v1)

- Vergelijking met andere landen (BE, DE)
- Prijsalert bij overschrijden drempelwaarde
- Export naar CSV
- Service Worker voor offline werking

### UX verbeteringen

- **Betere loader feedback (prioriteit: hoog)**
  De huidige loader toont alleen tekst ("Ophalen: januari 2006... (123 records)").
  Bij een trage verbinding of grote eerste load is niet duidelijk of de app écht bezig is
  of vastgelopen. Verbeteren met:
  - Progressiebalk op basis van verwacht totaal records (~22.000)
  - Zichtbare recordteller die actief oploopt
  - Geschatte resterende tijd
  - Visueel onderscheid tussen "bezig" en "vastgelopen" (timeout detectie)
