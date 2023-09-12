require('dotenv').config()
const { createBot, createProvider, createFlow } = require('@bot-whatsapp/bot')
const flujos = require("./flujos/Principal")
const TwilioProvider = require('@bot-whatsapp/provider/twilio')
const MongoAdapter = require('@bot-whatsapp/database/mongo')



/**
 * Declaramos las conexiones de Mongo y Twilio
**/

const MONGO_DB_URI = process.env.MONGO_DB_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;


const main = async () => {
    const adapterDB = new MongoAdapter({
        dbUri: MONGO_DB_URI,
        dbName: MONGO_DB_NAME,
    })
    const adapterFlow = createFlow([flujos.flowInicio,flujos.flowDespedida])
    const adapterProvider = createProvider(TwilioProvider, {
        accountSid: TWILIO_ACCOUNT_SID,
        authToken: TWILIO_AUTH_TOKEN,
        vendorNumber: '+5218261354156',
    })

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })

    
}

main()
