// Importar la API de EmailJS
require('dotenv').config();
const nodemailer = require("nodemailer");
const PASS_GMAIL = process.env.PASS_GMAIL;
const emailEjecutivo = ['1180762@alumno.um.edu.mx','yesi0348@gmail.com','jiaupjp@outlook.com'];
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    // TODO: replace `user` and `pass` values from <https://forwardemail.net>
    user: "jiaupjp@gmail.com",
    pass: PASS_GMAIL,
  },
});


async function sendEmail(Plantilla,InfoProspecto ) {  
    try {
      const body = crearDescripcion(Plantilla,InfoProspecto);
        // send mail with defined transport object
        console.log('dentro de la función para enviar correos...');
        const info = await transporter.sendMail({
          from: '"Bot de WhatsApp AWY 👻" <jiaupjp@gmail.com>',
          to: emailEjecutivo,
          subject: (Plantilla !== 'Contactar un Asesor')? `Nuevo prospecto, ${InfoProspecto.nombre} está esperando cotización #${Plantilla}.`: `Nuevo prospecto, ${InfoProspecto.nombre} requiere #${Plantilla}.`,
          text: `Hola, @Ejecutivo`,
          html: body,
        });
        console.log("Message sent: %s", info.messageId);
      } catch (error) {
        // Manejar cualquier error que ocurra durante el envío del correo electrónico
        console.error("Error sending email:", error.message);
      }
}


function crearDescripcion(Plantilla,prospectoInfo){
  
  if (Plantilla == 'Autos') {
    const htmlBody = `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Información de Prospecto</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
            }
            h1 {
                color: #3498db;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Información del Prospecto</h1>
            <table>
                <tr>
                    <th>Nombre del Prospecto</th>
                    <td>${prospectoInfo.nombre}</td>
                </tr>
                <tr>
                    <th>Número de Teléfono</th>
                    <td>${prospectoInfo.telefono}</td>
                </tr>
                <tr>
                    <th>Municipio</th>
                    <td>${prospectoInfo.municipio}</td>
                </tr>
                <tr>
                    <th>Tipo de Cotización</th>
                    <td>Autos</td>
                </tr>
                <tr>
                    <th>Año del Carro</th>
                    <td>${prospectoInfo.anio}</td>
                </tr>
                <tr>
                    <th>Marca del Carro</th>
                    <td>${prospectoInfo.marca}</td>
                </tr>
                <tr>
                    <th>Modelo del Carro</th>
                    <td>${prospectoInfo.modelo}</td>
                </tr>
                <tr>
                    <th>Nacional o Regularizado</th>
                    <td>${prospectoInfo.nacionalRegularizado}</td>
                </tr>
            </table>
            <p>Esta información ha sido proporcionada por el bot de WhatsApp en respuesta a la solicitud de cotización de un seguro para auto. Por favor, atienda esta petición en un plazo de 24 horas.</p>
        </div>
    </body>
    </html>
    `;
    return htmlBody;
  } if (Plantilla == 'Gastos Médicos') {
    const htmlBody = `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Información de Prospecto</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
            }
            h1 {
                color: #3498db;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Información del Prospecto</h1>
            <table>
                <tr>
                    <th>Nombre del Prospecto</th>
                    <td>${prospectoInfo.nombre}</td>
                </tr>
                <tr>
                    <th>Número de Teléfono</th>
                    <td>${prospectoInfo.telefono}</td>
                </tr>
                <tr>
                    <th>Municipio</th>
                    <td>${prospectoInfo.municipio}</td>
                </tr>
                <tr>
                    <th>Tipo de Cotización</th>
                    <td>Gastos Médicos</td>
                </tr>
                <tr>
                    <th>Sexo</th>
                    <td>${prospectoInfo.sexo}</td>
                </tr>
                <tr>
                    <th>Fecha de Nacimiento</th>
                    <td>${prospectoInfo.fechaNacimiento}</td>
                </tr>
            </table>
            <p>Esta información ha sido proporcionada por el bot de WhatsApp en respuesta a la solicitud de cotización de un seguro de Gastos Médicos. Por favor, atienda esta petición en un plazo de 24 horas.</p>
        </div>
    </body>
    </html>
    `;
    return htmlBody;
  } else {
    const htmlBody = `<!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Información de Prospecto</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
            }
            h1 {
                color: #3498db;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
            }
            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 8px;
            }
            th {
                background-color: #f2f2f2;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Información del Prospecto</h1>
            <table>
                <tr>
                    <th>Nombre del Prospecto</th>
                    <td>${prospectoInfo.nombre}</td>
                </tr>
                <tr>
                    <th>Número de Teléfono</th>
                    <td>${prospectoInfo.telefono}</td>
                </tr>
                <tr>
                    <th>Municipio</th>
                    <td>${prospectoInfo.municipio}</td>
                </tr>
                <tr>
                    <th>Tipo de Solicitud</th>
                    <td>Contactar un Asesor</td>
                </tr>
                <tr>
                    <th>Sexo</th>
                    <td>${prospectoInfo.sexo}</td>
                </tr>
                <tr>
                    <th>Fecha de Nacimiento</th>
                    <td>${prospectoInfo.fechaNacimiento}</td>
                </tr>
            </table>
            <p>Esta información ha sido proporcionada por el bot de WhatsApp en respuesta a la solicitud para Contactar un Asesor. Por favor, atienda esta petición en un plazo de 24 horas.</p>
        </div>
    </body>
    </html>
    `;
    return htmlBody;
  } 
}

module.exports = {
    sendEmail
  };