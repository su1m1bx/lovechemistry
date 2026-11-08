import { test, expect } from '@playwright/test';
import { menuAction } from './ui-driver.js';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'node:http';
import os from 'node:os';
import { build } from 'vite';
const KEY = 'love-chemistry.prototype.v1';
const CODES = { H: '수소', HE: '헬륨', C: '탄소', NA: '나트륨', CL: '염소' };
const SNAP_IDS = ['SNAP-H', 'SNAP2-H', 'SNAP3-H', 'SNAP-HE', 'SNAP2-HE', 'SNAP3-HE', 'SNAP-C', 'SNAP2-C', 'SNAP3-C', 'SNAP-NA', 'SNAP2-NA', 'SNAP3-NA', 'SNAP-CL', 'SNAP2-CL', 'SNAP3-CL'];
const game = s => { const { ui, ...rest } = s; return rest; };
async function load(page, s, ledger = null) {
  await page.evaluate(([key, s, ledger]) => { localStorage.setItem(key, JSON.stringify(s)); if (ledger) localStorage.setItem('love-chemistry.helium-reservations.v1', JSON.stringify(ledger)); }, [KEY, s, ledger]);
  await menuAction(page, '불러오기');
}
async function save(page) { await menuAction(page, '저장'); return page.evaluate(key => JSON.parse(localStorage.getItem(key)), KEY); }
async function loaded(image) { await expect(image).toBeVisible(); await expect.poll(() => image.evaluate(i => i.complete && i.naturalWidth > 0)).toBe(true); }
async function portraitFits(page) {
  const result = await page.locator('.standing').evaluateAll(images => images.map(img => {
    const r = img.getBoundingClientRect(); const p = img.closest('.portrait').getBoundingClientRect(); const d = document.querySelector('.dialogue').getBoundingClientRect(); const css = getComputedStyle(img);
    const paintedHeight = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight) * img.naturalHeight;
    return { x: r.x, y: r.y, right: r.right, bottom: r.bottom, h: r.height, paintedHeight, pBottom: p.bottom, dTop: d.top, vw: innerWidth, vh: innerHeight, fit: css.objectFit, blend: css.mixBlendMode };
  }));
  for (const r of result) { expect(r.fit).toBe('contain'); expect(r.blend).toBe('normal'); expect(r.h).toBeGreaterThan(30); expect(r.x).toBeGreaterThanOrEqual(0); expect(r.y).toBeGreaterThanOrEqual(0); expect(r.right).toBeLessThanOrEqual(r.vw); expect(r.bottom).toBeLessThanOrEqual(r.dTop - 8); expect(r.bottom).toBeLessThanOrEqual(r.pBottom + 1); }
  // Check the painted raster, not just its possibly letterboxed element box.
  // These floors prevent the previous undersized standings from regressing.
  for (const r of result) {
    const minimum = r.vw <= 600 ? r.vh < 700 ? 195 : result.length > 1 ? 290 : 370 : r.vh < 550 ? 150 : r.vh < 800 ? 310 : 430;
    expect(r.paintedHeight).toBeGreaterThanOrEqual(minimum);
  }
  for (let i = 1; i < result.length; i++) expect(result[i - 1].right).toBeLessThanOrEqual(result[i].x + 1);
}

for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 720 }, { width: 390, height: 844 }, { width: 320, height: 568 }, { width: 844, height: 390 }]) {
  for (const [code, name] of Object.entries(CODES)) test(`${viewport.width}×${viewport.height} ${name}: 실제 대화 스탠딩·현재 화자·원본 전체 비율`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.goto('/'); const s = await page.evaluate(async c => (await import('/tests/asset-fixtures.js')).standingState(c), code); await load(page, s);
    await expect(page.locator('.cast-slot')).toHaveCount(1); await expect(page.locator('.speaking')).toHaveAttribute('data-character', name); await expect(page.locator('.speaking-label')).toHaveText('말하는 중');
    await loaded(page.getByAltText(`${name} 스탠딩`)); await portraitFits(page); expect(game(await save(page))).toEqual(game(s));
    await page.screenshot({ path: info.outputPath(`standing-${code}.png`) });
  });
  test(`${viewport.width}×${viewport.height} 다인: 실제 cast만·이름/미터/화자 분리·각 스탠딩 잘림 없음`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.goto('/'); const s = await page.evaluate(async () => (await import('/tests/asset-fixtures.js')).multiState()); await load(page, s);
    expect(await page.locator('.cast-slot').evaluateAll(nodes => nodes.map(n => n.dataset.character))).toEqual(['수소', '탄소']); await expect(page.getByRole('meter')).toHaveCount(2);
    await loaded(page.getByAltText('수소 스탠딩')); await loaded(page.getByAltText('탄소 스탠딩')); await portraitFits(page);
    await expect(page.locator('.speaking')).toHaveAttribute('data-character', '수소'); await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await expect(page.locator('.speaking')).toHaveAttribute('data-character', '탄소');
    await page.screenshot({ path: info.outputPath('multi.png') });
  });
}

test('미제공 MG/CA와 스탠딩 로드 실패는 기존 자리표시자, 잘못된 인물로 대체하지 않음', async ({ page }) => {
  await page.goto('/');
  for (const code of ['MG', 'CA']) { const s = await page.evaluate(async c => (await import('/tests/asset-fixtures.js')).standingState(c), code); await load(page, s); await expect(page.locator('.standing')).toHaveCount(0); await expect(page.locator('.portrait')).toContainText('이미지 준비 중'); }
  await page.route('**/assets/characters/H.webp', route => route.abort()); const s = await page.evaluate(async () => (await import('/tests/asset-fixtures.js')).standingState('H')); await load(page, s); await expect(page.locator('.portrait')).toContainText('이미지 준비 중'); expect(game(await save(page))).toEqual(game(s));
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) for (const id of SNAP_IDS) test(`${viewport.width}×${viewport.height} ${id}: 실제 그림·표시전/그림/알림/후속 저장 복원·효과 불변`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.goto('/'); const { s, ledger } = await page.evaluate(async id => (await import('/tests/asset-fixtures.js')).snapState(id), id);
  const before = structuredClone(s); before.index--; await load(page, before, ledger); const savedBefore = await save(page); await page.reload(); await menuAction(page, '불러오기'); expect(game(await save(page))).toEqual(game(savedBefore));
  await page.getByRole('button', { name: '다음 ▸', exact: true }).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image'); const image = page.locator('.snap-backdrop img'); await loaded(image);
  await expect(image).toHaveAttribute('src', new RegExp(`/assets/snaps/${id}\\.webp$`)); await expect(image).toHaveCSS('object-fit', 'contain');
  const baseline = await save(page); await page.reload(); await menuAction(page, '불러오기'); await loaded(page.locator('.snap-backdrop img')); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'image');
  await page.screenshot({ path: info.outputPath(`${id}-image.png`) });
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await save(page); await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'notice');
  await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow'); const follow = await page.locator('.dialogue-text').textContent(); const after = await save(page); await page.reload(); await menuAction(page, '불러오기'); await expect(page.locator('.dialogue-text')).toHaveText(follow);
  expect(after.affinity).toEqual(baseline.affinity); expect(after.applied).toEqual(baseline.applied); expect(after.snaps).toEqual(baseline.snaps);
  const bounds = await page.locator('.snap-backdrop img').evaluate(img => { const i = img.getBoundingClientRect(); const b = img.parentElement.getBoundingClientRect(); const d = document.querySelector('.dialogue').getBoundingClientRect(); return { imageHeight: i.height, boxHeight: b.height, bottom: i.bottom, dialogueTop: d.top }; });
  expect(bounds.imageHeight).toBeLessThanOrEqual(bounds.boxHeight + 1); expect(bounds.bottom).toBeLessThanOrEqual(bounds.dialogueTop - 8);
  await page.screenshot({ path: info.outputPath(`${id}-follow.png`) });
});

test('옥상 전용 SNAP2-H를 도서관 변형에 재사용하지 않음·미제공 스냅 fallback 진행', async ({ page }) => {
  await page.goto('/');
  const s = await page.evaluate(async () => { const { Run, focus } = await import('/tests/mid-driver.js'); const run = new Run(); run.to('DAY16-HANDOFF', focus('H')); return run.snaps.find(s => s.id === 'SNAP2-H').state; });
  const library = structuredClone(s); library.location = '도서관'; library.place = '도서관'; await load(page, library); await expect(page.locator('.snap-fallback')).toContainText('이미지 준비 중'); await expect(page.locator('.snap-backdrop img')).toHaveCount(0);
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); await expect(page.locator('main')).toHaveAttribute('data-snap-phase', 'follow');
  const missing = await page.evaluate(async () => (await import('/tests/asset-fixtures.js')).snapState('SNAP-MG')); await load(page, missing.s); await expect(page.locator('.snap-fallback')).toContainText('이미지 준비 중'); const before = await save(page);
  await page.getByRole('button', { name: '스냅 정보 보기 ▸' }).click(); await page.getByRole('button', { name: '스냅 닫고 계속' }).click(); expect((await save(page)).affinity).toEqual(before.affinity);
});

test('배포 하위 경로 실제 production: 스탠딩5·스냅15 전부 WebP 로드, 루트 assets 요청 없음', async ({ page }) => {
  test.setTimeout(120000); await page.goto('/');
  const fixtures = await page.evaluate(async ids => { const f = await import('/tests/asset-fixtures.js'); return { characters: Object.keys((await import('/src/character-art.js')).CHARACTER_ART), states: Object.keys({ H:1,HE:1,C:1,NA:1,CL:1 }).map(c => f.standingState(c)), snaps: ids.map(id => f.snapState(id)) }; }, SNAP_IDS);
  // Build the current source into an isolated directory: npm test must work
  // without a pre-existing dist, and browser projects must not overwrite it.
  const temp = path.join(os.tmpdir(), 'opencode'); await fs.mkdir(temp, { recursive: true });
  const dist = await fs.mkdtemp(path.join(temp, 'chemistry-assets-build-'));
  await build({ configFile: path.resolve('vite.config.js'), logLevel: 'silent', build: { outDir: dist, emptyOutDir: true } });
  const server = createServer(async (req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); if (!pathname.startsWith('/lovechemistry/')) { res.writeHead(404).end(); return; }
    const relative = pathname.slice('/lovechemistry/'.length) || 'index.html'; const file = path.resolve(dist, relative); if (!file.startsWith(dist + path.sep)) { res.writeHead(403).end(); return; }
    try { const body = await fs.readFile(file); res.setHeader('Content-Type', { '.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.svg':'image/svg+xml' }[path.extname(file)] || 'application/octet-stream'); res.end(body); } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); const origin = `http://127.0.0.1:${server.address().port}`; const wrong = []; page.on('request', r => { if (new URL(r.url()).pathname.startsWith('/assets/')) wrong.push(r.url()); });
  try {
    await page.goto(`${origin}/lovechemistry/index.html?qa=assets#screen`);
    for (let i = 0; i < fixtures.states.length; i++) { await load(page, fixtures.states[i]); await loaded(page.getByAltText(`${fixtures.characters[i]} 스탠딩`)); }
    for (const { s, ledger } of fixtures.snaps) { await load(page, s, ledger); await loaded(page.locator('.snap-backdrop img')); }
    for (const file of [...Object.keys(CODES).map(c => `characters/${c}.webp`), ...SNAP_IDS.map(id => `snaps/${id}.webp`)]) {
      const response = await page.request.get(`${origin}/lovechemistry/assets/${file}`); expect(response.status()).toBe(200); expect(response.headers()['content-type']).toBe('image/webp'); const b = await response.body(); expect(b.subarray(0,4).toString()).toBe('RIFF'); expect(b.subarray(8,12).toString()).toBe('WEBP');
    }
    expect(wrong).toEqual([]);
  } finally { await new Promise(resolve => server.close(resolve)); await fs.rm(dist, { recursive: true, force: true }); }
});
