Feature: Encolar turnos

  Background:
    Given la app Nest inicializada

  @integration
  Scenario: Enqueue válido retorna 201 y encola job
    Given tengo un usuario autenticado
    And un payload válido de turno para "2026-11-06" de "10:00" a "11:00" en "America/Argentina/Buenos_Aires"
    When hago POST "/date/enqueue" con el payload
    Then recibo 201
    And el body tiene propiedad "jobId"
    And la queue "date" recibió un job "create-date"

  @integration
  Scenario: Rechaza fecha no ISO
    Given tengo un usuario autenticado
    And un payload válido de turno para "2026-11-06" de "10:00" a "11:00" en "America/Argentina/Buenos_Aires"
    When hago POST "/date/enqueue" con el payload
    Then recibo 400
    And el mensaje de error contiene "YYYY-MM-DD"

  @integration
  Scenario Outline: Rechaza horarios inválidos
    Given tengo un usuario autenticado
    And un payload válido de turno para "<day>" de "<start>" a "<end>" en "America/Argentina/Buenos_Aires"
    When hago POST "/date/enqueue" con el payload
    Then recibo 400
    And el mensaje de error contiene "<msg>"

    Examples:
      | day         | start | end   | msg                                        |
      | 2025-11-05  | 11:00 | 10:59 | endTime debe ser mayor que startTime       |

  @integration
  Scenario: Rechaza turno en el pasado
    Given tengo un usuario autenticado
    And un payload válido de turno para "2025-10-01" de "09:00" a "10:00" en "America/Argentina/Buenos_Aires"
    When hago POST "/date/enqueue" con el payload
    Then recibo 400
    And el mensaje de error contiene "anterior a la actual"
