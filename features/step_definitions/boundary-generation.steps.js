import { Given, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { browser, APP_URL } from '../support/browser.js'
import { TD_WITH_NUMERIC_BOUNDS_PROPERTY, TD_WITH_NUMERIC_PROPERTY_NO_BOUNDS } from '../support/fixtures.js'
import { getGeneratedCode } from '../support/utils.js'

Given('I have loaded a Thing Description with numeric bounds in the editor', { timeout: 30000 }, async function () {
  await browser.driver.get(APP_URL)
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, 30000)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_NUMERIC_BOUNDS_PROPERTY
  )
})

Given('I have loaded a Thing Description without numeric bounds in the editor', { timeout: 30000 }, async function () {
  await browser.driver.get(APP_URL)
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, 30000)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_NUMERIC_PROPERTY_NO_BOUNDS
  )
})

Then('the generated code contains a test for the minimum boundary value {int}', async function (minValue) {
  const code = await getGeneratedCode()

  assert.ok(
    code.includes('minimumBoundary'),
    `Expected a test named with 'minimumBoundary' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify(${minValue})`) || code.includes(`body: JSON.stringify(${minValue})`),
    `Expected minimum boundary value ${minValue} in generated code`
  )
  assert.ok(
    code.includes('response.status, 200'),
    `Expected status 200 assertion for minimum boundary test`
  )
})

Then('the generated code contains a test for the maximum boundary value {int}', async function (maxValue) {
  const code = await getGeneratedCode()

  assert.ok(
    code.includes('maximumBoundary'),
    `Expected a test named with 'maximumBoundary' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify(${maxValue})`) || code.includes(`body: JSON.stringify(${maxValue})`),
    `Expected maximum boundary value ${maxValue} in generated code`
  )
  assert.ok(
    code.includes('response.status, 200'),
    `Expected status 200 assertion for maximum boundary test`
  )
})

Then('the generated code contains a test below the minimum with value {int} expecting status {int}', async function (belowMinValue, expectedStatus) {
  const code = await getGeneratedCode()

  assert.ok(
    code.includes('belowMinimum'),
    `Expected a test named with 'belowMinimum' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify(${belowMinValue})`) || code.includes(`body: JSON.stringify(${belowMinValue})`),
    `Expected below-minimum value ${belowMinValue} in generated code`
  )
  assert.ok(
    code.includes(`response.status, ${expectedStatus}`),
    `Expected status ${expectedStatus} assertion for below-minimum test`
  )
})

Then('the generated code contains a test above the maximum with value {int} expecting status {int}', async function (aboveMaxValue, expectedStatus) {
  const code = await getGeneratedCode()

  assert.ok(
    code.includes('aboveMaximum'),
    `Expected a test named with 'aboveMaximum' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify(${aboveMaxValue})`) || code.includes(`body: JSON.stringify(${aboveMaxValue})`),
    `Expected above-maximum value ${aboveMaxValue} in generated code`
  )
  assert.ok(
    code.includes(`response.status, ${expectedStatus}`),
    `Expected status ${expectedStatus} assertion for above-maximum test`
  )
})

Then('the generated code contains no boundary test variants', async function () {
  const code = await getGeneratedCode()

  assert.ok(
    !code.includes('minimumBoundary'),
    `Expected no minimumBoundary test in generated code`
  )
  assert.ok(
    !code.includes('belowMinimum'),
    `Expected no belowMinimum test in generated code`
  )
  assert.ok(
    !code.includes('maximumBoundary'),
    `Expected no maximumBoundary test in generated code`
  )
  assert.ok(
    !code.includes('aboveMaximum'),
    `Expected no aboveMaximum test in generated code`
  )
})
