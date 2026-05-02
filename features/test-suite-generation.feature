Feature: Test Suite Generation from Thing Description

  Scenario: User generates a JavaScript test suite from a valid Thing Description
    When I enter a valid Thing Description JSON
    And I click on generate
    Then the generated test suite code is displayed

  Scenario: User submits a Thing Description with no testable elements
    When I enter a Thing Description with no properties or actions
    And I click on generate
    Then a message indicates no testable elements were found

  Scenario: Generate button is disabled for invalid JSON input
    When I enter invalid JSON text
    Then the "Generate" button is disabled
