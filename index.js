const
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json());

app.listen(process.env.PORT || 4000, () => { console.log('listening on 4000')});

app.post('/webhook', (req,res,next) => {
  let body = req.body;
  if (body.object === 'page') {
    body.entry.forEach(function(entry){
      let webhookEvent = entry.messaging[0];
      console.log(webhookEvent);
    });
    res.status(200).send('EVENT_RECEIVED');
  }
  else{
    res.sendStatus(404);
  }
});

app.get('/webhook', (req,res) => {
  let verifyToken = "thisistoken";
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
