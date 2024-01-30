const newtoken = require('./getToken.js');
const endpoint = 'http://140.84.189.156:3002/api/public/awy-external/customer/';

//con el token obtenido, crear un función que obtenga los datos del usuario usando el token para acceder a la api, como paremotros un numero de telefono y un valor type
// la función hara una solicitud post a la api con los parametros como body y el token como header, y regresara un json con los datos del usuario

async function getUserInfo(phoneNumber) {
    try {
        const token = await newtoken.getToken();
        //console.log('\x1b[32m%s\x1b[0m','token obtenido:', token.token);

        // Configura las opciones para la solicitud
        const requestOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': `${token.token}` // Agrega el token en el encabezado de autorización
            }
        };

        //console.log('Opciones de la solicitud:', requestOptions)

        const response = await fetch((endpoint+phoneNumber), requestOptions);
        console.log(response.status);
        if (!response.ok) {
                const errorMessage = await response.text(); // Obtener el mensaje de error del cuerpo de la respuesta si lo hay
                throw new Error(`La solicitud no fue exitosa. Código de estado: ${response.status}. Mensaje: ${errorMessage}`);
        }

        const responseData = await response.json();
        
            // Se maneja la respuesta JSON recibida
        //console.log('Respuesta del servidor:', responseData);
        return responseData;
        
    } catch (error) {
            console.error('Error al hacer la solicitud:', error.message);
    }
}


module.exports = {
    getUserInfo
}

