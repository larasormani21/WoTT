Feature: Linting of Thing Descriptions

 Scenario: Real-time linting on valid content
  Given: The TD editor is empty
  When: I write a syntactically correct JSON content
  Then: I shouldn't see any errors highlighted in the editor

 Scenario: Real-time linting on invalid content
  Given: The TD editor is empty
  When: I write syntactically incorrect JSON content
  Then: I should see errors highlighted in the editor

 Scenario: Linting on content uploaded from a valid file
  Given: The TD editor is empty
  When: I upload a file "valid.json"
  Then: I shouldn't see any errors highlighted in the editor

 Scenario: Linting on content uploaded from an invalid file
  Given: The TD editor is empty
  When: I upload a file "invalid.json"
  Then: I should see no errors highlighted in the editor
  And: Each error should have its own descriptive message

 Scenario: Correcting a syntax error
  Given: There is a JSON syntax error in the editor
  When: I correct the error
  Then: I shouldn't see any errors highlighted in the editor

 Scenario: Linting does not block writing
  Given: There is a JSON syntax error in the editor
  When: I continue writing to the file
  Then: I should be able to edit the contents of the editor
  And: I should see errors highlighted in the editor