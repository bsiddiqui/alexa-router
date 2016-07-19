'use strict'

let _ = require('lodash')
let Joi = require('joi')
let url = require('url')
let path = require('path')
let request = require('request-promise')
let crypto = require('crypto')
let x509 = require('x509')

let helpers = require('./helpers')
let Request = require('./request')
let errors = require('./errors')

/**
 * The main AlexaRouter class
 */
class AlexaRouter {
  /**
   * Instantiates AlexaRouter and creates an empty routing table
   * @constructs AlexaRouter
   * @param {Object} config
   * @param {String[]} config.appId Your application ID or an array with many IDs
   * @param {Boolean} [config.routeIntentOnly=true] Only deal with intent requests
   * @param {Boolean} [config.verifySignature=true] Whenever to validate the request's signature
   * @param {Boolean} [config.verifyTimestamp=true] Whenever to validate the request's timestamp
   * @param {Boolean} [config.verifyApplication=true] Whenever to validate the request's application ID
   */
  constructor (config) {
    this.config = helpers.validate(config, Joi.object({
      appId: Joi.array().items(Joi.string()).single().required(),
      routeIntentOnly: Joi.bool().default(true),
      verifySignature: Joi.bool().default(true),
      verifyTimestamp: Joi.bool().default(true),
      verifyApplicationId: Joi.bool().default(true)
    }))

    this.actions = {}
    this.certs = {}
  }

  /**
   * Registers a new action into the router
   * @param {String} name The action's name
   * @param {Object} config
   * @param {Function} config.handler The main handler of the action
   * @param {Object} [config.global] Additional global configurations
   * @param {String} [config.global.type] The global type to be matched
   * @param {String} [config.global.intent] The intent name if any
   * @return {[type]} [description]
   */
  action (name, config) {
    helpers.checkDuplicatedAction(this, name)

    config = helpers.validate(config, Joi.object({
      handler: Joi.func().required(),
      global: Joi.object({
        type: Joi.only('launch', 'intent', 'sessionEnded', 'unexpected').required(),
        intent: Joi.when('type', {
          is: 'intent',
          then: Joi.string().required(),
          otherwise: Joi.forbidden()
        })
      }).optional()
    }))

    config.name = name
    helpers.checkConflictingGlobal(this, config)
    this.actions[name] = config
  }

  /**
   * Dispatches an Alexa request through the router
   * @param {Object} alexaData A valid Alexa request
   * @param {Object} headers The headers present in the incoming request
   * @return {Promise(Response)} A promise that resolves to a Response instance
   */
  dispatch (alexaData, headers) {
    return new Promise((resolve, reject) => {
      let request = new Request(alexaData, this)
      Promise.resolve(this._checkSignature(alexaData, headers))
      .then(() => {
        if (this.config.routeIntentOnly && request.type !== 'intent') {
          return {}
        } else {
          return this._actionDiscovery(request)()
        }
      })
      .then(resolve, reject)
    })
  }

  /**
   * Detects which action should be triggered
   * @private
   * @param {Request} request A Request instance
   * @return {Function} An handler ready to be executed
   * @throws {RoutingFailed} If not able to route a request
   */
  _actionDiscovery (request) {
    let next = request.next()

    if (next) {
      let search = { type: request.type }

      if (request.type === 'intent') {
        search.intent = request.intent.name
      }

      let action = _.find(next, search)

      if (action) {
        return this.actions[action.action].handler.bind(null, request, action.params)
      } else {
        let unexpected = _.find(next, { type: 'unexpected' })

        if (unexpected) {
          return this.actions[unexpected.action].handler.bind(null, request, unexpected.params)
        } else {
          let unexpected = _.find(this.actions, {
            global: { type: 'unexpected' }
          })

          if (unexpected) {
            return unexpected.handler.bind(null, request)
          }
        }
      }
    }

    let search = {
      global: { type: request.type }
    }

    if (request.type === 'intent') {
      search.global.intent = request.intent.name
    }

    let action = _.find(this.actions, search) || _.find(this.actions, {
      global: { type: 'unexpected' }
    })

    if (action) {
      return action.handler.bind(null, request)
    } else {
      throw new errors.RoutingFailed(request.id, request.type)
    }
  }

  /**
   * Check, retrieve and cache certificates from Amazon
   * @param {String} uri The certificate's URI
   * @throws {InvalidCertificateUri} If the URI is untrusted
   * @return {Promise(String)} A promise that resolves to the certificate
   */
  _retrieveCertificate (uri) {
    let uriData = url.parse(uri)

    return new Promise((resolve, reject) => {
      if (this.certs[uri]) {
        return resolve(this.certs[uri])
      } else if (uriData.protocol.toLowerCase() !== 'https:' ||
        uriData.hostname.toLowerCase() !== 's3.amazonaws.com' ||
        !path.normalize(uriData.path).startsWith('/echo.api/') ||
        (uriData.port !== null && uriData.port !== '443')) {
        reject(new errors.InvalidCertificateUri(uri))
      } else {
        this.certs[uri] = request.get(uri)
        .then(cert => this._checkCert(cert))

        return resolve(this.certs[uri])
      }
    })
  }

  /**
   * Check if the certificate is valid
   * @param {String} cert The certificate to be validated
   * @throws {InvalidCertificate} If cert is invalid
   * @return {String} The cert
   */
  _checkCert (cert) {
    let date = new Date()
    let data

    try {
      data = x509.parseCert(cert)
    } catch (_) {
      throw new errors.InvalidCertificate()
    }

    // TODO find a way to test this with a custom certificate
    /* $lab:coverage:off$ */
    if (new Date(data.notBefore) >= date ||
      new Date(data.notAfter) <= date ||
      data.altNames.indexOf('echo-api.amazon.com') === -1) {
      throw new errors.InvalidCertificate()
    } else {
      return cert
    }
    /* $lab:coverage:on$ */
  }

  /**
   * Check if the incoming request have a valid timestamp
   * @param {Object} payload The incoming payload
   * @throws {ExpiredRequest} If the request have an invalid timestamp
   */
  _checkTimestamp (payload) {
    let limit = new Date(new Date().getTime() - 15 * 1000)

    if (this.config.verifyTimestamp === true && new Date(payload.request.timestamp) < limit) {
      throw new errors.ExpiredRequest()
    }
  }

  /**
   * Check if the request have a valid application id
   * @param {Object} payload The incoming payload
   * @throws {InvalidApplicationId} If the request have an invalid application ID
   */
  _checkAppId (payload) {
    if (this.config.verifyApplicationId === true &&
      this.config.appId.indexOf(payload.session.application.applicationId) === -1) {
      throw new errors.InvalidApplicationId()
    }
  }

  /**
   * Check the signature of the incoming request to make sure it's from Amazon
   * @param {Object} payload The incoming payload
   * @param {Object} headers The headers present in the original request
   * @throws {InvalidSignature} If the request have an invalid signature
   * @return {Promise} A promise that resolves if the requests is valid
   */
  _checkSignature (payload, headers) {
    if (this.config.verifySignature === true) {
      return this._retrieveCertificate(headers['signaturecertchainurl'])
      .then(cert => {
        let verify = crypto.createVerify('RSA-SHA1')
        verify.write(JSON.stringify(payload))

        if (!verify.verify(new Buffer(cert), new Buffer(headers.signature, 'base64'))) {
          throw new errors.InvalidSignature()
        } else {
          this._checkTimestamp(payload)
          this._checkAppId(payload)
        }
      })
    } else {
      return Promise.resolve()
    }
  }
}

module.exports = AlexaRouter
