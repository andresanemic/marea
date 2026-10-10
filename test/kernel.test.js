'use strict';

// El corte del núcleo, verificado por bytes contra lo que declara el kit.
// Las comparaciones viven en `nucleo.js`; aquí solo se afirma.

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { KERNEL, MODULOS, cuerpo, sha, declaracionDelKit, COPIAS } = require('./nucleo.js');

test('la copia vendorizada declara los diez módulos del núcleo', () => {
  // 0.1.5 declara diez módulos, incluidos nombres con guion y dígitos.
  const tabla = declaracionDelKit(KERNEL);
  assert.equal(tabla.size, 10, `el SOURCE.md instalado declara ${tabla.size} módulos y se esperaban 10`);
  for (const nombre of MODULOS) {
    assert.ok(tabla.has(nombre), `el SOURCE.md instalado no declara ${nombre}`);
  }
});

test('el núcleo que consume Marea es el corte fijado, módulo por módulo', () => {
  const tabla = declaracionDelKit(KERNEL);
  for (const [archivo, declarado] of tabla) {
    const bytes = cuerpo(path.join(KERNEL, archivo));
    assert.equal(sha(path.join(KERNEL, archivo)), declarado.sha256, `${archivo}: la copia instalada no calza con lo que el kit declara; el corte se movió y hay que repintarlo a mano antes de seguir`);
    assert.equal(bytes.length, declarado.bytes, `${archivo}: el cuerpo tiene ${bytes.length} bytes y el kit declara ${declarado.bytes}`);
  }
});

// 0.1.5: COPIAS ya no apunta a los hosts sino a la copia vendorizada
// (`test/nucleo.js`); el recorrido verifica esa copia, sin leer fuera de la carpeta.
test('la copia vendorizada coincide con su SOURCE.md, byte a byte', () => {
  const presentes = COPIAS.filter(([, dir]) => fs.existsSync(path.join(dir, 'SOURCE.md')));
  assert.ok(presentes.length >= 1, 'no hay copia vendorizada del núcleo en vendor/vespi-kernel');
  for (const modulo of MODULOS) {
    const huellas = new Map();
    for (const [host, dir] of presentes) {
      huellas.set(host, sha(path.join(dir, modulo)));
    }
    const unicas = new Set(huellas.values());
    assert.equal(unicas.size, 1, `${modulo}: las copias verificadas no coinciden — ${[...huellas].map(([h, d]) => `${h}=${d.slice(0, 12)}`).join(' ')}`);
  }
});

test('el encabezado de los diez módulos declara el mismo commit', () => {
  // 0.1.5: diez módulos y el commit fijado es
  // ed559e83c976dd6e6a379a5510db776206f670b4, el del corte 0.1.5.
  const commits = new Set();
  for (const modulo of MODULOS) {
    const lineas = fs.readFileSync(path.join(KERNEL, modulo), 'utf8').split('\n').slice(0, 3).join(' ');
    const encontrado = lineas.match(/commit ([0-9a-f]{7,40})/);
    assert.ok(encontrado, `${modulo}: el encabezado no declara un commit`);
    commits.add(encontrado[1].slice(0, 7));
  }
  assert.equal(commits.size, 1, `los diez módulos no apuntan al mismo commit: ${[...commits].join(', ')}`);
  assert.equal([...commits][0], 'ed559e8', 'el commit del encabezado no es el corte 0.1.5 fijado');
});
