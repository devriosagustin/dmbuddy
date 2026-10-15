#!/usr/bin/env node
// Extrae y limpia el texto de los PDFs del SRD 5.2.1 (inglés y español).
//
// Uso:  node scripts/clean-srd-text.mjs [en|es|all]   (por defecto: all)
// Requiere `pdftotext` (poppler). Salida en srd-text/ (ignorado por git):
//   srd-text/en.txt, srd-text/es.txt          texto limpio, con marcas <!-- pN -->
//   srd-text/en.report.txt, es.report.txt     estadísticas + palabras cortadas sin resolver
//
// Qué limpia (ambos idiomas):
//   - encabezado/pie de página y número de página sueltos
//   - guiones blandos (U+00AD) y el artefacto "­t ienes" (letra capitular separada)
//   - corte de palabras a fin de línea ("ca-\ntegory", "bonifica‑\ndor"), resuelto
//     contra el vocabulario del propio documento (une o conserva el guion)
//   - ligaduras, espacios raros (U+00A0, U+200B), signo menos U+2212 -> "-",
//     guion no separable U+2011 -> "-"
//   - re-armado de párrafos (líneas cortadas por el ancho de columna)
// No toca: comillas tipográficas, rayas, viñetas, números, tablas/bloques de stats.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'srd-text')

const LANGS = {
  en: { pdf: 'SRD_CC_v5.2.1.pdf', header: /^System Reference Document 5\.2\.1$/ },
  es: { pdf: 'SP_SRD_CC_v5.2.1.pdf', header: /^Documento de referencia del sistema 5\.2\.1$/ },
}

const LIGATURES = { 'ﬀ': 'ff', 'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬃ': 'ffi', 'ﬄ': 'ffl' }
const SENTENCE_END = /[.!?:;”)\]»]$/
const BULLET = /^[•·▪◦-]\s/

function normalizeChars(s) {
  return s
    .replace(/[ﬀ-ﬄ]/g, (c) => LIGATURES[c])
    .replace(/­(\p{L}) (?=\p{L})/gu, '$1') // "­t ienes" -> "tienes"
    .replace(/‑(?=\n)/g, '‑') // se resuelve luego (corte de palabra)
    .replace(/­(?=\n)/g, '­') // idem
    .replace(/[  ]/g, ' ')
    .replace(/[​﻿]/g, '')
    .replace(/−/g, '-')
}

// Quita encabezado/pie de una página: la línea del título corrido y el número suelto
// que la acompaña (antes o después, saltando líneas en blanco).
function stripRunningHeader(lines, headerRe) {
  const out = lines.slice()
  const idx = out.findIndex((l) => headerRe.test(l.trim()))
  if (idx === -1) return out
  const drop = new Set([idx])
  for (const dir of [-1, 1]) {
    let j = idx + dir
    while (out[j] !== undefined && out[j].trim() === '') j += dir
    if (out[j] !== undefined && /^\d{1,3}$/.test(out[j].trim())) {
      drop.add(j)
      break
    }
  }
  return out.filter((_, i) => !drop.has(i))
}

function buildVocab(text) {
  const plain = new Set()
  const hyph = new Set()
  const t = text.replace(/­/g, '')
  for (const m of t.matchAll(/\p{L}+(?:[-‑]\p{L}+)*/gu)) {
    const w = m[0].toLowerCase()
    if (/[-‑]/.test(w)) hyph.add(w.replace(/‑/g, '-'))
    else plain.add(w)
  }
  return { plain, hyph }
}

function cleanPage(rawPage, headerRe) {
  let lines = normalizeChars(rawPage).split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trimEnd())
  lines = stripRunningHeader(lines, headerRe)
  return lines
}

function unwrap(lines, vocab, unresolved, stats) {
  const out = []
  const isBlank = (l) => l === undefined || l.trim() === ''
  for (let i = 0; i < lines.length; i++) {
    let cur = lines[i].trimStart()
    if (cur === '') { out.push(''); continue }
    // Acumula líneas de la misma frase/párrafo.
    while (i + 1 < lines.length && !isBlank(lines[i + 1])) {
      const next = lines[i + 1].trimStart()
      // 1) corte de palabra a fin de línea
      const m = cur.match(/(\p{L}+)([-‑­])$/u)
      if (m && /^\p{L}/u.test(next)) {
        const a = m[1]
        const b = next.match(/^\p{L}+/u)[0]
        const joined = (a + b).toLowerCase()
        const hy = `${a}-${b}`.toLowerCase()
        let glue
        if (m[2] === '­') glue = ''
        else if (vocab.plain.has(joined)) glue = ''
        else if (vocab.hyph.has(hy)) glue = '-'
        else {
          glue = m[2] === '‑' ? '' : '-'
          unresolved.push(`${a}${m[2] === '‑' ? '‑' : '-'}${b} -> ${a}${glue}${b}`)
        }
        cur = cur.slice(0, -1) + glue + next
        stats.hyphenJoins++
        i++
        continue
      }
      // 2) continuación de párrafo
      const endsSentence = SENTENCE_END.test(cur)
      const nextLower = /^\p{Ll}/u.test(next)
      const longLine = cur.length >= 46
      if (BULLET.test(next)) break
      if (nextLower || (longLine && !endsSentence)) {
        cur += ' ' + next
        stats.lineJoins++
        i++
        continue
      }
      break
    }
    out.push(cur.replace(/‑/g, '-').replace(/­/g, '').replace(/ {2,}/g, ' ').trim())
  }
  return out
}

// Continuaciones que el flujo de pdftotext separa con una línea en blanco (salto de
// columna) o con el cambio de página. Se procesa sobre el texto ya armado, con las
// marcas <!-- pN --> intactas.
//  - palabra cortada con guion: se mueve la primera palabra de la línea siguiente
//    (en la página siguiente también) para completar la palabra;
//  - oración cortada en el salto de columna (misma página): se une el párrafo entero.
function fixBreaks(lines, vocab, unresolved, stats) {
  const isMarker = (l) => /^<!-- p\d+ -->$/.test(l)
  const nextIdx = (from) => {
    let j = from + 1
    while (j < lines.length && (lines[j] === '' || isMarker(lines[j]))) j++
    return j
  }
  for (let i = 0; i < lines.length; i++) {
    const cur = lines[i]
    if (cur === '' || isMarker(cur)) continue
    const j = nextIdx(i)
    if (j >= lines.length || !/^\p{Ll}/u.test(lines[j])) continue
    const crossesPage = lines.slice(i + 1, j).some(isMarker)
    const m = cur.match(/(\p{L}+)-$/u)
    if (m) {
      const [word] = lines[j].match(/^\p{L}+/u)
      const rest = lines[j].slice(word.length).replace(/^\s+/, '')
      const joined = (m[1] + word).toLowerCase()
      let glue = ''
      if (!vocab.plain.has(joined)) {
        if (vocab.hyph.has(`${m[1]}-${word}`.toLowerCase())) glue = '-'
        else { unresolved.push(`${m[1]}-${word} -> ${m[1]}${'-'}${word}  (salto de columna/página)`); glue = '-' }
      }
      lines[i] = cur.slice(0, -1) + glue + word
      lines[j] = rest
      if (rest === '') lines[j] = ''
      stats.hyphenJoins++
      continue
    }
    if (!crossesPage && !SENTENCE_END.test(cur) && !BULLET.test(lines[j])) {
      lines[i] = cur + ' ' + lines[j]
      lines[j] = ''
      stats.lineJoins++
      i-- // re-evaluar la línea ya ampliada
    }
  }
  return lines
}

function processLang(code) {
  const { pdf, header } = LANGS[code]
  const pdfPath = join(ROOT, pdf)
  if (!existsSync(pdfPath)) throw new Error(`No encuentro ${pdf} en la raíz del repo`)
  const raw = execFileSync('pdftotext', [pdfPath, '-'], { maxBuffer: 1 << 28, encoding: 'utf8' })
  const pages = raw.split('\f')
  if (pages.at(-1).trim() === '') pages.pop()

  const cleaned = pages.map((p) => cleanPage(p, header))
  const vocab = buildVocab(cleaned.flat().join('\n'))
  const stats = { pages: pages.length, hyphenJoins: 0, lineJoins: 0, headersRemoved: 0, continuationPages: 0 }
  stats.headersRemoved = pages.filter((p, i) => cleaned[i].length < p.split('\n').length).length
  const unresolved = []

  const chunks = []
  cleaned.forEach((lines, i) => {
    const body = unwrap(lines, vocab, unresolved, stats)
    while (body.length && body[0] === '') body.shift()
    while (body.length && body.at(-1) === '') body.pop()
    if (body[0] && /^\p{Ll}/u.test(body[0])) stats.continuationPages++
    chunks.push(`<!-- p${i + 1} -->\n${body.join('\n').replace(/\n{3,}/g, '\n\n')}`)
  })
  const text = fixBreaks(chunks.join('\n\n').split('\n'), vocab, unresolved, stats)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n') + '\n'

  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, `${code}.txt`), text)
  const uniq = [...new Set(unresolved)].sort()
  const pending = []
  let page = 0
  text.split('\n').forEach((l, n) => {
    const pm = l.match(/^<!-- p(\d+) -->$/)
    if (pm) page = Number(pm[1])
    else if (/\p{L}-$/u.test(l)) pending.push(`p${page} (línea ${n + 1}): ...${l.slice(-40)}`)
  })
  writeFileSync(
    join(OUT, `${code}.report.txt`),
    [
      `Idioma: ${code}  (${pdf})`,
      `Páginas: ${stats.pages}`,
      `Páginas con encabezado/pie quitado: ${stats.headersRemoved}`,
      `Palabras cortadas a fin de línea re-unidas: ${stats.hyphenJoins}`,
      `Saltos de línea de párrafo re-unidos: ${stats.lineJoins}`,
      `Páginas que arrancan con minúscula (oración cortada entre páginas): ${stats.continuationPages}`,
      `Cortes de palabra sin confirmar en el vocabulario (${uniq.length}) -- revisar:`,
      ...uniq,
      '',
      `Cortes pendientes: la palabra quedó cortada y su resto está lejos (${pending.length}) -- arreglar a mano:`,
      ...pending,
      '',
    ].join('\n'),
  )
  console.log(`${code}: ${stats.pages} págs, ${stats.hyphenJoins} cortes unidos (${uniq.length} sin confirmar), ${stats.lineJoins} líneas unidas -> srd-text/${code}.txt`)
}

const arg = process.argv[2] ?? 'all'
for (const code of arg === 'all' ? Object.keys(LANGS) : [arg]) {
  if (!LANGS[code]) throw new Error(`Idioma desconocido: ${code} (usá en, es o all)`)
  processLang(code)
}
