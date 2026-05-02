import { Given, Then } from '@cucumber/cucumber'
import assert from 'node:assert/strict'
import { browser, APP_URL } from '../support/browser.js'
import { TD_WITH_DATA_LENGTH_BOUNDS_PROPERTY, TD_WITH_STRING_PROPERTY_NO_BOUNDS } from '../support/fixtures.js'
import { getGeneratedCode, buildStringOfLength } from '../support/utils.js'

Given('I have loaded a Thing Description with data length bounds in the editor', { timeout: 30000 }, async function () {
  await browser.driver.get(APP_URL)
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, 30000)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_DATA_LENGTH_BOUNDS_PROPERTY
  )
})

Given('I have loaded a Thing Description without data length bounds in the editor', { timeout: 30000 }, async function () {
  await browser.driver.get(APP_URL)
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript('return window.monacoEditor !== undefined')
  }, 30000)

  await browser.driver.executeScript(
    'window.monacoEditor.setValue(arguments[0])',
    TD_WITH_STRING_PROPERTY_NO_BOUNDS
  )
})

Then('the generated code contains a test for the minLength boundary value {int}', async function (minValue) {
  const code = await getGeneratedCode()
  const minValueString = buildStringOfLength(minValue)

  assert.ok(
    code.includes('minLengthBoundary'),
    `Expected a test named with 'minLengthBoundary' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify("${minValueString}")`) || code.includes(`body: JSON.stringify("${minValueString}")`),
    `Expected minLength boundary value ${minValue} in generated code`
  )
  assert.ok(
    code.includes('response.status, 200'),
    `Expected status 200 assertion for minLength boundary test`
  )
})

Then('the generated code contains a test for the maxLength boundary value {int}', async function (maxValue) {
  const code = await getGeneratedCode()
  const maxValueString = buildStringOfLength(maxValue)

  assert.ok(
    code.includes('maxLengthBoundary'),
    `Expected a test named with 'maxLengthBoundary' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify("${maxValueString}")`) || code.includes(`body: JSON.stringify("${maxValueString}")`),
    `Expected maxLength boundary value ${maxValue} in generated code`
  )
  assert.ok(
    code.includes('response.status, 200'),
    `Expected status 200 assertion for maxLength boundary test`
  )
})

Then('the generated code contains a test below the minLength with value {int} expecting status {int}', async function (belowMinValue, expectedStatus) {
  const code = await getGeneratedCode()
  const belowMinValueString = buildStringOfLength(belowMinValue)

  assert.ok(
    code.includes('belowMinLength'),
    `Expected a test named with 'belowMinLength' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify("${belowMinValueString}")`) || code.includes(`body: JSON.stringify("${belowMinValueString}")`),
    `Expected below-minLength value ${belowMinValue} in generated code`
  )
  assert.ok(
    code.includes(`response.status, ${expectedStatus}`),
    `Expected status ${expectedStatus} assertion for below-minLength test`
  )
})

Then('the generated code contains a test above the maxLength with value {int} expecting status {int}', async function (aboveMaxValue, expectedStatus) {
  const code = await getGeneratedCode()
  const aboveMaxValueString = buildStringOfLength(aboveMaxValue)

  assert.ok(
    code.includes('aboveMaxLength'),
    `Expected a test named with 'aboveMaxLength' in generated code`
  )
  assert.ok(
    code.includes(`JSON.stringify("${aboveMaxValueString}")`) || code.includes(`body: JSON.stringify("${aboveMaxValueString}")`),
    `Expected above-maxLength value ${aboveMaxValue} in generated code`
  )
  assert.ok(
    code.includes(`response.status, ${expectedStatus}`),
    `Expected status ${expectedStatus} assertion for above-maxLength test`
  )
})

Then('the generated code contains no data length boundary test variants', async function () {
  const code = await getGeneratedCode()

  assert.ok(
    !code.includes('minLengthBoundary'),
    `Expected no minLengthBoundary test in generated code`
  )
  assert.ok(
    !code.includes('belowMinLength'),
    `Expected no belowMinLength test in generated code`
  )
  assert.ok(
    !code.includes('maxLengthBoundary'),
    `Expected no maxLengthBoundary test in generated code`
  )
  assert.ok(
    !code.includes('aboveMaxLength'),
    `Expected no aboveMaxLength test in generated code`
  )
})
