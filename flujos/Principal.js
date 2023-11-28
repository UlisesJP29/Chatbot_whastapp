const { addKeyword } = require('@bot-whatsapp/bot')
const { getPolizaPDF } = require('../utils/getPolizaPDF.js')
const { getUserInfo } = require('../utils/Buscarusuario.js')
const { EVENTS } = require('@bot-whatsapp/bot')
const { getRecibos } = require('../utils/getRecibos.js')
const {getFechaCercana,ordenarFechas} = require('../utils/fechaCercana.js');
const {esNumero,esCadenaDeLetrasConEspacios} = require('../utils/esNumerico.js')



const flowSiniestros = addKeyword(['siniestros', 'siniestro'])
.addAnswer(['📄 ¿Qué tipo de siniestro quieres levantar?']
).addAnswer('¿Quieres regresar al menu de opciones?',
{
    capture:true
},(ctx, {endFlow}) => {
    console.log("regreso al menu de opciones");
}

)

const flowFacturas = addKeyword(['Fac', 'facturas', 'Factura']).addAnswer(
    [
        '📄 Aquí te muestro las facturas que tienes disponibles',
    ],
    {
        media : 'https://awy-network.s3.amazonaws.com/64cd5f9197d9bc001419599c-policy',
    }
).addAnswer('¿Quieres regresar al menu de opciones?',
{
    delay: 5000,
    capture:true,
},(ctx, {endFlow}) => {
    console.log("regreso al menu de opciones");
}

)

const flowPagar = addKeyword(['pagar', 'pag','Pagar']).addAnswer(
    [
        '¡Hola! Soy el asistente virtual de AWY. Estoy aquí para ayudarte con tus pagos y cualquier otra consulta que tengas. 😊',
    ]
).addAnswer(
    '*Para conocer el recibo de pago escribe tu número póliza*',
    {capture:true},
    async (ctx, {state})=>{
        try {
            const poliza = ctx.body;
            const recibo =  await getRecibos(3,poliza);
            const recibos = getFechaCercana(recibo,false);

            console.log(recibos[0].mensaje);

            await state.update({ recibos: recibos[0].mensaje });

        } catch (error) {
            console.error('Error al obtener Recibos:', error.message);
        }
        
    }
).addAnswer(
    '*Este es tu próximo recibo a pagar 🗒️:*',
    null,
    async (ctx, {state,flowDynamic})=>{
        try {
            const recibos = state.getMyState();
            console.log(recibos.recibos.result);

            return flowDynamic( 
                
                recibos.recibos.result
                
            )
        } catch (error) {
            console.error('Error al obtener Recibos:', error.message);
        }
        
    }
).addAnswer(
    '¡Buenas noticias! Ahora puedes pagar de diferentes maneras en nuestra sucursal:',
    {
        delay: 10000,
    },
).addAnswer('💳 Pago con tarjeta: Aceptamos tarjetas de crédito y débito Visa, Mastercard, y más. Solo acércate a la caja y podrás pagar de forma rápida y segura.'
).addAnswer('📲 Pago por transferencia: Si prefieres hacer tus pagos desde la comodidad de tu aplicación bancaria, solo necesitas nuestros datos bancarios. ¡Es fácil y seguro!'
).addAnswer('🏦 Pago en OXXO: Si te gusta pagar en efectivo, proporciona al cajero la referencia que se encuentra en tu póliza o documento de pago. indica el monto a pagar correspondiente a tu compra o servicio y listo! recibirás un comprobante de pago que confirma la transacción.',
).addAnswer(['¡Gracias por confiar en AWY Agente de Seguros! Esperamos verte pronto en nuestra sucursal. 😊🏢',
              'Visita nuetra pagina web https://awy.com.mx/']
).addAnswer('¿Quieres regresar al menu de opciones?',
{
    delay: 5000,
    capture:true,
},(ctx, {endFlow}) => {
    console.log("regreso al menu de opciones");
}

)

const flowPolizas = addKeyword(['polizas', 'poliza','Pólizas']).addAction(//muestra los ramos de las pólizas
    async (ctx,{state,flowDynamic}) => {
        console.log('inicia el flujo de pólizas...');
        const RamosObtenidos = [];
        const RamosMapa = [];

        //hacemos la llamada al API para obtener los datos del cliente.
        const telefono = ctx.from.substring(3); 
        console.log("El telefono es: ", telefono);
        const poliza = await getPolizaPDF(1,"9321114495");
        RamosObtenidos.push('Selecciona el tipo de póliza que quieres ver:\n');
        poliza.payload.forEach((obj,i) => {
            if (obj.ramo && obj.ramo.name) {
                RamosObtenidos.push(`( *${i+1}* )  ${obj.ramo.name}\n`);
                RamosMapa.push(obj.ramo.name);
                i++;
            }
        });
        const mensaje = RamosObtenidos.join(" ");
        console.log(RamosObtenidos);
        console.log(mensaje);
        await state.update({ listaDePolizas: poliza,Ramos:RamosMapa })

        return flowDynamic(mensaje);
    }
 ).addAction({// capturamos el tipo de ramo que necesita el usuario para mostrar cada bien asegurado por orden de vigencia
        capture:true
    },
   async (ctx, {state,gotoFlow}) => {
        if (esNumero(ctx.body) || esCadenaDeLetrasConEspacios(ctx.body)) {
            console.log('se capturo el valor el: ',ctx.body);
            const RamoSeleccionado = ctx.body;

            const infoPolizas = state.getMyState();
            const PolizaDescripcionMap = [];
            const mostrarDescripcion = [];
            const compararFecha = [];
            mostrarDescripcion.push('Selecciona la póliza que quieres ver:\n');
            const listaDescripcion = new Map();

            const ramosMap = new Map();
            infoPolizas.Ramos.forEach((ramo, indice) => {
                ramosMap.set(indice, ramo);
            });
            console.log(ramosMap);

            if (esNumero(RamoSeleccionado)) {

                infoPolizas.listaDePolizas.payload.forEach(async (obj,index) => {
                    console.log('dentro del ciclo:',index);

                    if (obj.ramo.name && ramosMap.get(RamoSeleccionado-1) == obj.ramo.name) {
                        console.log(`dentro del ciclo x${obj.ramo.name}`);
                        const recibos = await getRecibos(3,obj.noPolicy);
                        console.log(recibos);
                        const fechaDeVigencia = getFechaCercana(recibos, true);
                        console.log(fechaDeVigencia.result);
                        PolizaDescripcionMap.push(
                            {
                                fecha: fechaDeVigencia.result,
                                descripcion: "Vehículo - RAM 1500 A/AC, AUT/STD",
                            }
                        )
                        compararFecha.push(fechaDeVigencia.result);
                        console.log("Este es el objeto que se guardo en la lista",PolizaDescripcionMap);
                        console.log(`el usuario selecciono: ${ramosMap.get(RamoSeleccionado-1)} y ${obj.ramo.name}. 
                        \npoliza: ${obj.noPolicy} y ${obj.description}`);
                    }
                });

                const fechasOrdenadas =  ordenarFechas(compararFecha);
                console.log("Se guardan las fechas ordenadas y se agregan los descripciones");
                fechasOrdenadas.forEach(fecha=>{
                    PolizaDescripcionMap.forEach(datos,index =>{
                        if (datos.fecha === fecha) {
                            mostrarDescripcion.push(
                                `( *${index +1}* )  ${datos.descripcion}\n`
                            );
                            listaDescripcion.set(index,datos.descripcion);
                          }
                    });
                });

                const mensaje = mostrarDescripcion.join(" ");
                console.log(listaDescripcion);
                console.log(mensaje);

                await state.update({ mensaje: mensaje, listaDescripcion: listaDescripcion })
            }
        }else{

            return gotoFlow(flowPolizas);  
        }
}).addAction(// mostramos la lista con los bienes asegurados - se hará por orden de vigencia
    async (_, { flowDynamic,state }) => {
        const respuesta = state.getMyState();
        return flowDynamic(respuesta.mensaje);
    }
).addAction(//mostramos la póliza que requiere el usuario.
    {
        capture:true 
    },
async (ctx, { state }) => {
    if (esNumero(ctx.body) || esCadenaDeLetrasConEspacios(ctx.body)) {
        console.log('se capturo el valor ',ctx.body);
        const poliza = ctx.body; 

        const infoPolizas = state.getMyState();
        const mostrarPolzias = [];

        const descripcionMap = new Map();
        infoPolizas.listaDescripcion.forEach((descripcion, indice) => {
            descripcionMap.set(indice, descripcion);
        });
        console.log(descripcionMap);

        if (esNumero(poliza)) {
            infoPolizas.listaDePolizas.payload.forEach((obj,index) => {
                console.log('dentro del ciclo: x',index);
                if (obj.description && descripcionMap.get(poliza-1) == obj.description) {
                    console.log(`dentro del ciclo x${obj.descripcion}`);
                    mostrarPolzias.push({
                        body: `📄 Poliza ${obj.noPolicy}`,
                        media: obj.policyPDF.Location
                    });
                    console.log(`el usuario selecciono: ${descripcionMap.get(poliza-1)} y ${obj.ramo.name}. descripciónactual: ${descripcionMap.get(poliza-1)} y ${obj.description}`);
                }
            });
            const mensaje = mostrarPolzias.join(" ");
            console.log(mostrarPolzias);
            await state.update({ mensaje: mostrarPolzias })
        }
    }
}
).addAction(
    async (_, { flowDynamic,state }) => {
        const respuesta = state.getMyState();
        console.log(respuesta.mensaje);
        return flowDynamic(respuesta.mensaje);
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



const flowMenuOtros = addKeyword(['otros','Ver otras opciones']).addAnswer(
    ['Tambien puedes dar de alta a *Siniestros* y revisar tus *Facturas*.'],
    {
        capture:true
    },
    async (ctx,{gotoFlow}) =>{
        console.log("Menu otros", ctx.from);
        if(ctx.body == 'Menu anterior'){
            return gotoFlow(flowMenu);
        }
    },
    [flowSiniestros,flowFacturas]
)


const flowMenu = addKeyword(['menu', 'Menu']).addAnswer(
    '¿Cómo puedo ayudarte? \n\nElige una de las siguientes opciones:',
    {
        capture:true,
    },null,
    [flowPolizas,flowPagar,flowFacturas,flowSiniestros,flowMenuOtros]
)


const flowNoRegistrado = addKeyword(['no registrado'],{ sensitive: true }).addAnswer(
    [
        'Nos emociona que hayas llegado a nuestro servicio. 😃 \n \nPara comenzar, por favor proporciona tu información básica para poder ayudarte de la mejor manera posible.',
        '\n¡Gracias por confiar en nosotros! \n \n¡Comencemos! 📋🔒'
    ],
).addAnswer(
    '¿Cuál es tu nombre completo?',
    {capture:true},
    async (ctx, {state} ) =>{
        state.update({ NombreCliente: ctx.body });
    }
).addAnswer(
    [
            'Selecciona tu sucursal de preferencia:\n',
        '✅ *Allende*\n',
        '✅ *Galeana*\n',
        '✅ *General Terán*\n',
        '✅ *Linares*\n',
        '✅ *Montemorelos*\n'
    ],
    {capture:true},
    async (ctx, {state,fallBack} ) =>{
        console.log("sucursal seleccionada:", ctx.body)
        if (ctx.body == 'Allende' || ctx.body == 'Galeana' || ctx.body == 'General Terán' || ctx.body == 'Linares' || ctx.body == 'Montemorelos'){
            state.update({ SucursalCliente: ctx.body });
            console.log("Se actualizo el estado del cliente con la sucursal seleccionada", ctx.body);
        }else{
            return fallBack()
        }
    }
).addAnswer(
    [
        'Ahora te podrás comunicar con un ejecutivo de la sucursal seleccionada.\n',
        'Selecciona algun ejecutivo de la lista:\n',
        //dame una lista en strings de 10 nombres de ejecutivos de la sucursal seleccionada,como una lista en javascript
        '✔ Juan\n',
        '✔ Pedro\n', 
        '✔ Jorge Luis\n',
        '✔ Alfredo\n',
        '✔ Roberto Carlos\n',
        '✔ Ana Maria\n'
    ],
    {capture:true},
    async (ctx, {flowDynamic,state,fallback} ) =>{
        const cliente = state.getMyState()

        console.log("Ejecutivo seleccionado:", ctx.body);
        return flowDynamic([
            {body: `📍 ${cliente.SucursalCliente}, Nuevo León\n *Llamar* 📞 932 111 4495`},
            {body: `*${cliente.NombreCliente}*, ahora podras comunicarte con tu ejecutivo *${ctx.body}*.\n \nEl esta disponible para ayudarte con cualquier duda que tengas. 😊`}
        ]);
    }
).addAnswer('De parte de AWY, ¡muchas gracias por confiar en nosotros! 😊\n\n¡Esperamos verte pronto!',
{
    delay: 5000
},(ctx, {endFlow}) => {
        return endFlow(
            {

                body: '¡Saliste del Chat. 😔 Para volver a iniciar, simplemente escribe *Hola* o *Inicio*. Estamos aquí para ayudarte. 🙌🤖'
            }
        )
    
    
}
)

const flowDespedida = addKeyword(['adios', 'Gracias', 'Thx','hasta luego', 'bye','finalizar chat'])
    .addAnswer('🙌 Gracias por utilizar el servicio de *Chatbot de AWY*').addAnswer(
        '¡Saliste del Chat. 😔 Para volver a iniciar, simplemente escribe *Hola* o *Inicio*. Estamos aquí para ayudarte. 🙌🤖'
)


const flowInicio = addKeyword(EVENTS.WELCOME).addAction(
    async (ctx, {flowDynamic,endFlow,state,gotoFlow} ) =>{
        //aqui se hace una petición a la api para saber si el cliente es un usuario registrado en la base de datos de awy
        const telefono = ctx.from.substring(3); // Obtener caracteres después del segundo (índice 2)
        console.log("El telefono es: ", telefono);
        const usuario = await getUserInfo('9321114495');
        console.log("Se inicia la conversación");
        try {
            if(usuario.payload == null){
                state.update({ usuarioExiste: false });
                return gotoFlow(flowNoRegistrado);
                
            }
        } catch (error) {
            console.error('Error al obtener el usuario:', error.message);
            console.log("El usuario es un cliente registrado en la base de datos de awy");
            
        }
        console.log("El usuario es un cliente registrado ", usuario.payload.name);
        await state.update({ usuarioExiste: true });
        return flowDynamic(
            {
                body: `¡Hola *${usuario.payload.name}*! \n\nSoy Tu Asistente Virtual de AWY Agentes de Seguros 😊`
            }
        )
    }
).addAction(
     (_, { gotoFlow, state}) => {

        console.log("Va al menu principal");
        const Usuario = state.getMyState()
        if (Usuario.usuarioExiste) {
            return gotoFlow(flowMenu)    
        }
    }
)


    module.exports = {
        flowInicio,
        flowMenu,
        flowMenuOtros,
        flowDespedida,
        flowNoRegistrado,
        flowPolizas,
        flowPagar,
        flowFacturas,
        flowSiniestros,
    };
