const puppeteer = require('puppeteer')
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
;(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] })
  const page = await browser.newPage()
  const errors = []
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text().slice(0, 200)) })
  page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message.slice(0, 200)}`))
  await page.goto('http://localhost:5173/auth/login', { waitUntil: 'networkidle2', timeout: 20000 }).catch(() => {})
  await wait(1500)
  const result = await page.evaluate(async () => {
    try {
      const { handleMockRequest } = await import('/src/api/mock-server.js')
      await import('/src/api/mock-routes-extra.js')
      const dup = await handleMockRequest({ method: 'post', url: '/faculty/paper-generator/papers/gp1/duplicate' })
      const del = await handleMockRequest({ method: 'delete', url: '/faculty/paper-generator/papers/gp1' })
      return { dup: dup.data, del: del.data }
    } catch (e) {
      return { error: e.message }
    }
  })
  console.log('browser mock test:', JSON.stringify(result))
  console.log('errors:', errors.length ? errors.slice(0, 4) : 'NONE')
  await browser.close()
})().catch((e) => { console.error('ERR', e); process.exit(1) })
