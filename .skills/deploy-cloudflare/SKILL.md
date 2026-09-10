# Skill — Deploy Cloudflare

Um dos provedores suportados — o único com camada extra no repo
(`worker.js` + `wrangler.jsonc`). Fonte canônica: `README.md` (seções
"Local" e "Deploy") e `AGENTS.md`. Este arquivo existe pra manter o
mesmo formato de "uma skill por plataforma".

O init (`utils/init.py`) **não** é específico da Cloudflare: ele só
preenche os `name` do Wrangler para o caso de este caminho ser o
escolhido. Publicação em Vercel/Netlify ignora esses arquivos.

Local de todo mundo: `npm run dev` (Python, não Wrangler). Extra desta
plataforma: `npm run dev:cloudflare` (npx wrangler). Staging/produção:

```bash
npx --yes wrangler@4.91.0 login   # uma vez
npm run deploy:cloudflare:staging
npm run deploy:cloudflare
```

O CLI não é dependência do projeto — `npx` baixa a versão pinada na hora.

Os outros provedores servem `public/` direto, sem Worker.

## DNS / domínio próprio

O deploy **não** mexe em DNS. Sem domínio: URL `*.workers.dev` (ou a
que o `wrangler deploy` imprimir).

Domínio customizado: painel Cloudflare → o Worker / o projeto →
Custom Domains (ou `routes` no `wrangler.jsonc` **depois** de o cliente
ter a zona na mesma conta). DNS da zona, se a zona já for Cloudflare,
é CNAME/proxied para o worker; se a zona estiver em outro registrador,
nameservers ou CNAME conforme o painel mostrar. SSL no proxy da
Cloudflare.

Staging (`pages-site-staging` ou o nome do init) é **outro** Worker —
domínio de staging é outro hostname (ex. `staging.exemplo.com`)
apontando para o Worker de staging, não um “preview URL” automático
como na Vercel.

Não versionar registros DNS neste repo. Preview/SSO de outros
provedores: ver a skill deles.

## Outros provedores já implementados

- **Vercel**: `.skills/deploy-vercel/` — free tier real, sem cartão.
- **Netlify**: `.skills/deploy-netlify/` — free tier real, sem cartão.
- **Hospedagem tradicional (FTP, ex.: Hostinger)**: ainda não construído
  — Hostinger não tem free tier permanente pra testar; validar antes com
  um host FTP gratuito equivalente antes de escrever a skill de verdade.
