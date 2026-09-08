# Skill — Deploy Cloudflare

Caminho padrão do projeto. Fonte canônica das instruções de verdade:
`README.md` (seções "Local" e "Deploy") e `AGENTS.md` na raiz do
projeto — leia e siga aqueles, este arquivo só existe pra manter o mesmo
formato de "uma skill por plataforma" que os outros provedores usam.

Resumo rápido: `npm run dev` (local), `npm run deploy:staging` /
`npm run deploy` (produção) — cada um já roda o build (`src/` → `public/`)
sozinho antes.

Único caminho com asset binding próprio (`worker.js`) — os outros
provedores servem `public/` direto, sem essa camada.

## Outros provedores já implementados

- **Vercel**: `.skills/deploy-vercel/` — free tier real, sem cartão.
- **Netlify**: `.skills/deploy-netlify/` — free tier real, sem cartão.
- **Hospedagem tradicional (FTP, ex.: Hostinger)**: ainda não construído
  — Hostinger não tem free tier permanente pra testar; validar antes com
  um host FTP gratuito equivalente antes de escrever a skill de verdade.
