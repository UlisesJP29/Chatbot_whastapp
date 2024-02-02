const { addKeyword } = require('@bot-whatsapp/bot')
const { getPolizaPDF } = require('../utils/getPolizaPDF.js')
const { getUserInfo } = require('../utils/Buscarusuario.js')
const { EVENTS } = require('@bot-whatsapp/bot')
const { getRecibos } = require('../utils/getRecibos.js')
const {getFechaCercana,ordenarFechas} = require('../utils/fechaCercana.js');
const {esNumero,esCadenaDeLetrasConEspacios} = require('../utils/esNumerico.js')
const {sendEmail}  = require('../utils/Correos/sendEmail.js');

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

const flowPagar = addKeyword(['pagar', 'pag','Pagar']).addAction(
    async (ctx, {state})=>{
            let status;
            //hacemos la llamada al API para obtener los datos del cliente.
            const telefono = ctx.from.substring(3); 
            console.log("El telefono es: ", telefono);
            const polizas = await getPolizaPDF(1,'8261236069');
            const listaPoliza = [];
            console.log("a punto de entrar al for",polizas);
            for(let i = 0; i < polizas.payload.length; i++) {
                const obj = polizas.payload[i];
                console.log("poliza: ", obj.noPolicy);
                const recibo =  await getRecibos(3,obj.noPolicy);
                const fechaCerna = getFechaCercana(recibo,true,obj.descripcion);
                status = fechaCerna;
                /*if( status === 0){
                    console.log('si fue un estado diferente');
                    await state.update({ status: status});
                    break;
                }*/
                if (obj.noPolicy) {
                  const data = {
                    poliza: obj.noPolicy,
                    vigencia: fechaCerna.result,
                    descripcion: obj.description
                  };
                  listaPoliza.push(data);
                }
            }
            //if (status != 0) {
                console.log("lista desordenada: ",listaPoliza);
                // Función de comparación para ordenar por fecha de vigencia de forma ascendente
                const compararFechas = (a, b) => {
                    // Convertir las fechas de vigencia a objetos Date
                    const fechaA = new Date(a.vigencia);
                    const fechaB = new Date(b.vigencia);
                
                    // Comparar las fechas y retornar el resultado
                    return fechaA - fechaB;
                };
                // Ordenar la lista de objetos por fecha de vigencia
                listaPoliza.sort(compararFechas);
                console.log("lista ordenada: ",listaPoliza);

                const MensajesDeRecibos = [];
                const infoGuardada = [];
                for (let i = 0; i < listaPoliza.length; i++) {
                    const info = listaPoliza[i];
                    console.log(`La póliza que se busca es : ${info}`);
                    const recibo =  await getRecibos(3,info.poliza);
                    const reciboCercano = getFechaCercana(recibo,false,info.descripcion);
                    console.log(reciboCercano);
                    reciboCercano.result.forEach((mensaje, i)=> {
                        console.log("mensaje", mensaje.body);
                        console.log("mensaje", mensaje.media);
                        console.log("mensaje", mensaje.status);
                        MensajesDeRecibos.push(`*( ${i+1} )* ${mensaje.body}`);
                        infoGuardada.push({mensaje});

                    });
                }
                
                console.log("Cargando los mensajes para ser enviados:\n",MensajesDeRecibos);
                

                await state.update({ recibos: MensajesDeRecibos, seleccionUsuario: infoGuardada});
            //}

    }
).addAnswer(
    '*Estos son tus próximos recibos a pagar 🗒️:*',
    null,
    async (ctx, {state,flowDynamic})=>{
        try {
            const mensajes = state.getMyState();
            console.log("dentro de la respuesta:\n",mensajes.status);
            if(mensajes.recibos.propiedad === undefined){
                await flowDynamic( 
                
                    [
                        'Lo sentimos, no tienes recibos próximos a vencer 😉',
                    ]
                    
                )
            }else{
                console.log("dentro de la respuesta:\n",mensajes.recibos);
                return flowDynamic( 
                
                    mensajes.recibos
                    
                )
            }
            
        } catch (error) {
            console.error('Error al obtener Recibos:', error.message);
        }
        
    }
).addAction(
    async(ctx,{state, gotoFlow}) =>{
        const mensajes = state.getMyState();
        console.log("dentro de la respuesta:\n",mensajes.recibos);
        if(mensajes.recibos.propiedad === undefined){
            return gotoFlow(RegresarAlMenu);
        }
        

    }
).addAction(
    {capture:true},
    async(ctx,{state}) =>{
        
            const UsuaroNumero = ctx.body -1;
            await state.update({ seleccion: UsuaroNumero});
        

    }
).addAction(
    async(ctx,{state,flowDynamic}) =>{
        /*
            -Cuando se captura la entrada se busca el recibo que requiere la persona.
            -Si es un recibo vencido se envia directamente a atención al cliente para hacer el pago.
        */
        const elementos = state.getMyState();
        const UsuaroNumero = elementos.seleccion;
        if (esNumero(ctx.body) && ctx.body>0) {
            console.log(elementos.seleccionUsuario);
            const estadoMensaje = elementos.seleccionUsuario[UsuaroNumero].mensaje.status;
            console.log(estadoMensaje);
            if(estadoMensaje == "Vencido"){
                return flowDynamic(
                    [
                        {
                            body: elementos.seleccionUsuario[UsuaroNumero].mensaje.body,
                            media: elementos.seleccionUsuario[UsuaroNumero].mensaje.media
                        }
                    ]
                );
            }else{
                return flowDynamic(
                    [{body:"¡Atención! ⚠️ *Tu recibo está vencido*.\n\n 🆘 *Comunícate ya mismo con Caja y evita contratiempos*. 💼💸 \n\n¡Gracias por tu pronta acción! 🚀🔥"},
                    {body:"Llamar a Caja AWY"}]
                );
            }
            
        }
    }
).addAction(
    async(ctx,{state,flowDynamic}) =>{
        /*
            -Cuando se captura la entrada se busca el recibo que requiere la persona.
            -Si es un recibo vencido se envia directamente a atención al cliente para hacer el pago.
        */
        const elementos = state.getMyState();
        const UsuaroNumero = elementos.seleccion;
        if (esNumero(ctx.body) && ctx.body>0) {
            console.log(elementos.seleccionUsuario);
            const estadoMensaje = elementos.seleccionUsuario[UsuaroNumero].mensaje.status;
            console.log(estadoMensaje);
            if(estadoMensaje == "Vencido"){
                return flowDynamic(
                    [
                        {body: "*Opciones de Pago:* \n\n\n1️⃣ Toma las referencias del PDF anexo 📄 y paga en banco 🏦 o desde tu App de banco 💳. \n\n\n2️⃣ Cargo telefónico a tarjeta 📲. \n *se enlistan  numeros de la aseguradora* \n\n\n3️⃣ Llamar a caja AWY"},
                        {body: "Llamar a caja AWY"}
                    ]
                );
            }
            
        }
    }

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
        const poliza = await getPolizaPDF(1,'8261236069');
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
                const listaPolizas = infoPolizas.listaDePolizas.payload;

                for (let index = 0; index < listaPolizas.length; index++) {
                    const obj = listaPolizas[index];
            
                    console.log('dentro del ciclo:', index);
            
                    if (obj.ramo.name && ramosMap.get(RamoSeleccionado - 1) == obj.ramo.name) {
                        console.log(`dentro del ciclo x${obj.ramo.name}`);
                        const recibos = await getRecibos(3, obj.noPolicy);
                        console.log(recibos);
                        const fechaDeVigencia =  getFechaCercana(recibos, true);
                        console.log(fechaDeVigencia.result);
            
                        PolizaDescripcionMap.push({
                            fecha: fechaDeVigencia.result,
                            descripcion: obj.description,
                        });
            
                        compararFecha.push(fechaDeVigencia.result);
            
                        console.log("Este es el objeto que se guardó en la lista", PolizaDescripcionMap);
            
                        console.log(`el usuario seleccionó: ${ramosMap.get(RamoSeleccionado - 1)} y ${obj.ramo.name}.
                            \npoliza: ${obj.noPolicy} y ${obj.description}`);
                    }
                }

                const fechasOrdenadas =  ordenarFechas(compararFecha);
                console.log("Se guardan las fechas ordenadas y se agregan los descripciones");
                fechasOrdenadas.forEach((fecha, index)=>{
                    PolizaDescripcionMap.forEach(datos =>{
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
            console.log(infoPolizas.listaDePolizas.payload);
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

const RegresarAlMenu = addKeyword('regresar').addAnswer(
    '¿Quieres regresar al menu de opciones?',
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

const flowMenu = addKeyword(['menu', 'Menu']).addAnswer(
    '¿Cómo puedo ayudarte? \n\nElige una de las siguientes opciones:',
    {
        capture:true,
    },null,
    [flowPolizas,flowPagar,flowFacturas,flowSiniestros,flowMenuOtros]
)


const flowGastosMedicos = addKeyword(['cotizar','flujoAutos','autos']).addAnswer(
    [
        'Has elegido la opción Gastos Médicos🏥',
        'Contesta el siguiente formulario:'
    ]
).addAnswer(
    [
        "¿Cuál es tu *nombre completo*?"
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const nombreCliente = ctx.body;
        // Validar que la respuesta sea una cadena de texto
        const esCadenaDeTexto = /^[a-zA-ZáéíóúñÑÁÉÍÓÚüÜ\s]+$/.test(nombreCliente);
        if (esCadenaDeTexto) {
            // Si es una cadena de texto válida, actualizar el estado
            state.update({ NombreCliente: nombreCliente });
        } else {
            // Si no es una cadena de texto válida, ejecutar la función fallBack()
            fallBack();
        }
    }
).addAnswer(
    [
        "¿Cuál es tu *Municipio*?\n\n",
        '( 1 ) *Allende*\n',
        '( 2 ) *Galeana*\n',
        '( 3 ) *General Terán*\n',
        '( 4 ) *Linares*\n',
        '( 5 ) *Montemorelos*\n'
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const respuesta = ctx.body;
        // Verificar la respuesta del usuario y asignar el municipio correspondiente
        let municipioSeleccionado;
        if (respuesta === '1' || respuesta.toLowerCase() === 'allende') {
            municipioSeleccionado = 'Allende';
        } else if (respuesta === '2' || respuesta.toLowerCase() === 'galeana') {
            municipioSeleccionado = 'Galeana';
        } else if (respuesta === '3' || respuesta.toLowerCase() === 'general terán') {
            municipioSeleccionado = 'General Terán';
        } else if (respuesta === '4' || respuesta.toLowerCase() === 'linares') {
            municipioSeleccionado = 'Linares';
        } else if (respuesta === '5' || respuesta.toLowerCase() === 'montemorelos') {
            municipioSeleccionado = 'Montemorelos';
        } else {
            municipioSeleccionado = '*Municipio no válido*';
            return fallBack();
        }

        // Guardar el municipio en el estado
        state.update({ MunicipioCliente: municipioSeleccionado });   
        
    }
)
.addAnswer(
    [
        "¿Cuál es tu sexo?\n\n( 1 ) *Femenino* \n( 2 ) *Masculino*"
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const respuestaSexo = ctx.body; // Puedes reemplazar esto con la respuesta real del usuario

        // Normalizar la respuesta a minúsculas para hacer la comparación sin importar la capitalización
        const respuestaNormalizada = respuestaSexo.toLowerCase();

        // Validar la respuesta
        let sexo;

        if (respuestaNormalizada === 'femenino' || respuestaNormalizada === 'f' || respuestaNormalizada === '1') {
            sexo = 'Femenino';
            state.update({ sexo: sexo });
        } else if (respuestaNormalizada === 'masculino' || respuestaNormalizada === 'm' || respuestaNormalizada === '2') {
            sexo = 'Masculino';
            state.update({ sexo: sexo });
        } else {
            // Respuesta no válida
            console.log('Respuesta no válida');
            fallBack();
        }
        
    }
).addAnswer(
    [
        "¿Cuál es tu fecha de nacimiento? \n\nDe preferencia formato *DD-MM-AAAA*"
    ],
    {capture:true},
    async (ctx,{state,flowDynamic})=>{  
        state.update({ fechaNacimiento: ctx.body });

        const GM =  state.getMyState();
        const telefonoCompleto = ctx.from; // Ejemplo: "5219321114495"

        // Extraer los números después de los primeros tres dígitos
        const telefono = telefonoCompleto.slice(3);        
        console.log(`Nombre del cliente ${GM.NombreCliente}, Municipio ${GM.MunicipioCliente}, Sexo ${GM.sexo}, Fecha de Nacimiento ${GM.fechaNacimiento}`);
        const prospectoInfo = {
            nombre: GM.NombreCliente,
            telefono: telefono,
            municipio: GM.MunicipioCliente,
            sexo: GM.sexo,
            fechaNacimiento: GM.fechaNacimiento,
          };
        console.log('se va a enviar el correo...',GM.NombreCliente);
        await sendEmail('Gastos Médicos',prospectoInfo).then(() => {
            console.log("Correo electrónico enviado exitosamente.");
             flowDynamic(`📬 ¡Hola, *${GM.NombreCliente}*! \n\nHemos recibido tu solicitud de cotización de seguro para Gastos Médicos. \n\n¡Buenas noticias! \n\nTu información ha sido enviada con éxito a nuestro equipo de ejecutivos. Estarán revisando los detalles y te contactarán pronto para brindarte más información. 😊 \n\n¡Gracias por elegirnos! 🚗✨`)
        }).catch((err) => {
            console.error("Hubo un error al enviar el correo electrónico:", err.message);
            flowDynamic(`Hubo un error al enviar el correo electrónico: ${err.message}\n\nUna disculpa, intentalo de nuevo más tarde.`)
        });
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


//Año, Marca, Modelo ¿Nacional o Regularizado?
const flowAutos = addKeyword(['cotizar','flujoAutos','autos']).addAnswer(
    [
        'Has elegido la opción Autos 🚗',
        'Contesta el siguiente formulario:'
    ]
).addAnswer(
    [
        "¿Cuál es tu *nombre completo*?"
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const nombreCliente = ctx.body;
        // Validar que la respuesta sea una cadena de texto
        const esCadenaDeTexto = /^[a-zA-ZáéíóúñÑÁÉÍÓÚüÜ\s]+$/.test(nombreCliente);
        if (esCadenaDeTexto) {
            // Si es una cadena de texto válida, actualizar el estado
            state.update({ NombreCliente: nombreCliente });
        } else {
            // Si no es una cadena de texto válida, ejecutar la función fallBack()
            fallBack();
        }
    }
).addAnswer(
    [
        "¿Cuál es tu *Municipio*?\n\n",
        '( 1 ) *Allende*\n',
        '( 2 ) *Galeana*\n',
        '( 3 ) *General Terán*\n',
        '( 4 ) *Linares*\n',
        '( 5 ) *Montemorelos*\n'
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const respuesta = ctx.body;
        // Verificar la respuesta del usuario y asignar el municipio correspondiente
        let municipioSeleccionado;
        if (respuesta === '1' || respuesta.toLowerCase() === 'allende') {
            municipioSeleccionado = 'Allende';
        } else if (respuesta === '2' || respuesta.toLowerCase() === 'galeana') {
            municipioSeleccionado = 'Galeana';
        } else if (respuesta === '3' || respuesta.toLowerCase() === 'general terán') {
            municipioSeleccionado = 'General Terán';
        } else if (respuesta === '4' || respuesta.toLowerCase() === 'linares') {
            municipioSeleccionado = 'Linares';
        } else if (respuesta === '5' || respuesta.toLowerCase() === 'montemorelos') {
            municipioSeleccionado = 'Montemorelos';
        } else {
            municipioSeleccionado = '*Municipio no válido*';
            return fallBack();
        }

        // Guardar el municipio en el estado
        state.update({ MunicipioCliente: municipioSeleccionado });   
        
    }
)
.addAnswer(
    [
        "¿Cuál es el año de tu automóvil?"
    ],
    {capture:true},
    async (ctx,{state,fallBack})=>{
        const anioAutomovil = ctx.body;
        // Validar que la respuesta contenga solo números
        const contieneSoloNumeros = /^\d+$/.test(anioAutomovil);
        if (contieneSoloNumeros) {
            // Si la respuesta contiene solo números, actualizar el estado
            state.update({ anio: anioAutomovil });
        } else {
            // Si la respuesta no contiene solo números, ejecutar la función fallBack()
            fallBack();
        }
        
    }
).addAnswer(
    [
        "¿Cuál es la marca de tu automóvil?"
    ],
    {capture:true},
    async (ctx,{state})=>{
        state.update({ marca: ctx.body });
        
    }
).addAnswer(
    [
        "¿Cuál es el modelo de tu automóvil?",
    ],
    {capture:true},
    async (ctx,{state})=>{
        state.update({ modelo: ctx.body });
        
    }
).addAnswer(
    [
        "¿Es tu automóvil nacional o regularizado?"
    ],
    {capture:true},
    async (ctx,{state,flowDynamic,fallBack})=>{  
        const tipo = ctx.body;
        // Validar que la respuesta sea una cadena de texto
        const esCadenaDeTexto = /^[a-zA-Z\s]+$/.test(tipo);
        if (esCadenaDeTexto) {
            // Si es una cadena de texto válida, actualizar el estado
            state.update({ tipo: tipo });
        } else {
            // Si no es una cadena de texto válida, ejecutar la función fallBack()
            fallBack();
        }

        const auto =  state.getMyState();
        const telefonoCompleto = ctx.from; // Ejemplo: "5219321114495"

        // Extraer los números después de los primeros tres dígitos
        const telefono = telefonoCompleto.slice(3);        
        console.log(`Nombre del cliente ${auto.NombreCliente}, Año ${auto.anio}, Marca ${auto.marca}, Modelo ${auto.modelo}, Tipo ${auto.tipo}`);
        const prospectoInfo = {
            nombre: auto.NombreCliente,
            telefono: telefono,
            municipio: auto.MunicipioCliente,
            anio: auto.anio,
            marca: auto.marca,
            modelo: auto.modelo,
            nacionalRegularizado: auto.tipo
          };
        console.log('se va a enviar el correo...',auto.NombreCliente);
        await sendEmail('Autos',prospectoInfo).then(() => {
            console.log("Correo electrónico enviado exitosamente.");
             flowDynamic(`📬 ¡Hola, *${auto.NombreCliente}*! \n\nHemos recibido tu solicitud de cotización de seguro para auto. \n\n¡Buenas noticias! \n\nTu información ha sido enviada con éxito a nuestro equipo de ejecutivos. Estarán revisando los detalles y te contactarán pronto para brindarte más información. 😊 \n\n¡Gracias por elegirnos! 🚗✨`)
        }).catch((err) => {
            console.error("Hubo un error al enviar el correo electrónico:", err.message);
            flowDynamic(`Hubo un error al enviar el correo electrónico: ${err.message}\n\nUna disculpa, intentalo de nuevo más tarde.`)

        });
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



const flowNoRegistrado = addKeyword(['no registrado'],{ sensitive: true }).addAction(
    
    async (ctx, {flowDynamic} ) =>{
        return flowDynamic(
            [
                `Bienvenido ${ctx.ProfileName}`,
                'Nos emociona que nos contactes 😃'
            ]
        );
    }    
    
        
).addAnswer(
    [
        `¿Cómo podemos ayudarte?\n\n( 1 ) *Autos*\n( 2 ) *Gastos Médicos*\n( 3 ) *Contactar un Asesor*\n`
    ],
    {capture:true},
    async (ctx, {fallBack,gotoFlow} ) =>{
        const seleccion = ctx.body;
        console.log('se eligio',seleccion);
        if (seleccion === '1' || seleccion === 'autos') {
            return gotoFlow(flowAutos);
          } else if (seleccion === '2' || seleccion === 'gastos médicos') {
            return gotoFlow(flowGastosMedicos);
          } else if (seleccion === '3' || seleccion === 'contactar a un asesor') {
            return gotoFlow(flowGastosMedicos);
          } else {
            // Código para manejar otras opciones
            console.log("Opción no válida");
            return fallBack();
          }
    }
)

/*.addAnswer(
    'Guardamos tu información con éxito. Un asesor se pondrá en contacto contigo.',
    null,
    async (ctx, {state,flowDynamic}) => {
        const chat =  state.getMyState()
        console.log('se va a enviar el correo...',chat.NombreCliente);
        await sendEmail(chat.NombreCliente,ctx.body).then(() => {
            console.log("Correo electrónico enviado exitosamente.");
        }).catch((err) => {
            console.error("Hubo un error al enviar el correo electrónico:", err.message);
        });
    }
)*/



/*.addAction(
    async (ctx, {state,flowDynamic})=>{
        const cliente = state.getMyState();
        return flowDynamic(`Hola,${cliente.NombreCliente} ¿Cuál es tu municipio?\n`)
    }
).addAnswer(
    [
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
        'Ahora te podrás comunicar con un ejecutivo de la sucursal seleccionada.\n'
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
)*/

const flowDespedida = addKeyword(['adios', 'Gracias', 'Thx','hasta luego', 'bye','finalizar chat'])
    .addAnswer('🙌 Gracias por utilizar el servicio de *Chatbot de AWY*').addAnswer(
        '¡Saliste del Chat. 😔 Para volver a iniciar, simplemente escribe *Hola* o *Inicio*. Estamos aquí para ayudarte. 🙌🤖'
)


const flowInicio = addKeyword(EVENTS.WELCOME).addAction(
    async (ctx, {flowDynamic,endFlow,state,gotoFlow} ) =>{
            //aqui se hace una petición a la api para saber si el cliente es un usuario registrado en la base de datos de awy
            /*const telefono = ctx.from.substring(3); // Obtener caracteres después del segundo (índice 2)
            console.log("El telefono es: ", telefono);
            const usuario = await getUserInfo('9321114495');
            console.log("Se inicia la conversación");
            if(usuario.payload == null){
                state.update({ usuarioExiste: false });
                return gotoFlow(flowNoRegistrado);
            }
            console.log("El usuario es un cliente registrado ", usuario.payload.name);*/
            await state.update({ usuarioExiste: true });
            /*return flowDynamic(
                {
                    body: `¡Hola *${usuario.payload.name}*! \n\nSoy Tu Asistente Virtual de AWY Agentes de Seguros 😊`
                }
            )*/
        
        
    }
).addAction(
     (_, { gotoFlow, state}) => {

        console.log("Va al menu principal");
        const Usuario = state.getMyState()
        if (Usuario.usuarioExiste) {
            return gotoFlow(flowNoRegistrado);    
        }else{
            return gotoFlow(flowMenu); 
        }
    }
)


    module.exports = {
        flowInicio,
        flowMenu,
        flowMenuOtros,
        flowAutos,
        flowGastosMedicos,
        RegresarAlMenu,
        flowDespedida,
        flowNoRegistrado,
        flowPolizas,
        flowPagar,
        flowFacturas,
        flowSiniestros,
    };
