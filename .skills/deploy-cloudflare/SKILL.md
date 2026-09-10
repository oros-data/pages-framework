# Skill — Deploy Cloudflare

Um dos provedores suportados — o único com camada extra no repo
(`worker.js` + `wrangler.jsonc`). Fonte canônica: `README.md` (seções
"Local" e "Deploy") e `AGENTS.md`. Este arquivo existe pra manter o
mesmo formato de "uma skill por plataforma".

O init (`utils/init.py`) **não** é específico da Cloudflare: ele só
preenche os `name` do Wrangler para o caso de este caminho ser o
escolhido. Publicação em Vercel/Netlify ignora esses arquivos.

Resumo: `npm run dev` (local via Wrangler), `npm run deploy:staging` /
`npm run deploy` (produção) — cada um já roda o build (`src/` → `public/`).

Os outros provedores servem `public/` direto, sem Worker.

## Outros provedores já implementados

- **Vercel**: `.skills/deploy-vercel/` — free tier real, sem cartão.
- **Netlify**: `.skills/deploy-netlify/` — free tier real, sem cartão.
- **Hospedagem tradicional (FTP, ex.: Hostinger)**: ainda não construído
  — Hostinger não tem free tier permanente pra testar; validar antes com
  um host FTP gratuito equivalente antes de escrever a skill de verdade.
