import { Given, Then } from '@cucumber/cucumber'
import { until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { TD_WITH_PROPERTIES_DATA_TYPES, TD_WITH_ACTIONS_INPUT_DATA_TYPES,  
  TD_WITH_ACTIONS_OUTPUT_DATA_TYPES, TD_WITH_NO_DATA_TYPES } from '../support/fixtures.js'

Given('I have loaded a Thing Description with properties with declared data types in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_PROPERTIES_DATA_TYPES
  )
})

Given('I have loaded a Thing Description with actions that have input parameters with declared data types in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_ACTIONS_INPUT_DATA_TYPES
  )
})

Given('I have loaded a Thing Description with actions that have output parameters with declared data types in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_ACTIONS_OUTPUT_DATA_TYPES
  )
})

Given('I have loaded a Thing Description with no declared data types in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_NO_DATA_TYPES
  )
})

Then('the generated tests should include test cases that verify the type of the response for each property', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )

    return typeof value === 'string' && (value.includes('typeof') || value.includes('toBe')) ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes('typeof') || text.includes('toBe'),
    `Expected type check for property response, got: ${text}`
  )
})


Then('the generated tests should include test cases that that verify that the submitted input matches the declared type', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes('body: JSON.stringify(') ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes('body: JSON.stringify('),
    `Expected request body serialization, got: ${text}`
  )

  assert.ok(
    text.includes('true') || text.includes('false'),
    `Expected boolean input matching declared type, got: ${text}`
  )
})


Then('the generated tests should include test cases that verify that the response type matches the declared type', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && (value.includes('typeof') || value.includes('toBe')) ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes('typeof') || text.includes('toBe'),
    `Expected type check for action output, got: ${text}`
  )
})


Then("the generated tests shouldn't include type verification test cases", async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const value = await browser.driver.wait(async () => {
    const v = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof v === 'string' ? v : null
  }, TIMEOUT_MS)

  if (typeof value === 'string' && value.length > 0) {
    assert.ok(
      !value.includes('typeof') && !value.includes('toBe'),
      `Expected no type verification tests, got: ${value}`
    )
  }
})