Feature: Uploading a Thing Description

  Scenario: Uploading a JSON file
    When I upload a file "valid.json"
    Then I should see the file in the editor

  Scenario: Uploading a JSON-LD file
    When I upload a file "valid.jsonld"
    Then I should see the file in the editor

  Scenario: Uploading an unsupported file
    When I upload a file "invalid.txt"
    Then I should see an error message about unsupported file

  Scenario: Replacing the Thing Description
    When I upload a file "valid.json"
    And I upload a file "valid2.json"
    Then I should see the new file in the editor