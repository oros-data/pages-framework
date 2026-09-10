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
npx --yes --ignore-scripts netlify-cli@27.5.0 login
```

Plano gratuito ("Starter") não pede cartão de crédito — dá pra testar de
verdade sem custo.

**Deploy anônimo (validado):** depois do `npm run build`:

```bash
npx --yes --ignore-scripts netlify-cli@27.5.0 deploy --allow-anonymous --dir=public --no-build
```

Sobe com senha (o CLI imprime Site URL + Password) e precisa ser
reivindicado em 60 minutos (`netlify login` + `netlify claim`, ou o
link Drop que o CLI imprime). Site permanente continua precisando de
login; na primeira vez autenticada, escolher "create new site".

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

## Gotcha: `sharp` no netlify-cli

`netlify-cli` puxa `sharp` (otimização de imagem do *dev server* deles,
não do deploy). Em Node muito novo isso quebra compilação nativa. Os
scripts do projeto já passam `--ignore-scripts` no `npx` — o CLI de
deploy funciona sem o binário do `sharp`. Não instale `netlify-cli` no
projeto nem no SO.

## O que muda em relação à Cloudflare

- Sem `worker.js`, sem binding de asset — Netlify serve `public/` direto.
- `GTM_ID`/outros valores de `.env` continuam resolvidos no build, antes
  do deploy — isso não muda entre provedores, é sempre o mesmo `.env`.
- Domínio próprio: ver seção DNS abaixo.

## DNS / domínio próprio

O deploy **não** mexe em DNS. URL grátis:

- produção: `https://<site>.netlify.app`
- staging/draft: `https://<deploy-id>--<site>.netlify.app`

Drafts e, em times novos, até a produção podem cair em **visitor
access** (`edge-access` / login Netlify). Se o curl vier 401/404 com
"Login Redirect", o deploy subiu — o site não está público. No painel:
Project → Access control / visitor access → público.

Domínio customizado (domínio já no registrador):

1. Project configuration → Domain management → Add domain.
2. No DNS do registrador:
   - **subdomínio** (`www`, `staging`): **CNAME** para
     `<site>.netlify.app`.
   - **apex** (`exemplo.com`): **ALIAS/ANAME** (ou CNAME flattened) para
     `apex-loadbalancer.netlify.com`. Se o DNS não tiver ALIAS: **A**
     para `75.2.60.5` (fallback da Netlify; confirme no painel).
3. HTTPS (Let's Encrypt) a Netlify emite sozinha depois de verificar o
   DNS.

Alternativa: delegar nameservers para **Netlify DNS** e gerenciar
registros no painel deles — só vale se não precisarem deixar MX/e-mail
no registrador atual.

O repo **não** versiona registros DNS. Primeira vez autenticada: criar
site novo (`netlify sites:create` ou o prompt "create new site"), não
reusar um Drop anônimo. `.netlify/` fica local (gitignore).
