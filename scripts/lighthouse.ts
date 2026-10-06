/**
 * Auditoria Lighthouse de início e detalhe em mobile e desktop, conforme `lighthouserc.cjs`.
 * Executa `numberOfRuns` medições por página e perfil e grava a mediana em `docs/lighthouse/summary.json`.
 * Requer `pnpm build:demo`.
 *
 * Uso: pnpm lighthouse
 * Env: LH_BASE_URL (padrão http://127.0.0.1:4173) e LH_SKIP_SERVER=1 se o preview já estiver no ar.
 */
import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

interface LighthouseRc {
  ci: {
    collect: {
      url: string[]
      numberOfRuns: number
      startServerCommand: string
      settings: { onlyCategories: string[]; chromeFlags: string }
    }
    assert: { assertions: Record<string, [string, { minScore: number }]> }
  }
}

interface Report {
  lighthouseVersion: string
  environment: { hostUserAgent: string; benchmarkIndex: number }
  configSettings: { formFactor: string; throttlingMethod: string; throttling: Record<string, number> }
  categories: Record<string, { score: number | null }>
  audits: Record<string, { numericValue?: number }>
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'docs', 'lighthouse')
const rc = createRequire(import.meta.url)('../lighthouserc.cjs') as LighthouseRc
const { collect, assert } = rc.ci
const profiles = ['mobile', 'desktop'] as const
const categories = collect.settings.onlyCategories

const pageId = (url: string) => (new URL(url).pathname === '/' ? 'inicio' : 'detalhe')

const targets = Object.fromEntries(
  Object.entries(assert.assertions).map(([key, [, { minScore }]]) => [key.replace('categories:', ''), Math.round(minScore * 100)]),
)

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2
}

async function waitForServer(url: string, timeoutMs = 90_000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url)
      if (res.ok || res.status === 304) return
    } catch {
      /* tenta de novo */
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Preview não respondeu em ${url}`)
}

function stopServer(server: ChildProcess | undefined) {
  if (!server?.pid) return
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(server.pid), '/T', '/F'])
  else server.kill()
}

function runOnce(url: string, formFactor: (typeof profiles)[number], outputPath: string) {
  const preset = formFactor === 'desktop' ? ['--preset=desktop'] : []
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'lighthouse',
      `"${url}"`,
      ...preset,
      `--only-categories=${categories.join(',')}`,
      `--chrome-flags="${collect.settings.chromeFlags}"`,
      '--output=json',
      '--output=html',
      `--output-path="${outputPath}"`,
      '--quiet',
    ],
    { cwd: root, encoding: 'utf8', shell: true },
  )
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || 'Lighthouse falhou')
}

async function main() {
  await mkdir(outDir, { recursive: true })
  const baseURL = new URL(collect.url[0]!).origin
  const server =
    process.env.LH_SKIP_SERVER === '1'
      ? undefined
      : spawn(collect.startServerCommand, { cwd: root, stdio: 'ignore', shell: true })

  try {
    await waitForServer(baseURL)
    const summary = {
      generatedAt: new Date().toISOString(),
      config: 'lighthouserc.cjs',
      baseURL,
      numberOfRuns: collect.numberOfRuns,
      targets,
      environment: { node: process.version, platform: `${process.platform} ${process.arch}` } as Record<string, unknown>,
      pages: {} as Record<string, unknown>,
    }

    for (const url of collect.url) {
      for (const profile of profiles) {
        const key = `${pageId(url)}-${profile}`
        const scores = Object.fromEntries(categories.map((c) => [c, [] as number[]]))
        const metrics = { lcpSeconds: [] as number[], cls: [] as number[], tbtMs: [] as number[] }
        let conditions: Record<string, unknown> = {}

        for (let i = 0; i < collect.numberOfRuns; i++) {
          const outputPath = path.join(outDir, `${key}-run${i + 1}`)
          console.log(`> ${key} ${i + 1}/${collect.numberOfRuns}`)
          runOnce(url, profile, outputPath)
          const report = JSON.parse(await readFile(`${outputPath}.report.json`, 'utf8')) as Report
          for (const c of categories) scores[c]!.push(Math.round((report.categories[c]?.score ?? 0) * 100))
          metrics.lcpSeconds.push((report.audits['largest-contentful-paint']?.numericValue ?? 0) / 1000)
          metrics.cls.push(report.audits['cumulative-layout-shift']?.numericValue ?? 0)
          metrics.tbtMs.push(report.audits['total-blocking-time']?.numericValue ?? 0)
          summary.environment.lighthouse = report.lighthouseVersion
          summary.environment.userAgent = report.environment.hostUserAgent
          conditions = {
            formFactor: report.configSettings.formFactor,
            throttlingMethod: report.configSettings.throttlingMethod,
            throttling: report.configSettings.throttling,
            benchmarkIndex: report.environment.benchmarkIndex,
          }
        }

        const medians = Object.fromEntries(categories.map((c) => [c, median(scores[c]!)]))
        summary.pages[key] = {
          url,
          conditions,
          runs: { ...scores, ...metrics },
          medians: {
            ...medians,
            lcpSeconds: Number(median(metrics.lcpSeconds).toFixed(2)),
            cls: Number(median(metrics.cls).toFixed(3)),
            tbtMs: Math.round(median(metrics.tbtMs)),
          },
          belowTarget: categories.filter((c) => (medians[c] ?? 0) < (targets[c] ?? 0)),
        }
      }
    }

    await writeFile(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`, 'utf8')
    console.log(JSON.stringify(summary.pages, null, 2))
  } finally {
    stopServer(server)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
