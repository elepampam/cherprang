const
  express = require('express'),
  bodyParser = require('body-parser'),
  token = require('./token'),
  pageAccessToken = token.pageAccessToken,
  request = require('request'),
  app = express().use(bodyParser.json());

app.listen(process.env.PORT || 4000, () => { console.log('listening on 4000')});

// Handles messages events
function handleMessage(sender_psid, received_message) {

    let response;

    // Check if the message contains text
    if (received_message.text) {

      // Create the payload for a basic text message
      response = {
        "text": `You sent the message: "${received_message.text}". Now send me an image!`
      }
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

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
        handlePostback(senderPsid, webhook_event.postback);
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
