## 2026-03-28 - Integratietests gescheiden van unit tests

**Keuze:** Twee Jest configuraties: `jest.config.js` (unit, jsdom) en
`jest.integration.config.js` (integratie, node). Pre-commit draait alleen unit tests.
CI draait beide.

**Motivatie:** Unit tests moeten snel en offline zijn voor de pre-commit hook.
Integratietests raken het netwerk (CBS API) en zijn trager en minder deterministisch.
De scheiding voorkomt dat een tijdelijke CBS-storing commits blokkeert.

---

## 2026-03-28 - CBS API: correcties na productie-incident

**Bevinding:** De gegenereerde filter-URL gaf een 404 in productie, ondanks 100% unit test
coverage. Oorzaken gevonden via curl-onderzoek:

1. Tabel-ID is case-sensitive: `80416NED` moet `80416ned` zijn (lowercase)
2. Measure-codes in OData v4 wijken af van de CBS-documentatie:
   - `BenzineEuro95_1` → `A047220`
   - `Diesel_2` → `A047219`
   - `Lpg_3` → `A047221`

**Les:** Unit tests met gemockte fetch kunnen nooit valideren of een externe API-URL
correct is. Integratietests die de echte API aanroepen zijn noodzakelijk als aanvulling.

**Actie:** `js/api.js` gecorrigeerd, `CLAUDE.md` bijgewerkt met de juiste measure-codes,
integratietests toegevoegd.

---

## 2026-03-28 - Terraform en Ansible handmatig via CLI, geen GitHub Actions

**Keuze:** Geen `provision.yml` of `configure.yml` GitHub Actions workflows. Terraform
en Ansible worden uitsluitend via de CLI uitgevoerd.

**Motivatie:** Het doel van Fase 6 is leren hoe Infrastructure as Code werkt. Automatisering
via GitHub Actions verbergt de feedback loop: je ziet niet direct wat er gebeurt, foutmeldingen
zijn moeilijker te debuggen, en je leert minder van het proces. Door handmatig
`terraform apply` en `ansible-playbook` te draaien ontstaat een directe band met de tooling.
Automatisering kan later alsnog worden toegevoegd wanneer het proces begrepen en stabiel is.

**Bewust niet gekozen:** GitHub Actions voor provisioning/configuratie (te vroeg in het
leerproces, verbergt complexiteit, maakt debugging lastiger).

---

## 2026-03-28 - Terraform remote state in Hetzner Object Storage

**Keuze:** Terraform state wordt opgeslagen in een S3-compatible Hetzner Object Storage
bucket (`gasprice-tfstate`), niet lokaal.

**Motivatie:** Lokale state is verliesbaar (bij disk crash of per ongeluk verwijderen) en
niet deelbaar. Remote state is de standaard best practice. Hetzner Object Storage is
S3-compatible, goedkoop, en houdt alle infrastructuur bij dezelfde provider. De backend
credentials worden via environment variables meegegeven bij `terraform init`.

**Bewust niet gekozen:** Terraform Cloud (overkill voor een soloproject), lokale state
(te fragiel), AWS S3 (onnodige provider-mix).

---

## 2026-03-28 - VPS zonder vaste projectkoppeling

**Keuze:** De Terraform-beheerde VPS is een generieke machine. Project-specifieke
configuratie (vhosts, webroots, deploy users) wordt door Ansible geregeld.

**Motivatie:** Toekomstige projecten kunnen hun eigen subdomain en Nginx vhost krijgen
op dezelfde VPS, zonder de Terraform-configuratie te wijzigen. Dit scheidt de
infrastructuurlaag (machine bestaat) van de configuratielaag (machine doet iets).

---

## 2026-03-28 - Fail2Ban: jail.local boven jail.conf

**Keuze:** Alle Fail2Ban configuratie staat in `/etc/fail2ban/jail.local`, beheerd via
een Ansible template. Het bestand `jail.conf` wordt nooit aangepast.

**Motivatie:** `jail.conf` is eigendom van het Fail2Ban-pakket. Bij een `apt upgrade`
wordt dit bestand overschreven door de package maintainer. Aanpassingen in `jail.conf`
gaan dan stilzwijgend verloren — of dpkg vraagt interactief welke versie bewaard moet
worden, wat onbeheerde servers blokkeert. `jail.local` wordt automatisch geladen als
override en wordt nooit aangeraakt door pakketbeheer. Dit is de door Fail2Ban
[gedocumenteerde aanpak](https://github.com/fail2ban/fail2ban/wiki/Proper-fail2ban-configuration).

---

## 2026-03-28 - Unattended-upgrades: alleen verificatie, geen installatie

**Keuze:** De Ansible `hardening` role installeert unattended-upgrades niet, maar
verifieert alleen dat de service enabled is via `systemctl is-enabled`.

**Motivatie:** Ubuntu 24.04 heeft unattended-upgrades standaard geïnstalleerd en
ingeschakeld. Opnieuw installeren of configureren brengt het risico dat defaults
overschreven worden met een eigen configuratie die vervolgens onderhouden moet worden.
Een assert-task vangt het onverwachte geval dat de service uitgeschakeld is, zonder
onnodige wijzigingen aan te brengen.
