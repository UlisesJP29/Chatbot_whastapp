function hacerFechaCorta(fechas) {
    const fechaISO = fechas;
    const fecha = new Date(fechaISO);
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1;
    const day = fecha.getDate();
    const fechaAcortada = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;


    console.log("la fecha acortada es:",fechaAcortada);
    return fechaAcortada;

}


function getFechaCercana(recibo,soloFechaDeVigencia,descripcion){
    const listaRecibosActivos= [];
    const listaRecibosVencidos= [];
    const fechasDeRecibos = [];
    const fechaVigenciaExpirada = [];
    const traducciones = {
        'inProcessToRenewed': 'En proceso de renovación',
        'active': 'Activo',
        'expired': 'Vencido',
        'reject': 'Rechazado',
        'paid': 'Pagado',
        'liquidated': 'Liquidado',
        'liquidated From Client': 'Liquidado por el cliente',
        'apply': 'Aplicado',
        'cancelled': 'Cancelado'
    };
      
    for (let i = 0; i < recibo.payload.length; i++) {
        const estatus = traducciones[recibo.payload[i].status] || 'Valor desconocido';
        const vencimiento = hacerFechaCorta(recibo.payload[i].dateOfPayment);
        if (estatus == "Activo") {
            fechasDeRecibos.push(vencimiento);
        }
       /* else{
            return 0;
        }*/
    }

    // Lista de fechas en formato "YYYY-MM-DD"
    const fechas = fechasDeRecibos;
    console.log(fechas);

    // Convierte las fechas a objetos de fecha
    const fechasObjeto = fechas.map(fecha => new Date(fecha));

    // Obtiene la fecha actual
    const fechaActual = new Date();

    // Inicializa variables para la fecha más cercana y su diferencia
    let fechaMasCercana = fechasObjeto[0];
    let diferenciaMasCercana = Math.abs(fechaActual - fechaMasCercana);

    // Itera a través de las fechas y encuentra la más cercana
    fechasObjeto.forEach(fecha => {
    const diferencia = Math.abs(fechaActual - fecha);
    if (diferencia < diferenciaMasCercana) {
        fechaMasCercana = fecha;
        diferenciaMasCercana = diferencia;
    }
    });
    console.log(fechaMasCercana);

    const fechaCompleta = new Date(fechaMasCercana);
    fechaCompleta.setHours(fechaCompleta.getHours() + fechaCompleta.getTimezoneOffset() / 60);

    const year = fechaCompleta.getFullYear();
    const month = fechaCompleta.getMonth() + 1; // Sumar 1 al mes para obtener el número correcto del mes
    const day = fechaCompleta.getDate();

    const fechaCorta = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

    console.log(fechaCorta);

    for (let i = 0; i < recibo.payload.length; i++) {
        const estatus = traducciones[recibo.payload[i].status] || 'Valor desconocido';
        console.log(`El status es ${estatus}`);

        const vencimiento = hacerFechaCorta(recibo.payload[i].dateOfPayment);
        console.log(`La vigncia es ${vencimiento} y la fecha más cerca es ${fechaCorta}`);

        if (estatus == "Activo" && fechaCorta == vencimiento) {
            listaRecibosActivos.push({
                body: `*${vencimiento}* Recibo *${recibo.payload[i].serie}*\n*${descripcion}*`,
                media: recibo.payload[i].file,
                status: estatus
            });
            console.log('Recibo obtenida:', recibo.payload[i].file);
        }
        if (estatus == "Vencido") {
            listaRecibosVencidos.push({
                body: `*${vencimiento}* Recibo *${recibo.payload[i].serie}*\n*${descripcion}*`,
                media: recibo.payload[i].file,
                status: estatus
            });
            console.log('Recibo obtenida:', recibo.payload[i].file);
            fechaVigenciaExpirada.push(vencimiento);
        }

        
        //iterar en todos los elementos de la lista para agregarlos a la respuesta dentro del return flowDynamic
    } 

    if (listaRecibosVencidos.length === 0) {//solo recibos Activos
        console.log("Solo se encontraron recibos activos\n",listaRecibosActivos);
        if (soloFechaDeVigencia) {
            const result = fechaCorta;
            return {result};
        } else {
            const result = listaRecibosActivos;
            return {result};
        }

    } else{ // hay un recibo vencido
        console.log("El recibo se encuentra vencido:\n",listaRecibosVencidos);
        if (soloFechaDeVigencia) {
            console.log(fechaVigenciaExpirada[0]);
            const result = fechaVigenciaExpirada[0];
            return {result};
        } else {
            const result = listaRecibosVencidos;
            return {result};
        }
        
    }

    
}

function ordenarFechas(fechas) {
    fechas.sort((a, b) => new Date(a) - new Date(b));
  
    return fechas;
  }

module.exports = {
    getFechaCercana,
    ordenarFechas};
    
