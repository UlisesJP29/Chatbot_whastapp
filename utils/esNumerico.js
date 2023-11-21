function esNumero(str) {
  // Utilizamos una expresión regular que coincide con una cadena que contiene solo dígitos y espacios
  // ^ indica el comienzo de la cadena
  // \d+ indica uno o más dígitos
  // $ indica el final de la cadena
  const expresionRegular = /^[\d\s]+$/;

  // Eliminamos los espacios en blanco antes de la verificación
  const strSinEspacios = str.replace(/\s/g, '');

  // Probamos la expresión regular con el string sin espacios
  return expresionRegular.test(strSinEspacios);
}

function esCadenaDeLetrasConEspacios(cadena) {
    // Expresión regular que verifica si la cadena contiene solo letras y espacios
    const expresionRegular = /^[a-zA-Z\s]+$/;
  
    // Verificar si la cadena contiene solo letras y espacios
    return expresionRegular.test(cadena);
  }
  
  module.exports = {esNumero,esCadenaDeLetrasConEspacios};
