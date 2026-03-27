# Gasprice

Statische webapp die 20 jaar aan Nederlandse pompprijzen visualiseert met D3.js.
Data komt van de CBS Open Data API (tabel 80416NED), gratis en zonder registratie.

## Wat doet het

- Toont de meest recente pompprijzen voor Euro95, diesel en LPG
- Interactieve D3 lijndiagram met data vanaf 1 januari 2006
- Tijdranges instelbaar: 1M, 3M, 1J, 5J, 10J of alles
- Per brandstof aan/uitzetten
- Hover tooltip met exacte datum en prijs
- Annotaties op historische momenten (piek 2022, accijnskorting, etc.)

## Technische stack

- Statische HTML/CSS/JS - geen framework, geen build-stap
- D3.js v7 (CDN)
- CBS OData v4 API
- Nginx op Hetzner VPS

## Lokaal draaien

Omdat de app fetch() gebruikt, heb je een lokale webserver nodig
(browsers blokkeren fetch() op file:// URLs).

```bash
# Python (standaard beschikbaar op macOS/Linux)
cd gasprice
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy

Elke push naar `main` triggert automatisch een deploy via GitHub Actions.
Zie `.github/workflows/deploy.yml` voor de pipeline.

### Benodigde GitHub Secrets

Stel deze in via: Repository → Settings → Secrets and variables → Actions

| Secret            | Inhoud                                          |
| ----------------- | ----------------------------------------------- |
| `SSH_PRIVATE_KEY` | Private SSH key voor toegang tot de VPS         |
| `VPS_HOST`        | IP-adres of hostname van de Hetzner VPS         |
| `VPS_USER`        | SSH gebruikersnaam (bijv. `deploy`)             |
| `VPS_PATH`        | Absoluut pad op VPS (bijv. `/var/www/gasprice`) |

### VPS setup (eenmalig)

```bash
# Op de Hetzner VPS:
sudo apt update && sudo apt install -y nginx

# Webroot aanmaken
sudo mkdir -p /var/www/gasprice
sudo chown $USER:$USER /var/www/gasprice

# Nginx configureren - zie docs/nginx.conf
```

## CBS API - measure-codes valideren

Bij de eerste keer draaien logt de app de ontvangen CBS measure-codes
naar de browser console. Gebruik dit om `FUEL_CONFIG` in `js/app.js`
te valideren en eventueel aan te passen.

Je kunt ook `validateData()` aanroepen vanuit de browser console
nadat de data geladen is.

## Data

- Bron: CBS StatLine tabel 80416NED
- Inhoud: gewogen gemiddelde dagprijzen Euro95, diesel, LPG
- Frequentie: dagelijkse meting, wekelijks gepubliceerd
- Beschikbaar vanaf: 1 januari 2006
- Licentie: CC BY 4.0
