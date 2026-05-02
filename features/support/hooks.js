import { Before, After } from '@cucumber/cucumber'
import { Builder } from 'selenium-webdriver'
import chromedriverModule from 'chromedriver'
import path from 'node:path'
import { browser, APP_URL } from './browser.js'

Before(async function () {
  const chromedriverDirectory = path.dirname(chromedriverModule.path)

  process.env['PATH'] =
    chromedriverDirectory + path.delimiter + (process.env['PATH'] ?? '')

  browser.driver = await new Builder().forBrowser('chrome').build()
  await browser.driver.get(APP_URL)
})

After(async function () {
  if (browser.driver) await browser.driver.quit()
})
