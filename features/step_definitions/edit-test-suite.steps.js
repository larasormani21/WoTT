import { Given, When, Then } from '@cucumber/cucumber'
import { By, until } from 'selenium-webdriver'
import assert from 'node:assert/strict'
import { browser, TIMEOUT_MS } from '../support/browser.js'
import { VALID_TD } from '../support/fixtures.js'

const MANUAL_EDIT_MARKER = '// manual edit marker'

Given('I have generated a test suite from the Thing Description', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    VALID_TD
  )

  const generateButton = await browser.driver.findElement(
    By.xpath("//button[contains(., 'Generate')]")
  )
  await generateButton.click()

  await browser.driver.wait(until.urlContains('/test-suite'), TIMEOUT_MS)

  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, TIMEOUT_MS)
})

Given('the selected language is javascript', async function () {
  const languageBadge = await browser.driver.findElement(By.css('.uppercase'))
  const badgeText = await languageBadge.getText()
  assert.strictEqual(badgeText.toLowerCase(), 'javascript')
})

When('I write in the test suite editor', async function () {
  const originalContent = await browser.driver.executeScript(
    'return window.monacoEditor.getValue()'
  )

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0] + "\\n// new content")',
    originalContent
  )

  await browser.driver.sleep(200)
})

When('I manually edit the test suite content', async function () {
  const originalContent = await browser.driver.executeScript(
    'return window.monacoEditor.getValue()'
  )

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0] + "\\n" + arguments[1])',
    originalContent,
    MANUAL_EDIT_MARKER
  )

  await browser.driver.sleep(200)
})

When('I click the Download button', async function () {
  // Spy on anchor.click to capture the download without triggering the browser's file-save dialog.
  // The blob is read asynchronously via FileReader; result is stored on window.__lastDownload.
  await browser.driver.executeScript(`
    window.__lastDownload = null;
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = function(blob) {
      window.__pendingDownloadBlob = blob;
      return 'blob:spy-url';
    };
    HTMLAnchorElement.prototype.click = function() {
      const blob = window.__pendingDownloadBlob;
      if (!blob) return;
      const reader = new FileReader();
      reader.onload = () => {
        window.__lastDownload = { filename: this.download, contents: reader.result };
      };
      reader.readAsText(blob);
      window.__pendingDownloadBlob = null;
    };
  `)

  const downloadButton = await browser.driver.findElement(
    By.xpath("//button[contains(., 'Download')]")
  )
  await downloadButton.click()

  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.__lastDownload !== null')
  }, TIMEOUT_MS)
})

Then('I should see the changes in the test suite editor in real time', async function () {
  const content = await browser.driver.executeScript(
    'return window.monacoEditor.getValue()'
  )
  assert.ok(content.includes('// new content'))
})

Then('the test suite should be saved locally', async function () {
  const lastDownload = await browser.driver.executeScript('return window.__lastDownload')
  assert.ok(lastDownload !== null)
  assert.ok(lastDownload.filename.startsWith('test-suite'))
  assert.ok(lastDownload.contents.length > 0)
})

Then('the editor applies javascript indentation rules', async function () {
  const languageId = await browser.driver.executeScript(
    'return window.monacoEditor.getModel().getLanguageId()'
  )
  assert.strictEqual(languageId, 'javascript')
})

Then('the downloaded file matches the generated test suite content', async function () {
  const lastDownload = await browser.driver.executeScript('return window.__lastDownload')
  const editorContent = await browser.driver.executeScript(
    'return window.monacoEditor.getValue()'
  )
  assert.strictEqual(lastDownload.contents, editorContent)
})

Then('the downloaded file includes the manual edits', async function () {
  const lastDownload = await browser.driver.executeScript('return window.__lastDownload')
  assert.ok(lastDownload.contents.includes(MANUAL_EDIT_MARKER))
})
