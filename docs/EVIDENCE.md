# Evidence

## Tests and coverage

The supplied suite output contains these 25 test names.

### Kernel pin

- el kit instalado declara los cinco módulos del núcleo
- el núcleo que consume Marea es el corte fijado, módulo por módulo
- los tres hosts corren la misma copia del núcleo, byte a byte
- el encabezado de los cinco módulos declara el mismo commit

### Duplicate checks and valid cases

- un segundo país que declara la misma actividad en la misma métrica es rechazado, y el motivo nombra al primero
- el solapamiento parcial de un año también es doble conteo, y el motivo nombra el año
- el segundo lado de una transferencia internacional se rechaza en vez de contarse dos veces
- CONTROL: dos países en métricas legítimamente distintas entran ambos, y la clave de la partida no es el año

### Origins, methodology, aggregation and authority

- una reducción sin metodología declarada no es comparable y se rechaza nombrando qué falta
- una reducción anclada a una actividad que el registro no tiene se rechaza por verificable, no por inválida
- una reducción que se apoya en un anclaje de otra métrica tampoco resuelve
- una declaración que suma un conjunto junto con sus propias partes se rechaza nombrando la actividad contada dos veces
- una agregación declarada una sola vez sí entra, con la cantidad declarada
- un compromiso con el reloj vencido se rechaza nombrando la hora en que murió
- pasada la hora, la autorización no revive sola: la misma declaración sigue rechazada
- una declaración que pasa el techo autorizado se rechaza nombrando lo que queda
- una transferencia que cita un origen rechazado se rechaza por eso, no por doble conteo

### Receipts and independent audit

- el rechazo también queda sellado por el núcleo, no solo por el registro
- el rechazo queda escrito en el mismo registro y en el mismo archivo que la aceptación
- una entrada aceptada lleva un recibo que verifica, y editarlo a mano lo rompe
- el reporte muestra, entrada por entrada, por qué cada una entró o no
- una tercera parte audita sin creer a nadie: un verificador que solo cree al ejecutor no pasa la auditoría
- la auditoría de una entrada rechazada también pasa, y la de un recibo ajeno no
- el verificador rechaza un doble conteo que la puerta no vio, porque no confía en ella
- el verificador rechaza un efecto cuyo ajuste se atribuyó al párrafo equivocado de la guía

## Recorded result and kernel pin

The source snapshot reports **25 tests, 25 pass, 0 fail** against Marea's pinned kernel cut. The nine code-bearing projects, including Marea, were built on 2026-09-29 against kernel cut 54c20c7, and their records report green suites at that cut. Each pins the kernel by digest and is intended to fail if those bytes move.

The Vespi README was read on 2026-10-02 and checked again on 2026-10-03; it reports 25 of 25 passing for Vespi. The installed kernel is now Vespi 0.1.3. Until each pin is refreshed, parts of those suites are expected to fail against the current installation; that re-pin is pending. This evidence is the earlier pinned-cut Marea run, not a fresh run against today's installed kernel. It shows a working path, not a finished product or readiness for use.

When the code opens, the package script specifies <code>npm test</code>. Rerun it from a fresh environment against the documented kernel copy, then inspect the output and receipts. The recorded project has no network or testnet steps to repeat.

## Adversarial phase

Before implementation, the red run had **25 tests, 4 pass and 21 fail**. The four passing checks were the kernel kit and pin checks. The behavior cases failed individually against the empty implementation skeleton, rather than all failing because a module was missing. The red run preceded the code.

The later mutation sweep deliberately broke detector rules and confirmed the suite caught the mutations: dropping either activity or year from the collision key; accepting any methodology or wrong years; ignoring authorization expiry or its ceiling; missing inflated aggregation or a mismatched origin metric; missing international transfer or accepting a rejected origin; trusting the executor in the verifier; and treating every metric track as countable in the same way. The recorded baseline was restored to **25 pass, 0 fail** after the sweep.

These are adversarial software checks against the specified examples. They do not establish that the selected rules are legally or scientifically sufficient.

## Walkthrough

See [the concrete example](HOW_IT_WORKS.md#a-concrete-example) in the workflow document. This evidence contains no real country data, network, blockchain, payment or testnet transaction.

---

# Evidencia

## Pruebas y cobertura

La salida de suite suministrada contiene estos 25 nombres de pruebas.

### Fijación del kernel

- <code>el kit instalado declara los cinco módulos del núcleo</code>
- <code>el núcleo que consume Marea es el corte fijado, módulo por módulo</code>
- <code>los tres hosts corren la misma copia del núcleo, byte a byte</code>
- <code>el encabezado de los cinco módulos declara el mismo commit</code>

### Detección de duplicados y casos válidos

- <code>un segundo país que declara la misma actividad en la misma métrica es rechazado, y el motivo nombra al primero</code>
- <code>el solapamiento parcial de un año también es doble conteo, y el motivo nombra el año</code>
- <code>el segundo lado de una transferencia internacional se rechaza en vez de contarse dos veces</code>
- <code>CONTROL: dos países en métricas legítimamente distintas entran ambos, y la clave de la partida no es el año</code>

### Orígenes, metodología, agregación y autoridad

- <code>una reducción sin metodología declarada no es comparable y se rechaza nombrando qué falta</code>
- <code>una reducción anclada a una actividad que el registro no tiene se rechaza por verificable, no por inválida</code>
- <code>una reducción que se apoya en un anclaje de otra métrica tampoco resuelve</code>
- <code>una declaración que suma un conjunto junto con sus propias partes se rechaza nombrando la actividad contada dos veces</code>
- <code>una agregación declarada una sola vez sí entra, con la cantidad declarada</code>
- <code>un compromiso con el reloj vencido se rechaza nombrando la hora en que murió</code>
- <code>pasada la hora, la autorización no revive sola: la misma declaración sigue rechazada</code>
- <code>una declaración que pasa el techo autorizado se rechaza nombrando lo que queda</code>
- <code>una transferencia que cita un origen rechazado se rechaza por eso, no por doble conteo</code>

### Recibos y auditoría independiente

- <code>el rechazo también queda sellado por el núcleo, no solo por el registro</code>
- <code>el rechazo queda escrito en el mismo registro y en el mismo archivo que la aceptación</code>
- <code>una entrada aceptada lleva un recibo que verifica, y editarlo a mano lo rompe</code>
- <code>el reporte muestra, entrada por entrada, por qué cada una entró o no</code>
- <code>una tercera parte audita sin creer a nadie: un verificador que solo cree al ejecutor no pasa la auditoría</code>
- <code>la auditoría de una entrada rechazada también pasa, y la de un recibo ajeno no</code>
- <code>el verificador rechaza un doble conteo que la puerta no vio, porque no confía en ella</code>
- <code>el verificador rechaza un efecto cuyo ajuste se atribuyó al párrafo equivocado de la guía</code>

## Resultado registrado y fijación del kernel

La captura de fuentes informa **25 pruebas, 25 aprobadas y 0 fallidas** contra el corte de kernel fijado por Marea. Los nueve proyectos con código, incluido Marea, se construyeron el 2026-09-29 contra el corte 54c20c7 del kernel y sus registros reportan suites aprobadas en ese corte. Cada uno fija el kernel por digest y debe fallar si esos bytes cambian.

El README de Vespi se leyó el 2026-10-02 y se comprobó otra vez el 2026-10-03; informa 25 de 25 pruebas aprobadas para Vespi. El kernel instalado ahora es Vespi 0.1.3. Hasta volver a fijar cada kernel, se espera que partes de esas suites fallen contra la instalación actual; esa actualización está pendiente. Esta evidencia es la corrida anterior de Marea contra el corte fijado, no una corrida nueva contra el kernel instalado hoy. Muestra un camino que funciona, no un producto terminado ni preparación para el uso.

Cuando se abra el código, el paquete especifica <code>npm test</code>. Vuelve a ejecutarlo desde un entorno fresco contra la copia de kernel documentada y luego inspecciona la salida y los recibos. El proyecto registrado no tiene pasos de red ni de testnet que repetir.

## Fase adversarial

Antes de la implementación, la corrida roja tuvo **25 pruebas, 4 aprobadas y 21 fallidas**. Las cuatro aprobadas eran las comprobaciones del kit y de la fijación del kernel. Los casos de comportamiento fallaron individualmente contra el esqueleto vacío, en vez de fallar todos porque faltara un módulo. La corrida roja fue anterior al código.

El barrido posterior rompió deliberadamente reglas del detector y confirmó que la suite detectaba esas mutaciones: quitar actividad o año de la clave de colisión; aceptar cualquier metodología o años incorrectos; ignorar el vencimiento o el tope de autorización; no detectar agregación inflada o un origen de otra métrica; no detectar una transferencia internacional o aceptar un origen rechazado; confiar en el ejecutor al verificar; y tratar todas las pistas métricas como si tuvieran la misma contabilidad. Después del barrido, la línea base registrada volvió a **25 aprobadas, 0 fallidas**.

Son comprobaciones adversariales de software sobre los ejemplos especificados. No demuestran que las reglas elegidas sean suficientes en derecho o en ciencias.

## Recorrido

Consulta [el ejemplo concreto](HOW_IT_WORKS.md#un-ejemplo-concreto) en el documento del flujo de trabajo. Esta evidencia no contiene datos de países reales ni intervenciones de red, blockchain, pagos o transacciones de testnet.