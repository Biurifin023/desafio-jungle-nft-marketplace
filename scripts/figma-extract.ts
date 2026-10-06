/**
 * Extrai métricas, screenshots e assets do arquivo Figma do desafio via REST API.
 *
 * Uso: FIGMA_TOKEN=... pnpm figma:extract   (ou defina FIGMA_TOKEN no .env)
 *
 * Saídas:
 * - docs/figma/raw/file.json        árvore completa (ignorada no git)
 * - docs/figma/screens/*.png        render de referência de cada frame
 * - docs/figma/frames/*.txt         outline legível de cada frame (posições, tamanhos, cores, textos)
 * - docs/figma/tokens.json          cores, tipografia, raios e sombras com frequência de uso
 * - public/assets/figma/*           imagens (image fills) usadas no layout
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const FILE_KEY = 'Ff0SksUi7UFtPWUO8kyNtw'
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = {
  raw: path.join(ROOT, 'docs/figma/raw'),
  screens: path.join(ROOT, 'docs/figma/screens'),
  frames: path.join(ROOT, 'docs/figma/frames'),
  tokens: path.join(ROOT, 'docs/figma/tokens.json'),
  assets: path.join(ROOT, 'public/assets/figma'),
}

type Color = { r: number; g: number; b: number; a: number }
type Paint = {
  type: string
  visible?: boolean
  color?: Color
  opacity?: number
  imageRef?: string
  gradientStops?: { color: Color; position: number }[]
}
type Effect = { type: string; visible?: boolean; color?: Color; offset?: { x: number; y: number }; radius: number; spread?: number }
type TypeStyle = {
  fontFamily: string
  fontWeight: number
  fontSize: number
  lineHeightPx?: number
  letterSpacing?: number
  textCase?: string
  textAlignHorizontal?: string
}
type Node = {
  id: string
  name: string
  type: string
  visible?: boolean
  children?: Node[]
  absoluteBoundingBox?: { x: number; y: number; width: number; height: number }
  fills?: Paint[]
  strokes?: Paint[]
  strokeWeight?: number
  cornerRadius?: number
  rectangleCornerRadii?: number[]
  effects?: Effect[]
  characters?: string
  style?: TypeStyle
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE'
  itemSpacing?: number
  paddingLeft?: number
  paddingRight?: number
  paddingTop?: number
  paddingBottom?: number
  primaryAxisAlignItems?: string
  counterAxisAlignItems?: string
  opacity?: number
}

async function loadToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN
  const envFile = path.join(ROOT, '.env')
  if (existsSync(envFile)) {
    const line = (await readFile(envFile, 'utf8')).split(/\r?\n/).find((l) => l.startsWith('FIGMA_TOKEN='))
    if (line) return line.slice('FIGMA_TOKEN='.length).trim()
  }
  throw new Error('FIGMA_TOKEN não definido (variável de ambiente ou .env).')
}

const token = await loadToken()

async function api<T>(endpoint: string): Promise<T> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.figma.com/v1${endpoint}`, { headers: { 'X-Figma-Token': token } })
    if (res.status === 429) {
      const wait = Number(res.headers.get('retry-after') ?? 10) * 1000
      console.warn(`429 em ${endpoint}, aguardando ${wait}ms`)
      await new Promise((r) => setTimeout(r, wait))
      continue
    }
    if (!res.ok) throw new Error(`${res.status} ${endpoint}: ${await res.text()}`)
    return (await res.json()) as T
  }
  throw new Error(`Rate limit persistente em ${endpoint}`)
}

async function download(url: string, file: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download ${res.status} ${url}`)
  await writeFile(file, Buffer.from(await res.arrayBuffer()))
}

const hex = (c: Color, opacity = 1) => {
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0')
  const a = c.a * opacity
  return `#${to(c.r)}${to(c.g)}${to(c.b)}${a < 0.999 ? to(a) : ''}`
}

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

function paintToString(p: Paint) {
  if (p.visible === false) return null
  if (p.type === 'SOLID' && p.color) return hex(p.color, p.opacity ?? 1)
  if (p.type === 'IMAGE') return `image(${p.imageRef})`
  if (p.type.startsWith('GRADIENT') && p.gradientStops)
    return `${p.type.toLowerCase()}(${p.gradientStops.map((s) => `${hex(s.color)} ${Math.round(s.position * 100)}%`).join(', ')})`
  return p.type
}

const colors = new Map<string, number>()
const typography = new Map<string, { style: TypeStyle; count: number; samples: string[] }>()
const radii = new Map<number, number>()
const shadows = new Map<string, number>()
const imageRefs = new Map<string, string[]>()
const inc = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1)

function describe(node: Node, origin: { x: number; y: number }, depth: number, lines: string[]) {
  if (node.visible === false) return
  const b = node.absoluteBoundingBox
  const geo = b ? `@${Math.round(b.x - origin.x)},${Math.round(b.y - origin.y)} ${Math.round(b.width)}x${Math.round(b.height)}` : ''
  const parts: string[] = [`${'  '.repeat(depth)}${node.type} "${node.name}" [${node.id}] ${geo}`]

  const fills = (node.fills ?? []).map(paintToString).filter(Boolean) as string[]
  if (fills.length) {
    parts.push(`fill=${fills.join('|')}`)
    for (const f of fills) {
      if (f.startsWith('image(')) {
        const ref = f.slice(6, -1)
        imageRefs.set(ref, [...(imageRefs.get(ref) ?? []), node.name])
      } else if (node.type !== 'TEXT') inc(colors, `bg ${f}`)
    }
  }
  const strokes = (node.strokes ?? []).map(paintToString).filter(Boolean) as string[]
  if (strokes.length) {
    parts.push(`stroke=${strokes.join('|')}/${node.strokeWeight ?? 1}`)
    for (const s of strokes) inc(colors, `border ${s}`)
  }
  if (node.cornerRadius) {
    parts.push(`radius=${node.cornerRadius}`)
    inc(radii, node.cornerRadius)
  } else if (node.rectangleCornerRadii) parts.push(`radii=${node.rectangleCornerRadii.join('/')}`)
  if (node.opacity !== undefined && node.opacity < 1) parts.push(`opacity=${node.opacity.toFixed(2)}`)
  for (const e of node.effects ?? []) {
    if (e.visible === false) continue
    const s = `${e.type} ${e.offset?.x ?? 0} ${e.offset?.y ?? 0} ${e.radius} ${e.spread ?? 0} ${e.color ? hex(e.color) : ''}`
    parts.push(`effect=${s}`)
    inc(shadows, s)
  }
  if (node.layoutMode && node.layoutMode !== 'NONE') {
    parts.push(
      `layout=${node.layoutMode} gap=${node.itemSpacing ?? 0} pad=${node.paddingTop ?? 0}/${node.paddingRight ?? 0}/${node.paddingBottom ?? 0}/${node.paddingLeft ?? 0} align=${node.primaryAxisAlignItems ?? ''}/${node.counterAxisAlignItems ?? ''}`,
    )
  }
  if (node.type === 'TEXT' && node.style) {
    const s = node.style
    const key = `${s.fontFamily} ${s.fontWeight} ${s.fontSize}/${s.lineHeightPx ? Math.round(s.lineHeightPx * 10) / 10 : 'auto'} ls=${s.letterSpacing ?? 0}${s.textCase ? ` ${s.textCase}` : ''}`
    parts.push(`font="${key}"`)
    const fillColor = fills[0] ?? ''
    if (fillColor) inc(colors, `text ${fillColor}`)
    const entry = typography.get(key) ?? { style: s, count: 0, samples: [] }
    entry.count++
    if (entry.samples.length < 4 && node.characters) entry.samples.push(node.characters.slice(0, 40))
    typography.set(key, entry)
    parts.push(`text=${JSON.stringify((node.characters ?? '').slice(0, 160))}`)
  }
  lines.push(parts.join(' '))
  for (const child of node.children ?? []) describe(child, origin, depth + 1, lines)
}

for (const dir of [OUT.raw, OUT.screens, OUT.frames, OUT.assets]) await mkdir(dir, { recursive: true })

console.log('Baixando árvore completa…')
const file = await api<{ document: Node; name: string; lastModified: string }>(`/files/${FILE_KEY}?geometry=paths`)
await writeFile(path.join(OUT.raw, 'file.json'), JSON.stringify(file))

const page = file.document.children![0]!
const frames = (page.children ?? []).filter((n) => n.type === 'FRAME')

const index: { id: string; name: string; file: string; width: number; height: number }[] = []
for (const frame of frames) {
  const lines: string[] = []
  const b = frame.absoluteBoundingBox!
  describe(frame, { x: b.x, y: b.y }, 0, lines)
  const name = slug(frame.name)
  await writeFile(path.join(OUT.frames, `${name}.txt`), lines.join('\n'))
  index.push({ id: frame.id, name: frame.name, file: name, width: b.width, height: b.height })
}

console.log('Renderizando screenshots dos frames…')
const ids = frames.map((f) => f.id).join(',')
const renders = await api<{ images: Record<string, string> }>(`/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=png&scale=1`)
for (const entry of index) {
  const url = renders.images[entry.id]
  if (url) await download(url, path.join(OUT.screens, `${entry.file}.png`))
}

console.log('Baixando image fills…')
const fills = await api<{ meta: { images: Record<string, string> } }>(`/files/${FILE_KEY}/images`)
const assetIndex: Record<string, { file: string; usedBy: string[] }> = {}
for (const [ref, usedBy] of imageRefs) {
  const url = fills.meta.images[ref]
  if (!url) continue
  const fileName = `${ref}.png`
  if (!existsSync(path.join(OUT.assets, fileName))) await download(url, path.join(OUT.assets, fileName))
  assetIndex[ref] = { file: `/assets/figma/${fileName}`, usedBy: [...new Set(usedBy)] }
}

const sortDesc = <K>(m: Map<K, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])
await writeFile(
  OUT.tokens,
  JSON.stringify(
    {
      source: { file: file.name, lastModified: file.lastModified, key: FILE_KEY },
      frames: index,
      colors: Object.fromEntries(sortDesc(colors)),
      typography: [...typography.entries()].sort((a, b) => b[1].count - a[1].count).map(([key, v]) => ({ key, count: v.count, samples: v.samples })),
      radii: Object.fromEntries(sortDesc(radii)),
      shadows: Object.fromEntries(sortDesc(shadows)),
      assets: assetIndex,
    },
    null,
    2,
  ),
)

console.log(`OK: ${index.length} frames, ${Object.keys(assetIndex).length} imagens, ${colors.size} cores, ${typography.size} estilos de texto.`)
