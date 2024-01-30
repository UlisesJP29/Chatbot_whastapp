const  newtoken = require( './getToken.js');
const endpoint = 'http://140.84.189.156:3002/api/public/awy-external/get-info';

async function getPolizaPDF(type,telephone) {
    try {
        const token = await newtoken.getToken();
        //console.log('\x1b[32m%s\x1b[0m','token obtenido:', token.token);

        const data = {
            type: type,
            telephone: telephone
        };

        // Configura las opciones para la solicitud
        const requestOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': `${token.token}` // Agrega el token en el encabezado de autorización
            },
            body: JSON.stringify(data) // Convierte el objeto JSON en una cadena JSON
        };

        //console.log('Cuerpo de la solicitud:', JSON.stringify(data));
        //console.log('Opciones de la solicitud:', requestOptions)

        const response = await fetch(endpoint, requestOptions);
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
    getPolizaPDF 
}