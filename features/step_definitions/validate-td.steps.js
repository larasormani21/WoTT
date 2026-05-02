import { When, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser } from '../support/browser.js'

When('I click on validate', async function () {
  const button = await browser.driver.findElement(
    By.xpath("//button[contains(., 'Validate')]")
  )

  const isDisabled = await button.getAttribute('disabled')

  if (!isDisabled) {
    await button.click()
  }
})

Then('I should see a message confirming the validation of the Thing Description', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.css('.bg-green-50')),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('valid'))
})

Then('I should see a message confirming the invalidation of the Thing Description', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.css('.bg-red-50')),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('invalid'))
})

Then('I should see an error message about the missing required field', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.xpath("//div[contains(., 'Missing required field')]")),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('Missing required field') || errorText.includes('missing required field'))
})

Then('I should see an error message about the invalid type', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.xpath("//div[contains(., 'Invalid type')]")),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('Invalid type') || errorText.includes('invalid type'))
})
