# CLAUDE.md - Gasprice project

Dit bestand is de projectspecifieke instructieset voor Claude Code.
Het **overschrijft** de globale `~/.claude/CLAUDE.md` waar dit bestand explicieter is.
De globale standaarden (Conventional Commits, logging, security, testing) blijven van kracht.

## Toestemming

Alle acties die Claude Code uitvoert binnen de map `Projects/gasprice` zijn toegestaan
zonder bevestiging. Dit omvat:

- Bestanden aanmaken, wijzigen en verwijderen
- Git commits en pushes naar de remote repository
- Packages installeren via npm
- Pre-commit hooks uitvoeren en herhaaldelijk corrigeren totdat alle checks slagen
- De GitHub repository aanmaken en secrets instellen via de GitHub CLI

## Gedeelde documentatie

De Obsidian-projectnote staat op:
`/Users/rick/Documents/Rick's Vault/Code projects/Gasprice/Gasprice.md`

Claude Code mag deze note lezen voor context en bijwerken wanneer architectuurkeuzes
of de projectstatus veranderen.

## Stack

- Vanilla JavaScript (ES2022, geen framework, geen bundler)
- D3.js v7 via CDN
- IndexedDB voor lokale datapersistentie (via idb wrapper library)
- CBS OData v4 API - tabel `80416NED`
- Nginx op Hetzner VPS
- GitHub Actions voor CI/CD (rsync deploy)

## CBS API

Endpoint: `https://datasets.cbs.nl/odata/v1/CBS/80416ned/Observations`
Let op: tabel-ID is **lowercase** (`80416ned`, niet `80416NED`).

Measure-codes (bevestigd via OData v4 MeasureCodes endpoint):

- `A047220` - Euro 95 (Benzine Euro95)
- `A047219` - Diesel
- `A047221` - LPG

Datum formaat in `Perioden`: `YYYYMMDD` (string zonder koppeltekens)
Prijs in euro per liter, inclusief BTW en accijns.
Data beschikbaar vanaf: 2006-01-01.
Publicatiefrequentie: wekelijks (dagprijzen t/m maandag verschijnen de donderdag erna).

## Data strategie

Bij de **eerste page load** wordt alle historische data opgehaald via de gepagineerde CBS API.
De loader toont per API-pagina de voortgang: jaar en maand van de records die binnenkomen.

Daarna slaat de app alle data op in **IndexedDB** (database: `gasprice`, store: `prices`).
Een aparte `meta` store bewaart `lastFetchedDate`.

Bij **volgende page loads** wordt alleen de data opgehaald die nog ontbreekt:
`?$filter=Perioden ge 'YYYYMMDD'` op basis van `lastFetchedDate`.

## Visualisatie

D3.js lijndiagram, Highstock-stijl, met twee componenten:

1. **Hoofdgrafiek** - toont het geselecteerde tijdvenster
2. **Navigator** (mini-overview onderaan) - sleepbare selectie over de volledige tijdreeks

De tijdas schaalt automatisch mee met het zoom-niveau:

- Ver uitgezoomed: jaren
- Middel: maanden
- Ingezoomd: weken
- Ver ingezoomd: dagen

Alle drie brandstofsoorten zijn apart zichtbaar en individueel aan/uitzetten.

## Kwaliteitsborging

### Pre-commit (via husky + lint-staged)

Alle onderstaande checks worden uitgevoerd bij elke commit.
Claude Code lost alle fouten op voordat een commit als geslaagd wordt beschouwd.

- **ESLint** - code kwaliteit (config: `.eslintrc.json`)
- **Prettier** - formatting (config: `.prettierrc`)
- **npm audit** - dependency vulnerabilities (level: moderate en hoger)
- **Jest** - unit tests met jsdom (`--coverage --coverageThreshold='{"global":{"lines":80}}'`)
- **OWASP dependency-check** of `better-npm-audit` - security scan

### CI (GitHub Actions)

Dezelfde checks als pre-commit, plus:

- Lint
- Unit tests met coverage rapport
- Security scan
- Deploy via rsync (alleen op `main`)

### Testbare logica (unit tests verplicht)

- CBS API response parsen (datum, measure-code, waarde)
- Incrementele fetch beslissing (welke datumrange ophalen)
- IndexedDB lees/schrijf operaties (gemockt)
- D3 schaalberekeningen

### Coverage

Minimaal 80% line coverage. Rapportage via Jest `--coverage`.

## Secrets

Geen hardcoded secrets. Alle secrets via environment variables of GitHub Secrets.

| Secret            | Gebruik                       | Locatie       |
| ----------------- | ----------------------------- | ------------- |
| `SSH_PRIVATE_KEY` | Deploy naar Hetzner VPS       | GitHub Secret |
| `VPS_HOST`        | Hostname of IP van de VPS     | GitHub Secret |
| `VPS_USER`        | SSH gebruikersnaam op de VPS  | GitHub Secret |
| `VPS_PATH`        | Absoluut deploy-pad op de VPS | GitHub Secret |

Een `.env.example` staat in de repo als referentie. Het `.env` bestand zelf staat in `.gitignore`.

## Documentatie

Alle functies, klassen en modules hebben JSDoc comments.
Inline comments uitleggen het _waarom_, niet het _wat_.
