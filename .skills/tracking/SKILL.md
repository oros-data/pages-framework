# Skill — Tracking

Instrumenta páginas deste projeto com tracking baseado em `dataLayer`,
centralizado no GTM. **Sem endpoint próprio** — GTM é o único destino;
cada ferramenta final (GA4, Meta, TikTok, etc.) é configurada dentro do
próprio GTM, não no código da página.

Baseado nos padrões reais de tracking da Oros (`cloudflare/site/`,
`cloudflare/public/pixel.js`), adaptado: tirado o payload duplo pro
endpoint próprio (não existe aqui), mantidos os princípios de identidade,
atribuição e curadoria de dado sensível.

---

## Princípios (não negociáveis)

1. **Um único ponto de disparo:** toda página usa a mesma função
   `track(eventName, properties)` — nunca um `dataLayer.push` solto e
   ad-hoc em outro lugar do código. (A própria Oros tem um bug documentado
   de um segundo `track()` local no quiz que ignorou essa regra —
   não repetir isso.)

2. **Identidade sempre junto, gerada 100% no cliente** (sem servidor
   próprio pra registrar nada):
   - `anon_id` — permanente, `localStorage`, UUID.
   - `session_id` — `sessionStorage`, reseta em nova aba/sessão.

3. **Atribuição capturada uma vez, persistida, reenviada em todo evento:**
   UTMs (`utm_source/medium/campaign/content/term`) e click IDs
   (`gclid`, `fbclid`) lidos da URL na primeira visita, guardados em
   `sessionStorage`, e incluídos em todo `track()` daí em diante — não só
   no `page_view`.

4. **`dataLayer` é legível por qualquer script/tag da página — curadoria
   é obrigatória, mas isso não significa "nunca e-mail/telefone".**
   Google (Enhanced Conversions) e Meta (Advanced Matching) realmente
   pedem esses dados pra melhorar match rate, e as tags oficiais deles no
   GTM esperam isso. A regra certa: **e-mail e telefone sempre hasheados
   (SHA-256, via `hashForMatching()`) antes de entrar no `track()`, nunca
   em texto puro.** Hash não é reversível — deixa de ser "PII exposta a
   qualquer script", continua servindo pro match das plataformas de
   anúncio.

   O que continua proibido, sem exceção: resposta de formulário em texto
   livre, geolocalização precisa (GPS do navegador — categoria mais
   sensível ainda, e as plataformas de ads normalmente já inferem local
   pelo IP da própria requisição, não precisam disso), qualquer campo que
   não seja especificamente e-mail/telefone pra matching de anúncio.

5. **Nome de evento em `snake_case`, verbo/substantivo descritivo.**
   `page_view`, `click`, `form_submit` — nunca `Event1`, `buttonClicked`.

---

## `track()` — implementação

A implementação real (única cópia, não duplicar) mora em `src/tracking.js`
— é código que roda de verdade no navegador do visitante, por isso vive em
`src/` como qualquer outro asset, não dentro desta pasta de skill. Leia e
edite ele lá diretamente. Resumo do contrato:

```js
track(eventName, { ...propriedades_curadas })
// empurra pro dataLayer: { event, anon_id, session_id, page_url,
// page_title, referrer, utm_*, ...propriedades_curadas }
```

Pra e-mail/telefone (matching de anúncio), sempre hashear antes:

```js
var emailHash = await hashForMatching(emailDigitado);
track("lead_capturado", { email_hash: emailHash });
// nunca: track("lead_capturado", { email: emailDigitado })
```

---

## Padrão: botão / CTA

Captura automática, sem instrumentar botão por botão:

- Todo `<a>` e `<button>` da página dispara `click` sozinho, com
  `element_type`, `element_text`, `element_id` (se tiver).
- Pra dar nome de negócio a um clique importante (não só "click"
  genérico), usa o atributo `data-track-event`:
  ```html
  <button data-track-event="cta_comprar">Comprar agora</button>
  ```
  Isso dispara `cta_comprar` em vez de `click` genérico — mesma captura
  automática de `element_text`/`element_id` junto.

**Não fazer:** `onclick="track(...)"` espalhado em cada botão à mão —
é exatamente o tipo de instrumentação manual, inconsistente, que este
padrão existe pra evitar.

## Padrão: formulário

A captura automática de `submit` (qualquer `<form>`) dispara `form_submit`
com `form_id`, `field_count`, `has_email`/`has_phone` (booleano, nunca o
valor) — isso cobre analytics geral, sem PII nenhuma.

Se o formulário for de fato um lead/conversão e a página precisar mandar
e-mail/telefone pra uma tag de Enhanced Conversions/Advanced Matching,
isso é um evento **separado**, disparado manualmente no ponto certo (ex.:
depois da confirmação de sucesso), sempre hasheado:

```js
form.addEventListener("submit", async function () {
  var emailHash = await hashForMatching(form.email.value);
  var phoneHash = await hashForMatching(form.phone.value); // já em E.164
  track("lead_capturado", { email_hash: emailHash, phone_hash: phoneHash });
});
```

**Nunca incluir, sem exceção:** valor de campo de texto livre, nome
completo, e-mail/telefone **crus** (sem hash), ou qualquer campo do
formulário que não seja especificamente e-mail/telefone hasheado pra
matching. Esse é o bug documentado da Oros (quiz vazando e-mail e
resposta de texto livre pro `dataLayer`) — este padrão existe pra não
repetir.

---

## Checklist antes de considerar uma página "instrumentada"

- [ ] `tracking.js` incluído, `track()` disponível globalmente
- [ ] `page_view` dispara sozinho, sem código manual na página
- [ ] Todo clique em `<a>`/`<button>` gera evento sozinho
- [ ] CTAs importantes têm `data-track-event` nomeado
- [ ] Formulário (se houver) dispara `form_submit` sem valor de campo
- [ ] Se houver evento de lead/conversão, e-mail/telefone vão sempre via `hashForMatching()`, nunca crus
- [ ] Nenhum `dataLayer.push` fora de `tracking.js`
