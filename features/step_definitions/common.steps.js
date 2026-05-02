import { Given, When, Then } from "@cucumber/cucumber";
import { By } from "selenium-webdriver";
import assert from "node:assert/strict";
import path from "node:path";
import { browser } from "../support/browser.js";

Given("The TD editor is empty", async function () {
  await browser.driver.wait(async () => {
    return await browser.driver.executeScript(`
      return window.monacoEditor !== undefined;
    `);
  }, 5000);

  await browser.driver.executeScript(`
    window.monacoEditor.setValue('');
  `);
});

When("I upload a file {string}", async function (fileName) {
  const absoluteFilePath = path.resolve("files", fileName);

  const fileInputElement = await browser.driver.findElement(
    By.css('input[type="file"]'),
  );

  await browser.driver.executeScript(
    'arguments[0].value = "";',
    fileInputElement,
  );

  await fileInputElement.sendKeys(absoluteFilePath);

  await browser.driver.sleep(300);
});

When("I click on generate", async function () {
  const button = await browser.driver.findElement(
    By.xpath("//button[contains(., 'Generate')]"),
  );

  const isDisabled = await button.getAttribute("disabled");

  if (!isDisabled) {
    await button.click();
  }
});

Then("the {string} button is disabled", async function (buttonText) {
  const button = await browser.driver.findElement(
    By.xpath(`//button[contains(., '${buttonText}')]`),
  );

  const disabled = await button.getAttribute("disabled");

  assert.ok(disabled !== null);
});
