/**
 * Exporta como SVG os ícones usados no layout do Figma para src/assets/icons/.
 * Os ids vêm dos outlines em docs/figma/frames/*.txt.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const FILE_KEY = 'Ff0SksUi7UFtPWUO8kyNtw'
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'src/assets/icons')

const ICONS: Record<string, string> = {
  search: 'I70522:3240;70504:3015;70486:519',
  cart: 'I70522:3240;70504:3015;70486:521',
  login: 'I70522:3240;70504:3015;70486:527',
  facebook: 'I70492:696;70491:1270',
  instagram: 'I70492:696;70491:1272',
  twitter: 'I70492:696;70491:1274',
  linkedin: 'I70492:696;70491:1276',
  youtube: 'I70492:696;70491:1278',
  'google-color': 'I70484:260;70483:242',
  'facebook-color': 'I70484:240;70483:259',
  'thank-you': '11:5150',
  close: '9:947',
  hide: '9:963',
  star: '11:1195',
  delete: '11:2029',
  'arrow-left': '16:395',
  'arrow-right': '15:5295',
  filter: '15:5488',
  'search-mobile': '15:5331',
  'tab-home': '15:5519',
  'tab-user': '15:5522',
  'tab-shop': '15:5524',
  'tab-heart': '15:5527',
  'tab-scan': '15:5529',
  location: '70420:4602',
  activity: '70420:4613',
  download: '70420:4616',
  danger: '70420:4619',
  logout: '70420:4623',
  image: '9:1560',
  'arrow-down': '9:1589',
  wallet: '23:1379',
}

/** Ícones multicoloridos preservam as cores originais; os demais herdam `currentColor`. */
const KEEP_COLORS = new Set(['google-color', 'facebook-color', 'tab-scan'])

async function loadToken() {
  if (process.env.FIGMA_TOKEN) return process.env.FIGMA_TOKEN
  const envFile = path.join(ROOT, '.env')
  if (existsSync(envFile)) {
    const line = (await readFile(envFile, 'utf8')).split(/\r?\n/).find((l) => l.startsWith('FIGMA_TOKEN='))
    if (line) return line.slice('FIGMA_TOKEN='.length).trim()
  }
  throw new Error('FIGMA_TOKEN não definido.')
}

const token = await loadToken()
await mkdir(OUT, { recursive: true })

const ids = Object.values(ICONS).join(',')
const res = await fetch(`https://api.figma.com/v1/images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=svg&svg_outline_text=true`, {
  headers: { 'X-Figma-Token': token },
})
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
const { images } = (await res.json()) as { images: Record<string, string | null> }

for (const [name, id] of Object.entries(ICONS)) {
  const url = images[id]
  if (!url) {
    console.warn(`sem render para ${name} (${id})`)
    continue
  }
  let svg = await (await fetch(url)).text()
  if (!KEEP_COLORS.has(name)) svg = svg.replace(/(fill|stroke)="#[0-9A-Fa-f]{6}"/g, '$1="currentColor"')
  await writeFile(path.join(OUT, `${name}.svg`), svg)
  console.log(`ok ${name}`)
}
