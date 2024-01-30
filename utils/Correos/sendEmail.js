// Importar la API de EmailJS
require('dotenv').config();
const nodemailer = require("nodemailer");
const PASS_GMAIL = process.env.PASS_GMAIL;
const emailEjecutivo = '1180762@alumno.um.edu.mx';
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


async function sendEmail(InfoProspecto, telefono ) {  
    try {
      crearDescripcion(InfoProspecto, telefono);
        // send mail with defined transport object
        console.log('dentro de la función...');
        const info = await transporter.sendMail({
          from: '"Bot de WhatsApp AWY 👻" <jiaupjp@gmail.com>',
          to: `${emailEjecutivo}`,
          subject: "Nuevo cliente esperando cotización.",
          text: `Hola, @${cliente}`,
          html: "<b>Necesito una cotización para un seguro de auto</b>",
        });
    
        console.log("Message sent: %s", info.messageId);
      } catch (error) {
        // Manejar cualquier error que ocurra durante el envío del correo electrónico
        console.error("Error sending email:", error.message);
      }
}

function crearDescripcion(InfoProspecto,telefono){

}

module.exports = {
    sendEmail
  };