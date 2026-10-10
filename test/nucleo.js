'use strict';

// Dónde está el núcleo y cómo se comprueba que es el corte.
//
// Un solo módulo responde las dos preguntas, para que la suite y el código que
// se está probando no puedan discrepar sobre qué núcleo están mirando. Vive en
// `test/` y no se llama `*.test.js`, así que `node --test` no lo corre como
// prueba: es el andamiaje del que las pruebas crecen.
//
// Marea consume la copia vendorizada en `vendor/vespi-kernel`, no el árbol de
// desarrollo ni la copia instalada en los hosts. La razón es medida, no de
// estilo: el árbol `founder/proyectos/vespi/kernel/src/` tiene trabajo sin
// commitear y sus huellas ya no coinciden con las que el kit declara, y las
// rutas de los hosts (`~/.claude`, `~/.codex`, `~/.config`) no existen en un
// clon limpio. La copia vendorizada sí coincide, y se verifica contra su propio
// `SOURCE.md` sin leer nada fuera de esta carpeta.
//
// La tabla de digest se **lee del `SOURCE.md` de esa copia vendorizada**, en vez
// de estar escrita a mano. Una constante escrita a mano puede envejecer callada
// junto al cambio; una que se lee del kit solo puede envejecer si el kit cambia,
// que es exactamente lo que se quiere detectar.
//
// Cuando el kernel publique un corte distinto, la suite se pondrá roja a
// propósito. Es el control funcionando, no una regresión, y reevaluar la huella
// es decisión de Andrés.

// Kernel 0.1.5 declara diez módulos; la lista y la prueba de procedencia cubren los diez.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// La copia vendorizada en esta carpeta: la única que el proyecto consume y la
// única que las pruebas verifican. Se guarda en una lista de un elemento para
// que `kernel.test.js` siga recorriendo copias sin leer fuera de aquí.
const KERNEL = path.join(__dirname, '..', 'vendor', 'vespi-kernel');
const COPIAS = [['vendorizada', KERNEL]];

const MODULOS = ['authority.js', 'continuity.js', 'delegation.js', 'emergency.js', 'operation.js', 'receipt.js', 'skill-provenance.js', 'time.js', 'x402.js', 'zk.js'];

// Cada archivo del núcleo es un encabezado de procedencia de tres líneas seguido
// de los bytes exactos de la fuente. El cuerpo es lo que se hashea.
function cuerpo(archivo) {
  const crudo = fs.readFileSync(archivo);
  let inicio = 0;
  for (let i = 0; i < 3; i += 1) {
    const salto = crudo.indexOf(10, inicio);
    if (salto < 0) throw new Error(`${archivo}: el encabezado de procedencia no tiene tres líneas`);
    inicio = salto + 1;
  }
  return crudo.slice(inicio);
}

function sha(archivo) {
  return createHash('sha256').update(cuerpo(archivo)).digest('hex');
}

// La tabla del `SOURCE.md` instalado, leída y no escrita a mano.
function declaracionDelKit(dir) {
  const md = fs.readFileSync(path.join(dir, 'SOURCE.md'), 'utf8');
  const tabla = new Map();
  for (const linea of md.split('\n')) {
    const m = linea.match(/^\|\s*`([^\x60]+\.js)`\s*\|\s*`([0-9a-f]{64})`\s*\|\s*(\d+)\s*\|/);
    if (m) tabla.set(m[1], { sha256: m[2], bytes: Number(m[3]) });
  }
  return tabla;
}

module.exports = { COPIAS, KERNEL, MODULOS, cuerpo, sha, declaracionDelKit };
