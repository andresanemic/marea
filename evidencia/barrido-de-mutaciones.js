'use strict';

// Barrido de mutaciones: cada regla del detector se rompe a propósito y se
// comprueba que la suite la note. Una regla que se puede quitar sin que nada se
// ponga rojo no es una regla, es una decoracion.
//
// Uso: node --test "test/*.test.js"  con este archivo NO hace falta; se corre
// aparte, desde la terminal, con `node evidencia/barrido-de-mutaciones.js`.
// El archivo restaura el original al terminar, incluso si una mutacion se rompe.

const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');

const RAIZ = path.join(__dirname, '..');
const OBJETIVO = path.join(RAIZ, 'src', 'marea.js');
const original = fs.readFileSync(OBJETIVO, 'utf8');

// Cada mutacion es un reemplazo exacto. Si no aplica, la mutacion esta mal
// escrita y eso se dice, en vez de contarlo como un fallo del detector.
const MUTACIONES = [
  ['la clave de colision pierde el anio', "mapa.get(`${par[0]}|${par[1]}`)", 'mapa.get(`${par[0]}`)'],
  ['la clave de colision pierde la actividad', "mapa.get(`${par[0]}|${par[1]}`)", 'mapa.get(`${par[1]}`)'],
  ['la puerta acepta cualquier metodologia', 'if (!texto(spec.metodologia)) {', 'if (false) {'],
  ['la puerta acepta los anos que no son', 'const anios = aniosDe(spec.anios);', 'const anios = [2027];'],
  ['la puerta no mira el reloj de la autorizacion', 'expiresAt: aut.vence', 'expiresAt: "2099-01-01T00:00:00.000Z"'],
  ['la puerta no mira el techo de la autorizacion', 'maxAmount: String(restante < 0n ? 0n : restante)', 'maxAmount: "999999999"'],
  ['la puerta no detecta la cifra inflada', 'if (repetidas.length > 0) {', 'if (false) {'],
  ['la puerta no exige que el anclaje sea de la misma metrica', 'if (ancla.metrica !== spec.metrica) {', 'if (false) {'],
  ['la puerta no ve la transferencia internacional', 'if (texto(spec.transferido_de)) {', 'if (false) {'],
  ['la puerta no distingue un origen rechazado de uno reconocido', 'if (origen && origen.estado === \'aceptada\') {', 'if (origen) {'],
  ['el verificador cree al ejecutor en el doble conteo', 'return reclamos.some((previo) => previo.clave !== clave);', 'return false;'],
  ['el verificador cree que toda pista es contable', "'ajuste-en-pista': !!PISTAS[cuerpo.pista] && PISTAS[cuerpo.pista].parrafo === cuerpo.parrafo,", "'ajuste-en-pista': true,"],
];

const correr = () => {
  try {
    return cp.execSync('node --test --test-reporter=tap "test/*.test.js"', { cwd: RAIZ, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (err) {
    return `${err.stdout || ''}${err.stderr || ''}`;
  }
};

let sinDetectar = 0;
for (const [nombre, de, a] of MUTACIONES) {
  if (!original.includes(de)) {
    process.stdout.write(`MUTACION MAL ESCRITA (no aplica) : ${nombre}\n`);
    sinDetectar += 1;
    continue;
  }
  fs.writeFileSync(OBJETIVO, original.replace(de, a), 'utf8');
  const salida = correr();
  const rojos = (salida.match(/^not ok/gm) || []).length;
  if (rojos > 0) {
    process.stdout.write(`DETECTADO   (${String(rojos).padStart(2)} rojos): ${nombre}\n`);
  } else {
    process.stdout.write(`NO DETECTADO          : ${nombre}\n`);
    sinDetectar += 1;
  }
}
fs.writeFileSync(OBJETIVO, original, 'utf8');

const base = correr();
process.stdout.write(`\nbaseline restaurado: ${(base.match(/^# pass (\d+)/m) || [])[1]} pass, ${(base.match(/^# fail (\d+)/m) || [])[1]} fail\n`);
process.stdout.write(sinDetectar === 0 ? 'todas las reglas cargan peso\n' : `${sinDetectar} regla(s) sin peso: la suite no las distingue\n`);
process.exitCode = sinDetectar === 0 ? 0 : 1;
