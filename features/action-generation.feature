Feature: InvokeAction Test Generation

  Scenario: User generates tests for invokeaction operations with bindings
    Given I have loaded a Thing Description with invokeaction and binding with HTTP GET method in the editor
    When I click on generate
    Then the generated tests should contain GET requests

  Scenario: User generates tests for invokeaction operations without bindings
    Given I have loaded a Thing Description with invokeaction without bindings in the editor
    When I click on generate
    Then the generated tests should contain POST requests with a request body
    And I should see a warning about missing bindings for the action