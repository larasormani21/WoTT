Feature: WriteProperty Test Generation

  Scenario: User generates tests for writeproperty operations
    Given I have loaded a Thing Description with writeproperty in the editor
    When I click on generate
    Then the generated tests should contain PUT requests with a request body

  Scenario: No write tests for read-only properties
    Given I have loaded a Thing Description with only read-only properties
    When I click on generate
    Then no write tests should be generated