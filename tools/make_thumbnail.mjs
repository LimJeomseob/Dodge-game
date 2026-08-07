/**
 * public/og.svg 를 public/og.png (1200x630) 로 렌더한다.
 * 썸네일 디자인을 고쳤을 때만 돌리면 되므로 playwright 는 의존성에 넣지 않았다.
 *
 *   npx playwright install chromium   # 처음 한 번
 *   node tools/make_thumbnail.mjs
 *
 * 한글이 네모로 나오면 시스템에 한글 글꼴이 없는 것이다.
 * og.svg 는 NanumBarunGothic 을 쓴다 (NanumSquareRound 에는 '됌' 글리프가 없다).
 */
import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(root, 'public/og.svg')
const out = path.join(root, 'public/og.png')
const [W, H] = [1200, 630]

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H } })
await page.setContent(`<style>*{margin:0;padding:0}</style>${fs.readFileSync(src, 'utf8')}`)
await page.waitForTimeout(300) // 글꼴 적용 대기
await page.screenshot({ path: out })
await browser.close()
console.log(`${path.relative(root, out)} 생성 완료 (${W}x${H})`)
