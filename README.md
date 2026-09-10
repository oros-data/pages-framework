# pages-framework

Template de páginas rápidas (HTML + JS quando precisar). A fonte é
`src/`; o build gera `public/` pronto pra **qualquer host estático**
(Cloudflare, Netlify, Vercel, FTP, etc.). Cloudflare tem extras no
repo (`worker.js`, Wrangler) — o restante do fluxo não depende disso.

Este repositório é um **GitHub Template**. Cliente (ou a live) cria o
projeto com **Use this template** — não com Fork. Fork liga o repo de
volta ao esqueleto e empurra PRs pra cá; o template nasce independente.

## Começar a partir do template

1. No GitHub: **Use this template** → repositório novo (nome livre).
2. Clone o repo **novo**, não este.
3. Identidade local (não escolhe provedor, não faz login em host nenhum):

```bash
python3 utils/init.py "Nome do projeto"
```

Isso grava o slug em `package.json`, preenche os nomes de Worker no
`wrangler.jsonc` **para o caso** de o deploy ser Cloudflare, e troca o
título placeholder de `src/index.html` se ainda estiver o do template.

4. `cp .env.example .env` e preencha `GTM_ID` (e o que mais os snippets
   de `templates/head/` pedirem).
5. Hospedagem é pergunta de onboarding (`.skills/onboarding/`), na hora
   do deploy — não do init. DNS/domínio próprio está na skill do
   provedor escolhido. GTM: `.skills/gtm/` + import de
   `templates/gtm/container.json` (não é API).

## Estrutura

- `src/` — **fonte de verdade.** Edite as páginas aqui, nunca em `public/`.
- `public/` — **100% gerado pelo build.** Não editar direto, some/reaparece
  a cada build. Não é versionado (veja `.gitignore`).
- `templates/head/` — snippets a injetar no `<head>` de toda página (GTM,
  Pixel do Facebook, qualquer outro). **Qualquer `.html` aqui entra
  automaticamente** — não precisa mexer no `build.py` pra adicionar um.
- `utils/build.py` — monta `public/` a partir de `src/`, concatenando todo
  arquivo de `templates/head/` e injetando no marcador `<!-- build:head -->`
  de cada página.
- `utils/palette.py` — extrai paleta de cor de uma imagem, escreve
  `src/theme.css` (veja `AGENTS.md` pro ambiente Python).
- `templates/gtm/container.json` — import no Tag Manager (GA4, Meta,
  Ads). Ver `.skills/gtm/`.
- `utils/init.py` — identidade do projeto no clone (stdlib; sem venv).
- `worker.js` — extra Cloudflare: serve `public/` via binding `ASSETS`.
  Passthrough; os outros provedores ignoram este arquivo.
- `wrangler.jsonc` — extra Cloudflare (produção + `staging`). Nomes
  genéricos no template (`pages-site`); o init preenche. Sem efeito
  em Vercel/Netlify.

## Configurar snippets (GTM e outros)

```bash
cp .env.example .env
```

Edite `.env` e preencha o valor real (`GTM_ID=GTM-XXXXXXX`). Esse arquivo
não é versionado — cada pessoa mantém o próprio, e o build já lê ele
sozinho, sem precisar exportar variável de ambiente na mão toda vez.

Sem o `.env` (ou sem a variável dentro dele), o build funciona
normalmente mas avisa e deixa o placeholder (`{{GTM_ID}}`) sem preencher
— propositalmente quebrado, pra não subir sem querer um snippet que não
funciona de verdade. Se preferir variável de ambiente de verdade (ex.:
CI), também funciona — `.env` só tem prioridade quando os dois existem.

**Adicionar outro script** (Pixel do Facebook, outro analytics, o que
for): cria um arquivo novo em `templates/head/`, usa `{{NOME_DA_VAR}}` pra
qualquer valor que precise vir de variável de ambiente, e pronto — entra
automaticamente em toda página no próximo build. Nenhum código a mexer.

## Local

Não precisa de `npm install`. O projeto não tem dependências npm —
Python 3 cobre build e o servidor local; Node só entra na hora do
deploy, via `npx` (baixa o CLI daquele provedor, não instala no SO).

```bash
python3 utils/init.py "Nome do projeto"   # uma vez
cp .env.example .env                      # GTM etc.
npm run dev                               # build + http://127.0.0.1:8787
```

`npm run dev` serve `public/` com o `http.server` da stdlib do Python
(porta 8787). Não usa Wrangler. Extra Cloudflare, se quiser o Worker
local: `npm run dev:cloudflare` (baixa `wrangler` na hora).

## Deploy

Não há provedor padrão. Cada um tem skill em `.skills/deploy-<nome>/`
(login, o que muda em staging). O CLI **não** vai no computador do
aluno nem em `node_modules`: o script chama `npx --yes pacote@version`.

Staging (URL de teste, não produção):

```bash
npm run deploy:cloudflare:staging
npm run deploy:vercel:staging
npm run deploy:netlify:staging
```

Produção:

```bash
npm run deploy:cloudflare
npm run deploy:vercel
npm run deploy:netlify
```

`npm run deploy` / `deploy:staging` sem o nome do provedor só lembram
esses comandos e saem com erro — de propósito.

Login (uma vez por máquina, no browser):

```bash
npx --yes wrangler@4.91.0 login
npx --yes vercel@59.11.7 login
npx --yes --ignore-scripts netlify-cli@27.5.0 login
```

Hospedagem tradicional via FTP (Hostinger, etc.) ainda não tem skill —
ver `.skills/deploy-cloudflare/SKILL.md` pro motivo.

## Por que isso funciona em qualquer host estático

`public/` sai pronto do build — sem depender de nenhuma função/edge specific
de provedor pra injetar o GTM. Isso significa que a mesma pasta `public/`
serve tanto pra Cloudflare (via `worker.js`) quanto subida direta em
Netlify, Vercel, ou por FTP numa hospedagem tradicional (Hostinger, por
exemplo) — só WordPress fica de fora, por ser CMS dinâmico, não site
estático.

## Atualizar a partir do esqueleto (opcional)

O template não puxa commits sozinho. No repo do cliente:

```bash
git remote add upstream git@github.com:oros-data/pages-framework.git
git fetch upstream
git merge upstream/master
```

Evite misturar página do cliente com arquivos do esqueleto no mesmo
commit — o merge fica mais simples.

## Próximos passos

Ainda não decididos: framework de página em si (componentes, layout
reutilizável) e como o roteamento vai funcionar quando houver mais de uma
página.
