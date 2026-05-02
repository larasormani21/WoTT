Feature: Online Test Suite Editor

  Background:
    Given I have generated a test suite from the Thing Description

  Scenario: User edits the generated test suite
    When I write in the test suite editor
    Then I should see the changes in the test suite editor in real time

  Scenario: User downloads the generated test suite
    When I click the Download button
    Then the test suite should be saved locally

  Scenario: Auto-indentation consistent with the language
    Given the selected language is javascript
    When I write in the test suite editor
    Then the editor applies javascript indentation rules

  Scenario: User downloads the test suite without edits
    When I click the Download button
    Then the downloaded file matches the generated test suite content

  Scenario: User downloads the test suite after manual edits
    When I manually edit the test suite content
    And I click the Download button
    Then the downloaded file includes the manual edits
