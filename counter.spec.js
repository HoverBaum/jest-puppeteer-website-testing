/* eslint-env jest */

import puppeteer from 'puppeteer'
import { spawn } from 'child_process'

// Remember puppeteer browser and current page.
let browser
let page

// Also remember the process which we use to serve our website.
let serverProcess

// URL that the webserver will serve our website under.
const testUrl = 'http://localhost:8282'

beforeAll(async () => {
  // Wait until a local webserver is started to test against.
  await new Promise(resolve => {
    // We use a webserver here to be as agnostic of frameworks etc.,
    // as possible. Any (potentially compiled) website should be testable.
    serverProcess = spawn('live-server', [`--port=${testUrl.split(':')[2]}`, '--no-browser'])
    // Better wait for a first response from the server to ensure the website is available.
    serverProcess.stdout.on('data', resolve)
  })

  // Set config depending on environment and start browser.
  const browserConfig = process.env.SHOW_BROWSER ? {
    headless: false,
    // Change this number to a higher one to slow down visually run tests.
    slowMo: 100
  } : {}
  browser = await puppeteer.launch(browserConfig)
})

beforeEach(async () => {
  // Get a new page for each test so that we start fresh.
  page = await browser.newPage()
})

afterEach(async () => {
  // Remember to close pages after tests.
  await page.close()
})

afterAll(async () => {
  // Cleanup everything that is still running after all tests are through.
  serverProcess.kill()
  await browser.close()
})

describe('Counter', () => {
  it('should have a headline', async () => {
    await page.goto(testUrl)
    await page.screenshot({ path: 'screens/basicRender.png' })
    const headlines = await page.$$('h1')

    expect(headlines.length).toBe(1)
  })

  it('should initially have a count of 0', async () => {
    await page.goto(testUrl)
    const count = await page.$eval('[data-test="count-output"]', e => parseInt(e.innerHTML))
    await page.screenshot({ path: 'screens/initialCount.png' })

    expect(count).toBe(0)
  })

  it('should increment on click', async () => {
    await page.goto(testUrl)
    const incrementBtn = await page.$('[data-test="button-increment"]')
    const initialCount = await page.$eval('[data-test="count-output"]', e => parseInt(e.innerHTML))
    const expectedCount = initialCount + 1

    await incrementBtn.click()
    const newCount = await page.$eval('[data-test="count-output"]', e => parseInt(e.innerHTML))
    await page.screenshot({ path: 'screens/incrementedCount.png' })

    expect(newCount).toBe(expectedCount)
  })

  it('should increment right for multiple clicks', async () => {
    await page.goto(testUrl)
    const incrementBtn = await page.$('[data-test="button-increment"]')
    const initialCount = await page.$eval('[data-test="count-output"]', e => parseInt(e.innerHTML))
    const clickCount = 3
    const expectedCount = initialCount + clickCount

    await Promise.all(Array.apply(null, { length: clickCount }).map(Number.call, Number).map(() => incrementBtn.click()))
    const newCount = await page.$eval('[data-test="count-output"]', e => parseInt(e.innerHTML))
    await page.screenshot({ path: 'screens/multiIncrementedCount.png' })

    expect(newCount).toBe(expectedCount)
  })

  it('should display a message', async () => {
    await page.goto(testUrl)
    await page.$eval('[data-test="button-display"]', e => e.click())
    await page.screenshot({ path: 'screens/messageDisplay.png' })
    const displays = await page.$$('[data-test="display"]')

    expect(displays.length).toBe(1)
  })
})
