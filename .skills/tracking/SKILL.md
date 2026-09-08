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
   é obrigatória.** Nunca inclua: valor de campo de formulário, e-mail,
   telefone, resposta de texto livre, qualquer PII. Isso vale mesmo sem
   endpoint próprio — é o único lugar que os dados existem, então a régua
   é ainda mais importante, não menos.

5. **Nome de evento em `snake_case`, verbo/substantivo descritivo.**
   `page_view`, `click`, `form_submit` — nunca `Event1`, `buttonClicked`.

---

## `track()` — implementação de referência

Ver `tracking.js` nesta pasta. Resumo do contrato:

```js
track(eventName, { ...propriedades_curadas })
// empurra pro dataLayer: { event, anon_id, session_id, page_url,
// page_title, referrer, utm_*, ...propriedades_curadas }
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

No `submit`, dispara `form_submit` com:
- `form_id`, `field_count`
- `has_email` / `has_phone` (booleano, checado pelo `type`/`name` do
  campo — **nunca o valor**)

**Nunca incluir:** `form_fields` com valor real, nome, e-mail ou resposta
digitada. Esse é exatamente o bug documentado da Oros (quiz vazando
e-mail e resposta de texto livre pro `dataLayer`) — este padrão existe
pra não repetir.

---

## Checklist antes de considerar uma página "instrumentada"

- [ ] `tracking.js` incluído, `track()` disponível globalmente
- [ ] `page_view` dispara sozinho, sem código manual na página
- [ ] Todo clique em `<a>`/`<button>` gera evento sozinho
- [ ] CTAs importantes têm `data-track-event` nomeado
- [ ] Formulário (se houver) dispara `form_submit` sem valor de campo
- [ ] Nenhum `dataLayer.push` fora de `tracking.js`
