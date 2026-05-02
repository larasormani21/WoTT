import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { browser } from '../support/browser.js'

Given('There is a JSON syntax error in the editor', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript(`       return window.monacoEditor !== undefined;
    `)
  }, 5000)

  await browser.driver.executeScript(`     window.monacoEditor.setValue('{"test": "JSON syntax error');}');
  `)

  await browser.driver.sleep(300)
})

When('I write a syntactically correct JSON content', async function () {
    await browser.driver.wait(async () => {
        return await browser.driver.executeScript(`       return window.monacoEditor !== undefined;
    `)
    }, 5000)

    await browser.driver.executeScript(`     window.monacoEditor.setValue('{"test" "valid"}');
  `)

    await browser.driver.sleep(300)
})

When('I write a syntactically incorrect JSON content', async function () {
    await browser.driver.wait(async () => {
        return await browser.driver.executeScript(`       return window.monacoEditor !== undefined;
    `)
    }, 5000)

    await browser.driver.executeScript(`     window.monacoEditor.setValue('{"test: "invalid');
  `)

    await browser.driver.sleep(300)
})

When('I correct the error', async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript(`       return window.monacoEditor !== undefined;
    `)
  }, 5000)

  await browser.driver.executeScript(`     window.monacoEditor.setValue('{"test": "JSON syntax error"}');
  `)

  await browser.driver.sleep(300)
})

When('I continue writing to the file', async function () {
  await browser.driver.executeScript(`
    const currentVal = window.monacoEditor.getValue();
    window.monacoEditor.setValue(currentVal + "\\n 'still_error': true");
  `);
  await browser.driver.sleep(500);
});

Then('I should see errors highlighted in the editor', async function () {
    await browser.driver.wait(async () => {
        const errorCount = await browser.driver.executeScript(`

      const markers = monaco.editor.getModelMarkers({ owner: 'json' });

      return markers.filter(m => m.severity === 8).length;

    `);

        return errorCount > 0;

    }, 5000, "No errors found in Monaco Editor");

})

Then("I shouldn't see any errors highlighted in the editor", async function () {
  await browser.driver.sleep(500);
  const errors = await browser.driver.executeScript(`
    const markers = monaco.editor.getModelMarkers({ owner: 'json' });
    return markers.filter(m => m.severity === 8).map(m => m.message);
  `);

  assert.strictEqual(errors.length, 0, `Found : ${errors.join(", ")} errors.`);
});

Then('Each error should have its own descriptive message', async function () {
  const messages = await browser.driver.executeScript(`
    const markers = monaco.editor.getModelMarkers({ owner: 'json' });
    return markers.filter(m => m.severity === 8).map(m => m.message);
  `);

  assert.ok(messages.length > 0, "No error messages found.");
  messages.forEach(msg => {
    assert.ok(msg && msg.length > 0, "Found an error without a descriptive message.");
    console.log("Found error: " + msg);
  });
});

Then('I should be able to edit the contents of the editor', async function () {
  const canEdit = await browser.driver.executeScript(`
    const isReadOnly = window.monacoEditor.getRawOptions().readOnly;
    const oldVal = window.monacoEditor.getValue();
    window.monacoEditor.setValue(oldVal + " ");
    return !isReadOnly;
  `);

  assert.strictEqual(canEdit, true, "The editor seems to be read-only or blocked.");
});