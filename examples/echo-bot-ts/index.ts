// Import all dependencies, mostly using destructuring for better view.
import { ClientConfig, Client, middleware, MiddlewareConfig, WebhookEvent, TextMessage, MessageAPIResponseBase } from '@line/bot-sdk';
import axios from 'axios';
import express, { Application, Request, Response } from 'express';

// Setup all LINE client and Express configurations.
const clientConfig: ClientConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.CHANNEL_SECRET,
};

const middlewareConfig: MiddlewareConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET || '',
};

const PORT = process.env.PORT || 3000;

// Create a new LINE SDK client.
const client = new Client(clientConfig);

// Create a new Express application.
const app: Application = express();

// Function handler to receive the text.
const textEventHandler = async (event: WebhookEvent): Promise<MessageAPIResponseBase | undefined> => {
  // Process all variables here.
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  // Process all message related variables here.
  //const { replyToken } = event;
  //const { text } = event.message;


  //Get dad joke
  let config = { headers:{Accept: 'application/json'} }
  const address = 'https://icanhazdadjoke.com/';
  
  const getDadJoke = async() => {
      try{
        const res = await axios.get(address, config)
        return res.data.joke;
      } catch(e) {
          return "No jokes available! Thank god!";
      }
  }

  //Get horroscope
  const getHoroscope = async(search_term : any) => {
    try{
      const res = await axios.get(`http://horoscope-api.herokuapp.com/horoscope/today/${search_term}`);
      return res.data.horoscope.toString();
    } catch(e) {
        return "No horrorscopes available! Thank god!";
    }
}






  let text;
  // Process all message related variables here.
  const { replyToken } = event;
  //const { text } = event.message;
  //if(event.message.toString().includes('jo'))
    let temp = event.message.toString();

    if(event.message.text.toLowerCase().includes('joke')){
      text  = `${await getDadJoke()}`;
    }

    else if(event.message.text.toLowerCase().includes('hor')){
      console.log("horrorscope requested");
      let sign_input = temp.substr(temp.indexOf(' ')+1);
      getHoroscope(sign_input).then(text => console.log(text));
      return text;
    }

    else
      return;


  // Create a new message.
  const response: TextMessage = {
    type: 'text',
    text,
  };




  // Reply to the user.
  await client.replyMessage(replyToken, response);
};

// Register the LINE middleware.
// As an alternative, you could also pass the middleware in the route handler, which is what is used here.
// app.use(middleware(middlewareConfig));

// Route handler to receive webhook events.
// This route is used to receive connection tests.
app.get(
  '/',
  async (_: Request, res: Response): Promise<Response> => {
    return res.status(200).json({
      status: 'success',
      message: 'Connected successfully!',
    });
  }
);

// This route is used for the Webhook.
app.post(
  '/webhook',
  middleware(middlewareConfig),
  async (req: Request, res: Response): Promise<Response> => {
    const events: WebhookEvent[] = req.body.events;

    // Process all of the received events asynchronously.
    const results = await Promise.all(
      events.map(async (event: WebhookEvent) => {
        try {
          await textEventHandler(event);
        } catch (err: unknown) {
          if (err instanceof Error) {
            console.error(err);
          }

          // Return an error message.
          return res.status(500).json({
            status: 'error',
          });
        }
      })
    );

    // Return a successfull message.
    return res.status(200).json({
      status: 'success',
      results,
    });
  }
);

// Create a server and listen to it.
app.listen(PORT, () => {
  console.log(`Application is live and listening on port ${PORT}`);
});
