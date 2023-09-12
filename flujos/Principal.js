const { addKeyword } = require('@bot-whatsapp/bot')
const { postData } = require('../utils/getPolizaPDF.js')
const { FlowValidatePage } = require('twilio/lib/rest/studio/v2/flowValidate.js')

const usuarios = ["Juan"]

const flowCotizarAutos = addKeyword(['1', 'autos','auto', 'carro']).addAnswer(['📄 Aquí podrás cotizar autos', 'Entra a https://awy.com.mx/'])

const flowSiniestros = addKeyword(['siniestros', 'siniestro'])
.addAnswer(['📄 ¿Qué tipo de siniestro quieres levantar?'],
    {
        media : 'https://awy-network.s3.amazonaws.com/64cd5f9197d9bc001419599c-policy'
    }
)

const flowFacturas = addKeyword(['Fac', 'facturas', 'Factura']).addAnswer(
    [
        '📄 Aquí te muestro las facturas que tienes disponibles',
    ],
    {
        media : 'https://awy-network.s3.amazonaws.com/64cd5f9197d9bc001419599c-policy',
    }
)

const flowPagar = addKeyword(['pagar', 'pag','Pagar']).addAnswer(
    [
        '¡Hola! Soy el asistente virtual de AWY. Estoy aquí para ayudarte con tus pagos y cualquier otra consulta que tengas. 😊',
    ]
).addAnswer([
    '¡Buenas noticias! Ahora puedes pagar de diferentes maneras en nuestra sucursal:',
    'Recuerda que siempre estamos aquí para ayudarte en todo lo que necesites. Si tienes alguna duda o requieres asistencia, solo escríbeme. ¡Estoy listo para ayudarte las 24 horas, los 7 días de la semana!',
]).addAnswer('💳 Pago con tarjeta: Aceptamos tarjetas de crédito y débito Visa, Mastercard, y más. Solo acércate a la caja y podrás pagar de forma rápida y segura.'
).addAnswer('📲 Pago por transferencia: Si prefieres hacer tus pagos desde la comodidad de tu aplicación bancaria, solo necesitas nuestros datos bancarios. ¡Es fácil y seguro!'
).addAnswer('🏦 Pago en OXXO: Si te gusta pagar en efectivo, proporciona al cajero la referencia que se encuentra en tu póliza o documento de pago. indica el monto a pagar correspondiente a tu compra o servicio y listo! recibirás un comprobante de pago que confirma la transacción.',
).addAnswer(['¡Gracias por confiar en AWY Agente de Seguros! Esperamos verte pronto en nuestra sucursal. 😊🏢',
              'Visita nuetra pagina web https://awy.com.mx/']
).addAnswer('¿Quieres regresar al menu de opciones?',
{
    capture:true
},(ctx, {endFlow}) => {
    console.log("regreso al menu de opciones");
}

)

 const flowPolizas = addKeyword(['polizas', 'poliza',"dos",'Pólizas']).addAnswer(
    [
        '👋 Soy el asistente virtual de AWY Seguros. ¡Tengo una excelente noticia para ti! 😃 Ahora puedes acceder a tus pólizas de una manera más fácil y rápida a través de nuestro servicio en línea. 🚀📈'
    ]
 ).addAnswer(
    [
        '¡Estamos aquí para hacer tu vida más sencilla! 😄🤖'
    ]
 ).addAnswer(
    [
        '📄 Aquí te muestro las pólizas que tienes disponibles: '
    ],
    null,
    async (ctx, {flowDynamic} ) =>{ 
        try {
            const polizas = []
            const poliza = await postData(1,"8118806631");
            length = poliza.payload.length;
            for (let i = 0; i < length; i++) {
                polizas.push({
                    body: `📄 Poliza No.${i+1} - ${poliza.payload[i].noPolicy}`,
                    media: poliza.payload[i].policyPDF.Location
                });
                console.log('poliza obtenida:', poliza.payload[i].policyPDF.Location);
                //iterar en todos los elementos de la lista para agregarlos a la respuesta dentro del return flowDynamic
            }
            return flowDynamic(
                polizas
            )
        } catch (error) {
            console.error('Error al obtener el pdf:', error.message);
        }
    }
).addAnswer('¿Quieres regresar al menu de opciones?',
{
    delay: 5000,
    capture:true,
},(ctx, {endFlow}) => {
    if (ctx.body == 'Finalizar chat'){
        return endFlow(
            {
                body: '¡Saliste del Chat. 😔 Para volver a iniciar, simplemente escribe *Hola* o *Inicio*. Estamos aquí para ayudarte. 🙌🤖'
            }
        )
    }
    
}
)

const flowCotizar = addKeyword(['cotizar','cot']).addAnswer(
    ['¿Qué quieres cotizar?','*Autos*','*Vida, Ahorros e inversión*','GMM','Casa y Negocio'],
    null,
    null,
    flowCotizarAutos
)


const flowMenuOtros = addKeyword(['otros','Ver otras opciones']).addAnswer(
    ['Tambien puedes dar de alta a *Siniestros* y revisar tus *Facturas*.'],
    {
        capture:true
    },
    async (ctx, {flowDynamic} ) =>{
        if (ctx.body == 'Siniestros'){
            console.log("Siniestros");
        }
    },
    [flowSiniestros,flowFacturas]
)
const flowMenu = addKeyword(['menu','Menu']).addAnswer(
    '¿Cómo podemos ayudarte hoy? Selecciona una de las siguientes opciones.',
    {
        capture:true,
    },null,
    [flowPolizas,flowPagar,flowFacturas,flowSiniestros,flowMenuOtros]
)


const flowDespedida = addKeyword(['adios', 'Gracias', 'Thx','hasta luego', 'bye'])
    .addAnswer('🙌 Gracias por utilizar el servicio de *Chatbot de AWY*').addAction( ()=>{
        console.log(" ****** Finalizar conversación ******")
})



const flowInicio = addKeyword(['hola', 'ole', 'alo','Buenos días','menu','inicio'])
.addAnswer(
    'Bienvenido al ChatBot de AWY🤖 ¿Quieres iniciar una conversación?',
    {
        capture:true,
    },
    async (ctx, {flowDynamic,endFlow} ) =>{

        //aqui se hace una petición a la api para saber si el cliente es un usuario registrado en la base de datos de awy
        try {
            const usuario = await postData(1,"8118806639");
            if(usuario.ok){
                console.log("El usuario es un cliente registrado ", ctx.from);

                if (ctx.body == 'Iniciar conversación'){
                    console.log("Se inicia la conversación");
                    return flowDynamic(
                        {
                            body: `Hola, ${ctx.from}`,
                        }
                    )
                }

                if (ctx.body == 'Cancelar'){
                    console.log("Se cancela la conversación");
                    return endFlow(
                        {
                            body: ['❌ Su solicitud ha sido cancelada ❌ \nSi quieres volver a iniciar una conversación escribe *hola*']
                        }
                    )
                }
            }
            
        } catch (error) {
            console.error('Error al obtener el usuario:', error.message);
            console.log("El usuario no es un cliente registrado en la base de datos de awy");
                return flowDynamic(
                    [
                        {
                            body: 'Parece que no eres un cliente registrado en la base de datos de AWY 😔'
                        },
                        {
                            body: 'Puedes ponerte en contacto con nuestros ejecutivos para obtener más información sobre nuestros productos y servicios. 😊'
                        }
                    ]
                )
        }
        
    },
    [flowPolizas,flowPagar,flowSiniestros,flowMenuOtros,flowMenu]
)/*.addAnswer(
    '¿Cómo podemos ayudarte hoy? Selecciona una de las siguientes opciones.',
    {
        capture:true,
    },null,
    [flowPolizas,flowPagar,flowSiniestros,flowMenuOtros]
)*/


    module.exports = {
        flowInicio,
        flowMenu,
        flowMenuOtros,
        flowDespedida,
        flowCotizar,
        flowPolizas,
        flowPagar,
        flowFacturas,
        flowSiniestros,
        flowCotizarAutos
    };
