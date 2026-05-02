import { browser, TIMEOUT_MS } from './browser.js'
import { until } from 'selenium-webdriver'

export async function getGeneratedCode() {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  return await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes('it(') ? value : null
  }, TIMEOUT_MS)
}

export function buildStringOfLength(length) {
  return 'a'.repeat(Math.max(0, length));
}