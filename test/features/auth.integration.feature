Feature: Endpoints de autenticación

  @integration
  Scenario: Signup exitoso setea cookie
    Given un payload válido de signup
    When hago POST "/auth/signup"
    Then recibo 201
    And la respuesta setea cookie "token"
    And el body no expone campos sensibles
