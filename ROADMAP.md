# ROADMAP.md - Gasprice

Bouwvolgorde voor Claude Code. Eén fase per sessie, tenzij anders aangegeven.
Status: [ ] = open, [x] = klaar, [~] = in uitvoering.

---

## Fase 1 - Project fundament ✓

- [x] `package.json` met alle dev dependencies
- [x] ESLint, Prettier, Jest config + Husky pre-commit hook
- [x] `.gitignore`, `.env.example`
- [x] GitHub repository aangemaakt: rickgreen/gasprice (public)
- [x] GitHub Secrets VPS_USER en VPS_PATH ingesteld

## Fase 2 - Data laag ✓

- [x] `js/db.js` - IndexedDB wrapper
- [x] `js/api.js` - CBS OData v4 client met paginering
- [x] `js/data.js` - orchestratie
- [x] 45 unit tests, 100% line coverage

## Fase 3 - Visualisatie ✓

- [x] `index.html`, `css/style.css`
- [x] `js/chart.js` - D3 hoofdgrafiek met auto-schaalende tijdas
- [x] `js/navigator.js` - D3 mini-overview met brush
- [x] `js/prices.js`, `js/app.js`

## Fase 4 - CI pipeline ✓

- [x] `.github/workflows/ci.yml` - lint, test, security op elke push/PR
- [x] `.github/workflows/deploy.yml` - checks + rsync deploy op main
- [x] CI slaagt op GitHub

## Fase 5 - Deploy ✓

- [x] Hetzner VPS aangemaakt (CX23, Ubuntu 24.04)
- [x] SSH keypair aangemaakt, public key op VPS
- [x] Nginx geconfigureerd, webroot aangemaakt, deploy-gebruiker
- [x] GitHub Secrets SSH_PRIVATE_KEY en VPS_HOST ingesteld
- [x] Eerste deploy geslaagd
- [x] CBS API 404 opgelost (lowercase tabel-ID, correcte measure-codes)
- [x] Integratietests toegevoegd

---

## Fase 6 - Infrastructure as Code + SSL + Subdomain (leerdoel)

Terraform voor provisioning van de Hetzner VPS, Ansible voor configuratie.
Inclusief subdomain op rickgreen.nl, Let's Encrypt SSL met automatische verlenging en HSTS.
Vervangt het handmatige werk van Fase 5 volledig.

De VPS is bewust ingericht zonder vaste projectkoppeling: toekomstige projecten krijgen
elk hun eigen subdomain en Nginx vhost op dezelfde machine.

**Voorbereiding (handmatig, eenmalig):**

- [ ] Bij Vimexx een A-record aanmaken: `gasprice.rickgreen.nl` → IP-adres van de Hetzner VPS
      DNS propagatie duurt 0-48 uur, plan dit vooraf
- [ ] Hetzner API token aanmaken via Hetzner Console → API tokens

**Benodigde GitHub Secrets (nieuw):**

| Secret              | Inhoud            |
| ------------------- | ----------------- |
| `HETZNER_API_TOKEN` | Hetzner API token |

### Terraform (provisioning)

- [x] `terraform/` map aangemaakt
- [x] `terraform/main.tf` - Hetzner provider, VPS resource (cx22, ubuntu-24.04, nbg1)
- [x] `terraform/variables.tf` - hcloud_token, ssh_public_key_path, server_name, etc.
- [x] `terraform/outputs.tf` - server_ip, server_id, server_status
- [x] `terraform/versions.tf` - provider versies vergrendeld + S3 backend
- [x] `terraform/terraform.tfvars.example` - voorbeeld variabelen
- [x] `terraform.tfstate` en `.terraform/` in `.gitignore`
- [x] Remote state in Hetzner Object Storage (S3-compatible, bucket `gasprice-tfstate`)
- ~~`.github/workflows/provision.yml`~~ — bewust niet: CLI-only (zie DECISIONS.md)

### Ansible (configuratie)

- [x] `ansible/` map met roles-structuur
- [x] `ansible/inventory.yml` - host definitie (IP in te vullen na terraform apply)
- [x] `ansible/site.yml` - hoofdplaybook met alle roles
- [x] `ansible/roles/nginx/` - Nginx installeren, vhost template (HTTP-only initieel)
- [x] `ansible/roles/nginx/templates/gasprice.nginx.ssl.conf.j2` - HTTPS + HSTS template
- [x] `ansible/roles/certbot/` - Certbot installeren, cert aanvragen, auto-renewal (tag: ssl)
- [x] `ansible/roles/deploy_user/` - deploy-gebruiker, SSH key, webroot
- [x] `ansible/vars/gasprice.yml` - variabelen (domain, webroot, deploy_user, certbot_email)
- [x] `ansible/ansible.cfg` - defaults
- [x] `ansible/roles/ufw/` - UFW firewall: deny inbound, allow 22/80/443 (tag: firewall)
- [x] `ansible/roles/fail2ban/` - SSH + Nginx jails via jail.local template (tag: fail2ban)
- [x] `ansible/roles/hardening/` - Assert unattended-upgrades enabled (tag: hardening)
- [x] Role-volgorde in site.yml: ufw → fail2ban → hardening → deploy_user → nginx → certbot
- ~~`.github/workflows/configure.yml`~~ — bewust niet: CLI-only (zie DECISIONS.md)

### SSL en HSTS - hoe het werkt

**Let's Encrypt** is een gratis Certificate Authority. Certbot is de tool die namens
Let's Encrypt een SSL-certificaat aanvraagt en beheert. De geldigheid is 90 dagen;
Certbot verlengt automatisch via een systemd timer die twee keer per dag controleert
of verlenging nodig is (bij minder dan 30 dagen resterende geldigheid).

De Nginx vhost na Certbot ziet er zo uit:

```nginx
# HTTP: altijd doorsturen naar HTTPS
server {
    listen 80;
    server_name gasprice.rickgreen.nl;
    return 301 https://$host$request_uri;
}

# HTTPS: de echte vhost
server {
    listen 443 ssl;
    server_name gasprice.rickgreen.nl;
    root /var/www/gasprice;
    index index.html;

    ssl_certificate     /etc/letsencrypt/live/gasprice.rickgreen.nl/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gasprice.rickgreen.nl/privkey.pem;

    # HSTS: browsers onthouden dat deze site altijd HTTPS vereist
    # max-age=31536000 = 1 jaar
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

**HSTS** (HTTP Strict Transport Security) instrueert de browser om voor de komende
31536000 seconden (1 jaar) altijd HTTPS te gebruiken voor dit domein, ook als de
gebruiker `http://` typt. Dit voorkomt dat een aanvaller de eerste request kan
onderscheppen voordat de redirect plaatsvindt.

### Volgorde bij gebruik

1. Hetzner Object Storage bucket aanmaken (`gasprice-tfstate`)
2. `terraform.tfvars` aanmaken op basis van `terraform.tfvars.example`
3. `cd terraform && terraform init -backend-config="access_key=..." -backend-config="secret_key=..."`
4. `terraform plan` → controleer, dan `terraform apply` → IP-adres als output
5. A-record aanmaken bij Vimexx: `gasprice.rickgreen.nl` → IP uit stap 4
6. IP-adres invullen in `ansible/inventory.yml`
7. `cd ../ansible && ansible-playbook site.yml` → Nginx + deploy user (HTTP-only)
8. Wacht op DNS propagatie, dan: `ansible-playbook site.yml --tags ssl` → Certbot + HTTPS + HSTS
9. Verifiëren: `https://gasprice.rickgreen.nl` bereikbaar, cert geldig, HSTS header
10. GitHub Secrets updaten met nieuw IP, dan normale `deploy.yml` bij push naar main

**Doel:** de huidige VPS blijft draaien tijdens de bouw van de IaC-setup.
Zodra alles werkt, wordt de bestaande VPS vervangen door de Terraform-beheerde instantie.

---

## Latere uitbreidingen (buiten scope v1)

- Vergelijking met andere landen (BE, DE)
- Prijsalert bij overschrijden drempelwaarde
- Export naar CSV
- Service Worker voor offline werking

### UX verbeteringen

- **Betere loader feedback**
  Progressiebalk, oplopende recordteller, geschatte resterende tijd,
  timeout detectie voor vastgelopen loader.

### Grafiek verbeteringen

- **Vaste Y-as schaal**
  Gebaseerd op historisch min/max, niet op de geselecteerde periode.

- **Herhalende jaarlabels op X-as**
  Automatisch granulariteit aanpassen: jaren → maanden → weken → dagen.

### Prijskaarten verbeteringen

- **Datum op actuele prijs**
  Formaat: "23 maart 2026" (Nederlandse notatie).

- **Statistieken per brandstof**
  Historisch laagste/hoogste met datum. Laagste/hoogste in geselecteerde periode,
  dynamisch bijgewerkt bij navigator-wijziging.

### Teststrategie

- **Integratietest CBS API**
  Aparte CI-stap op schema (dagelijks). Smoke test na elke deploy.
