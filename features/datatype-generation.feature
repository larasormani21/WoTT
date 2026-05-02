Feature: DataType Test Generation

  Scenario: User generates tests for properties with declared data types
    Given I have loaded a Thing Description with properties with declared data types in the editor
    When I click on generate
    Then the generated tests should include test cases that verify the type of the response for each property

 Scenario: User generates tests for action input parameters with declared data types
    Given I have loaded a Thing Description with actions that have input parameters with declared data types in the editor
    When I click on generate
    Then the generated tests should include test cases that that verify that the submitted input matches the declared type

 Scenario: User generates tests for action output parameters with declared data types
    Given I have loaded a Thing Description with actions that have output parameters with declared data types in the editor
    When I click on generate
    Then the generated tests should include test cases that verify that the response type matches the declared type

  Scenario: User generates tests for a Thing Description with missing data type declarations
    Given I have loaded a Thing Description with no declared data types in the editor
    When I click on generate
    Then the generated tests shouldn't include type verification test cases