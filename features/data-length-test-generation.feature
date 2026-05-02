Feature: Boundary Test Generation for Data Length

  Background:
    Given I have loaded a Thing Description with data length bounds in the editor
    And I select "javascript" as the target language

  Scenario: Boundary test for minLength value
    When I click on generate
    Then the generated code contains a test for the minLength boundary value 5

  Scenario: Boundary test for maxLength value
    When I click on generate
    Then the generated code contains a test for the maxLength boundary value 20

  Scenario: Boundary test below minLength
    When I click on generate
    Then the generated code contains a test below the minLength with value 4 expecting status 400

  Scenario: Boundary test above maxLength
    When I click on generate
    Then the generated code contains a test above the maxLength with value 21 expecting status 400

  Scenario: No boundary tests when TD has no data length bounds
    Given I have loaded a Thing Description without data length bounds in the editor
    When I click on generate
    Then the generated code contains no data length boundary test variants
