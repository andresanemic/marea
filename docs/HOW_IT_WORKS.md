# How Marea works

## Scope

Marea is a local register of fictional declarations and a checker that rejects a second declaration of the same activity-year pair in the same metric track. It imitates a narrow accounting idea associated with Paris Agreement Article 6.2: a transferred mitigation outcome is treated as one fact, while accounting tracks remain separate by metric. Marea does not calculate emissions or determine whether a real country met a commitment.

All countries, activities, methodologies, units and amounts are invented. The record is a local file. There is no institutional connection, blockchain, payment, testnet anchor or real-country data. This document describes the implemented walkthrough and the boundaries of its model; it does not certify a climate result.

## People and rights

| Actor | What they can do | What the record shows | Boundary |
|---|---|---|---|
| Person who records an origin activity | Add an activity, country and metric to the local register | Which origin an entry refers to and who recorded it | The record does not establish that the activity or person is real |
| Person who authorizes a declaration | Grant authority for a named country, metric, period, amount ceiling, destination and expiry | Who granted the authority and its limits | The declaring agent cannot authorize itself; the grant does not extend beyond its scope or clock |
| Declaring country | Submit a declaration against an origin and stated methodology | Whether it entered or was rejected, and why | Alba, Bruma, Cenal and Duna are fictional examples, not states |
| Marea checker | Recalculate results from the local store | Which checks passed and what evidence caused a decision | It checks stored inputs and rules, not the truth of climate claims |
| Independent reader | Open the record and report, or rerun the audit when code is available | Stored acceptances, rejections, reasons and receipt checks | The reader still depends on fictional inputs and this limited model |

The people who supply entries and authority are distinct roles in the model. A declaration records who granted its authority, its allowed scope and its expiry; it does not treat an agent's own declaration as permission.

## A declaration, step by step

1. A person records an origin activity, country and metric. A declaration whose origin does not resolve in the register is rejected.
2. A person grants authority for a country, metric, commitment period, amount ceiling and destination. The grant records its author and expiry, and cannot be stretched to another metric, period or destination.
3. A country submits a declaration with an origin, stated methodology, metric, years, amount and destination. The checker resolves the origin and checks the metric, methodology, authorization scope and expiry, and whether the activity-year pair has already been recognized.
4. A passing declaration enters its metric track. A collision or other failed rule produces a rejection with the evidence and a named way to resolve the issue.
5. Acceptance and rejection are written to the same local register. Each receives a receipt sealed with the canonical digest used by the Vespi kernel. The independent checker recomputes from the store instead of trusting the executor's report.
6. A reader can inspect the report without running Marea. An audit checks whether the stored record, receipt and recomputed result agree.

```text
PERSON RECORDS ORIGIN ── PERSON GRANTS BOUNDED AUTHORITY
             │                              │
             └────────── COUNTRY DECLARES ──┘
                              │
                              ▼
        resolve origin · metric · method · year · amount · authority
                       ┌──────┴──────┐
                       ▼             ▼
                   accepted      rejected + reason
                       └──────┬──────┘
                              ▼
              one local register + sealed receipt
                              │
                              ▼
             independent recomputation + readable report
```

## A concrete example

In the recorded example, fictional Alba has an origin activity called “bosque de la cuenca alta,” in the `tCO2e` metric. A person records that origin and authorizes Alba to declare up to a ceiling, for a stated destination and until a stated time. Alba declares 1,200 `tCO2e` for 2027 with a named methodology. The checker accepts it into the `tCO2e` track.

Fictional Bruma then declares 900 `tCO2e` against the same activity and year. Marea rejects the second entry as `unidad-compartida`, points to Alba's earlier declaration and the colliding activity-year pair, and records the reason beside the acceptance. The transcript also includes other refusals: missing methodology, unresolved or mismatched-metric origin, expired authority, an exceeded ceiling, a rejected origin and an international transfer's second side. These are examples of the bounded checker, not findings about countries or emissions in the world.

The walkthrough contains a control for the rule's other side. A distinct activity in the same metric and year can enter, and a distinct metric track can also enter for the same year. The key is `(activity, year)`, not year alone and not the metric by itself.

## Rules the agreement makes visible

- **One activity-year pair is recognized once.** The collision key is `(activity, year)`, not the metric or year alone. Distinct activities can enter in the same year, including in the same metric. Distinct metric tracks remain separate.
- **An origin and methodology must be stated.** An unresolved origin, an origin under a different metric or a missing methodology blocks the declaration with a reason.
- **Aggregates cannot count their own parts twice.** Declared components must resolve so each activity is counted once.
- **Authority has a clock and a ceiling.** An expired grant stays expired; exceeding its amount, metric, period or destination is rejected. Changing destination requires a separate authorization.
- **An international transfer is one accounting fact.** Marea rejects the second side rather than claiming to perform the full adjustment process.
- **The verifier recomputes.** It reads stored inputs rather than accepting the executor's report as proof.
- **Rejections remain inspectable.** A rejection records its reason, supporting collision or failed check, and a named way to resolve the issue in the same register as accepted entries.
- **Receipts are sealed and checked.** Editing a receipt by hand makes its digest check fail.

## Marea, Vespi and Lore Plugin

Marea consumes the Vespi kernel copy installed by Lore Plugin. It uses the kernel's authority and receipt mechanisms so each declaration is checked against a bounded grant and each acceptance or rejection receives a seal that can be verified. The verifier recomputes the declaration from the local store; the receipt is evidence of that bounded operation, not proof that the underlying climate claim is true.

The project pins five kernel modules by digest and checks the module headers and host copies in its recorded suite. Marea consumes those modules; it does not modify the kernel, Lore Plugin, host applications or installed versions. Because the installed kernel can change, the evidence names the tested cut and does not treat the old pin as current. See [Evidence](EVIDENCE.md) for the recorded result and re-pin limitation.

## What this proves, and what it does not

The recorded run demonstrates a local mechanism for accepting and rejecting fictional declarations under these rules. The suite and recorded transcript let a reader inspect the modeled cases and the stated reasons.

The run does not establish real-world truth, authorization, legal compliance, scientific sufficiency or environmental integrity. See [Evidence](EVIDENCE.md) for the test result and kernel pin, and [Legal and limits](LEGAL_AND_LIMITS.md) for the cited framework and open questions.

---

# Cómo funciona Marea

## Alcance

Marea es un registro local de declaraciones ficticias y un verificador que rechaza una segunda declaración del mismo par actividad-año en la misma pista métrica. Imita una idea contable acotada asociada al artículo 6.2 del Acuerdo de París: un resultado de mitigación transferido se trata como un solo hecho, mientras las pistas contables permanecen separadas por métrica. Marea no calcula emisiones ni determina si un país real cumplió un compromiso.

Todos los países, actividades, metodologías, unidades y cantidades son inventados. El registro es un archivo local. No hay conexión institucional, blockchain, pagos, anclaje en testnet ni datos de países reales. Este documento describe el recorrido implementado y los límites del modelo; no certifica un resultado climático.

## Personas y derechos

| Actor | Qué puede hacer | Qué muestra el registro | Límite |
|---|---|---|---|
| Persona que inscribe una actividad de origen | Agregar una actividad, país y métrica al registro local | A qué origen se refiere una entrada y quién lo inscribió | El registro no demuestra que la actividad o la persona existan |
| Persona que autoriza una declaración | Conceder autoridad para un país, métrica, período, tope, destino y vencimiento | Quién concedió la autoridad y cuáles son sus límites | El agente declarante no puede autorizarse; el permiso no excede su alcance ni su plazo |
| País declarante | Presentar una declaración contra un origen y una metodología declarada | Si la declaración entró o fue rechazada, y por qué | Alba, Bruma, Cenal y Duna son ejemplos ficticios, no Estados |
| Verificador de Marea | Recalcular los resultados desde el almacén local | Qué comprobaciones pasaron y qué evidencia produjo la decisión | Comprueba los datos y las reglas almacenadas, no la verdad de las afirmaciones climáticas |
| Lector independiente | Abrir el registro y el reporte, o volver a ejecutar la auditoría cuando haya código disponible | Aceptaciones, rechazos, motivos y comprobaciones de recibos | Sigue dependiendo de datos ficticios y de este modelo limitado |

En el modelo, quien aporta los datos y quien concede la autorización cumplen funciones distintas. Cada declaración registra quién otorgó la autoridad, su alcance y vencimiento; la declaración del agente no se considera permiso para sí mismo.

## Una declaración, paso a paso

1. Una persona inscribe una actividad de origen, su país y su métrica. Se rechaza una declaración cuyo origen no resuelve en el registro.
2. Una persona concede autoridad para un país, una métrica, un período de compromiso, un tope de cantidad y un destino. La autorización identifica a quien la otorgó y cuándo vence, y no se extiende a otra métrica, período o destino.
3. Un país presenta su declaración con origen, metodología declarada, métrica, años, cantidad y destino. El verificador resuelve el origen y comprueba la métrica, la metodología, el alcance y vencimiento de la autorización, y que el par actividad-año no se haya reconocido antes.
4. Una declaración que pasa entra en su pista métrica. Una colisión u otra regla incumplida produce un rechazo con evidencia y una salida nombrada para resolverlo.
5. La aceptación y el rechazo se escriben en el mismo registro local. Cada uno recibe un sello con el digest canónico que usa el kernel de Vespi. El verificador independiente vuelve a calcular desde el almacén, en vez de confiar en el informe del ejecutor.
6. Una persona puede leer el reporte sin ejecutar Marea. La auditoría comprueba si el registro, el recibo y el resultado recalculado coinciden.

```text
PERSONA INSCRIBE ORIGEN ── PERSONA CONCEDE AUTORIDAD ACOTADA
              │                                 │
              └────────── PAÍS DECLARA ─────────┘
                               │
                               ▼
      resolver origen · métrica · método · año · cantidad · autoridad
                         ┌─────┴─────┐
                         ▼           ▼
                     aceptada    rechazada + motivo
                         └─────┬─────┘
                               ▼
                un registro local + recibo sellado
                               │
                               ▼
               recálculo independiente + reporte legible
```

## Un ejemplo concreto

En el recorrido registrado, el país ficticio Alba tiene una actividad de origen llamada «bosque de la cuenca alta», en la métrica `tCO2e`. Una persona inscribe ese origen y autoriza a Alba a declarar hasta un tope, hacia un destino y hasta una hora determinados. Alba declara 1.200 `tCO2e` para 2027 con una metodología nombrada. El verificador la acepta en la pista `tCO2e`.

Luego el país ficticio Bruma declara 900 `tCO2e` sobre la misma actividad y el mismo año. Marea rechaza la segunda entrada como `unidad-compartida`, señala la declaración anterior de Alba y el par actividad-año en colisión, y registra el motivo junto a la aceptación. La transcripción también incluye otros rechazos: metodología ausente, origen que no resuelve o cuya métrica no coincide, autorización vencida, tope excedido, origen rechazado y segundo lado de una transferencia internacional. Son casos del verificador acotado, no conclusiones sobre países ni emisiones reales.

El recorrido incluye un control para el otro lado de la regla. Una actividad distinta en la misma métrica y año puede entrar, y una pista métrica distinta también puede entrar en ese mismo año. La clave es `(actividad, año)`, no solo el año ni la métrica por sí sola.

## Reglas que el acuerdo deja visibles

- **Un par actividad-año se reconoce una sola vez.** La clave de colisión es `(actividad, año)`, no solo la métrica ni solo el año. Actividades distintas pueden entrar en el mismo año, incluso en la misma métrica. Las pistas de métricas distintas permanecen separadas.
- **Se deben declarar origen y metodología.** Un origen que no resuelve, uno cuya métrica no coincide o la falta de metodología bloquean la declaración con un motivo.
- **Un agregado no puede contar sus propias partes dos veces.** Los componentes declarados deben resolver de modo que cada actividad se cuente una sola vez.
- **La autoridad tiene plazo y tope.** Una autorización vencida sigue vencida; se rechaza lo que supera su cantidad, métrica, período o destino. Cambiar de destino requiere otra autorización.
- **Una transferencia internacional es un solo hecho contable.** Marea rechaza el segundo lado en vez de afirmar que realiza el proceso completo de ajuste.
- **El verificador recalcula.** Lee los datos almacenados en vez de aceptar el informe del ejecutor como prueba.
- **Los rechazos se pueden inspeccionar.** Cada rechazo guarda su motivo, la colisión o comprobación que lo sustenta y una salida para resolverlo en el mismo registro de las aceptaciones.
- **Los recibos se sellan y verifican.** Si alguien edita un recibo a mano, falla la comprobación de su digest.

## Marea, Vespi y Lore Plugin

Marea consume la copia del kernel de Vespi que instala Lore Plugin. Usa los mecanismos del kernel para que cada declaración se compruebe contra una autorización acotada y cada aceptación o rechazo reciba un sello verificable. El verificador vuelve a calcular la declaración desde el almacén local; el recibo prueba esa operación acotada, no la verdad de la afirmación climática subyacente.

El proyecto fija por digest cinco módulos del kernel y comprueba los encabezados de esos módulos y las copias de los hosts en la suite registrada. Marea consume esos módulos; no modifica el kernel, Lore Plugin, las aplicaciones anfitrionas ni sus versiones instaladas. Como el kernel instalado puede cambiar, la evidencia identifica el corte probado y no presenta el pin anterior como si fuera actual. Consulta [Evidencia](EVIDENCE.md) para el resultado registrado y el límite de la nueva fijación.

## Qué demuestra y qué no

El recorrido registrado demuestra un mecanismo local que acepta y rechaza declaraciones ficticias según estas reglas. La suite y la transcripción permiten inspeccionar los casos modelados y los motivos declarados.

La corrida no establece verdad, autorización, cumplimiento legal, suficiencia científica ni integridad ambiental en el mundo real. Consulta [Evidencia](EVIDENCE.md) para el resultado de pruebas y el pin del kernel, y [Marco legal y límites](LEGAL_AND_LIMITS.md) para el marco citado y las preguntas abiertas.
