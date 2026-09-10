# Skill — Tracking

Instrumenta páginas deste projeto com tracking baseado em `dataLayer`,
centralizado no GTM. **Sem endpoint próprio** — GTM é o único destino;
cada ferramenta final (GA4, Meta, Google Ads) é **tag no container**,
não código na página e **não** uma skill por plataforma.

**Duas skills, não N:** esta (o que a página empurra) e `.skills/gtm/`
(destinos, IDs, cookie vs parâmetro). Não criar `.skills/tracking-meta`,
`tracking-ga4`, `tracking-ads`. O contrato do `dataLayer` é um só; o
que muda por plataforma é tag/constante no GTM. Skill extra só faria
sentido com CAPI/sGTM (token, payload servidor) — e aí ainda seria
extensão da skill GTM, não um fork do `track()`.

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

3. **Atribuição: sessão ≠ janela de ads.** Não é boa prática mandar o
   `fbclid`/`gclid`/UTM da semana passada como se fosse a campanha
   **desta** visita (GA4 conta aquisição errada: pago em vez de
   orgânico/direct).

   | Dado | Onde | Vai no `track()` | Por quê |
   |---|---|---|---|
   | `utm_*` | `sessionStorage` | só nesta sessão | analytics (last non-direct da sessão) |
   | `gclid`, `fbclid` crus | `sessionStorage` | só se esta sessão viu o param na URL | GA4 / debug; Ads usa cookie do Conversion Linker |
   | `fbc`, `fbp` | `localStorage`, TTL 90 dias | **todo** evento, mesmo visita orgânica depois | spec Meta (`_fbc` / `_fbp`); match de conversão atrasada |
   | `anon_id` | `localStorage` permanente | todo evento | identidade, não campanha |

   Volta uma semana depois por outro canal, **sem** `fbclid` na URL: o
   dataLayer **não** leva `fbclid`/`gclid`/`utm_*`; **leva** `fbc`/`fbp`
   se ainda estiverem na janela de 90 dias. O Pixel atribui à Meta; o
   GA4 vê sessão nova.

   `fbc` é montado **na página**, formato `fb.1.{timestamp_ms}.{fbclid}`,
   timestamp da primeira captura daquele `fbclid`. Não remontar no GTM.

   **IP:** a página **não** resolve IP e **não** manda IP no dataLayer
   (GTM no browser não tem o IP público do visitante). GA4/Pixel/Ads
   veem o IP no request HTTPS **deles** quando a tag dispara — isso é
   da plataforma, não nosso payload. Não chamar serviço de geo/IP pra
   “completar” o dataLayer.

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

6. **`event_id` = SHA-256 de identificadores da ocorrência, não random.**
   A Meta deduplica Pixel ↔ CAPI por (`event_name` + `event_id`) iguais
   em até 48 h. O ID tem que ser o **mesmo** nos dois canais para *a
   mesma ação*, e **diferente** para duas ações reais.

   Material (síncrono, sem `subtle.digest`):
   `event|anon_id|session_id|pathname|element_id|element_type|element_text|form_id|floor(now/2s)`

   - Dois `track()` iguais em &lt; 2 s (listener duplicado) → **mesmo** ID.
   - Refresh / outro clique / outro path → ID novo.
   - Sem `anon_id` no hash sozinho: dois `page_view` no mesmo dia
     colidiriam e a Meta descartaria o segundo.
   - Sem PII (e-mail) no `event_id`.
   - `properties.event_id` do caller é sobrescrito.
   - CAPI futuro reusa este valor; não gera outro no servidor.

   `event_time` = unix segundos no mesmo `push`.

7. **Não implementar first-click / last-click “nosso” no analytics.**
   A página manda **insumos corretos**; o modelo de atribuição mora no
   destino:

   | Destino | Quem atribui | O que nós mandamos |
   |---|---|---|
   | GA4 | relatórios (last non-direct, first user, data-driven) | UTM/`gclid` **só da sessão atual** |
   | Meta | janela de ads deles, last-click de `fbc` | `fbc` mais recente (spec); `fbp` estável |
   | Google Ads | Conversion Linker + `_gcl_aw` last-click | não reenviar `gclid` velho no dataLayer |

   Guardar `utm_source` first-touch em `localStorage` e mandar
   `first_utm_*` + `last_utm_*` em todo evento: o GA4 **já tem** first
   user vs sessão; os dois números vão divergir; o agente e o cliente
   passam a debugar dois modelos. First-click no `fbc` **quebra** a
   spec da Meta (clique novo tem que substituir).

   Exceção futura: relatório *nosso* fora do GA4, com produto pedindo
   isso explicitamente — não na live, não no `track()` padrão.

---

## `track()` — implementação

A implementação real (única cópia, não duplicar) mora em `src/tracking.js`
— é código que roda de verdade no navegador do visitante, por isso vive em
`src/` como qualquer outro asset, não dentro desta pasta de skill. Leia e
edite ele lá diretamente. Resumo do contrato:

```js
track(eventName, { ...propriedades_curadas })
// empurra pro dataLayer: { event, event_id, event_time, anon_id,
// session_id, page_url, page_title, referrer, utm_*/fbc/…,
// ...propriedades_curadas }
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
- [ ] Destinos (GA4 / Pixel / Ads) configurados no GTM, não no HTML —
      `.skills/gtm/`
