Feature: Language Selection for Test Generation

  Scenario: Tests generation in JavaScript
    Given I have loaded a valid Thing Description in the editor
    When I select "javascript" as the target language
    And I click on generate
    Then the generated test suite is displayed in JavaScript
    And the generated test suite imports a JavaScript testing framework

  Scenario: Language selection changed
    Given I have loaded a valid Thing Description in the editor
    And I select "javascript" as the target language
    When I select "javascript" as the target language
    And I click on generate
    Then the generated test suite is displayed in JavaScript
