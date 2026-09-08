# oros-pages

Esqueleto de deploy pra páginas rápidas (HTML + JS quando precisar) em
Cloudflare Workers, com ambiente de staging e produção separados desde o
início. Ponto de partida — ainda sem framework de página, sem injeção de
GTM. Isso vem depois.

## Estrutura

- `worker.js` — serve os arquivos estáticos de `public/`. Ainda sem
  roteamento próprio; hoje é um passthrough puro pro binding `ASSETS`.
- `public/index.html` — página inicial, propositalmente mínima.
- `wrangler.jsonc` — config de deploy, com um ambiente `staging` já
  configurado ao lado da produção.

## Local

```bash
npm install
npm run dev
```

Roda `wrangler dev`, servindo exatamente como em produção.

## Deploy

```bash
npm run deploy:staging   # ambiente de staging
npm run deploy           # produção
```

## Próximos passos

Ainda não decididos: framework de página, injeção de GTM, e como o
roteamento vai funcionar quando houver mais de uma página.
