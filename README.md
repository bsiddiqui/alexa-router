# alexa-router

We should probably find a better name for it

```javascript
  let alexa = new AlexaRouter()

  // Register all routing somehow, this is just an example
  // alexa.route('myIntent', () => {}, { some: 'config' })
  // alexa.route('404Intent', () => {})

  // Process a request to the routing system. This request can arrive from
  // anywhere so we can easily make it framework agnostic
  alexa.dispatch({
    "version": "string",
    "session": {
      "new": boolean,
      "sessionId": "string",
      "application": {
        "applicationId": "string"
      },
      "attributes": {
        "string": object
      },
      "user": {
        "userId": "string",
        "accessToken": "string"
      }
    },
    "request": {
      "type": "IntentRequest",
      "requestId": "string",
      "timestamp": "string",
      "intent": {
        "name": "string",
        "slots": {
          "string": {
            "name": "string",
            "value": "string"
          }
        }
      }
    }
  })
  .then((result) => {
    // Here we already a full Alexa response, you can use use pretty much
    // anything you like to reply to Alexa
    console.log(result)
  })
```

Example using Express

```javascript
let express = require('express')
let AlexaRouter = require('alexa-router')

let json = require('body-parser').json()
let app = express()
let alexa = new AlexaFramework()

app.post('/alexa/income', json, (req, res) => {
  alexa.dispatch(req.body)
  .then((result) => res.json(result))
})

app.listen(8080)
```
