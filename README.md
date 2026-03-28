# Brandstofprijzen Nederland

Interactieve visualisatie van 20 jaar Nederlandse pompprijzen (Euro 95, Diesel, LPG) met data van het CBS.

**Live:** [http://204.168.178.129](http://204.168.178.129)

## Features

- D3.js lijndiagram met automatisch schaalende tijdas
- Navigator (mini-overview) met sleepbare selectie
- Brandstofsoorten individueel aan/uitzetten
- IndexedDB caching: eerste bezoek haalt alle data op, daarna alleen incrementeel
- Hover tooltip met exacte datum en prijs per brandstof
- Donker thema, responsive design

## Stack

- Vanilla JavaScript (ES2022, geen framework, geen bundler)
- D3.js v7 via CDN
- IndexedDB via [idb](https://github.com/jakearchibald/idb)
- CBS OData v4 API (tabel 80416NED)
- Nginx op Hetzner VPS
- GitHub Actions CI/CD (rsync deploy)

## Lokale setup

```bash
git clone git@github.com:rickgreen/gasprice.git
cd gasprice
npm install
```

Lokaal testen:

```bash
npm test              # Jest tests met coverage
npx eslint js/**/*.js # Lint
npx prettier --check '**/*.{js,json,css,html,md}'  # Format check
```

Open `index.html` via een lokale server (fetch vereist HTTP):

```bash
npx serve .
```

## Deploy

Elke push naar `main` triggert automatisch:

1. Lint (ESLint + Prettier)
2. Tests (Jest, coverage > 80%)
3. Security audit (better-npm-audit)
4. Deploy via rsync naar de VPS

### Benodigde GitHub Secrets

| Secret            | Inhoud                                  |
| ----------------- | --------------------------------------- |
| `SSH_PRIVATE_KEY` | Private SSH key voor toegang tot de VPS |
| `VPS_HOST`        | IP-adres of hostname van de VPS         |
| `VPS_USER`        | SSH gebruikersnaam                      |
| `VPS_PATH`        | Absoluut pad op VPS                     |

### VPS setup (eenmalig)

```bash
sudo apt update && sudo apt install -y nginx
sudo mkdir -p /var/www/gasprice
sudo chown $USER:$USER /var/www/gasprice
```

## Data

Bron: [CBS Open Data](https://opendata.cbs.nl) — tabel 80416NED (Pompprijzen motorbrandstoffen per dag).
Beschikbaar vanaf 1 januari 2006. Licentie: CC BY 4.0.

## Licentie

MIT
