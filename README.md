# pages-framework

Esqueleto de deploy pra páginas rápidas (HTML + JS quando precisar) em
Cloudflare Workers, com ambiente de staging e produção separados desde o
início — e um passo de build que gera páginas prontas pra qualquer host
estático (Cloudflare, Netlify, Vercel, Hostinger via FTP, etc.), não só
Cloudflare.

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
- `worker.js` — serve os arquivos de `public/`. Ainda sem roteamento
  próprio; hoje é um passthrough puro pro binding `ASSETS`.
- `wrangler.jsonc` — config de deploy, com um ambiente `staging` já
  configurado ao lado da produção.

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

```bash
npm install
npm run dev
```

`npm run dev` já roda o build antes (`src/` → `public/`) e depois `wrangler
dev`, servindo exatamente como em produção.

**Se `npm install` falhar** compilando `sharp` (dependência do
`netlify-cli`, só usada num recurso opcional de otimização de imagem no
dev server deles) — comum em versão de Node muito recente sem binário
pré-compilado disponível ainda — rode `npm install --ignore-scripts`.
Confirmado que o deploy continua funcionando normal sem isso.

## Deploy

Cloudflare é o padrão do projeto (`worker.js` + `wrangler.jsonc`):

```bash
npm run deploy:staging   # ambiente de staging
npm run deploy           # produção
```

Outros provedores, cada um com skill própria (ver `.skills/deploy-<nome>/`
pra detalhe, login, e o que muda de conceito):

```bash
npm run deploy:vercel:staging   # Vercel — preview
npm run deploy:vercel           # Vercel — produção

npm run deploy:netlify:staging  # Netlify — draft
npm run deploy:netlify          # Netlify — produção
```

Todos rodam o build (`src/` → `public/`) antes de fato dar o deploy.
Hospedagem tradicional via FTP (Hostinger, etc.) ainda não tem skill —
ver `.skills/deploy-cloudflare/SKILL.md` pro motivo.

## Por que isso funciona em qualquer host estático

`public/` sai pronto do build — sem depender de nenhuma função/edge specific
de provedor pra injetar o GTM. Isso significa que a mesma pasta `public/`
serve tanto pra Cloudflare (via `worker.js`) quanto subida direta em
Netlify, Vercel, ou por FTP numa hospedagem tradicional (Hostinger, por
exemplo) — só WordPress fica de fora, por ser CMS dinâmico, não site
estático.

## Próximos passos

Ainda não decididos: framework de página em si (componentes, layout
reutilizável) e como o roteamento vai funcionar quando houver mais de uma
página.
