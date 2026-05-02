import { Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, getEditorContent } from '../support/browser.js'

Then('I should see the file in the editor', async function () {
  await browser.driver.wait(async () => {
    const editorText = await getEditorContent()
    return editorText && editorText.includes('{')
  }, 5000)

  const editorText = await getEditorContent()
  assert.ok(editorText.includes('{'))
})

Then('I should see the new file in the editor', async function () {
  await browser.driver.wait(async () => {
    const editorText = await getEditorContent()
    return editorText && editorText.includes('valid2')
  }, 5000)

  const editorText = await getEditorContent()
  assert.ok(editorText.includes('valid2'))
})

Then('I should see an error message about unsupported file', async function () {
  const errorElement = await browser.driver.wait(
    until.elementLocated(By.css('.bg-red-50')),
    3000
  )

  const errorText = await errorElement.getText()

  assert.ok(errorText.includes('json') || errorText.includes('JSON'))
})
