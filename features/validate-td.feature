Feature: Thing Description validation
 Scenario: Validation of a valid Thing Description
  Given I upload a file "valid.json"
  When I click on validate
  Then I should see a message confirming the validation of the Thing Description
   
 Scenario: Validating a Thing Description with Invalid JSON Syntax
  When I upload a file "invalid.json"
  Then the "Validate" button is disabled
    
 Scenario: Validating a Thing Description with Missing Required Fields
  Given I upload a file "nocontext.json"
  When I click on validate
  Then I should see a message confirming the invalidation of the Thing Description
  And I should see an error message about the missing required field

 Scenario: Validating a Thing Description with Wrong data type
  Given I upload a file "invalidcontext.json"
  When I click on validate
  Then I should see a message confirming the invalidation of the Thing Description
  And I should see an error message about the invalid type

 Scenario: Requesting validation without a Thing Description loaded
  Given The TD editor is empty
  When I click on validate
  Then the "Validate" button is disabled 