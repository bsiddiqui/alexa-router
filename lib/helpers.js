'use strict'

let _ = require('lodash')

let errors = require('./errors')

function checkUnknownEvent (router, event) {
  if (!router.events[event]) {
    throw new errors.UnknownEvent(event)
  }
}

function checkDuplicatedAction (router, action) {
  if (router.actions[action]) {
    throw new errors.DuplicatedAction(action)
  }
}

function checkConflictingAuto (router, config) {
  if (config.auto) {
    let exists = _.chain(router.action)
    .values()
    .find({ auto: config.auto })
    .value()

    if (exists) {
      throw new errors.ConflictingAuto(config.name, exists.name)
    }
  }
}

function checkConflictingFlow (config, flow) {
  if (_.find(flow, { type: config.type, action: config.action })) {
    throw new errors.ConflictingFlow(config.type, config.action)
  }
}

function alexaTypeToRouterType (alexaType) {
  if (alexaType === 'IntentRequest') {
    return 'intent'
  } else if (alexaType === 'LaunchRequest') {
    return 'launch'
  } else if (alexaType === 'sessionEndedRequest') {
    return 'sessionEnded'
  } else {
    return 'unexpected'
  }
}

module.exports = {
  checkUnknownEvent,
  checkConflictingAuto,
  checkDuplicatedAction,
  checkConflictingFlow,
  alexaTypeToRouterType
}
