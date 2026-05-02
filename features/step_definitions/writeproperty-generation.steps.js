import { Given, Then } from '@cucumber/cucumber'
import { until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { TD_WITH_WRITE_PROPERTY, TD_WITH_READ_ONLY_PROPERTIES } from '../support/fixtures.js'

Given('I have loaded a Thing Description with writeproperty in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_WRITE_PROPERTY
  )
})

Given('I have loaded a Thing Description with only read-only properties', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_READ_ONLY_PROPERTIES
  )
})

Then('the generated tests should contain PUT requests with a request body', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes("method: 'PUT'") ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes("method: 'PUT'"),
    `Expected PUT method in generated code, got: ${text}`
  )
  assert.ok(
    text.includes('body: JSON.stringify('),
    `Expected body serialization in generated code, got: ${text}`
  )
})

Then('no write tests should be generated', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const value = await browser.driver.wait(async () => {
    const v = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof v === 'string' ? v : null
  }, TIMEOUT_MS)

  if (typeof value === 'string' && value.length > 0) {
    assert.ok(
      !value.includes("method: 'PUT'"),
      `Expected no PUT write test in generated code, got: ${value}`
    )
  }
})
