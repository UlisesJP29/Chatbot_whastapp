const username = "awyExternal2022"
const password = "A!Fi8RGw73ukzeJwu1" 
const url = "https://network.awy.digital/api/public/bot-awy/auth"
//creando un token para la conexion a la api, que despues usaremos para obtener los datos faltantes
//conect to an external api with token by fetch and get the data in a json

async function getToken() {
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({
                username: username,
                password: password
            }),
            headers: {
                'Content-Type': 'application/json'
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
    getToken
}

