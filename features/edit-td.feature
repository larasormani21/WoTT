Feature: Editing a Thing Description

    Scenario: Writing a Thing Description
        Given The TD editor is empty
        When I write in the editor
        Then I should see the content in real time

    Scenario: Modifying a Thing Description
        Given I upload a file "valid.json"
        When I write in the editor
        Then I should see the updated content in real time

    Scenario: Trying to continue with an empty editor
        Given The TD editor is empty
        When I click on generate
        Then I should not be able to continue