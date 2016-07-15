# alexa-router

The `alexa-router` project allows you to easily develop custom skills for
Amazon's Alexa.

### Getting started

All you need to do is `npm install -s alexa-router` and you're already done
with the setup.

### Understanding actions

The router is configured through actions, next options and globals.

```javascript
let Alexa = require('alexa-router')
let alexa = new Alexa.Router()

// A simple action, note that the user would never be able to reach this
// action without being present in the next options of some response
alexa.action('hello-world', {
  handler: request => {
    let response = request.response()
    response.speech('Hello world!')

    return response
  }
})

// An action that can be activated by an incoming intent
alexa.action('global-hello', {
  handler: request => {...},
  global: {
    type: 'intent', // Could also be launch, sessionEnded or unexpected
    intent: 'AMAZON.YesIntent'
  }
})

// An action that can be activated by an incoming intent
alexa.action('here-be-dragons', {
  handler: request => {
    let response = request.response()
    response.speech('Sorry, you can\'t activate that command right now')
  }
})

// Finally, you can control the user options by setting the next available commands
alexa.action('say-the-weather', {
  handler: (request, params) => {
    let response = request.response()

    if (params.sayWeather) {
      response.speech('If you can\'t see the sky then it\'s probably cloudy')
      response.endSession(true)
    } else {
      response.speech('Would you like me to read the weather?')

      // The user can say yes
      response.next({
        type: 'intent',
        intent: 'AMAZON.YesIntent',
        action: 'say-the-weather', // call me again
        params: { sayWeather: yes } // Will be passed as the parameters if the user says Yes
      })

      // If the user send another intent that isn't in the options they will be
      // routed to here-be-dragons in the next interaction. You can also
      // pass an array of next options for convenience response.next([...])
      // Calling next will always merge new next options with previous ones
      response.next({
        type: 'unexpected',
        action: 'here-be-dragons'
      })
    }

    // Reply with the response or a promise that resolves to the response
    return response
  }
})
```

### Understanding the routing mechanism

How the internal router works?

1. Check if the incoming request has next options
  1. If next options are present try to resolve the next action
  2. If no action was resolved see if there's an `unexpected` next configured
  3. If there's no `unexpected` next then try to find a global `unexpected`
  4. If no global `unexpected` then throw `RoutingFailed` error
2. If no next options are present in the request's session then try to match a global action
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

// Configure a route for passing a JSON to alexa-router and reply with a JSON too
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
