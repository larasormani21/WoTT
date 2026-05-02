Feature: ReadProperty Test Generation

  Scenario: User generates tests for readproperty operations
    Given I have loaded a Thing Description with readproperty in the editor
    When I click on generate
    Then the generated tests should contain GET requests to the property endpoints

  Scenario: No GET read tests generated for write-only properties
    Given I have loaded a Thing Description with only write-only properties
    When I click on generate
    Then no read tests should be generated
