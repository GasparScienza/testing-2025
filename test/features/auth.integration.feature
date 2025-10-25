Feature: Endpoints de autenticación

  @integration
  Scenario: Signup exitoso setea cookie
    Given un payload válido de signup
    When hago POST "/auth/signup"
    Then recibo 201
    And la respuesta setea cookie "token"
    And el body no expone campos sensibles

  @integration
  Scenario: Login válido y logout
    Given un usuario existente con credenciales válidas
    When hago POST "/auth/login" con credenciales
    Then recibo 200 y cookie "token"
    When hago POST "/auth/logout" con la cookie
    Then la cookie "token" se invalida
    And acceder a "/auth/me" devuelve 401
# Feature: Endpoints de autenticación

#   @integration
#   Scenario: Signup exitoso setea cookie
#     Given un payload válido de signup
#     When hago POST "/auth/signup"
#     Then recibo 201
#     And la respuesta setea cookie "token"
#     And el body no expone campos sensibles

#   @integration
#   Scenario: Login válido y logout
#     Given un usuario existente con credenciales válidas
#     When hago POST "/auth/login"
#     Then recibo 200 y cookie "token"
#     When hago POST "/auth/logout" con la cookie
#     Then la cookie "token" se invalida
#     And acceder a "/me" devuelve 401