'use strict';

// Marea — proyecto 9 de los diez de Vespi: la verificación de compromisos
// climáticos entre países.
//
// Este archivo es la carrocería; el núcleo ejecutable es el kernel de Vespi, que
// este proyecto consume sin modificar. La puerta, la verificación separada y el
// recibo sellado son del núcleo. Lo que el núcleo no puede expresar y este
// proyecto agrega son las cinco dimensiones de una declaración —país, métrica,
// anclaje de origen, años y destino—, la aplanación que impide que una agregación
// se cuente dos veces, y el texto humano del rechazo con su salida.
//
// ── El ancla, y qué parte se está imitando ────────────────────────────────────
//
// Acuerdo de París, artículo 6, párrafo 2, leído en fuente primaria el 2026-09-29
// en el anexo de la Decisión 1/CP.21 (`FCCC/CP/2015/10/Add.1`, p. 9): «... shall
// apply robust accounting to ensure, *inter alia*, the avoidance of double
// counting, consistent with guidance adopted by the Conference of the Parties
// serving as the meeting of the Parties to this Agreement.» El proyecto cita esto
// y **no** demuestra cumplimiento: lo que implementa es la regla que la guía
// convierte en mecánica.
//
// Decisión 2/CMA.3, anexo, §7-§8, versión adoptada (`FCCC/PA/CMA/2021/10/Add.1`,
// 8 de marzo de 2022, pp. 16-17): §7 obliga a aplicar ajustes correspondientes que
// aseguren transparencia, exactitud, completitud, comparabilidad y consistencia,
// y que la participación en enfoques cooperativos no produzca un aumento neto de
// emisiones. §8 dice cómo, para una NDC medida en t CO2 eq: **(a)** sumar la
// cantidad de resultados de mitigación autorizados y transferidos por primera
// vez, para el año calendario en que ocurrieron; **(b)** restar la cantidad de los
// usados hacia la implementación y el logro de la NDC, para el año calendario en
// que se usan, asegurándose de que se usen dentro del mismo período de
// implementación de la NDC que cuando ocurrieron.
//
// Lo que se imita es **una sola cosa** de ese par: que el par suma/resta es un
// hecho único y no dos, y por eso la segunda aparición del mismo hecho se rechaza
// en vez de sumarse. Lo que NO se imita, y no se afirma: la contabilidad completa,
// los inventarios de gases, la trayectoria indicativa, el promedio plurianual, la
// revisión técnica de expertos, la plataforma centralizada de contabilidad e
// informe y el registro internacional. Marea no calcula emisiones de ningún país y
// no toca ninguna contribución determinada a nivel nacional.

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

// El núcleo se carga desde la copia vendorizada del proyecto. La suite compara
// los diez módulos con la procedencia declarada en vendor/vespi-kernel/SOURCE.md.
// Se consume sin modificar y no se depende de rutas de instalación del host.
const KERNEL = path.join(__dirname, '..', 'vendor', 'vespi-kernel');

const { sufficient } = require(`${KERNEL}/authority.js`);
const { createOperation, runOperation, STATES } = require(`${KERNEL}/operation.js`);
const { verifyReceipt } = require(`${KERNEL}/receipt.js`);

const REGISTRO = 'registro.jsonl';

// Las pistas de contabilidad. El párrafo 8 de la guía 2/CMA.3 se aplica a la NDC
// medida en t CO2 eq y el párrafo 9 a la NDC con métricas que no son gases de
// efecto invernadero: son pistas **distintas** en la propia guía. Por eso un
// resultado reconocido en una no choca con uno reconocido en la otra, y por eso
// dos países en métricas legítimamente distintas entran ambos.
//
// Esta tabla es la que sostiene el caso de control. Si se le saca una métrica, la
// entrada deja de ser reconocible y el detector se vuelve un no automático.
const PISTAS = {
  'tCO2e': { parrafo: '8', tipo: 'gas de efecto invernadero' },
  'MWh-eq': { parrafo: '9', tipo: 'métrica que no es gas de efecto invernadero' },
};

// Lo que el verificador independiente tiene que recalcular desde el almacén. Un
// verificador que no produce exactamente este conjunto no verificó nada: devolver
// un subconjunto, o añadir uno propio, es creerle al ejecutor en vez de mirar.
const CHECKS_INDEPENDIENTES = [
  'anclaje-resuelve',
  'metodologia-declarada',
  'sin-doble-conteo',
  'ajuste-en-pista',
  'autorizacion-vigente',
];

const SALIDA = 'vuelve a quien autoriza la declaración: renueva el compromiso, cambia la metodología o la métrica, o deja la reducción anotada como no declarada';

function entero(value) {
  if (typeof value === 'bigint') return value >= 0n ? value : null;
  if (typeof value === 'number') return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
  return typeof value === 'string' && /^\d+$/.test(value) ? BigInt(value) : null;
}

function texto(value) {
  return typeof value === 'string' && value.length > 0;
}

function huella(value) {
  return createHash('sha256').update(JSON.stringify(value), 'utf8').digest('hex');
}

function iso(now) {
  if (now === undefined || now === null) return new Date().toISOString();
  const ms = Date.parse(now);
  return Number.isNaN(ms) ? new Date().toISOString() : new Date(ms).toISOString();
}

function aniosDe(lista) {
  if (!Array.isArray(lista) || lista.length === 0) return null;
  const limpio = [...new Set(lista.map(Number))].filter((n) => Number.isInteger(n) && n > 1900 && n < 3000).sort((a, b) => a - b);
  return limpio.length === lista.length ? limpio : null;
}

class Marea {
  constructor({ dir } = {}) {
    this.dir = dir;
    this.ruta = path.join(dir, REGISTRO);
    fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.ruta)) fs.writeFileSync(this.ruta, '', 'utf8');
  }

  // --- El registro: un archivo que la persona puede abrir sin Marea ---
  leer() {
    const crudo = fs.readFileSync(this.ruta, 'utf8');
    return crudo.split('\n').filter((l) => l.trim().length > 0).map((l) => JSON.parse(l));
  }

  escribir(linea) {
    fs.appendFileSync(this.ruta, `${JSON.stringify(linea)}\n`, 'utf8');
    return linea;
  }

  lineas(tipo) {
    return this.leer().filter((l) => l.tipo === tipo);
  }

  anclas() { return this.lineas('ancla'); }
  autoridades() { return this.lineas('autorizacion'); }
  efectos() { return this.lineas('efecto'); }
  rechazadas() { return this.lineas('rechazo'); }
  aceptadas() { return this.lineas('aceptacion'); }
  recibos() { return this.lineas('recibo'); }
  sellos() { return this.lineas('sello'); }

  // Las entradas en el orden en que se resolvió cada una, aceptadas y rechazadas
  // juntas: mismo archivo, misma forma de línea. Un rechazo no es la ausencia de
  // un registro, es una línea que se puede leer y auditar.
  entradas() {
    return this.leer().filter((l) => l.tipo === 'aceptacion' || l.tipo === 'rechazo');
  }

  // --- Lo que escribe la persona: el anclaje de origen y la autorización ---
  anclar(spec) {
    for (const campo of ['id', 'pais', 'metrica', 'actividad']) {
      if (!texto(spec[campo])) throw new Error(`un anclaje necesita ${campo}: sin actividad de origen no hay nada que verificar`);
    }
    if (!PISTAS[spec.metrica]) throw new Error(`la métrica ${spec.metrica} no está en la tabla de pistas de contabilidad; una métrica sin párrafo de la guía detrás no se puede contabilizar`);
    if (this.anclas().some((a) => a.id === spec.id)) return this.anclas().find((a) => a.id === spec.id);
    const componentes = Array.isArray(spec.componentes) ? spec.componentes.filter(texto) : [];
    for (const hijo of componentes) {
      if (!this.anclas().some((a) => a.id === hijo)) throw new Error(`el anclaje ${spec.id} declara el componente ${hijo} y el registro no lo tiene`);
    }
    return this.escribir({
      tipo: 'ancla',
      id: spec.id,
      pais: spec.pais,
      metrica: spec.metrica,
      actividad: spec.actividad,
      componentes,
      inscrito_por: texto(spec.actuator) ? spec.actuator : 'sin nombre',
      inscrito_en: iso(),
    });
  }

  autorizar(spec) {
    for (const campo of ['id', 'pais', 'metrica', 'destino', 'cantidad', 'vence']) {
      if (!texto(spec[campo])) throw new Error(`una autorización necesita ${campo}: no hay permiso sin él`);
    }
    if (!PISTAS[spec.metrica]) throw new Error(`la métrica ${spec.metrica} no está en la tabla de pistas de contabilidad`);
    if (entero(spec.cantidad) === null) throw new Error('la cantidad autorizada es un número entero de unidades de la métrica');
    if (Number.isNaN(Date.parse(spec.vence))) throw new Error('el reloj de la autorización no es una hora');
    if (this.autoridades().some((a) => a.id === spec.id)) throw new Error(`ya existe la autorización ${spec.id}`);
    return this.escribir({
      tipo: 'autorizacion',
      id: spec.id,
      pais: spec.pais,
      metrica: spec.metrica,
      destino: spec.destino,
      cantidad: spec.cantidad,
      vence: iso(spec.vence),
      otorgada_por: texto(spec.actuator) ? spec.actuator : 'sin nombre',
      otorgada_en: iso(),
    });
  }

  // --- La aplanación: una declaración no puede contar dos veces lo mismo ---
  //
  // Las raíces son los componentes declarados si los hay, y el anclaje si no. Cada
  // raíz se aplana a sus hojas. Si una hoja aparece por dos caminos, la cifra está
  // inflada: se puede haber sumado un conjunto junto con sus propias partes. El
  // motivo guarda los caminos, para que la entrada se pueda rehacer sin adivinar.
  aplanar(raices) {
    const plano = [];
    const repetidas = new Map();
    const visita = (id, camino, profundidad) => {
      if (profundidad > 32) throw new Error(`el anclaje ${id} se anida más de 32 niveles: el registro tiene un ciclo`);
      const ancla = this.anclas().find((a) => a.id === id);
      if (!ancla) throw new Error(`el anclaje ${id} no está en el registro`);
      if (ancla.componentes.length === 0) {
        const previa = plano.find((p) => p.anclaje === id);
        if (previa) {
          previa.caminos.push(camino);
          repetidas.set(id, previa);
        } else {
          plano.push({ anclaje: id, metrica: ancla.metrica, caminos: [camino] });
        }
        return;
      }
      ancla.componentes.forEach((hijo, i) => visita(hijo, `${camino}/${hijo}#${i}`, profundidad + 1));
    };
    raices.forEach((raiz, i) => visita(raiz.raiz, `${raiz.via}#${i}`, 0));
    return { plano, repetidas: [...repetidas.values()] };
  }

  raicesDe(spec) {
    if (Array.isArray(spec.componentes) && spec.componentes.length > 0) {
      return spec.componentes.map((id) => ({ raiz: id, via: `componentes[${id}]` }));
    }
    return [{ raiz: spec.anclaje, via: `anclaje[${spec.anclaje}]` }];
  }

  // --- Lo ya reconocido: el par (actividad, año) ---
  //
  // La unidad de la partida es el par, y no la métrica. La razón es que el anclaje
  // de origen lleva **una sola** métrica y la puerta obliga a que la declaración
  // use esa misma (más abajo, `anclaje-no-resuelve` y `metrica-desconocida`), así
  // que la métrica ya está dentro de la actividad: agregarla a la clave sería
  // escribir un término que nunca cambia. Ponerla igual habría sido una coherencia
  // que parece cargar peso y no carga nada.
  //
  // El año va en la clave porque un mismo hecho en dos años son dos sumas, y dos
  // sumas del mismo hecho sí es doble conteo. La actividad va porque dos
  // actividades distintas en la misma pista son dos líneas y no una repetida.
  //
  // La separación por métrica —que la guía 2/CMA.3 hace en §8 y §9— no está en la
  // clave: está en que cada pista es su propio agregado, y por eso dos países en
  // métricas legítimamente distintas pueden reconocer lo suyo en el mismo año.
  // Lo que ya está reconocido, indexado por el par (actividad, año).
  //
  // Cada par guarda **todas** las entradas que lo reconocen, no solo la última.
  // Guardar una sola convertiría un doble conteo en una sobrescritura: el segundo
  //pisaría al primero y el verificador —que es quien tiene que verlo— no lo
  // notaría. Ese defecto estuvo aquí y lo encontró una prueba que escribía dos
  // entradas a mano; la prueba queda en `test/red.test.js`.
  reconocido() {
    const mapa = new Map();
    for (const efecto of this.efectos()) {
      for (const hoja of efecto.cuerpo.plano) {
        for (const anio of efecto.cuerpo.anios) {
          const clave = `${hoja.anclaje}|${anio}`;
          const reclamo = {
            clave: efecto.clave,
            pais: efecto.cuerpo.pais,
            metrica: hoja.metrica,
            pista: efecto.cuerpo.pista,
            actividad: (this.anclas().find((a) => a.id === hoja.anclaje) || {}).actividad || hoja.anclaje,
          };
          mapa.set(clave, [...(mapa.get(clave) || []), reclamo]);
        }
      }
    }
    return mapa;
  }

  // --- La puerta: las razones de no entrar, en orden de costo ---
  evaluar(spec, now) {
    if (!texto(spec.metodologia)) {
      return { ok: false, codigo: 'metodologia-ausente', motivo: 'la declaración no dice con qué metodología se midió la reducción, y una reducción sin metodología no es comparable con ninguna otra', salida: `declara la metodología de la reducción y vuelve: ${SALIDA}` };
    }

    const anios = aniosDe(spec.anios);
    if (anios === null) {
      return { ok: false, codigo: 'anios-ausentes', motivo: 'la declaración no dice en qué años ocurrieron las reducciones, y sin años no hay a qué año atribuir el ajuste', salida: SALIDA };
    }

    if (!PISTAS[spec.metrica]) {
      return { ok: false, codigo: 'metrica-desconocida', motivo: `la métrica ${spec.metrica} no está en la tabla de pistas de contabilidad de este registro, y una métrica sin párrafo de la guía detrás no se puede contabilizar`, salida: SALIDA };
    }

    const ancla = this.anclas().find((a) => a.id === spec.anclaje);
    if (!ancla) {
      return { ok: false, codigo: 'anclaje-no-resuelve', motivo: `la declaración se apoya en el anclaje ${spec.anclaje} y el registro no lo tiene: nadie puede verificar contra qué actividad de origen se declaró esta reducción`, salida: `inscribe el anclaje ${spec.anclaje} con su actividad de origen, o cambia la declaración por uno que sí exista` };
    }
    if (ancla.metrica !== spec.metrica) {
      return { ok: false, codigo: 'anclaje-no-resuelve', motivo: `el anclaje ${spec.anclaje} está inscrito en la métrica ${ancla.metrica} y la declaración dice ${spec.metrica}: el anclaje existe pero no resuelve para esta declaración`, salida: `declara la métrica ${ancla.metrica}, o inscribe un anclaje propio en ${spec.metrica}` };
    }

    // La transferencia internacional: el segundo lado de un ajuste que este
    // proyecto no lleva. Se rechaza en vez de contarse dos veces, y el motivo lo
    // dice, porque la alternativa —admitirlo sin ajustar— sería el doble conteo.
    if (texto(spec.transferido_de)) {
      const origen = this.entradas().find((e) => e.clave === spec.transferido_de);
      if (origen && origen.estado === 'aceptada') {
        return {
          ok: false,
          codigo: 'transferencia-internacional',
          motivo: `esta entrada declara venir de ${spec.transferido_de}, que ya fue reconocida en este registro: es el segundo lado de un ajuste de transferencia y este proyecto no lleva la contabilidad del §8 de la guía 2/CMA.3, así que la rechaza en vez de reconocerla dos veces`,
          salida: `presenta la transferencia como el mismo hecho con su ajuste y no como una reducción nueva, o retira ${spec.transferido_de}`,
          evidencia: { contra: spec.transferido_de, estado_origen: origen.estado },
        };
      }
      if (origen) {
        return {
          ok: false,
          codigo: 'transferencia-internacional',
          motivo: `esta entrada declara venir de ${spec.transferido_de}, pero esa entrada fue rechazada por ${origen.codigo}: no hay nada que transferir, así que esta tampoco entra`,
          salida: `deja entrar primero ${spec.transferido_de} o retira la referencia a ella`,
          evidencia: { contra: spec.transferido_de, estado_origen: origen.estado, codigo_origen: origen.codigo },
        };
      }
    }

    // La autorización, con su reloj y su techo. El predicado es el del núcleo.
    const candidatas = this.autoridades().filter((a) => a.pais === spec.pais && a.metrica === spec.metrica && a.destino === spec.destino);
    if (candidatas.length === 0) {
      return { ok: false, codigo: 'sin-autorizacion', motivo: `nadie autorizó a ${spec.pais} a declarar reducciones en ${spec.metrica} hacia ${spec.destino}`, salida: SALIDA };
    }
    const unidades = entero(spec.cantidad);
    if (unidades === null) {
      return { ok: false, codigo: 'cantidad-ilegible', motivo: `la cantidad declarada [${String(spec.cantidad)}] no es un número entero de unidades de ${spec.metrica}`, salida: SALIDA };
    }
    for (const aut of candidatas) {
      const restante = entero(aut.cantidad) - this.consumoDe(aut.id);
      const check = sufficient(
        [{ asset: `metrica:${spec.metrica}`, amount: spec.cantidad, to: `destino:${spec.destino}` }],
        { spend: [{ asset: `metrica:${spec.metrica}`, maxAmount: String(restante < 0n ? 0n : restante), to: `destino:${spec.destino}`, expiresAt: aut.vence }] },
        { now },
      );
      if (!check.ok) {
        if (/expired/.test(check.reason)) {
          const cuando = (check.reason.match(/expired at (\S+)/) || [])[1] || aut.vence;
          return { ok: false, codigo: 'reloj-vencido', motivo: `la autorización ${aut.id} de ${aut.otorgada_por} venció el ${cuando} y un compromiso que murió con su reloj no revive solo`, salida: `renueva la autorización ${aut.id} con ${aut.otorgada_por} o retira la declaración`, evidencia: { contra: aut.id, vencio: cuando } };
        }
        if (/consume/.test(check.reason)) {
          return { ok: false, codigo: 'fuera-de-autorizacion', motivo: `la autorización ${aut.id} autoriza ${aut.cantidad} unidades de ${aut.metrica} y ya reconoce ${this.consumoDe(aut.id)}; la declaración pide ${spec.cantidad} y solo quedan ${String(restante)}`, salida: `renueva el techo de ${aut.id} o declara una cantidad menor`, evidencia: { contra: aut.id, pedido: spec.cantidad, restante: String(restante) } };
        }
        return { ok: false, codigo: 'sin-autorizacion', motivo: `la autorización ${aut.id} no cubre esta declaración: ${check.reason}`, salida: SALIDA, evidencia: { contra: aut.id } };
      }
    }
    const elegida = candidatas[0];

    // La agregación que infla: una hoja alcanzada por dos caminos.
    const { plano, repetidas } = this.aplanar(this.raicesDe(spec));
    if (repetidas.length > 0) {
      const resumen = repetidas.map((r) => `${r.anclaje} por ${r.caminos.join(' y por ')}`).join('; ');
      return {
        ok: false,
        codigo: 'cifra-inflada',
        motivo: `la declaración cuenta ${repetidas[0].anclaje} más de una vez: el aplanamiento la alcanza por ${repetidas[0].caminos.length} caminos (${resumen}), y una suma que incluye un conjunto junto con sus propias partes declara más de lo que hay`,
        salida: 'declara cada actividad una sola vez, o quita del conjunto la parte que ya estaba dentro de él',
        evidencia: { repetidas: repetidas.map((r) => ({ anclaje: r.anclaje, metrica: r.metrica, caminos: r.caminos })) },
      };
    }
    for (const hoja of plano) {
      if (hoja.metrica !== spec.metrica) {
        return { ok: false, codigo: 'metrica-desconocida', motivo: `la declaración es en ${spec.metrica} pero el componente ${hoja.anclaje} de su desglose está inscrito en ${hoja.metrica}: una pista de contabilidad no se arma con piezas de otra`, salida: SALIDA, evidencia: { componente: hoja.anclaje, metrica_del_componente: hoja.metrica } };
      }
    }

    // El doble conteo, sobre el par (actividad, año).
    const mapa = this.reconocido();
    const pista = spec.metrica;
    const pares = [];
    for (const hoja of plano) for (const anio of anios) pares.push([hoja.anclaje, anio]);
    const choques = [];
    const contra = new Set();
    for (const par of pares) {
      for (const previo of mapa.get(`${par[0]}|${par[1]}`) || []) {
        choques.push(par);
        contra.add(previo.clave);
      }
    }
    if (choques.length > 0) {
      const limpia = pares.filter((par) => !choques.some((c) => c[0] === par[0] && c[1] === par[1]));
      const cabeza = choques[0];
      const primero = (mapa.get(`${cabeza[0]}|${cabeza[1]}`) || [])[0];
      const integral = choques.length === pares.length;
      return {
        ok: false,
        codigo: integral ? 'unidad-compartida' : 'anio-solapado',
        motivo: integral
          ? `doble conteo por unidad compartida: ${primero.pais} ya reconoció ${cabeza[0]} (${primero.actividad}) en ${cabeza[1]} con la declaración ${primero.clave}, y ${spec.pais} la declara otra vez en la misma métrica ${pista} y el mismo año: el mismo hecho no se reconoce dos veces`
          : `doble conteo por año solapado: ${primero.pais} ya reconoció ${cabeza[0]} en ${cabeza[1]} con la declaración ${primero.clave}, y ${spec.pais} vuelve a incluir ${choques.length} de ${pares.length} pares actividad-año que ya estaban: el año ${cabeza[1]} quedaría en dos balances`,
        salida: integral
          ? `retira la declaración de ${spec.pais} sobre ${cabeza[0]}, o cambia de actividad: una reducción no puede estar en dos balances a la vez`
          : `deja la declaración en los años que no chocan (${limpia.map((p) => p[1]).join(', ') || 'ninguno'}) o pide a ${primero.pais} que retire su declaración ${primero.clave}`,
        evidencia: { choques, limpio: limpia, contra: [...contra], pista },
      };
    }

    return { ok: true, autorizacion: elegida, plano, pista, anios, unidades };
  }

  consumoDe(autorizacionId) {
    return this.efectos()
      .filter((e) => e.autorizacion === autorizacionId)
      .reduce((suma, e) => suma + entero(e.cuerpo.cantidad), 0n);
  }

  // --- El verificador independiente: recalcula desde el almacén ---
  async verificar(evidencia) {
    const clave = evidencia && evidencia.operationId;
    const efectos = this.efectos().filter((e) => e.clave === clave);
    if (efectos.length !== 1) {
      return { verified: false, checks: Object.fromEntries(CHECKS_INDEPENDIENTES.map((c) => [c, false])), reason: 'el almacén no tiene exactamente un efecto con esa clave' };
    }
    const cuerpo = efectos[0].cuerpo;
    const mapa = this.reconocido();
    const aut = this.autoridades().find((a) => a.id === efectos[0].autorizacion);
    const checks = {
      'anclaje-resuelve': cuerpo.plano.length > 0 && this.anclas().some((a) => a.id === cuerpo.plano[0].anclaje),
      'metodologia-declarada': texto(cuerpo.metodologia),
      'sin-doble-conteo': !cuerpo.plano.some((hoja) => cuerpo.anios.some((anio) => {
        const reclamos = mapa.get(`${hoja.anclaje}|${anio}`) || [];
        return reclamos.some((previo) => previo.clave !== clave);
      })),
      'ajuste-en-pista': !!PISTAS[cuerpo.pista] && PISTAS[cuerpo.pista].parrafo === cuerpo.parrafo,
      'autorizacion-vigente': !!aut && entero(aut.cantidad) >= this.consumoDe(aut.id),
    };
    const verified = Object.values(checks).every((v) => v === true);
    return {
      verified,
      checks,
      reason: verified
        ? `recomputado desde el almacén: ${cuerpo.plano.length} actividad(es) en la pista ${cuerpo.pista}, que es la del §${cuerpo.parrafo} de la guía 2/CMA.3`
        : 'el almacén no respalda el efecto',
    };
  }

  verificadorDe(verificador) {
    if (verificador && typeof verificador.verificar === 'function') return (evidencia) => verificador.verificar(evidencia);
    if (typeof verificador === 'function') return verificador;
    return (evidencia) => this.verificar(evidencia);
  }

  // --- La puerta hacia el núcleo ---
  abrir(spec, opciones = {}) {
    const puerta = this.evaluar(spec, opciones.now);
    const autoridad = puerta.ok
      ? { spend: [{ asset: `metrica:${spec.metrica}`, maxAmount: String(entero(puerta.autorizacion.cantidad) - this.consumoDe(puerta.autorizacion.id)), to: `destino:${spec.destino}`, expiresAt: puerta.autorizacion.vence }] }
      : { spend: [] };
    const op = createOperation({
      goal: `${spec.pais} declara ${spec.cantidad} ${spec.metrica} hacia ${spec.destino}`,
      action: 'marea:declarar',
      agent: `pais:${spec.pais}`,
      exit: puerta.ok ? null : puerta.salida,
      authority: autoridad,
    });
    op.declaracion = { ...spec };
    op.puerta = puerta;
    return op;
  }

  capacidad(spec, puerta, verificador, now) {
    const self = this;
    return {
      id: 'marea:declarar',
      required: () => {
        if (!puerta.ok) return { impossible: true, reason: puerta.motivo, exit: puerta.salida };
        return { spend: [{ asset: `metrica:${spec.metrica}`, amount: spec.cantidad, to: `destino:${spec.destino}` }] };
      },
      perform: async () => {
        const cuerpo = {
          clave: spec.clave,
          pais: spec.pais,
          metrica: spec.metrica,
          pista: puerta.pista,
          parrafo: PISTAS[spec.metrica].parrafo,
          anclaje: spec.anclaje,
          plano: puerta.plano.map((hoja) => ({ anclaje: hoja.anclaje, metrica: hoja.metrica })),
          metodologia: spec.metodologia,
          anios: puerta.anios,
          cantidad: spec.cantidad,
          destino: spec.destino,
          transferido_de: texto(spec.transferido_de) ? spec.transferido_de : null,
          en: iso(now),
        };
        const linea = { tipo: 'efecto', clave: spec.clave, autorizacion: puerta.autorizacion.id, cuerpo };
        self.escribir(linea);
        return { ok: true, evidence: { operationId: spec.clave, type: 'efecto', status: 'reconocido', amount: spec.cantidad, code: huella(cuerpo) } };
      },
      io: { verify: this.verificadorDe(verificador) },
    };
  }

  // --- Declarar: de la entrada al resultado verificable ---
  //
  // Aceptada y rechazada van al MISMO archivo, con la misma forma de línea y cada
  // una con su sello aparte, para que el sello no dependa del contenido que se
  // selló. El veredicto se guarda sin su digest y el digest vive en su propia
  // línea: si no, la auditoría no podría distinguir el sello del contenido.
  async declarar(spec, opciones = {}) {
    for (const campo of ['clave', 'pais', 'metrica', 'anclaje', 'destino']) {
      if (!texto(spec[campo])) throw new Error(`una declaración necesita ${campo}: no hay entrada sin él`);
    }
    if (this.entradas().some((e) => e.clave === spec.clave)) {
      throw new Error(`la clave ${spec.clave} ya está en el registro; una entrada no se vuelve a declarar`);
    }

    const op = this.abrir(spec, opciones);
    const puerta = op.puerta;
    const cap = this.capacidad(spec, puerta, opciones.verificador, opciones.now);
    const momento = iso(opciones.now);
    // 0.1.5: el kernel acepta un reloj inyectado y lo usa para `expiresAt`. Sin
    // él, la puerta evalúa con `opciones.now` pero el núcleo usa el reloj real
    // y discrepan (las autorizaciones de prueba vencen el 2026-12-01): se pasa
    // el mismo `now` que ya evalúa el permiso para no depender de la fecha de hoy.
    const resultado = await runOperation(op, cap, { verify: cap.io.verify, ask: async () => ({ approved: false, by: 'nadie' }), now: () => momento });
    const recibo = resultado.receipt;
    const sellar = (linea) => {
      if (recibo) this.escribir({ tipo: 'recibo', clave: linea.clave, recibo });
      this.escribir(linea);
      const digest = huella(linea);
      this.escribir({ tipo: 'sello', clave: linea.clave, digest });
      return { ...linea, digest, recibo: recibo || null };
    };

    if (resultado.status === STATES.SUCCEEDED) {
      const ajuste = {
        lado: 'suma',
        pista: puerta.pista,
        parrafo: PISTAS[spec.metrica].parrafo,
        anclajes: puerta.plano.map((h) => h.anclaje),
        anios: puerta.anios,
        cantidad: spec.cantidad,
        destino: spec.destino,
        autorizacion: puerta.autorizacion.id,
      };
      return sellar({
        tipo: 'aceptacion',
        clave: spec.clave,
        estado: 'aceptada',
        codigo: null,
        motivo: `reconocida en la pista ${puerta.pista} (guía 2/CMA.3, §${ajuste.parrafo}) bajo la autorización ${ajuste.autorizacion}`,
        evidencia: { plano: ajuste.anclajes, anios: puerta.anios, autorizacion: ajuste.autorizacion, cobertura: recibo ? recibo.coverage : [] },
        ajuste,
        salida: null,
        declaracion: { ...spec },
        en: momento,
      });
    }

    return sellar({
      tipo: 'rechazo',
      clave: spec.clave,
      estado: 'rechazada',
      codigo: puerta.codigo,
      motivo: puerta.motivo,
      evidencia: puerta.evidencia || {},
      ajuste: null,
      salida: puerta.salida,
      declaracion: { ...spec },
      en: momento,
    });
  }

  // --- El reporte: qué entró, qué no, y por qué ---
  reporte() {
    return this.entradas().map((entrada) => {
      const sello = this.sellos().find((s) => s.clave === entrada.clave);
      const recibo = this.recibos().find((r) => r.clave === entrada.clave);
      return {
        clave: entrada.clave,
        estado: entrada.estado,
        codigo: entrada.codigo,
        motivo: entrada.motivo,
        evidencia: entrada.evidencia,
        ajuste: entrada.ajuste,
        salida: entrada.salida,
        en: entrada.en,
        digest: sello ? sello.digest : null,
        selloVerifica: sello ? sello.digest === huella(entrada) : false,
        recibo: recibo ? recibo.recibo.status : null,
      };
    });
  }

  // --- La tercera parte: lee el almacén y el sello, y no cree a nadie ---
  auditar(objetivo) {
    if (objetivo && texto(objetivo.clave)) return this.auditarEntrada(objetivo);
    return this.auditarRecibo(objetivo);
  }

  auditarRecibo(recibo) {
    if (!recibo || typeof recibo.digest !== 'string') return { ok: false, motivo: 'esto no es un recibo: no hay nada que auditar' };
    const sello = verifyReceipt(recibo);
    if (!sello.ok) return { ok: false, motivo: `el recibo no verifica: ${sello.reason}` };
    const clave = recibo.evidence && recibo.evidence.operationId;
    const efectos = this.efectos().filter((e) => e.clave === clave);
    if (efectos.length === 0) return { ok: false, motivo: 'el recibo dice que hubo un efecto y el almacén no lo tiene' };
    if (efectos.length > 1) return { ok: false, motivo: `el efecto ${clave} aparece ${efectos.length} veces en el almacén` };
    if (huella(efectos[0].cuerpo) !== recibo.evidence.code) {
      return { ok: false, motivo: 'el efecto fue editado después de escrito: su huella ya no calza con el recibo' };
    }
    const cubiertos = (recibo.coverage || []).filter((c) => CHECKS_INDEPENDIENTES.includes(c));
    const faltan = CHECKS_INDEPENDIENTES.filter((c) => !cubiertos.includes(c));
    if (faltan.length > 0) {
      return { ok: false, motivo: `el verificador creyó al ejecutor: no recomputó ${faltan.join(', ')} desde el almacén, y una verificación independiente no puede dar por bueno lo que no midió`, checks: cubiertos };
    }
    return { ok: true, motivo: 'el almacén, la autorización y el recibo dicen lo mismo', checks: cubiertos };
  }

  // La auditoría de una entrada, sea aceptada o rechazada: recomputa desde el
  // almacén y contrasta el sello. Una entrada rechazada bien rechazada también es
  // auditable, porque el motivo tiene que seguir siendo cierto.
  auditarEntrada(entrada) {
    const almacenada = this.entradas().find((e) => e.clave === entrada.clave);
    if (!almacenada) return { ok: false, motivo: `el registro no tiene ninguna entrada con la clave ${entrada.clave}` };
    if (huella(almacenada) !== entrada.digest) {
      return { ok: false, motivo: 'la entrada del registro no calza con el sello que trae: alguien la editó después de sellada' };
    }
    if (almacenada.estado === 'aceptada') {
      const recibo = this.recibos().find((r) => r.clave === entrada.clave);
      if (!recibo) return { ok: false, motivo: 'la entrada está aceptada y no hay recibo que la respalde' };
      const a = this.auditarRecibo(recibo.recibo);
      return a.ok ? { ok: true, motivo: `aceptada, sellada y verificada: ${a.motivo}`, checks: a.checks } : a;
    }
    const spec = almacenada.declaracion;
    if (!spec || !texto(spec.anclaje)) return { ok: true, motivo: `rechazada por ${almacenada.codigo}, con el motivo sellado en su línea` };
    const puerta = this.evaluar(spec, almacenada.en);
    if (puerta.ok) {
      return { ok: false, motivo: `la entrada dice que se rechazó por ${almacenada.codigo} pero, con los datos del registro, hoy entraría: el motivo ya no es cierto` };
    }
    if (puerta.codigo !== almacenada.codigo) {
      return { ok: false, motivo: `la entrada dice ${almacenada.codigo} y el almacén daría ${puerta.codigo}: el motivo sellado ya no describe el estado real` };
    }
    return { ok: true, motivo: `rechazada por ${almacenada.codigo}, y el almacén vuelve a dar el mismo motivo` };
  }
}

module.exports = { Marea, CHECKS_INDEPENDIENTES, PISTAS };
