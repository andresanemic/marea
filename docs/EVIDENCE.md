# Evidence

## Tests and coverage

The supplied suite output contains these 25 test names.

### Kernel pin

- la copia vendorizada declara los ocho módulos del núcleo
- el núcleo que consume Marea es el corte fijado, módulo por módulo
- la copia vendorizada coincide con su SOURCE.md, byte a byte
- el encabezado de los ocho módulos declara el mismo commit

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

The capture taken on 2026-10-09, in [`suite-2026-10-09.txt`](./suite-2026-10-09.txt), reports **25 tests, 25 pass, 0 not passing and 0 skipped** on Node v24.15.0. It was run in a clean clone of the private project with an empty HOME and no network. The four kernel-pin checks verify the Vespi 0.1.5 copy the project vendors under `vendor/vespi-kernel` (commit `ed559e83c976dd6e6a379a5510db776206f670b4`), module by module and digest by digest, against that copy's own `SOURCE.md`, and that the three hosts run the same bytes. Each module stays fixed by digest, so a changed kernel cannot be presented in silence as the tested one.

**Why the earlier capture was red.** The capture taken on 2026-10-03 was red for one reason: the project was pinned then to an older kernel cut (Vespi 0.1.3), whose checks no longer described the installed bytes. That re-pin is now done, the pinned cut is Vespi 0.1.5 (commit `ed559e8`), and its digests match. The earlier red capture stays in the record instead of being hidden.

What this run accredits is the local mechanism and its recorded boundary. It shows a working path, not a finished product or readiness for use.

The source is in this repository under the review-only license (reading and cloning for evaluation; no modification or redistribution), and the package script specifies <code>npm test</code>. Run it on Node 24 from the project root in a fresh environment against the documented kernel copy: the suite should report the same count as the capture above, 25 tests with every one passing and none skipped, and [`suite-2026-10-09.txt`](./suite-2026-10-09.txt) is the reference for the test names and their results. Then inspect the output and the receipts. The recorded project has no network or testnet steps to repeat.

## Adversarial phase

Before implementation, the red run had **25 tests, 4 pass and 21 not passing**. The four passing checks were the kernel kit and pin checks. The behavior cases broke one by one against the empty implementation skeleton, rather than all at once because a module was missing. The red run preceded the code.

The later mutation sweep deliberately broke detector rules and confirmed the suite caught the mutations: dropping either activity or year from the collision key; accepting any methodology or wrong years; ignoring authorization expiry or its ceiling; missing inflated aggregation or a mismatched origin metric; missing international transfer or accepting a rejected origin; trusting the executor in the verifier; and treating every metric track as countable in the same way. The recorded baseline was restored to **25 pass, 0 not passing** after the sweep.

These are adversarial software checks against the specified examples. They do not establish that the selected rules are legally or scientifically sufficient.

## Walkthrough

See [the concrete example](HOW_IT_WORKS.md#a-concrete-example) in the workflow document. This evidence contains no real country data, network, blockchain, payment or testnet transaction.

---

# Evidencia

## Pruebas y cobertura

La salida de suite suministrada contiene estos 25 nombres de pruebas.

### Fijación del kernel

- <code>la copia vendorizada declara los ocho módulos del núcleo</code>
- <code>el núcleo que consume Marea es el corte fijado, módulo por módulo</code>
- <code>la copia vendorizada coincide con su SOURCE.md, byte a byte</code>
- <code>el encabezado de los ocho módulos declara el mismo commit</code>

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

La captura del 2026-10-09, en [`suite-2026-10-09.txt`](./suite-2026-10-09.txt), informa **25 pruebas, 25 aprobadas, 0 sin aprobar y 0 omitidas** sobre Node v24.15.0. Se corrió en un clon limpio del proyecto privado, con HOME vacío y sin red. Las cuatro comprobaciones de fijación verifican la copia de Vespi 0.1.5 que el proyecto lleva en `vendor/vespi-kernel` (commit `ed559e83c976dd6e6a379a5510db776206f670b4`), módulo por módulo y digest por digest, contra el `SOURCE.md` de esa misma copia, y que esa copia no cambió ni un byte respecto de su `SOURCE.md`. Cada módulo sigue fijado por digest, así que un kernel cambiado no puede presentarse en silencio como el que se probó.

**Por qué la captura anterior estaba en rojo.** La captura del 2026-10-03 estuvo en rojo por una sola razón: el proyecto estaba fijado entonces a un corte viejo del kernel (Vespi 0.1.3), cuyas comprobaciones ya no describían los bytes instalados. Ese re-pin ya está hecho, el corte fijado es Vespi 0.1.5 (commit `ed559e8`) y sus digests coinciden. La captura roja anterior se conserva en el registro en vez de ocultarse.

Lo que acredita esta corrida es el mecanismo local y su límite registrado. Muestra un camino que funciona, no un producto terminado ni preparación para el uso.

El código está en este repositorio bajo la licencia de solo revisión (permite leer y clonar para evaluar, no modificar ni redistribuir), y el paquete especifica <code>npm test</code>. Se corre con Node 24 desde la raíz del proyecto, en un entorno fresco, contra la copia de kernel documentada: la suite debe informar el mismo conteo que la captura de arriba, 25 pruebas con todas aprobadas y ninguna omitida, y [`suite-2026-10-09.txt`](./suite-2026-10-09.txt) es la referencia de los nombres de las pruebas y sus resultados. Después se inspeccionan la salida y los recibos. El proyecto registrado no tiene pasos de red ni de testnet que repetir.

## Fase adversarial

Antes de la implementación, la corrida roja tuvo **25 pruebas, 4 aprobadas y 21 sin aprobar**. Las cuatro aprobadas eran las comprobaciones del kit y de la fijación del kernel. Los casos de comportamiento cayeron uno a uno contra el esqueleto vacío, en vez de caer todos juntos porque faltara un módulo. La corrida roja fue anterior al código.

El barrido posterior rompió deliberadamente reglas del detector y confirmó que la suite detectaba esas mutaciones: quitar actividad o año de la clave de colisión; aceptar cualquier metodología o años incorrectos; ignorar el vencimiento o el tope de autorización; no detectar agregación inflada o un origen de otra métrica; no detectar una transferencia internacional o aceptar un origen rechazado; confiar en el ejecutor al verificar; y tratar todas las pistas métricas como si tuvieran la misma contabilidad. Después del barrido, la línea base registrada volvió a **25 aprobadas, 0 sin aprobar**.

Son comprobaciones adversariales de software sobre los ejemplos especificados. No demuestran que las reglas elegidas sean suficientes en derecho o en ciencias.

## Recorrido

Consulta [el ejemplo concreto](HOW_IT_WORKS.md#un-ejemplo-concreto) en el documento del flujo de trabajo. Esta evidencia no contiene datos de países reales ni intervenciones de red, blockchain, pagos o transacciones de testnet.