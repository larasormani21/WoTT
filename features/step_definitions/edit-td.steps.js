import { When, Then } from '@cucumber/cucumber'
import { By } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, getEditorContent } from '../support/browser.js'

When('I write in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript(`       return window.monacoEditor !== undefined;
    `)
  }, 5000)

  await browser.driver.executeScript(`     window.monacoEditor.setValue('{"test": "value"}');
  `)

  await browser.driver.sleep(300)
})

Then('I should see the content in real time', async function () {
  await browser.driver.wait(async () => {
    const content = await getEditorContent()
    return content && content.includes('test')
  }, 5000)

  const content = await getEditorContent()
  assert.ok(content.includes('test'))
})

Then('I should see the updated content in real time', async function () {
  await browser.driver.wait(async () => {
    const content = await getEditorContent()
    return content && content.includes('test')
  }, 5000)

  const content = await getEditorContent()
  assert.ok(content.includes('test'))
})

Then('I should not be able to continue', async function () {
  const button = await browser.driver.findElement(
    By.xpath("//button[contains(., 'Generate')]")
  )

  const isDisabled = await button.getAttribute('disabled')

  assert.ok(isDisabled !== null)
})
