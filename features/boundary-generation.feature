Feature: Boundary Test Generation for Numeric Properties

  Background:
    Given I have loaded a Thing Description with numeric bounds in the editor
    And I select "javascript" as the target language

  Scenario: Boundary test for minimum value
    When I click on generate
    Then the generated code contains a test for the minimum boundary value 10

  Scenario: Boundary test for maximum value
    When I click on generate
    Then the generated code contains a test for the maximum boundary value 100

  Scenario: Boundary test below minimum
    When I click on generate
    Then the generated code contains a test below the minimum with value 9 expecting status 400

  Scenario: Boundary test above maximum
    When I click on generate
    Then the generated code contains a test above the maximum with value 101 expecting status 400

  Scenario: No boundary tests when TD has no numeric bounds
    Given I have loaded a Thing Description without numeric bounds in the editor
    When I click on generate
    Then the generated code contains no boundary test variants
