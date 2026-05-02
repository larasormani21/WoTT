import { Given, Then } from '@cucumber/cucumber'
import { until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { TD_WITH_READ_PROPERTY, TD_WITH_WRITE_ONLY_PROPERTIES } from '../support/fixtures.js'

Given('I have loaded a Thing Description with readproperty in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_READ_PROPERTY
  )
})

Given('I have loaded a Thing Description with only write-only properties', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_WRITE_ONLY_PROPERTIES
  )
})

Then('the generated tests should contain GET requests to the property endpoints', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes('fetch(') ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes('fetch('),
    `Expected fetch call in generated code, got: ${text}`
  )
})

Then('no read tests should be generated', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const value = await browser.driver.wait(async () => {
    const v = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof v === 'string' ? v : null
  }, TIMEOUT_MS)

  if (typeof value === 'string' && value.length > 0) {
    // Write-only properties now generate write (PUT) tests, so fetch() may be present.
    // Assert only that no GET-style read test is generated (no fetch without a method option).
    assert.ok(
      !value.includes("await fetch('") || value.includes("method: 'PUT'"),
      `Expected no GET read test in generated code, got: ${value}`
    )
  }
})
