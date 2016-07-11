'use strict'

/**
 * UnknownEvent class
 */
exports.UnknownEvent = class UnknownEvent extends Error {
  /**
   * Create a new UnknownEvent
   * @param {String} event Tried to use an unknown event
   * @constructs UnknownEvent
   */
  constructor (event) {
    let message = `The event ${event} is unknown and will never fire`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'UE01'
  }
}

/**
 * DuplicatedAction class
 */
exports.DuplicatedAction = class DuplicatedAction extends Error {
  /**
   * Create a new DuplicatedAction
   * @param {String} action The name of the action already registered
   * @constructs DuplicatedAction
   */
  constructor (action) {
    let message = `The action ${action} is already registered`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'DA01'
  }
}

/**
 * ConflictingAuto class
 */
exports.ConflictingAuto = class ConflictingAuto extends Error {
  /**
   * Create a new ConflictingAuto
   * @param {String} action The name of the action that have conflicting auto values
   * @constructs ConflictingAuto
   */
  constructor (action, conflictingAction) {
    let message = `The action ${action} is trying to register auto rules that conflics with ${conflictingAction}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'CA01'
  }
}

/**
 * ConflictingFlow class
 */
exports.ConflictingFlow = class ConflictingFlow extends Error {
  /**
   * Create a new ConflictingFlow
   * @param {String} action The name of the action that have conflicting auto values
   * @constructs ConflictingFlow
   */
  constructor (type, action) {
    let message = `Found multiple flows trying to run action ${action} when type is ${type}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'CF01'
  }
}

/**
 * RoutingFailed class
 */
exports.RoutingFailed = class RoutingFailed extends Error {
  /**
   * Create a new RoutingFailed
   * @param {String} id The request's id that failed to be routed
   * @param {String} type The request's type
   * @constructs RoutingFailed
   */
  constructor (id, type) {
    let message = `Unable to route request ${id} with type ${type}`
    super(message)

    this.name = this.constructor.name
    this.message = message
    this.code = 'RF01'
  }
}
