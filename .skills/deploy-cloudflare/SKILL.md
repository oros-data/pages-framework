# Skill — Deploy Cloudflare

Caminho padrão e único implementado hoje. Fonte canônica das instruções
de verdade: `README.md` (seções "Local" e "Deploy") e `AGENTS.md` na raiz
do projeto — leia e siga aqueles, este arquivo só existe pra manter o
mesmo formato de "uma skill por plataforma" que os outros provedores vão
seguir quando forem construídos.

Resumo rápido: `npm run dev` (local), `npm run deploy:staging` /
`npm run deploy` (produção) — cada um já roda o build (`src/` → `public/`)
sozinho antes.

## Outros provedores

`Netlify`, `Vercel`, hospedagem tradicional (FTP) — `public/` já sai
pronto pra qualquer um deles (ver "Por que isso funciona em qualquer
host estático" no `README.md`), mas **nenhuma skill de deploy específica
foi construída ainda pra esses**. Não construir especulativamente — só
quando um cliente real confirmar que vai usar um provedor diferente.
