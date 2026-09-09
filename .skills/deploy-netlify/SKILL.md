# Skill — Deploy Netlify

`public/` sai pronto do build (`npm run build`) pra qualquer host
estático — Netlify serve isso direto, sem função/edge própria, mesma
lógica do Cloudflare (ver `.skills/deploy-cloudflare/`).

## Configuração (já pronta no projeto)

`netlify.toml` na raiz:

```toml
[build]
  publish = "public"
```

Netlify já tira o `.html` da URL por padrão (Pretty URLs, ligado de
fábrica) — não precisa de config extra pra isso, ao contrário da Vercel.

## Pré-requisito: login (não dá pra automatizar)

`netlify login` abre um fluxo de autenticação no navegador — um agente
não consegue completar isso sozinho. Peça pro usuário rodar uma vez,
antes de qualquer deploy:

```bash
npx netlify login
```

Plano gratuito ("Starter") não pede cartão de crédito — dá pra testar de
verdade sem custo.

**Achado ao testar (visto na mensagem de erro do próprio CLI, não
confirmado até o fim):** existe uma flag `--allow-anonymous`
(`netlify deploy --dir=public --allow-anonymous`) que promete deploy
sem nem criar conta. Não terminei de validar essa via — vale confirmar
antes de recomendar de verdade.

## Deploy

```bash
npm run deploy:netlify:staging   # draft deploy — URL própria, não mexe em produção
npm run deploy:netlify           # produção (--prod)
```

Cada um já roda o build (`src/` → `public/`) antes.

**Primeira vez:** `netlify deploy` pergunta se quer linkar a um site
Netlify existente ou criar um novo — responda "create new site" na
primeira execução; depois disso fica salvo em `.netlify/` (local, não
versionar — ver `.gitignore`).

## Gotcha real: instalação pode falhar em Node muito novo

Testado nesta sessão: `netlify-cli` puxa `sharp` (processamento de
imagem, feature opcional de dev server) como dependência transitiva, que
tenta compilar um binário nativo no install. Em Node muito recente (sem
binário pré-compilado disponível ainda pro `sharp`), isso quebra o
`npm install` inteiro com erro de build do `node-gyp` — mesmo com
`python3`/`make`/`g++` instalados.

**Correção que funcionou:** `npm install --ignore-scripts`. Pula a
compilação nativa (que só serve pro recurso opcional de otimização de
imagem), e o `netlify` CLI continua funcionando normal pra deploy —
confirmado rodando `netlify --version` e o deploy de verdade depois.

## O que muda em relação à Cloudflare

- Sem `worker.js`, sem binding de asset — Netlify serve `public/` direto.
- `GTM_ID`/outros valores de `.env` continuam resolvidos no build, antes
  do deploy — isso não muda entre provedores, é sempre o mesmo `.env`.
- Domínio próprio: configurado no painel da Netlify, fora do escopo
  desta skill (mesma lógica em qualquer provedor — DNS não é decisão de
  deploy).
