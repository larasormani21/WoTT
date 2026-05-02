import { Given, When, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, APP_URL, TIMEOUT_MS } from '../support/browser.js'
import { VALID_TD } from '../support/fixtures.js'

Given('I have loaded a valid Thing Description in the editor', { timeout: 30000 }, async function () {
  await browser.driver.get(APP_URL)
  await browser.driver.wait(async () => {
    const exists = await browser.driver.executeScript(
      'return !!window.monacoEditor'
    )
    return exists === true
  }, 30000)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    VALID_TD
  )
})

When('I select {string} as the target language', async function (language) {
  const option = await browser.driver.findElement(
    By.css(`#language-select option[value="${language}"]`)
  )
  await option.click()
})

Then('the generated test suite is displayed in JavaScript', async function () {
  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  const text = await browser.driver.findElement(By.css('body')).getText()

  assert.ok(text.includes('describe('))
})

Then('the generated test suite imports a JavaScript testing framework', async function () {
  const text = await browser.driver.findElement(By.css('body')).getText()

  assert.ok(text.includes('node:test') || text.includes('describe'))
})

Then('{string} is the currently selected language', async function (language) {
  const select = await browser.driver.findElement(By.css('#language-select'))

  const value = await browser.driver.executeScript(
    'return arguments[0].value',
    select
  )

  assert.equal(value, language)
})
