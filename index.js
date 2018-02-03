const
  express = require('express'),
  bodyParser = require('body-parser'),
  token = require('./token'),
  pageAccessToken = token.pageAccessToken,
  axios = require('axios'),
  request = require('request'),
  app = express().use(bodyParser.json());

app.listen(process.env.PORT || 4000, () => { console.log('listening on 4000')});

function handleDigimon(senderPsid, digimonName){
  axios.get(`https://uofdmo-api.herokuapp.com/digimon/${digimonName}`)
  .then(res => {
    response = {
      "attachment": {
        "type": "template",
        "payload": {
          "template_type": "generic",
          "elements": [{
            "title": res.data.data.info.name.english.toUpperCase(),
            "subtitle": "Atribute: "+res.data.data.info.attribute.name+"<br />element: "+res.data.data.info.element.name,
            "image_url": res.data.data.info.image,
            "buttons": [
              {
                "type": "postback",
                "title": "Yes!",
                "payload": "yes",
              },
              {
                "type": "postback",
                "title": "No!",
                "payload": "no",
              }
            ],
          }]
        }
      }
    }
    callSendAPI(senderPsid, response);
  })
  .catch(err => {
    console.log(err)
  })
}

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {
      let text = received_message.text.split('#')
      if (text[0].toLowerCase() === 'digimon') {
        handleDigimon(sender_psid, text[1])
      }
      else{
        response = {
          "text": `You sent the message: "${received_message.text}". Now send me an image!`
        }
      }
      // Create the payload for a basic text message
    }
    else if (received_message.attachments) {

      // Gets the URL of the message attachment
      let attachment_url = received_message.attachments[0].payload.url;
      response = {
        "attachment": {
          "type": "template",
          "payload": {
            "template_type": "generic",
            "elements": [{
              "title": "Is this the right picture?",
              "subtitle": "Tap a button to answer.",
              "image_url": attachment_url,
              "buttons": [
                {
                  "type": "postback",
                  "title": "Yes!",
                  "payload": "yes",
                },
                {
                  "type": "postback",
                  "title": "No!",
                  "payload": "no",
                }
              ],
            }]
          }
        }
      }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {
  let response;

 // Get the payload for the postback
 let payload = received_postback.payload;

 // Set the response based on the postback payload
 if (payload === 'yes') {
   response = { "text": "Thanks!" }
 } else if (payload === 'no') {
   response = { "text": "Oops, try sending another image." }
 }
 // Send the message to acknowledge the postback
 callSendAPI(sender_psid, response);
}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
 let request_body = {
   "recipient": {
     "id": sender_psid
   },
   "message": response
 }
 request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": pageAccessToken },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });
}


app.post('/webhook', (req,res,next) => {
  let body = req.body;
  if (body.object === 'page') {
    body.entry.forEach(function(entry){
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);

      let senderPsid = webhookEvent.sender.id;
      console.log('Sender PSID: ' + senderPsid)

      if (webhookEvent.message) {
        handleMessage(senderPsid, webhookEvent.message);
      } else if (webhookEvent.postback) {
        handlePostback(senderPsid, webhookEvent.postback);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  }
  else{
    res.sendStatus(404);
  }
});

app.get('/webhook', (req,res) => {
  let verifyToken = pageAccessToken;
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    }
    else{
      res.sendStatus(403);
    }
  }
});
