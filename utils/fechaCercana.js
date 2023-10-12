function hacerFechaCorta(fechas) {
    const fechaISO = fechas;
    const fecha = new Date(fechaISO);
    const year = fecha.getFullYear();
    const month = fecha.getMonth() + 1;
    const day = fecha.getDate();
    const fechaAcortada = `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;

    return fechaAcortada;
}


function getFechaCercana(recibo){
    const listaRecibosActivos= [];
    const listaRecibosVencidos= [];
    const fechasDeRecibos = [];
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
                body: `Estatus del Recibo *${estatus}* \nMonto Total *$${recibo.payload[i].amount}* \nVencimiento de Pago *${vencimiento}*`,
                media: recibo.payload[i].file
            });
            console.log('Recibo obtenida:', recibo.payload[i].file);
        }
        if (estatus == "Vencido") {
            listaRecibosVencidos.push({
                body: `Estatus del Recibo *${estatus}* \nMonto Total *$${recibo.payload[i].amount}* \nVencimiento de Pago *${vencimiento}*`,
                media: recibo.payload[i].file
            });
            console.log('Recibo obtenida:', recibo.payload[i].file);
        }

        
        //iterar en todos los elementos de la lista para agregarlos a la respuesta dentro del return flowDynamic
    } 

    console.log(listaRecibosActivos);
    return {listaRecibosActivos, listaRecibosVencidos};

    




    
}

module.exports = getFechaCercana;
