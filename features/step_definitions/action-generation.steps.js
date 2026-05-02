import { Given, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { TD_WITH_INVOKE_ACTION_WITH_BINDING, TD_WITH_INVOKE_ACTION_WITHOUT_BINDING } from '../support/fixtures.js'

Given('I have loaded a Thing Description with invokeaction and binding with HTTP GET method in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_INVOKE_ACTION_WITH_BINDING
  )
})

Given('I have loaded a Thing Description with invokeaction without bindings in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_INVOKE_ACTION_WITHOUT_BINDING
  )
})

Then('the generated tests should contain GET requests', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes('http://example.com/toggle') ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes('http://example.com/toggle'),
    `Expected toggle URL in generated code, got: ${text}`
  )
  assert.ok(
    !text.includes("method: 'GET'"),
    `GET requests should not have explicit method, got: ${text}`
  )
})

Then('the generated tests should contain POST requests with a request body', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.wait(async () => {
    const value = await browser.driver.executeScript(
      'return window.monacoEditor ? window.monacoEditor.getValue() : null'
    )
    return typeof value === 'string' && value.includes("method: 'POST'") && value.includes('body: JSON.stringify(') ? value : null
  }, TIMEOUT_MS)

  assert.ok(
    text.includes("method: 'POST'"),
    `Expected POST method in generated code, got: ${text}`
  )
  assert.ok(
    text.includes('body: JSON.stringify('),
    `Expected body serialization in generated code, got: ${text}`
  )
  assert.ok(
    text.includes('true'),
    `Expected boolean true in request body, got: ${text}`
  )
})

Then('I should see a warning about missing bindings for the action', async function () {
  const warningElement = await browser.driver.wait(
    until.elementLocated(By.xpath("//div[contains(., 'Some actions are missing an HTTP method.') or contains(., 'htv:methodName')]") ),
    TIMEOUT_MS
  )

  const warningText = await warningElement.getText()

  assert.ok(
    warningText.length > 0,
    `Expected warning about missing action bindings, but found nothing`
  )
})