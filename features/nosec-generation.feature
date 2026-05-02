Feature: Test generation for services with no security

  Scenario: Generate tests for a service with no security
    When I enter a Thing Description with nosec security scheme
    And I click on generate
    Then the generated test suite code is displayed
    And the generated tests contain no Authorization header
    And the generated tests contain no API key parameter
