# How Marea works

## Scope

Marea is a local record of fictional declarations and a checker that rejects a second declaration of the same activity and year. It imitates one accounting idea associated with Paris Agreement Article 6.2: a transferred mitigation outcome is treated as one fact, and accounting tracks stay separate by metric. Marea does not calculate emissions or determine whether a real country has met a commitment.

All countries, activities, methodologies, units and amounts in the project are invented. The record is a local file. There is no institutional connection, blockchain, payment, testnet anchor or real country data.

## People and rights

| Actor | What they can do | What the record shows | Boundary |
|---|---|---|---|
| Person who records an origin activity | Add an activity, country and metric to the local register | Which origin an entry refers to and who recorded it | The record does not establish that the activity or person is real |
| Person who authorizes a declaration | Grant a named country, metric, commitment period, amount, destination and expiry | Who granted the authority and its limits | The agent cannot authorize itself; authority does not extend past its scope or clock |
| Declaring country | Submit a declaration against an origin activity and methodology | Whether the declaration entered or was rejected, and why | Alba, Bruma, Cenal and Duna are fictional examples, not states |
| Marea checker | Recalculate results from the local store | Which checks passed and what evidence caused a decision | It checks the stored inputs and rules, not the truth of climate claims |
| Independent reader | Open the record and report, or rerun the audit when code is available | The stored acceptances, rejections, reasons and receipt checks | The reader still depends on the supplied fictional inputs and this limited model |

## A declaration, step by step

1. A person records an origin activity, country and metric. A declaration without an origin that resolves in the register is rejected.
2. A person grants authority for a country, metric, commitment period, amount ceiling and destination. The authority names its grantor and an expiry. It cannot be stretched to another metric, period or destination.
3. A country submits its declaration with an origin, declared methodology, metric, years, amount and destination. The checker resolves the origin and checks that the metric matches, a methodology is present, the authority is in time and covers the amount, and the activity-year pair has not already been recognized.
4. If it passes, the declaration is accepted into the relevant metric track. If it collides with an accepted activity-year pair, or fails another rule, it is rejected with the evidence and a named way to resolve the issue.
5. Both the acceptance and the rejection are written into the same local register. Each gets a receipt sealed with the canonical digest used by the Vespi kernel. The independent checker recomputes from the store instead of trusting the executor's report.
6. A reader can inspect the report without running Marea. The audit checks whether the stored record, receipt and recomputed result agree.

```text
person records origin --> person grants bounded authority
                                  |
country submits declaration -----+
             |
             v
 resolve origin / metric / methodology / years / amount / authority
             |
       +-----+-----+
       v           v
 accepted      rejected with reason and exit
       +-----+-----+
             v
 same local register + sealed receipt
             |
             v
 independent recomputation and readable report
```

## A concrete example

In the recorded example, fictional Alba has an origin activity called “bosque de la cuenca alta,” in the `tCO2e` metric. A person records that origin and authorizes Alba to declare up to a stated ceiling, for a stated destination and until a stated time. Alba declares 1,200 `tCO2e` for 2027 with a named methodology. The checker accepts it into the `tCO2e` track.

Fictional Bruma then declares 900 `tCO2e` against that same activity and year. Marea rejects the second entry as `unidad-compartida`, points to Alba's earlier declaration and the colliding activity-year pair, and records the reason beside the acceptance. This is an example of the duplicate-detection mechanism; it is not a finding about countries or emissions in the world.

## Rules the agreement makes visible

- **One activity-year pair is recognized once.** The collision key is `(activity, year)`, not the metric or year alone. Distinct activities can enter in the same year, including in the same metric. Legitimately distinct metric tracks are not merged.
- **An origin and methodology must be stated.** An unresolved origin, an origin under a different metric, or a missing methodology blocks the declaration with a reason.
- **Aggregates cannot count their own parts twice.** The declared components must flatten to each activity exactly once.
- **Authority has a clock and a ceiling.** An expired grant stays expired; exceeding the amount, metric, period or destination it names is rejected. Changing destination requires a separate authorization.
- **An international transfer is one accounting fact.** Marea rejects the second side rather than claiming to perform the full transfer adjustment process.
- **The verifier recomputes.** It reads the stored inputs rather than accepting the executor's report as proof.
- **Rejections remain inspectable.** A rejection records its reason, supporting collision or failed check, and a named way to resolve the issue in the same register as accepted entries.
- **Receipts are sealed and checked.** Editing a receipt by hand makes its digest check fail.

## What this proves, and what it does not

The recorded run demonstrates a local mechanism for accepting and rejecting fictional declarations under these rules. See [Evidence](EVIDENCE.md) for the suite coverage and result.

The run does not establish real-world truth, authorization or compliance. See [Legal and limits](LEGAL_AND_LIMITS.md) for the full boundaries and open questions.

The exact named tests, current recorded suite result and kernel pin limitation are in [Evidence](EVIDENCE.md). The cited framework and open questions are in [Legal and limits](LEGAL_AND_LIMITS.md).

---

# Cómo funciona Marea

## Alcance

Marea es un registro local de declaraciones de fantasía y un verificador que rechaza una segunda declaración de la misma actividad y año. Imita una idea contable asociada al artículo 6.2 del Acuerdo de París: un resultado de mitigación transferido se trata como un solo hecho, y las pistas contables se mantienen separadas por métrica. Marea no calcula emisiones ni determina si un país real cumplió un compromiso.

Todos los países, actividades, metodologías, unidades y cantidades del proyecto son inventados. El registro es un archivo local. No hay conexión institucional, blockchain, pagos, anclaje en testnet ni datos de países reales.

## Personas y derechos

| Actor | Qué puede hacer | Qué muestra el registro | Límite |
|---|---|---|---|
| Persona que inscribe una actividad de origen | Agregar una actividad, país y métrica al registro local | A qué origen se refiere una entrada y quién la inscribió | El registro no demuestra que la actividad o la persona existan |
| Persona que autoriza una declaración | Conceder autoridad con país, métrica, período, cantidad, destino y vencimiento | Quién concedió la autoridad y cuáles son sus límites | El agente no puede autorizarse a sí mismo; la autoridad no supera su alcance ni su plazo |
| País declarante | Presentar una declaración vinculada a un origen y una metodología | Si la declaración entró o fue rechazada, y por qué | Alba, Bruma, Cenal y Duna son ejemplos de fantasía, no Estados |
| Verificador de Marea | Recalcular los resultados desde el almacén local | Qué comprobaciones pasaron y qué evidencia produjo la decisión | Comprueba los datos y reglas almacenados, no la verdad de las afirmaciones climáticas |
| Lector independiente | Abrir el registro y el reporte, o volver a ejecutar la auditoría cuando se publique el código | Aceptaciones, rechazos, motivos y comprobaciones de recibos almacenados | El lector sigue dependiendo de los datos ficticios suministrados y de este modelo limitado |

## Una declaración, paso a paso

1. Una persona inscribe una actividad de origen, su país y su métrica. Se rechaza una declaración cuyo origen no resuelve en el registro.
2. Una persona concede autoridad para un país, una métrica, un período de compromiso, un tope de cantidad y un destino. La autorización identifica a quien la otorgó y cuándo vence. No se extiende a otra métrica, período o destino.
3. Un país presenta su declaración con origen, metodología declarada, métrica, años, cantidad y destino. El verificador resuelve el origen y comprueba la métrica, la presencia de metodología, la vigencia y cobertura de la autorización, y que el par actividad-año no se haya reconocido antes.
4. Si pasa, la declaración se acepta en la pista de su métrica. Si choca con un par actividad-año ya reconocido o incumple otra regla, se rechaza con evidencia y una salida nombrada para resolver el problema.
5. La aceptación y el rechazo se escriben en el mismo registro local. Cada uno recibe un sello con el digest canónico que usa el kernel de Vespi. El verificador independiente vuelve a calcular desde el almacén, en vez de confiar en el informe del ejecutor.
6. Una persona puede leer el reporte sin ejecutar Marea. La auditoría comprueba si el registro, el recibo y el resultado recalculado coinciden.

```text
persona inscribe origen --> persona concede autoridad limitada
                                      |
país presenta declaración -----------+
                 |
                 v
 resolver origen / métrica / metodología / años / cantidad / autoridad
                 |
          +------+------+
          v             v
      aceptada      rechazada con motivo y salida
          +------+------+
                 v
 mismo registro local + recibo sellado
                 |
                 v
 recálculo independiente y reporte legible
```

## Un ejemplo concreto

En el recorrido registrado, el país ficticio Alba tiene una actividad de origen llamada «bosque de la cuenca alta», en la métrica `tCO2e`. Una persona inscribe ese origen y autoriza a Alba a declarar hasta un tope, hacia un destino y hasta una hora determinados. Alba declara 1.200 `tCO2e` para 2027 con una metodología nombrada. El verificador la acepta en la pista `tCO2e`.

Luego el país ficticio Bruma declara 900 `tCO2e` sobre la misma actividad y el mismo año. Marea rechaza la segunda entrada como `unidad-compartida`, señala la declaración anterior de Alba y el par actividad-año en colisión, y registra el motivo junto a la aceptación. Es un ejemplo del mecanismo para detectar duplicados; no es una conclusión sobre países ni emisiones reales.

## Reglas que el acuerdo deja visibles

- **Un par actividad-año se reconoce una sola vez.** La clave de colisión es `(actividad, año)`, no solo la métrica ni solo el año. Actividades distintas pueden entrar en el mismo año, incluso en la misma métrica. Las pistas de métricas legítimamente distintas no se mezclan.
- **Se deben declarar origen y metodología.** Un origen que no resuelve, un origen de otra métrica o la falta de metodología bloquean la declaración con un motivo.
- **Un agregado no puede contar dos veces sus propias partes.** Al desglosar los componentes declarados, cada actividad debe aparecer una sola vez.
- **La autoridad tiene plazo y tope.** Una autorización vencida sigue vencida; se rechaza lo que supera la cantidad, métrica, período o destino autorizado. Cambiar de destino requiere otra autorización.
- **Una transferencia internacional es un solo hecho contable.** Marea rechaza el segundo lado en vez de afirmar que realiza el proceso completo de ajuste de transferencias.
- **El verificador recalcula.** Lee los datos almacenados en vez de aceptar el informe del ejecutor como prueba.
- **Los rechazos se pueden inspeccionar.** Cada rechazo guarda su motivo, la colisión o comprobación que lo sustenta y una salida para resolverlo en el mismo registro de las aceptaciones.
- **Los recibos se sellan y verifican.** Si alguien edita un recibo a mano, falla la comprobación de su digest.

## Qué demuestra y qué no

El recorrido registrado demuestra un mecanismo local que acepta y rechaza declaraciones ficticias conforme a estas reglas. Consulta [Evidencia](EVIDENCE.md) para la cobertura y el resultado de la suite.

El recorrido no establece verdades, autorizaciones ni cumplimiento en el mundo real. Consulta [Marco legal y límites](LEGAL_AND_LIMITS.md) para ver todos los límites y preguntas abiertas.

Las pruebas con nombre, el resultado registrado de la suite y el límite del anclaje del kernel están en [Evidencia](EVIDENCE.md). El marco citado y las preguntas abiertas están en [Marco legal y límites](LEGAL_AND_LIMITS.md).