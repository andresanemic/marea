'use strict';

// RED de Marea. Escrito ANTES del código, el 2026-09-29.
//
// Los ocho casos que este proyecto tiene que presionar: doble conteo por unidad
// compartida entre dos países; por año solapado; por transferencia internacional
// entre registros; metodología ausente; anclaje que no resuelve; agregación que
// infla la cifra sin declararlo; compromiso con el reloj vencido; y el caso de
// control, dos países con unidades legítimamente distintas que **deben entrar
// ambos** — ese último es el que demuestra que el detector no es un no automático.
//
// La clave de la partida es el par (pista, actividad, año). Si la clave fuera solo
// el año, el caso de control no entraría. Si la clave fuera solo la actividad, el
// control entraría pero una métrica nunca se separaría de otra, que es exactamente
// lo que hacen los párrafos 8 y 9 de la guía 2/CMA.3. Las dos mitades se presionan.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { Marea } = require('../src/marea.js');
const { KERNEL } = require('./nucleo.js');

// El mismo digest canónico del núcleo que sella los recibos de Marea.
const { verifyReceipt } = require(`${KERNEL}/receipt.js`);

const T0 = '2026-09-29T12:00:00.000Z';
const T1 = '2026-09-29T15:00:00.000Z';

function temporal() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'marea-'));
}

// Las anclas de actividad, inscritas por la persona. El registro exige que un
// conjunto se inscriba después de sus partes, así que la agrupación va al final.
// Los países son de fantasía y las cifras también: no hay dato de ningún país real.
const ANCLAS = [
  { id: 'anc-alba-1', pais: 'alba', metrica: 'tCO2e', actividad: 'bosque de la cuenca alta' },
  { id: 'anc-alba-2', pais: 'alba', metrica: 'tCO2e', actividad: 'cambio de combustible de un hospital' },
  { id: 'anc-alba-3', pais: 'alba', metrica: 'MWh-eq', actividad: 'bombeo electrificado' },
  { id: 'anc-alba-5', pais: 'alba', metrica: 'tCO2e', actividad: 'recuperación de un basural' },
  { id: 'anc-alba-4', pais: 'alba', metrica: 'tCO2e', actividad: 'agrupación de dos actividades', componentes: ['anc-alba-2', 'anc-alba-5'] },
  { id: 'anc-cenal-1', pais: 'cenal', metrica: 'MWh-eq', actividad: 'riego solar' },
  { id: 'anc-cenal-2', pais: 'cenal', metrica: 'tCO2e', actividad: 'flota de camiones eléctricos' },
];

const AUTORIDADES = [
  { actuator: 'irene', id: 'aut-alba-ghg', pais: 'alba', metrica: 'tCO2e', destino: 'NDC', cantidad: '100000', vence: '2026-12-01T00:00:00.000Z' },
  { actuator: 'irene', id: 'aut-alba-nonghg', pais: 'alba', metrica: 'MWh-eq', destino: 'NDC', cantidad: '8000', vence: '2026-12-01T00:00:00.000Z' },
  { actuator: 'joel', id: 'aut-bruma-ghg', pais: 'bruma', metrica: 'tCO2e', destino: 'NDC', cantidad: '50000', vence: '2026-12-01T00:00:00.000Z' },
  { actuator: 'joel', id: 'aut-cenal-nonghg', pais: 'cenal', metrica: 'MWh-eq', destino: 'NDC', cantidad: '6000', vence: '2026-12-01T00:00:00.000Z' },
  { actuator: 'joel', id: 'aut-cenal-vencida', pais: 'cenal', metrica: 'tCO2e', destino: 'NDC', cantidad: '9000', vence: '2026-01-15T00:00:00.000Z' },
];

function taller(dir) {
  const m = new Marea({ dir });
  for (const a of ANCLAS) m.anclar(a);
  for (const p of AUTORIDADES) m.autorizar(p);
  return m;
}

// La declaración de Alba que abre el recorrido: una reducción con su metodología
// y su métrica, anclada a una actividad que existe.
const DEC_ALBA_1 = {
  clave: 'dec-alba-1',
  pais: 'alba',
  metrica: 'tCO2e',
  anclaje: 'anc-alba-1',
  metodologia: 'inventario-de-gas-planta-v3',
  anios: [2027],
  cantidad: '1200',
  destino: 'NDC',
};

// 1. Doble conteo por unidad compartida entre dos países.
test('un segundo país que declara la misma actividad en la misma métrica es rechazado, y el motivo nombra al primero', async () => {
  const m = taller(temporal());
  const primero = await m.declarar(DEC_ALBA_1, { now: T0 });
  assert.equal(primero.estado, 'aceptada', 'la primera declaración de Alba entra');

  const segundo = await m.declarar({
    clave: 'dec-bruma-1',
    pais: 'bruma',
    metrica: 'tCO2e',
    anclaje: 'anc-alba-1',
    metodologia: 'factor-de-emision-nacional-2024',
    anios: [2027],
    cantidad: '900',
    destino: 'NDC',
  }, { now: T1 });

  assert.equal(segundo.estado, 'rechazada');
  assert.equal(segundo.codigo, 'unidad-compartida');
  assert.match(segundo.motivo, /anc-alba-1/);
  assert.match(segundo.motivo, /dec-alba-1/);
  assert.deepEqual(segundo.evidencia.choques, [['anc-alba-1', 2027]]);
  assert.equal(segundo.ajuste, null, 'una entrada rechazada no ajusta nada');
});

// 2. Doble conteo por año solapado.
test('el solapamiento parcial de un año también es doble conteo, y el motivo nombra el año', async () => {
  const m = taller(temporal());
  // Alba reconoce la actividad en 2027 y 2028; Bruma la vuelve a declarar en 2028
  // y 2029. El año 2028 queda en dos balances y el 2029 no: por eso el motivo
  // distingue el año que choca del año que se salva.
  await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-2', anclaje: 'anc-alba-2', anios: [2027, 2028] }, { now: T0 });

  const solapado = await m.declarar({
    clave: 'dec-bruma-2',
    pais: 'bruma',
    metrica: 'tCO2e',
    anclaje: 'anc-alba-2',
    metodologia: 'factor-de-emision-nacional-2024',
    anios: [2028, 2029],
    cantidad: '400',
    destino: 'NDC',
  }, { now: T1 });

  assert.equal(solapado.estado, 'rechazada');
  assert.equal(solapado.codigo, 'anio-solapado');
  assert.deepEqual(solapado.evidencia.choques, [['anc-alba-2', 2028]]);
  assert.deepEqual(solapado.evidencia.limpio, [['anc-alba-2', 2029]], 'el motivo dice qué años no chocan, para que la entrada se pueda rehacer');
  assert.match(solapado.motivo, /2028/);
  assert.match(solapado.salida, /2029/, 'y la salida nombra el año que sí se puede declarar');
});

// 3. Doble conteo por transferencia internacional entre registros.
test('el segundo lado de una transferencia internacional se rechaza en vez de contarse dos veces', async () => {
  const m = taller(temporal());
  await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-3', anclaje: 'anc-alba-3', metrica: 'MWh-eq' }, { now: T0 });

  const segundoLado = await m.declarar({
    clave: 'dec-cenal-1',
    pais: 'cenal',
    metrica: 'MWh-eq',
    anclaje: 'anc-alba-3',
    metodologia: 'medicion-directa-de-red',
    anios: [2027],
    cantidad: '3000',
    destino: 'NDC',
    transferido_de: 'dec-alba-3',
  }, { now: T1 });

  assert.equal(segundoLado.estado, 'rechazada');
  assert.equal(segundoLado.codigo, 'transferencia-internacional');
  assert.match(segundoLado.motivo, /dec-alba-3/);
  assert.match(segundoLado.motivo, /ajuste/i, 'el motivo dice que es el segundo lado de un ajuste');
});

// 4. Metodología ausente.
test('una reducción sin metodología declarada no es comparable y se rechaza nombrando qué falta', async () => {
  const m = taller(temporal());
  const r = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-9', metodologia: '' }, { now: T0 });
  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'metodologia-ausente');
  assert.match(r.motivo, /metodolog/i);
  assert.ok(r.salida.length > 0, 'el rechazo nombra la salida');
});

// 5. Anclaje que no resuelve.
test('una reducción anclada a una actividad que el registro no tiene se rechaza por verificable, no por inválida', async () => {
  const m = taller(temporal());
  const r = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-8', anclaje: 'anc-que-no-existe' }, { now: T0 });
  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'anclaje-no-resuelve');
  assert.match(r.motivo, /anc-que-no-existe/);
});

test('una reducción que se apoya en un anclaje de otra métrica tampoco resuelve', async () => {
  const m = taller(temporal());
  // `anc-cenal-1` es MWh-eq y la declaración dice tCO2e: el anclaje existe y no
  // sirve para esta declaración. El código es el mismo y el motivo es distinto.
  const r = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-7', anclaje: 'anc-cenal-1' }, { now: T0 });
  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'anclaje-no-resuelve');
  assert.match(r.motivo, /MWh-eq/);
  assert.match(r.motivo, /tCO2e/);
});

// 6. Agregación que infla la cifra sin declararlo.
test('una declaración que suma un conjunto junto con sus propias partes se rechaza nombrando la actividad contada dos veces', async () => {
  const m = taller(temporal());
  const r = await m.declarar({
    clave: 'dec-alba-6',
    pais: 'alba',
    metrica: 'tCO2e',
    anclaje: 'anc-alba-4',
    metodologia: 'suma-de-subconjuntos-v1',
    anios: [2028],
    cantidad: '5000',
    destino: 'NDC',
    componentes: ['anc-alba-2', 'anc-alba-4'],
  }, { now: T0 });

  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'cifra-inflada');
  assert.equal(r.evidencia.repetidas.length, 1);
  assert.equal(r.evidencia.repetidas[0].anclaje, 'anc-alba-2');
  assert.ok(r.evidencia.repetidas[0].caminos.length >= 2, 'el motivo guarda los dos caminos por los que se contó');
  assert.match(r.motivo, /anc-alba-2/);
});

test('una agregación declarada una sola vez sí entra, con la cantidad declarada', async () => {
  const m = taller(temporal());
  const r = await m.declarar({
    clave: 'dec-alba-5',
    pais: 'alba',
    metrica: 'tCO2e',
    anclaje: 'anc-alba-4',
    metodologia: 'suma-de-subconjuntos-v1',
    anios: [2028],
    cantidad: '5000',
    destino: 'NDC',
    componentes: ['anc-alba-2', 'anc-alba-5'],
  }, { now: T0 });
  assert.equal(r.estado, 'aceptada', 'sumar un conjunto una vez es la operación normal, no una inflación');
  assert.deepEqual(r.evidencia.plano, ['anc-alba-2', 'anc-alba-5']);
  assert.deepEqual(r.ajuste.anclajes, ['anc-alba-2', 'anc-alba-5']);
});

// 7. Compromiso con el reloj vencido.
test('un compromiso con el reloj vencido se rechaza nombrando la hora en que murió', async () => {
  const m = taller(temporal());
  const r = await m.declarar({
    clave: 'dec-cenal-2',
    pais: 'cenal',
    metrica: 'tCO2e',
    anclaje: 'anc-cenal-2',
    metodologia: 'inventario-de-flota-v1',
    anios: [2027],
    cantidad: '2500',
    destino: 'NDC',
  }, { now: T0 });

  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'reloj-vencido');
  assert.match(r.motivo, /2026-01-15/);
});

test('pasada la hora, la autorización no revive sola: la misma declaración sigue rechazada', async () => {
  const m = taller(temporal());
  const spec = {
    clave: 'dec-cenal-3',
    pais: 'cenal',
    metrica: 'MWh-eq',
    anclaje: 'anc-cenal-1',
    metodologia: 'medicion-directa-de-red',
    anios: [2028],
    cantidad: '1000',
    destino: 'NDC',
  };
  const antes = await m.declarar(spec, { now: T0 });
  assert.equal(antes.estado, 'aceptada');
  const despues = await m.declarar({ ...spec, clave: 'dec-cenal-4' }, { now: '2027-06-01T00:00:00.000Z' });
  assert.equal(despues.estado, 'rechazada');
  assert.equal(despues.codigo, 'reloj-vencido');
});

// 8. Caso de control: dos países con unidades legítimamente distintas que DEBEN entrar ambos.
test('CONTROL: dos países en métricas legítimamente distintas entran ambos, y la clave de la partida no es el año', async () => {
  const m = taller(temporal());
  const enGas = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-c1', anclaje: 'anc-alba-2', cantidad: '1500' }, { now: T0 });
  const enNoGas = await m.declarar({
    clave: 'dec-cenal-c1',
    pais: 'cenal',
    metrica: 'MWh-eq',
    anclaje: 'anc-cenal-1',
    metodologia: 'medicion-directa-de-red',
    anios: [2027],
    cantidad: '2500',
    destino: 'NDC',
  }, { now: T1 });

  assert.equal(enGas.estado, 'aceptada', 'el de gases de efecto invernadero entra');
  assert.equal(enNoGas.estado, 'aceptada', 'el de métrica que no es gas entra: es otra pista de contabilidad, no la misma partida');
  assert.notEqual(enGas.ajuste.pista, enNoGas.ajuste.pista, 'las dos entradas viven en pistas distintas');
  assert.deepEqual(enGas.ajuste.anios, [2027]);
  assert.deepEqual(enNoGas.ajuste.anios, [2027], 'y el año es el mismo: si la clave fuera el año, esto no entraría');

  // La otra mitad: dos actividades distintas de la misma métrica en el mismo año
  // también entran. Si la clave fuera solo la actividad, esto sería un no.
  const otra = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-c2', anclaje: 'anc-alba-5', cantidad: '700' }, { now: T1 });
  assert.equal(otra.estado, 'aceptada', 'dos actividades distintas no son la misma línea');
  assert.equal(m.aceptadas().length, 3);
});

// 7 bis. El techo de la autorización.
test('una declaración que pasa el techo autorizado se rechaza nombrando lo que queda', async () => {
  const m = taller(temporal());
  const dentro = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-t1', anclaje: 'anc-alba-1', cantidad: '40000' }, { now: T0 });
  assert.equal(dentro.estado, 'aceptada', 'la primera entra: 40000 de 100000 autorizados');
  const sobre = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-t2', anclaje: 'anc-alba-2', anios: [2029], cantidad: '70000' }, { now: T0 });
  assert.equal(sobre.estado, 'rechazada');
  assert.equal(sobre.codigo, 'fuera-de-autorizacion');
  assert.match(sobre.motivo, /60000/, 'el motivo dice cuánto queda, no solo que no alcanza');
});

// 3 bis. Una transferencia que cita una entrada que fue rechazada.
test('una transferencia que cita un origen rechazado se rechaza por eso, no por doble conteo', async () => {
  const m = taller(temporal());
  // El origen se rechaza porque se apoya en un anclaje que no existe. Decir que
  // «ya fue reconocida» sería falso, y el motivo es justo lo que alguien lee para
  // rehacer la entrada.
  await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-sin', anclaje: 'anc-que-no-existe' }, { now: T0 });
  const r = await m.declarar({
    clave: 'dec-cenal-sin', pais: 'cenal', metrica: 'MWh-eq', anclaje: 'anc-cenal-1',
    metodologia: 'medicion-directa-de-red', anios: [2027], cantidad: '1000', destino: 'NDC',
    transferido_de: 'dec-alba-sin',
  }, { now: T1 });
  assert.equal(r.estado, 'rechazada');
  assert.equal(r.codigo, 'transferencia-internacional');
  assert.equal(r.evidencia.estado_origen, 'rechazada');
  assert.equal(r.evidencia.codigo_origen, 'anclaje-no-resuelve');
  assert.match(r.motivo, /no hay nada que transferir/);
  assert.doesNotMatch(r.motivo, /ya fue reconocida/, 'el motivo no afirma que entrara algo que no entró');
});

test('el rechazo también queda sellado por el núcleo, no solo por el registro', async () => {
  const m = taller(temporal());
  const r = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-rec', anclaje: 'anc-que-no-existe' }, { now: T0 });
  assert.equal(r.estado, 'rechazada');
  assert.ok(r.recibo, 'el núcleo también emitió un recibo para el rechazo');
  assert.equal(r.recibo.status, 'blocked');
  assert.equal(verifyReceipt(r.recibo).ok, true, 'y ese recibo también verifica con el digest canónico');
  const guardado = m.recibos().find((x) => x.clave === 'dec-alba-rec');
  assert.ok(guardado, 'y queda en el registro, al lado de la aceptación');
});

// Extras que el mismo acuerdo obliga.
test('el rechazo queda escrito en el mismo registro y en el mismo archivo que la aceptación', async () => {
  const dir = temporal();
  const m = taller(dir);
  await m.declarar(DEC_ALBA_1, { now: T0 });
  await m.declarar({
    clave: 'dec-bruma-1', pais: 'bruma', metrica: 'tCO2e', anclaje: 'anc-alba-1',
    metodologia: 'factor-de-emision-nacional-2024', anios: [2027], cantidad: '900', destino: 'NDC',
  }, { now: T1 });

  const crudo = fs.readFileSync(path.join(dir, 'registro.jsonl'), 'utf8').trim().split('\n').map((l) => JSON.parse(l));
  const aceptada = crudo.find((l) => l.tipo === 'efecto' && l.clave === 'dec-alba-1');
  const rechazada = crudo.find((l) => l.tipo === 'rechazo' && l.clave === 'dec-bruma-1');
  assert.ok(aceptada, 'la aceptación está en el archivo');
  assert.ok(rechazada, 'el rechazo está en el MISMO archivo');
  assert.equal(rechazada.codigo, 'unidad-compartida');
  assert.ok(rechazada.salida.length > 0, 'y trae la salida');
  assert.equal(aceptada.huella, undefined, 'el sello va en su propia línea, no en el efecto');
  assert.equal(crudo.find((l) => l.tipo === 'sello' && l.clave === 'dec-alba-1').digest.length, 64);
});

test('una entrada aceptada lleva un recibo que verifica, y editarlo a mano lo rompe', async () => {
  const m = taller(temporal());
  const r = await m.declarar(DEC_ALBA_1, { now: T0 });
  assert.equal(verifyReceipt(r.recibo).ok, true);
  const alterado = { ...r.recibo, detail: 'todo bien' };
  const veredicto = verifyReceipt(alterado);
  assert.equal(veredicto.ok, false);
  assert.equal(veredicto.reason, 'digest mismatch');
});

test('el reporte muestra, entrada por entrada, por qué cada una entró o no', async () => {
  const m = taller(temporal());
  await m.declarar(DEC_ALBA_1, { now: T0 });
  await m.declarar({
    clave: 'dec-bruma-1', pais: 'bruma', metrica: 'tCO2e', anclaje: 'anc-alba-1',
    metodologia: 'factor-de-emision-nacional-2024', anios: [2027], cantidad: '900', destino: 'NDC',
  }, { now: T1 });
  const reporte = m.reporte();
  assert.equal(reporte.length, 2);
  const rechazada = reporte.find((r) => r.clave === 'dec-bruma-1');
  assert.equal(rechazada.estado, 'rechazada');
  assert.equal(rechazada.codigo, 'unidad-compartida');
  assert.deepEqual(rechazada.evidencia.choques, [['anc-alba-1', 2027]]);
  assert.ok(reporte.find((r) => r.clave === 'dec-alba-1').ajuste, 'la aceptada trae su ajuste');
});

test('una tercera parte audita sin creer a nadie: un verificador que solo cree al ejecutor no pasa la auditoría', async () => {
  const m = taller(temporal());
  const creyente = { id: 'verificador-creyente', verificar: async () => ({ verified: true, checks: { me_lo_creo: true }, reason: 'me lo creo' }) };
  const r = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-11' }, { now: T0, verificador: creyente });
  assert.equal(r.estado, 'aceptada', 'el ejecutor dice que aceptó');
  const auditoria = m.auditar(r.recibo);
  assert.equal(auditoria.ok, false, 'y la auditoría independiente lo rechaza');
  assert.match(auditoria.motivo, /creyó al ejecutor|independiente/);
});

test('la auditoría de una entrada rechazada también pasa, y la de un recibo ajeno no', async () => {
  const m = taller(temporal());
  const rechazada = await m.declarar({ ...DEC_ALBA_1, clave: 'dec-alba-10', anclaje: 'anc-que-no-existe' }, { now: T0 });
  assert.equal(rechazada.estado, 'rechazada');
  const a = m.auditar(rechazada);
  assert.equal(a.ok, true, 'una entrada rechazada bien rechazada también es auditable');
  assert.equal(m.auditar({ digest: 'x', evidence: {}, coverage: [] }).ok, false);
});

// La independencia del verificador, probada de verdad.
//
// Mientras el verificador solo mire lo que la puerta ya aprobó, sus
// comprobaciones repiten la puerta y no pueden dar un veredicto distinto. La
// única forma de que la palabra «independiente» sea cierta es que el verificador
// juzgue un efecto que la puerta NO juzgó: aquí se escriben a mano dos entradas
// que la puerta habría rechazado, y el verificador tiene que rechazarlas él solo.
test('el verificador rechaza un doble conteo que la puerta no vio, porque no confía en ella', async () => {
  const m = taller(temporal());
  await m.declarar(DEC_ALBA_1, { now: T0 });

  // Se escribe a mano el mismo hecho dos veces, saltándose la puerta.
  const cuerpo = {
    clave: 'dec-colado', pais: 'bruma', metrica: 'tCO2e', pista: 'tCO2e', parrafo: '8',
    anclaje: 'anc-alba-1', plano: [{ anclaje: 'anc-alba-1', metrica: 'tCO2e' }],
    metodologia: 'factor-de-emision-nacional-2024', anios: [2027], cantidad: '900',
    destino: 'NDC', transferido_de: null, en: T0,
  };
  m.escribir({ tipo: 'efecto', clave: 'dec-colado', autorizacion: 'aut-bruma-ghg', cuerpo });

  const veredicto = await m.verificar({ operationId: 'dec-colado' });
  assert.equal(veredicto.verified, false, 'el verificador ve el choque que la puerta dejó pasar');
  assert.equal(veredicto.checks['sin-doble-conteo'], false, 'y lo ve sin que nadie le diga cuál es el choque');
  assert.equal(veredicto.checks['anclaje-resuelve'], true, 'las otras comprobaciones se siguen Midiendo: el verificador no dice que no por todo');
});

test('el verificador rechaza un efecto cuyo ajuste se atribuyó al párrafo equivocado de la guía', async () => {
  const m = taller(temporal());
  // Un efecto en la pista de métrica que no es gas (que va por el §9 de la guía)
  // que dice haber usado el §8. La puerta nunca lobbea, así que solo el
  // verificador independiente lo puede ver.
  const cuerpo = {
    clave: 'dec-parrafo', pais: 'cenal', metrica: 'MWh-eq', pista: 'MWh-eq', parrafo: '8',
    anclaje: 'anc-cenal-1', plano: [{ anclaje: 'anc-cenal-1', metrica: 'MWh-eq' }],
    metodologia: 'medicion-directa-de-red', anios: [2030], cantidad: '500',
    destino: 'NDC', transferido_de: null, en: T0,
  };
  m.escribir({ tipo: 'efecto', clave: 'dec-parrafo', autorizacion: 'aut-cenal-nonghg', cuerpo });

  const veredicto = await m.verificar({ operationId: 'dec-parrafo' });
  assert.equal(veredicto.verified, false);
  assert.equal(veredicto.checks['ajuste-en-pista'], false, 'el §8 es para gases de efecto invernadero y este efecto no lo es');
});
