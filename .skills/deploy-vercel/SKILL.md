# Skill — Deploy Vercel

`public/` sai pronto do build (`npm run build`) pra qualquer host
estático — Vercel serve isso direto, sem função/edge própria, mesma
lógica do Cloudflare (ver `.skills/deploy-cloudflare/`).

## Configuração (já pronta no projeto)

`vercel.json` na raiz já aponta pra `public/`:

```json
{
  "outputDirectory": "public",
  "cleanUrls": true
}
```

`cleanUrls` tira o `.html` da URL sozinho (`/sobre.html` vira `/sobre`)
— mesmo comportamento que já víamos por padrão na Cloudflare.

## Pré-requisito: login (não dá pra automatizar)

`vercel login` abre um fluxo de autenticação no navegador — um agente
não consegue completar isso sozinho. Peça pro usuário rodar uma vez,
antes de qualquer deploy:

```bash
npx vercel login
```

Plano gratuito ("Hobby") não pede cartão de crédito — dá pra testar de
verdade sem custo.

**Achado ao testar (visto na mensagem de erro do próprio CLI, não
confirmado até o fim):** existe `vercel deploy --temporary`, que promete
um deploy reivindicável depois, sem login prévio. Não terminei de validar
essa via — vale confirmar antes de recomendar de verdade.

## Deploy

```bash
npm run deploy:vercel:staging   # preview — cada deploy gera uma URL própria, não mexe em produção
npm run deploy:vercel           # produção (--prod)
```

Cada um já roda o build (`src/` → `public/`) antes.

**Diferença pro modelo da Cloudflare:** aqui staging não é um ambiente
fixo configurado antes — é automático, cada deploy sem `--prod` já ganha
uma URL de preview nova. Não precisa registrar isso em lugar nenhum
(ao contrário do `wrangler.jsonc`, que precisa do bloco `env.staging`
explícito).

## O que muda em relação à Cloudflare

- Sem `worker.js`, sem binding de asset — Vercel serve `public/` direto.
- `GTM_ID`/outros valores de `.env` continuam resolvidos no build, antes
  do deploy — isso não muda entre provedores, é sempre o mesmo `.env`.
- Domínio próprio: configurado no painel da Vercel, fora do escopo desta
  skill (mesma lógica em qualquer provedor — DNS não é decisão de deploy).
