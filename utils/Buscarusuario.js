const newtoken = require('./getToken.js').default;
const endpoint = 'https://network.awy.digital/api/public/awy-external/get-info';

//con el token obtenido, crear un función que obtenga los datos del usuario usando el token para acceder a la api, como paremotros un numero de telefono y un valor type
// la función hara una solicitud post a la api con los parametros como body y el token como header, y regresara un json con los datos del usuario

async function getUserInfo(type, phoneNumber) {
    try {
        const token = await newtoken.getToken();
        console.log('\x1b[32m%s\x1b[0m','token obtenido:', token);
        const response = await fetch(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                type: type,
                telephone: phoneNumber                
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authentication': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('La solicitud no fue exitosa');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error al consumir la API:', error.message);
    }
}




module.exports = {
    getUserInfo
}

