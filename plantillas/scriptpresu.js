// Obtener el ID del presupuesto desde la URL
const params = new URLSearchParams(window.location.search);
const budgetId = params.get('id');

// Obtener el token del almacenamiento local
const token = localStorage.getItem('token');

// Verifica si el token existe
if (!token) {
    alert('No estás autenticado. Por favor, inicia sesión.');
    window.location.href = '/index.html'; // Redirigir al login si no hay token
}

// Función para obtener el presupuesto
function obtenerPresupuesto(idPresupuesto) {
    console.log('Obteniendo presupuesto con ID:', idPresupuesto);
    return fetch('/presupuesto', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'idPresupuesto': idPresupuesto
        }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al obtener el presupuesto ' + idPresupuesto + ' del servidor');
            }
            return response.json();
        })
        .catch(error => {
            console.error('Error al obtener los grupos:', error);
        });
}

/*
// Esperar a que la función obtenerPresupuesto devuelva los datos
const budgetData = await obtenerPresupuesto(idPresupuesto);
budgetData.IdPresupuesto;
budgetData.IdGrupo;
budgetData.Concepto;
budgetData.Localizacion;
budgetData.Hora;
budgetData.Estado;
parseFloat(budgetData.Precio).toFixed(2);
parseInt(budgetData.Precio_iva);
(parseFloat(budgetData.Precio)*(1+parseInt(budgetData.Precio_iva)/100)).toFixed(2);
budgetData.Idcontacto;
budgetData.IdUsuario;
*/

// Esperar a que la función obtenerPresupuesto devuelva los datos
async function rellenarDatos() {
    const budgetData = await obtenerPresupuesto(budgetId);
    console.log('Datos del presupuesto:', budgetData.Concepto, budgetData.Localizacion, budgetData.Fecha);
    console.log('ID del presupuesto:', budgetData['IdPresupuesto']);

    // Convertir la fecha al formato ISO 8601 (yyyy-mm-dd)
    const fecha = new Date(budgetData.Fecha);
    const fechaISO = fecha.toISOString().split('T')[0]; // Obtener solo la parte de la fecha
    console.log('Fecha en formato ISO:', fechaISO);


    //AÑADIR LOS DATOS DEL PRESUPUESTO A LA PLANTILLA
    const diccionario = {
        //variable javascript: "texto a sustituri en el html.body"
        "Concepto": "##nombres",
        "Localizacion": "##espacio",
        "Precio_iva": "##porc"
    };

    const hoy = new Date();
    const dia = String(hoy.getDate()).padStart(2, '0'); // Asegura que el día tenga 2 dígitos
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // Los meses van de 0 a 11, por eso sumamos 1
    const anio = hoy.getFullYear();




    // Iterar sobre las claves del diccionario
    const body = document.body;
    for (const clave in diccionario) {
        if (diccionario.hasOwnProperty(clave)) {
            // Obtener el texto a sustituir en el body
            const textoASustituir = diccionario[clave];
            //console.log("clave:", clave);
            //console.log("Sustituyendo:", textoASustituir, "por:", window[clave]);
            // Buscar todas las ocurrencias del texto en el body y reemplazarlas
            body.innerHTML = body.innerHTML.replaceAll(textoASustituir, budgetData[clave] || '');
        }
    }
    body.innerHTML = body.innerHTML.replaceAll("##iva", (parseFloat(budgetData.Precio) * (parseInt(budgetData.Precio_iva) / 100)).toFixed(2).toString().replace(".", ","));
    body.innerHTML = body.innerHTML.replaceAll("##final", (parseFloat(budgetData.Precio) * (1 + parseInt(budgetData.Precio_iva) / 100)).toFixed(2).toString().replace(".", ","));
    body.innerHTML = body.innerHTML.replaceAll("##siniva", (parseFloat(budgetData.Precio)).toFixed(2).toString().replace(".", ","));
    body.innerHTML = body.innerHTML.replaceAll("##fechaactuacion", fechaISO);
    body.innerHTML = body.innerHTML.replaceAll("##fecha", `${dia}/${mes}/${anio}`);

    //DAR FORMATO A LA HORA
    const date = new Date(budgetData.Hora);
    const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    body.innerHTML = body.innerHTML.replaceAll("##horas", budgetData.Hora.toString().slice(0, 5));



}

rellenarDatos();

//BOTON DE IMPRIMIR
// Función para descargar el PDF
function descargarPDF() {
    const button = document.getElementById('download-btn');

    // Seleccionar el contenido que queremos convertir en PDF
    const content = document.body;

    // Configuración de html2pdf
    const options = {
        margin: [2, 0.5, 0.5, 0.5],
        filename: 'Presupuesto_Boda.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };
    console.log("Imprimiendo PDF con opciones:", options);
    // Ocultar el botón antes de generar el PDF
    button.style.display = 'none';
    // Generar el PDF
    html2pdf().set(options).from(content).save().then(() => {
        // Volver a mostrar el botón después de generar el PDF
        button.style.display = 'block';
    });
}