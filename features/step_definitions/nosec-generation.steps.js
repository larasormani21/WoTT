import { When, Then } from '@cucumber/cucumber'
import { until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { TD_WITH_NOSEC } from '../support/fixtures.js'

When('I enter a Thing Description with nosec security scheme', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_NOSEC
  )
})

Then('the generated tests contain no Authorization header', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const generatedCode = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.length > 0 ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    !generatedCode.includes('Authorization'),
    `Expected no Authorization header in generated code, got: ${generatedCode}`
  )
})

Then('the generated tests contain no API key parameter', async function () {
  const generatedCode = await browser.driver.executeScript(
    'return window.monacoEditor ? window.monacoEditor.getValue() : null'
  )

  assert.ok(
    typeof generatedCode === 'string' &&
    !generatedCode.toLowerCase().includes('x-api-key') &&
    !generatedCode.toLowerCase().includes('apikey'),
    `Expected no API key parameter in generated code, got: ${generatedCode}`
  )
})
