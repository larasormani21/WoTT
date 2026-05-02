import { When, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { VALID_TD, EMPTY_TD } from '../support/fixtures.js'

When('I enter a valid Thing Description JSON', async function () {
  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    VALID_TD
  )
})

When('I enter a Thing Description with no properties or actions', async function () {
  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    EMPTY_TD
  )
})

When('I enter invalid JSON text', async function () {
  await browser.driver.executeScript(
    `window.monacoEditor.setValue('not valid json {{{')`
  )
})

Then('the generated test suite code is displayed', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const editor = await browser.driver.wait(
    until.elementLocated(By.css('.monaco-editor')),
    TIMEOUT_MS
  )

  assert.ok(editor)
})

Then('a message indicates no testable elements were found', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.xpath("//div[contains(., 'Thing Description must have at least one property or action to be testable')]")),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('Thing Description must have at least one property or action to be testable'))
})
