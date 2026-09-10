---
name: gtm
description: >
  Template do container GTM deste projeto — tags GA4, Meta Pixel, Google
  Ads (linker + conversão), variáveis do dataLayer (hashes, fbc, gclid).
  Use ao configurar Tag Manager, importar o container, preencher IDs de
  medição, ou quando o usuário fala GTM, pixel, GA4, Facebook ads, fbc.
---

# Skill — GTM (container)

A página só empurra `dataLayer` (`src/tracking.js`, `.skills/tracking/`).
**Destinos de anúncio/analytics vivem no GTM**, não no HTML. Snippet do
container: `templates/head/gtm.html` + `GTM_ID` no `.env`.

Fonte do container importável: `templates/gtm/container.json`.

Não criar skill por plataforma de ads (Meta / GA4 / Ads). Tags e
constantes desta skill cobrem os três; o `dataLayer` é `.skills/tracking/`.
CAPI (servidor) no futuro entra aqui ou numa extensão desta pasta, não
como `tracking-meta`.

**API do GTM: não usar nesta live.** Criar container por API exige
projeto no Google Cloud, OAuth de conta Google do cliente, e scopes de
escrita — pior UX do que “criar container no site → Import → colar IDs
→ Publish”. Revisitar API só se o cliente já tiver GCP/OAuth no colo.

---

## O que o agente faz (ordem)

1. Cliente cria um container **Web** em https://tagmanager.google.com
   (conta Google). Copia o ID `GTM-XXXXXXX` → `.env` (`GTM_ID=`).
2. No GTM: Admin → Import Container → `templates/gtm/container.json`.
   **Merge** no workspace atual, não overwrite.
3. Perguntar quais IDs o cliente **já tem** (não inventar, não criar
   conta de ads por ele):
   - GA4 Measurement ID (`G-...`)
   - Meta Pixel ID (número)
   - Google Ads Conversion ID + label (só se rodar Ads)
4. Preencher as constantes no GTM (nomes abaixo). **Pausar** a tag cujo
   ID o cliente não tem — não deixar tag de Pixel/Ads atirando vazia.
5. Preview no GTM (debug) numa URL de staging, conferir `page_view` no
   dataLayer e o disparo das tags. Publish.

Não perguntar se “quer tracking” — tracking na página é sempre on.
Só faltam os IDs de destino.

---

## Contrato dataLayer → variáveis GTM

Tudo abaixo é **Data Layer Variable** (versão 2), nome da chave = nome
no payload do `track()`. Constantes são preenchidas à mão no GTM.

| Variável GTM | Chave dataLayer / valor | Notas |
|---|---|---|
| `Event` | built-in | nome do evento (`page_view`, `click`, …) |
| `DLV - event_id` | `event_id` | único por disparo; Meta `eventID` / CAPI |
| `DLV - event_time` | `event_time` | unix s; CAPI `event_time` |
| `DLV - anon_id` | `anon_id` | UUID permanente; Meta `external_id` |
| `DLV - session_id` | `session_id` | |
| `DLV - email_hash` | `email_hash` | SHA-256 **já feito** na página. Tag **não** hasheia de novo. |
| `DLV - phone_hash` | `phone_hash` | idem, telefone já em E.164 antes do hash |
| `DLV - gclid` | `gclid` | só se esta **sessão** teve `gclid` na URL |
| `DLV - fbclid` | `fbclid` | só se esta sessão teve `fbclid` na URL |
| `DLV - fbc` | `fbc` | persistido 90d; Meta, inclusive visita orgânica depois |
| `DLV - fbp` | `fbp` | persistido 90d |
| `DLV - utm_source` (etc.) | `utm_*` | sessão; **não** reenviar campanha velha no GA4 |

| `Constant - GA4 Measurement ID` | `G-XXXX` | cliente |
| `Constant - Meta Pixel ID` | `123456789` | cliente |
| `Constant - Google Ads Conversion ID` | `AW-XXXX` | cliente, opcional |
| `Constant - Google Ads Conversion Label` | label | cliente, opcional |

Não mapear `gclid`/`utm_*` velhos como se fossem aquisição da visita
atual. Conversion Linker grava o cookie do Google Ads sozinho. IP
**não** é variável GTM nossa — ver `.skills/tracking/`.

`email_hash` / `phone_hash` só existem no evento `lead_capturado` (e o
que a página disparar depois). Nos outros eventos a variável vem
undefined — ok.

### `fbc` (Meta)

Formato oficial do cookie `_fbc`:

```
fb.1.{timestamp_ms}.{fbclid}
```

- `fb` — versão
- `1` — subdomain index (site no apex / 1º nível; não calcular 2 só
  porque existe `www`)
- `timestamp_ms` — **criação**, `Date.now()` na primeira vez que aquele
  `fbclid` aparece. Não atualizar se o mesmo `fbclid` voltar.
- `fbclid` — valor da URL

A página monta isso em `src/tracking.js` e manda `fbc` em **todo**
`track()` enquanto o TTL de 90 dias valer — **inclusive** se a visita
atual for orgânica. GTM só lê `DLV - fbc`. Não remontar `fbc` no GTM.

**Dois anúncios em dois dias:** a spec *Store ClickID* da Meta manda
**atualizar** `_fbc` quando o `fbclid` da URL **não** é o que já está
no cookie (o trecho depois do último `.`). Last-click: o `fbc` enviado
é o do anúncio **de hoje**, timestamp novo. `fbp` (identidade do
browser) **não** muda. Ver tabela cookie vs parâmetro abaixo.

`fbp`: `fb.1.{timestamp_ms}.{random}` uma vez, mesmo TTL. Pixel oficial
também cria `_fbp`; mandar o nosso no `init` evita dois IDs.

---

## Tags (o que o JSON já traz)

| Tag | Tipo GTM | Disparo | Pausa se faltar |
|---|---|---|---|
| GA4 Configuration | `gaawc` | All Pages; `sendPageView` false | Measurement ID |
| GA4 Event | `gaawe` | custom event regex dos eventos nossos; nome = `{{Event}}` | Measurement ID |
| Conversion Linker | `gclidw` | All Pages | nunca (sem ID) |
| Google Ads Conversion | `awct` | `lead_capturado` | Conversion ID+label |
| Meta Pixel base | Custom HTML `fbq('init')` + PageView | `page_view` | Pixel ID |
| Meta Lead | Custom HTML `fbq('track','Lead')` | `lead_capturado` | Pixel ID |

Eventos cobertos pelo regex GA4:
`page_view|click|form_submit|lead_capturado|^cta_`.

GA4 params sugeridos no evento: `anon_id`, `gclid`, UTMs. User-provided
data (enhanced conversions): `sha256_email_address` ← `DLV - email_hash`
(já hash; marcar na UI como hashed se o campo existir).

Meta `init` / `track` userData: `em` ← email_hash, `ph` ← phone_hash,
`fbc`, `fbp`, `external_id` ← anon_id. Valores vazios: **omitir**, não
mandar string vazia. Todo `fbq('track', …)` leva
`{eventID: '{{DLV - event_id}}'}` — sem isso o CAPI não consegue
deduplicar. Google Ads: `orderId` ← `event_id` na conversão, quando a
tag tiver o campo. Não gerar `event_id` no GTM.

Não colocar Pixel/gtag no `templates/head/` — duplica o GTM.

## Cookie vs parâmetro (o que volta pra ads)

O cookie é **armazenamento no browser**. O parâmetro é o que a tag/CAPI
**envia**. Não hashear `fbc`/`fbp`/`gclid`.

| Cookie / URL | Parâmetro enviado | O que é | Quando atualiza |
|---|---|---|---|
| URL `fbclid` | não vai cru no CAPI | click id do anúncio Meta | a cada clique de anúncio |
| `_fbc` (e nosso `localStorage`) | `user_data.fbc` / `fbq` userData | `fb.1.{ms}.{fbclid}` | **last-click**: `fbclid` novo na URL substitui o antigo (spec Meta). Sem `fbclid` na URL, reenvia o gravado (até 90 d) |
| `_fbp` | `user_data.fbp` | `fb.1.{ms}.{random}` identidade do browser | **nunca** no segundo anúncio; só se não existir |
| URL `gclid` | Ads lê cookie, não nosso DLV eterno | click Google | Conversion Linker `_gcl_aw` last-click |
| `_gcl_aw` | tag Google Ads | gclid persistido ~90 d | novo `gclid` na URL sobrescreve |

Dois anúncios Meta D1 e D2: no D2 o `fbc` é o do D2. Conversão no D3 sem novo clique: ainda o `fbc` do D2. O do D1 não volta.

`event_id` **não** é cookie: é da ocorrência (hash no `track()`). Pixel `eventID` e CAPI `event_id` têm que ser byte a byte iguais. `fbc` diferente no Pixel vs CAPI **não** quebra a dedup de evento (a Meta casa `event_id` + nome); quebra match/atribuição do clique.

First vs last no **GA4**: não duplicar no dataLayer (`first_utm_*` /
`last_utm_*`). Relatório → modelo de atribuição. Ads: last-click do
cookie/`fbc` conforme a tabela. Ver princípio 7 em `.skills/tracking/`.

---

## DNS / staging (agente)

Domínio próprio **não** é passo do GTM. Depois do provedor escolhido no
onboarding, seguir a seção DNS da skill `deploy-<provedor>`. Preview
Vercel pode exigir SSO; Netlify team pode exigir login (`edge-access`).
GTM Preview precisa de uma URL que o browser do cliente abra de fato.

---

## API (adiado)

Não implementar até o onboarding do cliente já incluir Google Cloud +
OAuth consentidos. Import JSON + constantes é o caminho da live.
