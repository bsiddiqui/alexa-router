'use strict'

let Joi = require('joi')

const INTENT_TYPE_SCHEMA = Joi.when('type', {
  is: 'intent',
  then: Joi.string().required(),
  otherwise: Joi.forbidden()
})

module.exports = {
  INTENT_TYPE_SCHEMA
}
