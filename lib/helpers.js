'use strict'

let _ = require('lodash')
let Joi = require('joi')

let errors = require('./errors')

/**
 * Check if the provided action already exists
 * @param {Router} An instantiated Router instance
 * @param {Object} action The new action name
 * @throws {DuplicatedAction} If there's already an action registered with this name
 */
function checkDuplicatedAction (router, action) {
  if (router.actions[action]) {
    throw new errors.DuplicatedAction(action)
  }
}

/**
 * Checks if there's any action with equal global configurations
 * @param {Router} router An instantiated Router instance
 * @param {Object} config The configuration from the action that needs check
 * @throws {ConflictingGlobal} If there's an action with the same global configuration
 */
function checkConflictingGlobal (router, config) {
  if (config.global) {
    let exists = _.chain(router.actions)
    .values()
    .find({ global: config.global })
    .value()

    if (exists) {
      throw new errors.ConflictingGlobal(config.name, exists.name)
    }
  }
}

/**
 * Transforms an Alexa's request type into a router compatible type
 * @param {String} alexaType A valid Alexa's request type
 * @return {String} The router's counterpart
 */
function alexaTypeToRouterType (alexaType) {
  if (alexaType === 'IntentRequest') {
    return 'intent'
  } else if (alexaType === 'LaunchRequest') {
    return 'launch'
  } else if (alexaType === 'SessionEndedRequest') {
    return 'sessionEnded'
  } else {
    return 'unexpected'
  }
}

/**
 * Validates any data against a Joi schema and transforms the Joi error if needed
 * @param {Any} value The value to be validated
 * @param {Any} schema A valid Joi schema
 * @return {Any} The validated value
 * @throws {ValidationError} If the provided value fails on validation
 */
function validate (value, schema) {
  try {
    return Joi.attempt(value, schema)
  } catch (err) {
    throw new errors.ValidationError(err)
  }
}

module.exports = {
  checkConflictingGlobal,
  checkDuplicatedAction,
  alexaTypeToRouterType,
  validate
}
