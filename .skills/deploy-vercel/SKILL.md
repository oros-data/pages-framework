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
npx --yes vercel@59.11.7 login
```

Plano gratuito ("Hobby") não pede cartão de crédito — dá pra testar de
verdade sem custo.

**Deploy anônimo (validado):** `vercel deploy --temporary` na raiz do
repo **falha** — o CLI tenta mandar o fonte e a Vercel exige output
pré-built. O que funciona, depois do `npm run build`:

```bash
npx --yes vercel@59.11.7 deploy public --temporary --yes
```

Expira em 60 minutos até alguém reivindicar (`vercel login` + o link de
claim que o CLI imprime). Site permanente continua precisando de login.

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
- Domínio próprio: ver seção DNS abaixo.

## DNS / domínio próprio

O deploy **não** mexe em DNS. Enquanto não houver domínio comprado, a
URL grátis basta:

- produção: `https://<projeto>.vercel.app` (estável)
- staging/preview: `https://<projeto>-<hash>-<time>.vercel.app` (cada
  deploy uma URL nova)

Preview em time/Hobby costuma cair em **Deployment Protection** (SSO da
Vercel). Sem login da equipe, o curl/visitante anônimo toma 302. Para a
live, em Project → Settings → Deployment Protection, liberar preview
se o aluno precisar de URL pública de staging.

Domínio customizado (depois de ter o domínio no registrador):

1. No projeto: Settings → Domains → adicionar `exemplo.com` e/ou `www`.
2. No DNS do registrador (ou no provedor de DNS, se não for a Vercel):
   - **apex** (`exemplo.com`): registro **A** para o IP que o painel
     mostrar (hoje o genérico é `76.76.21.21` — confirme no painel).
   - **subdomínio** (`www` ou `staging`): **CNAME** para o valor do
     painel (ex. `cname.vercel-dns-0.com` ou o CNAME específico do
     projeto).
3. SSL a Vercel emite sozinha depois do DNS propagar.

Não apontar nameserver para a Vercel a menos que queiram gerenciar **todo**
o DNS lá (e-mail MX incluso). Só A/CNAME no registrador atual é o caminho
mínimo. Staging com domínio próprio (ex. `staging.exemplo.com`) é o mesmo
fluxo, apontando o CNAME para o projeto e associando o host ao environment
de preview no painel.

O `wrangler.jsonc` / este repo **não** guardam registros DNS.
