# alexa-router
[![Build Status](https://circleci.com/gh/estate/alexa-router.svg?style=shield)](https://circleci.com/gh/estate/alexa-router)
[![Code Climate](https://codeclimate.com/github/estate/alexa-router/badges/gpa.svg)](https://codeclimate.com/github/estate/alexa-router)
[![Test Coverage](https://codeclimate.com/github/estate/alexa-router/badges/coverage.svg)](https://codeclimate.com/github/estate/alexa-router/coverage)
[![Version](https://badge.fury.io/js/alexa-router.svg)](http://badge.fury.io/js/alexa-router)
[![Downloads](http://img.shields.io/npm/dm/alexa-router.svg)](https://www.npmjs.com/package/alexa-router)


## Why
`alexa-router` makes it easy for you to build custom [Alexa](https://developer.amazon.com/alexa)
skills with complex request/response flows.

## Install
```bash
$ npm install -S alexa-router
```

## Usage

`alexa-router` is available via an in instance of the `Router`. Make sure you begin by initializing the
`Router`.

```javascript
let Alexa = require('alexa-router')
let alexa = new Alexa.Router()
```

Once you intialize the router, you can either configure `actions` or `dispatch` a HTTP request to be
routed to the actions you have configured.

### `alexa.action`

Routes are defined via the `action` method

#### API

`alexa.action(name, config)`

##### name
*Required* <br>
Type: `string`

The action name. You can reference this action by its name when defining complex action flows.

##### config
*Required* <br>
Type: `object`

`config.handler(request[, params])` <br>
*Required* <br>
Type: `function`

The handler receives the HTTP request and optionally receives params if they were configured to
be passed by a previous action.

`config.global` <br>
*Optional* <br>
Type: `object`

Actions with the global key are accessible at any point in the routing flow. These actions can be
used to kick-off a new flow, interrupt an existing flow, etc. An action to help the user know what
commands are available or cancel the request are two examples for where you might use a global action.

`config.global.type` <br>
*Required* <br>
Type: `string`

One of 'intent', 'launch', 'sessionEnded', or 'unexpected'

`config.global.intent` <br>
*Required if type === 'intent'* <br>
Type: `string`

The custom or [built-in](https://developer.amazon.com/public/solutions/alexa/alexa-skills-kit/docs/implementing-the-built-in-intents)
intent that this action should be associated with. e.g. 'AMAZON.YesIntent'

#### Examples

A simple action that can be activated by an incoming intent
```javascript
alexa.action('global-hello', {
  handler: request => {...},
  global: {
    type: 'intent', // Could also be launch, sessionEnded or unexpected
    intent: 'AMAZON.YesIntent'
  }
})
```

You can also chain requests by responding with a list of possible actions that could be next in the interaction flow

```javascript
alexa.action('event-create', {
  handler: request => {
    let response = request.response()
    response.speech('What\'s the name of your event?')

    // You can define the next actions by passing an array of actions that can come next
    response.next([
      {
        type: 'intent',
        intent: 'EventName', // Custom intent
        action: 'event-create-name'
        params: { createdAt: new Date() } // Params will be passed to the `event-create-name` handler
      },
      {
        type: 'intent',
        intent: 'AMAZON.CancelIntent', // Built-in intent
        action: 'event-cancel'
      }
    ])

    // You can also pass an individual object and it will be merged with the previous ones
    response.next({
      type: 'unexpected',
      action: 'event-unexpected'
    })

    return response
  },

  global: {
    type: 'intent',
    intent: 'EventCreate' // Custom intent
  }
})

// This action does not have the global attribute so it can only be accessed if passed
// as a `next` action
alexa.action('event-create-name', {
  handler: (request, params) => {...}
})
```

### `alexa.dispatch`

The dispatch method takes a HTTP request and routes it to the appropriate action

#### API

`alexa.dispatch(requestBody)`

##### requestBody
*Required* <br>
Type: 'object'

The HTTP request body

### Understanding the routing mechanism

1. Check if the incoming request was configured with `next` actions
  1. If `next` actions are present, try to resolve the next action
  2. If no action was resolved, check for an `unexpected` type `next` option
2. If no next actions are present in the request's session, try to match a global action
3. If no global action was found try to find an `unexpected` global action
4. If no `unexpected` global action then throw `RoutingFailed`

### HTTP handling

`alexa-router` is HTTP server agnostic. This means that you can use it with
any Node.js library that can parse and reply JSON. An example using Express:

```javascript
let express = require('express')
let bodyParser = require('body-parser')
let Alexa = require('alexa-router')

let app = express()
let alexa = new Alexa.Router()

// Do all your routing configs
alexa.action('my-action', ...)

// Configure a route for passing JSON to alexa-router
app.post('/alexa/incoming', bodyParser.json(), (req, res) => {
  alexa.dispatch(req.body)
  .then(result => res.json(result))
  .catch(err => {
    res.send('Somthing bad happened...').status(500)
  })
})
```

### To-do

- [ ] Add plugin support
- [ ] Add more testing cases
- [ ] Build plugins for Express, Hapi, Restify (...)

### Testing

```bash
git clone https://github.com/estate/alexa-router && cd alexa-router
npm install && npm test
```
