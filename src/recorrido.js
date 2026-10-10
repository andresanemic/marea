'use strict';

// El recorrido de Marea, de la persona que inscribe el anclaje a la tercera parte
// que audita el rechazo. Cada línea sale de una ejecución real: no hay dato
// maquetado ni hash inventado. Los países son de fantasía, las metodologías y las
// cifras también, y no se reclama ningún permiso de nadie.
//
// El recorrido termina con lo que este proyecto NO demuestra. Esa pantalla no es
// un pie de página: es la cuarta declaración del encargo, la que impide que un
// ejemplo se lea como un resultado externo.

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Marea, PISTAS } = require('./marea.js');
const { KERNEL } = require('../test/nucleo.js');
const { verifyReceipt } = require(`${KERNEL}/receipt.js`);

const T0 = '2026-09-29T12:00:00.000Z';
const T1 = '2026-09-29T15:00:00.000Z';
const T2 = '2027-06-01T00:00:00.000Z';

function linea(t = '') { process.stdout.write(`${t}\n`); }
function titulo(t) { linea(`\n── ${t}`); }
function ver(r) {
  linea(`  estado:   ${r.estado}${r.codigo ? ` (${r.codigo})` : ''}`);
  linea(`  motivo:   ${r.motivo}`);
  if (r.evidencia && Object.keys(r.evidencia).length > 0) linea(`  evidencia: ${JSON.stringify(r.evidencia)}`);
  if (r.ajuste) linea(`  ajuste:   lado ${r.ajuste.lado}, pista ${r.ajuste.pista} (guía 2/CMA.3 §${r.ajuste.parrafo}), años ${r.ajuste.anios.join(', ')}, anclas ${r.ajuste.anclajes.join(', ')}`);
  if (r.salida) linea(`  salida:   ${r.salida}`);
  if (r.digest) linea(`  sello:    ${r.digest.slice(0, 16)}…`);
}

async function main() {
  const dir = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'marea-recorrido-'));
  const m = new Marea({ dir });
  linea('Marea — recorrido completo. Registro en: ' + path.join(dir, 'registro.jsonl'));
  linea('Países, metodologías, unidades y cifras son de EJEMPLO. Sin red, sin blockchain, sin pagos, sin un tercero.');

  titulo('1. La persona inscribe las actividades de origen');
  for (const a of [
    { id: 'anc-alba-1', pais: 'alba', metrica: 'tCO2e', actividad: 'bosque de la cuenca alta' },
    { id: 'anc-alba-2', pais: 'alba', metrica: 'tCO2e', actividad: 'cambio de combustible de un hospital' },
    { id: 'anc-alba-3', pais: 'alba', metrica: 'MWh-eq', actividad: 'bombeo electrificado' },
    { id: 'anc-cenal-1', pais: 'cenal', metrica: 'MWh-eq', actividad: 'riego solar' },
  ]) {
    m.anclar({ ...a, actuator: 'irene' });
  }
  for (const a of m.anclas()) linea(`  ${a.id}  ${a.pais}  ${a.metrica.padEnd(7)} ${a.actividad}`);
  linea(`  pistas de contabilidad: ${Object.entries(PISTAS).map(([k, v]) => `${k} → §${v.parrafo}`).join(', ')}`);

  titulo('2. La persona autoriza los compromisos, con su reloj y su techo');
  for (const p of [
    { actuator: 'irene', id: 'aut-alba-ghg', pais: 'alba', metrica: 'tCO2e', destino: 'NDC', cantidad: '100000', vence: '2026-12-01T00:00:00.000Z' },
    { actuator: 'irene', id: 'aut-alba-nonghg', pais: 'alba', metrica: 'MWh-eq', destino: 'NDC', cantidad: '8000', vence: '2026-12-01T00:00:00.000Z' },
    { actuator: 'joel', id: 'aut-bruma-ghg', pais: 'bruma', metrica: 'tCO2e', destino: 'NDC', cantidad: '50000', vence: '2026-12-01T00:00:00.000Z' },
    { actuator: 'irene', id: 'aut-cenal-nonghg', pais: 'cenal', metrica: 'MWh-eq', destino: 'NDC', cantidad: '6000', vence: '2026-12-01T00:00:00.000Z' },
  ]) m.autorizar(p);
  for (const a of m.autoridades()) linea(`  ${a.id}  ${a.pais}  hasta ${a.cantidad} ${a.metrica} hacia ${a.destino}, vence ${a.vence}, otorgada por ${a.otorgada_por}`);

  titulo('3. Alba declara una reducción con su metodología y su unidad: entra');
  const deAlba = {
    clave: 'dec-alba-1', pais: 'alba', metrica: 'tCO2e', anclaje: 'anc-alba-1',
    metodologia: 'inventario-de-gas-planta-v3', anios: [2027], cantidad: '1200', destino: 'NDC',
  };
  const uno = await m.declarar(deAlba, { now: T0 });
  ver(uno);
  linea(`  recibo:   ${uno.recibo.status} · cobertura ${uno.recibo.coverage.join(', ')}`);
  linea(`  anclaje:  ${uno.recibo.anchor.status} en ${uno.recibo.anchor.network} — nada llegó a una red; esto NO está verificado afuera`);

  titulo('4. Bruma declara reutilizando la misma unidad sobre el mismo hecho: se rechaza');
  const deBruma = {
    clave: 'dec-bruma-1', pais: 'bruma', metrica: 'tCO2e', anclaje: 'anc-alba-1',
    metodologia: 'factor-de-emision-nacional-2024', anios: [2027], cantidad: '900', destino: 'NDC',
  };
  const dos = await m.declarar(deBruma, { now: T1 });
  ver(dos);

  titulo('5. Con unidades legítimamente distintas, las dos entradas entran');
  const enGas = await m.declarar({
    clave: 'dec-cenal-1', pais: 'cenal', metrica: 'MWh-eq', anclaje: 'anc-cenal-1',
    metodologia: 'medicion-directa-de-red', anios: [2027], cantidad: '2500', destino: 'NDC',
  }, { now: T1 });
  ver(enGas);
  linea('  dos actividades distintas, en dos pistas distintas, en el mismo año 2027: las dos entran.');
  linea('  Si la clave de la partida fuera el año, la segunda no entraría — y eso sería un no automático.');
  const otraActividad = await m.declarar({
    ...deAlba, clave: 'dec-alba-2', anclaje: 'anc-alba-2', cantidad: '1500',
  }, { now: T1 });
  ver(otraActividad);
  linea('  dos actividades distintas en la misma métrica y el mismo año también entran: el par es (actividad, año), no el año solo.');

  titulo('6. Los otros rechazos, cada uno con su motivo');
  // La transferencia internacional necesita su origen en el registro primero: el
  // registro no juzga una copia de un hecho que todavía no existe.
  await m.declarar({ ...deAlba, clave: 'dec-alba-3', anclaje: 'anc-alba-3', metrica: 'MWh-eq', cantidad: '3000' }, { now: T0 });
  const rechazos = [
    { t: 'sin metodología', spec: { ...deAlba, clave: 'dec-alba-x1', anclaje: 'anc-alba-3', metrica: 'MWh-eq', metodologia: '' } },
    { t: 'anclaje que no resuelve', spec: { ...deAlba, clave: 'dec-alba-x2', anclaje: 'anc-que-no-existe' } },
    { t: 'anclaje de otra métrica', spec: { ...deAlba, clave: 'dec-alba-x3', anclaje: 'anc-cenal-1' } },
    { t: 'transferencia internacional entre registros', spec: { clave: 'dec-cenal-x4', pais: 'cenal', metrica: 'MWh-eq', anclaje: 'anc-alba-3', metodologia: 'medicion-directa-de-red', anios: [2028], cantidad: '3000', destino: 'NDC', transferido_de: 'dec-alba-3' } },
  ];
  for (const { t, spec } of rechazos) {
    const r = await m.declarar(spec, { now: T1 });
    linea(`\n  ${t}`);
    linea(`    ${r.estado} (${r.codigo}): ${r.motivo}`);
  }
  linea('\n  el segundo lado de una transferencia, sin ajuste, también es doble conteo: este proyecto');
  linea('  rechaza en vez de llevar la contabilidad del §8, y lo dice en el motivo.');

  titulo('7. El compromiso con el reloj vencido, y el techo que ya se gastó');
  const vencido = await m.declarar({
    clave: 'dec-cenal-5', pais: 'cenal', metrica: 'MWh-eq', anclaje: 'anc-cenal-1',
    metodologia: 'medicion-directa-de-red', anios: [2031], cantidad: '1000', destino: 'NDC',
  }, { now: T2 });
  ver(vencido);
  linea('  la misma autorización, dos años más tarde, sin que nadie la cerrara: sigue rechazada.');

  titulo('8. El reporte: qué entró, qué no, y por qué');
  for (const r of m.reporte()) {
    linea(`\n  ${r.clave.padEnd(16)} ${r.estado}${r.codigo ? ` (${r.codigo})` : ''}`);
    linea(`    ${r.motivo}`);
    if (r.salida) linea(`    salida: ${r.salida}`);
    linea(`    sello: ${r.selloVerifica ? 'verifica' : 'NO verifica'} · recibo: ${r.recibo || 'sin recibo'}`);
  }

  titulo('9. La tercera parte audita sin creer a nadie');
  for (const e of m.entradas()) {
    const conSello = { ...e, digest: (m.sellos().find((s) => s.clave === e.clave) || {}).digest };
    const a = m.auditar(conSello);
    linea(`  ${e.clave.padEnd(16)} ${a.ok ? 'auditoría pasa' : 'auditoría NO pasa'} — ${a.motivo}`);
  }
  const creyente = { id: 'verificador-creyente', verificar: async () => ({ verified: true, checks: { me_lo_creo: true }, reason: 'me lo creo' }) };
  const conCreyente = await m.declarar({ ...deAlba, clave: 'dec-alba-99', anclaje: 'anc-alba-2', anios: [2032] }, { now: T1, verificador: creyente });
  const aCreyente = m.auditar(conCreyente.recibo);
  linea('\n  dec-alba-99, declarado con un verificador que solo cree al ejecutor:');
  linea(`    el ejecutor dice ${conCreyente.estado} · la auditoría dice ${aCreyente.ok ? 'pasa' : 'NO pasa'} — ${aCreyente.motivo}`);

  titulo('10. El registro es un archivo que cualquiera puede abrir, sin Marea y sin el núcleo');
  const crudo = fs.readFileSync(path.join(dir, 'registro.jsonl'), 'utf8').trim().split('\n');
  const porTipo = crudo.reduce((acc, l) => { const t = JSON.parse(l).tipo; acc[t] = (acc[t] || 0) + 1; return acc; }, {});
  linea(`  ${path.join(dir, 'registro.jsonl')}: ${crudo.length} líneas — ${Object.entries(porTipo).map(([t, n]) => `${t} ${n}`).join(', ')}`);
  linea('  aceptadas y rechazadas están en el mismo archivo, con la misma forma de línea.');
  const conRechazo = m.entradas().find((e) => e.estado === 'rechazada');
  linea(`  ejemplo de rechazo, tal como está en el archivo:`);
  linea(`    ${conRechazo.clave} ${conRechazo.estado} (${conRechazo.codigo}) — ${conRechazo.motivo}`);
  linea(`    salida: ${conRechazo.salida}`);

  titulo('11. Lo que este recorrido NO demuestra');
  linea('  - El cumplimiento del Acuerdo de París NO está demostrado y NO se afirma.');
  linea('    Lo que se demuestra es el mecanismo de detección de doble conteo.');
  linea('  - El artículo 6.2 y la decisión 2/CMA.3, anexo, §7-§8 se leyeron en fuente primaria');
  linea('    el 2026-09-29 y de ellos se imita SOLO la estructura del ajuste: que el par');
  linea('    suma/resta es un hecho único. El comportamiento implementado NO se contrastó');
  linea('    contra el texto de la norma, así que la afirmación es NO VERIFICADO.');
  linea('  - El proyecto NO lleva la contabilidad del §8: no calcula emisiones, no lleva');
  linea('    inventarios, ni trayectoria indicativa, ni promedio, ni revisión técnica de');
  linea('    expertos, ni la plataforma centralizada, ni el registro internacional. Por eso');
  linea('    la transferencia internacional entre registros se rechaza en vez de ajustarse.');
  linea('  - No hay hash en testnet ni recibo en explorador: el anclaje quedó en `pending` a');
  linea('    propósito, y esa línea dice que eso no se verificó afuera.');
  linea('  - No hay adopción, ni permiso, ni ancla verificada de ningún Estado, ni de la CMNUCC.');
  linea('  - Los países, las metodologías, las unidades y las cifras son de ejemplo.');
  linea('  - No es un producto terminado: es un recorrido vertical con sus pruebas a la vista.');
  linea('');
  return dir;
}

if (require.main === module) {
  main().then((dir) => { process.stdout.write(`registro: ${path.join(dir, 'registro.jsonl')}\n`); });
}

module.exports = { main };
