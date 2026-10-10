'use strict';

// La interfaz de Marea: una terminal que una persona opera sin saber nada del
// núcleo. Cada comando dice qué hizo, con qué autorización y qué puede hacer
// después. El rechazo también dice qué hacer, porque un rechazo sin salida es un
// callejón.

const fs = require('node:fs');
const path = require('node:path');
const { Marea } = require('./marea.js');

const AYUDA = `marea — verificación de compromisos climáticos entre países

  marea <comando> [--clave valor ...] [--registro <carpeta>]

  ancla     --id --pais --metrica --actividad [--componentes a,b] [--por quien]
  autorizar --id --pais --metrica --destino --cantidad --vence --por
  declarar  --clave --pais --metrica --anclaje --metodologia --anios 2027,2028
            --cantidad --destino [--componentes a,b] [--transferido-de clave] [--ahora fecha]
  reporte
  auditar   --clave
  anclas
  autoridades
  entradas
  registro

Métricas y países son de EJEMPLO. Sin red, sin blockchain, sin pagos, sin un tercero.
Demuestra el mecanismo de detección de doble conteo; no demuestra que nadie cumpla
el Acuerdo de París.`;

function flags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith('--')) {
      out[key] = true;
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
}

function lista(valor) {
  if (valor === undefined || valor === true) return [];
  return String(valor).split(',').map((s) => s.trim()).filter(Boolean);
}

function linea(texto = '') {
  process.stdout.write(`${texto}\n`);
}

function mostrar(r) {
  linea(`  estado:   ${r.estado}${r.codigo ? ` (${r.codigo})` : ''}`);
  if (r.motivo) linea(`  motivo:   ${r.motivo}`);
  if (r.evidencia && Object.keys(r.evidencia).length > 0) linea(`  evidencia: ${JSON.stringify(r.evidencia)}`);
  if (r.ajuste) linea(`  ajuste:   lado ${r.ajuste.lado}, pista ${r.ajuste.pista} (guía 2/CMA.3 §${r.ajuste.parrafo}), años ${r.ajuste.anios.join(', ')}, anclas ${r.ajuste.anclajes.join(', ')}`);
  if (r.salida) linea(`  salida:   ${r.salida}`);
  if (r.digest) linea(`  sello:    ${r.digest.slice(0, 16)}…`);
  if (r.recibo) linea(`  recibo:   ${r.recibo.status} · anclaje ${r.recibo.anchor && r.recibo.anchor.status} — nada llegó a una red; esta línea dice que eso NO se verificó afuera`);
  if (r.recibo && r.recibo.coverage) linea(`  cobertura: ${r.recibo.coverage.join(', ')}`);
}

async function main(argv) {
  const [comando, ...resto] = argv;
  const f = flags(resto);
  const dir = f.registro || path.join(__dirname, '..', 'datos');
  const m = new Marea({ dir });

  if (!comando || f.ayuda) {
    linea(AYUDA);
    return 0;
  }

  if (comando === 'ancla') {
    const a = m.anclar({
      id: f.id,
      pais: f.pais,
      metrica: f.metrica,
      actividad: f.actividad,
      componentes: lista(f.componentes),
      actuator: f.por,
    });
    linea(`anclaje ${a.id}: ${a.actividad} — ${a.pais}, métrica ${a.metrica}${a.componentes.length > 0 ? `, agrupa ${a.componentes.join(' + ')}` : ''}, inscrito por ${a.inscrito_por}`);
    return 0;
  }

  if (comando === 'autorizar') {
    const p = m.autorizar({
      actuator: f.por,
      id: f.id,
      pais: f.pais,
      metrica: f.metrica,
      destino: f.destino,
      cantidad: f.cantidad,
      vence: f.vence,
    });
    linea(`autorización ${p.id}: ${p.pais} puede declarar hasta ${p.cantidad} ${p.metrica} hacia ${p.destino}, hasta ${p.vence}, otorgada por ${p.otorgada_por}`);
    return 0;
  }

  if (comando === 'declarar') {
    const r = await m.declarar({
      clave: f.clave,
      pais: f.pais,
      metrica: f.metrica,
      anclaje: f.anclaje,
      metodologia: f.metodologia === true ? '' : f.metodologia,
      anios: lista(f.anios).map(Number),
      cantidad: f.cantidad,
      destino: f.destino,
      componentes: lista(f.componentes),
      transferido_de: f['transferido-de'],
    }, { now: f.ahora });
    linea(`declaración «${f.clave}» de ${f.pais}: ${f.cantidad} ${f.metrica} hacia ${f.destino}, anclada en ${f.anclaje}, años ${f.anios}`);
    mostrar(r);
    return r.estado === 'aceptada' ? 0 : 1;
  }

  if (comando === 'reporte') {
    for (const r of m.reporte()) {
      linea(`\n${r.clave}  ${r.estado}${r.codigo ? ` (${r.codigo})` : ''}`);
      linea(`  motivo:    ${r.motivo}`);
      if (r.ajuste) linea(`  ajuste:    lado ${r.ajuste.lado} en la pista ${r.ajuste.pista} (guía 2/CMA.3 §${r.ajuste.parrafo}), años ${r.ajuste.anios.join(', ')}`);
      if (r.salida) linea(`  salida:    ${r.salida}`);
      linea(`  sello:     ${r.selloVerifica ? 'verifica' : 'NO verifica'} (${String(r.digest).slice(0, 16)}…)  recibo: ${r.recibo || 'sin recibo'}`);
    }
    return 0;
  }

  if (comando === 'auditar') {
    const entrada = m.entradas().find((e) => e.clave === f.clave);
    if (!entrada) {
      linea(`no hay ninguna entrada con la clave ${String(f.clave)}`);
      return 1;
    }
    const conSello = { ...entrada, digest: (m.sellos().find((s) => s.clave === f.clave) || {}).digest };
    const a = m.auditar(conSello);
    linea(`${f.clave}: auditoría independiente ${a.ok ? 'pasa' : 'NO pasa'}`);
    linea(`  ${a.motivo}`);
    if (a.checks) linea(`  comprobaciones: ${a.checks.join(', ')}`);
    return a.ok ? 0 : 1;
  }

  if (comando === 'anclas') {
    for (const a of m.anclas()) linea(`${a.id}  ${a.pais}  ${a.metrica}  ${a.actividad}${a.componentes.length > 0 ? `  = ${a.componentes.join(' + ')}` : ''}`);
    return 0;
  }

  if (comando === 'autoridades') {
    for (const a of m.autoridades()) linea(`${a.id}  ${a.pais}  ${a.metrica} → ${a.destino}  hasta ${a.cantidad}u  vence ${a.vence}  por ${a.otorgada_por}`);
    return 0;
  }

  if (comando === 'entradas') {
    for (const e of m.entradas()) linea(`${e.clave}  ${e.estado}${e.codigo ? ` (${e.codigo})` : ''}  ${e.motivo}`);
    return 0;
  }

  if (comando === 'registro') {
    linea(fs.readFileSync(path.join(dir, 'registro.jsonl'), 'utf8').trim());
    return 0;
  }

  linea(`comando desconocido: ${comando}`);
  linea(AYUDA);
  return 2;
}

module.exports = { main, AYUDA };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
