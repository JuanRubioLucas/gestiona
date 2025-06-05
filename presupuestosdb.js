// PresupuestosDB.js

// Obtener los presupuestos del servidor para actualizar presupuestos
function actualizarTablaPresupuestos() {
    const tableBody = document.getElementById('presupuestos-body');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de llenarla
    fetch('/presupuestos', {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('No autorizado');
            }
            return response.json();
        })
        .then(data => {
            console.log('Presupuestos:', data);
            data.forEach(presupuesto => {
                const row = document.createElement('tr');
                row.innerHTML = `
                <td>${presupuesto.Nombre}</td>
                <td>${presupuesto.Concepto}</td>
                <td>${presupuesto.Localizacion}</td>
                <td>${new Date(presupuesto.Fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}</td>
            `;
                tableBody.appendChild(row);
                // Agregar evento click a la fila
                row.addEventListener('click', () => {
                    // Redirigir a la página de detalles con el ID del presupuesto
                    // window.location.href = `/detallesPresupuesto.html?id=${presupuesto.IdPresupuesto}`;
                    openModal('show', presupuesto.IdPresupuesto);
                });

                // Cambiar el cursor al pasar sobre la fila
                row.style.cursor = 'pointer';
            });
        })
        .catch(error => {
            console.error('Error al obtener los presupuestos:', error);
            alert('No autorizado');
            window.location.href = '/index.html';
        });
}
actualizarTablaPresupuestos();

//AÑADIR PRESUPUESTO
//Obtener los grupos desde la base de datos y llenar el desplegable
fetch('/grupos', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al obtener los grupos');
        }
        return response.json();
    })
    .then(grupos => {
        const grupoSelect = document.getElementById('grupo');
        grupos.forEach(grupo => {
            const option = document.createElement('option');
            option.value = grupo.IdGrupo; // Enviar el ID del grupo
            option.textContent = grupo.Nombre; // Mostrar el nombre del grupo
            grupoSelect.appendChild(option);
        });
    })
    .catch(error => {
        console.error('Error al obtener los grupos:', error);
    });

//CONSULTAR PRESUPUESTO
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
//AÑADIR PRESUPUESTO
function addBudget() {

    const grupo = document.getElementById('grupo').value;
    const concepto = document.getElementById('concepto').value;
    const localizacion = document.getElementById('localizacion').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const estado = document.getElementById('estado').value;
    const precio = document.getElementById('precio').value;
    const precio_iva = document.getElementById('precio-iva').value;
    //const precio_final = document.getElementById('precio-final').value;
    const idcontacto = document.getElementById('idcontacto').value;
    const idusuario = document.getElementById('idusuario').value;

    fetch('/presupuestos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grupo, concepto, localizacion, fecha, hora, estado, precio, precio_iva, idcontacto, idusuario })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al añadir el presupuesto');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);

            // Actualizar la tabla de presupuestos después de añadir un nuevo presupuesto
            actualizarTablaPresupuestos();

            // Cerrar el modal y limpiar el formulario
            modal.classList.remove('show');
            budgetForm.reset();
            document.body.classList.remove('no-scroll'); // Eliminar la clase no scroll del body cuando se cierra el modal
        })
        .catch(error => {
            console.error('Error al añadir el presupuesto:', error);
            alert('Error al añadir el presupuesto');
        });
};
//MODIFICAR PRESUPUESTO
function modBudget() {
    const idpresupuesto = document.getElementById('idpresupuesto').value;
    console.log('Modificando presupuesto con ID:', idpresupuesto);
    const grupo = document.getElementById('grupo').value;
    const concepto = document.getElementById('concepto').value;
    const localizacion = document.getElementById('localizacion').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const estado = document.getElementById('estado').value;
    const precio = document.getElementById('precio').value;
    const precio_iva = document.getElementById('precio-iva').value;
    //const precio_final = document.getElementById('precio-final').value;
    const idcontacto = document.getElementById('idcontacto').value;
    const idusuario = document.getElementById('idusuario').value;

    fetch('/presupuestos-mod', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            idpresupuesto,
            grupo,
            concepto,
            localizacion,
            fecha,
            hora,
            estado,
            precio,
            precio_iva,
            idcontacto,
            idusuario
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al modificar el presupuesto');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.message);

            // Actualizar la tabla de presupuestos después de añadir un nuevo presupuesto
            actualizarTablaPresupuestos();

            // Cerrar el modal y limpiar el formulario
            modal.classList.remove('show');
            document.body.classList.remove('no-scroll'); // Eliminar la clase no scroll del body cuando se cierra el modal
            budgetForm.reset();
        })
        .catch(error => {
            console.error('Error al modificar el presupuesto:', error);
            alert('Error al modificar el presupuesto');
        });
};

// Mostrar el modal al hacer clic en el botón flotante
const addBudgetBtn = document.getElementById('add-budget-btn');
const modal = document.getElementById('budget-modal');
const modalTitle = document.getElementById('modal-title');
const modalActionBtn = document.getElementById('modal-action-btn');
const generarPresupuestoBtn = document.getElementById('generate-budget-btn');
const budgetForm = document.getElementById('budget-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const deleteBudgetBtn = document.getElementById('delete-budget-btn');

// Función para abrir el modal
async function openModal(action, idPresupuesto) {
    if (action === 'add') {
        modalTitle.textContent = 'Añadir Presupuesto';
        modalActionBtn.textContent = 'Añadir';
        budgetForm.reset(); // Limpiar el formulario
        modal.classList.add('show');
    } else if (action === 'show') {
        modalTitle.textContent = 'Presupuesto nº: ' + idPresupuesto;
        modalActionBtn.textContent = 'Guardar Cambios';

        try {
            // Esperar a que la función obtenerPresupuesto devuelva los datos
            const budgetData = await obtenerPresupuesto(idPresupuesto);
            // Rellenar el formulario con los datos del presupuesto
            document.getElementById('idpresupuesto').value = budgetData.IdPresupuesto;
            document.getElementById('grupo').value = budgetData.IdGrupo;
            document.getElementById('concepto').value = budgetData.Concepto;
            document.getElementById('localizacion').value = budgetData.Localizacion;
            // Convertir la fecha al formato ISO 8601 (yyyy-mm-dd)
            const fecha = new Date(budgetData.Fecha);
            const fechaISO = fecha.toISOString().split('T')[0]; // Obtener solo la parte de la fecha
            console.log('Fecha en formato ISO:', fechaISO);

            // Asignar la fecha al campo de tipo date
            document.getElementById('fecha').value = fechaISO;
            // Asignar la fecha formateada al campo de fecha
            console.log('Fecha formateada:', fechaISO);

            document.getElementById('hora').value = budgetData.Hora;
            document.getElementById('estado').value = budgetData.Estado;
            document.getElementById('precio').value = parseFloat(budgetData.Precio).toFixed(2);
            document.getElementById('precio-iva').value = parseInt(budgetData.Precio_iva);
            document.getElementById('precio-final').value = (parseFloat(budgetData.Precio) * (1 + parseInt(budgetData.Precio_iva) / 100)).toFixed(2);
            document.getElementById('idcontacto').value = budgetData.Idcontacto;
            document.getElementById('idusuario').value = budgetData.IdUsuario;
        } catch (error) {
            console.error('Error al obtener el presupuesto:', error);
            alert('No se pudo cargar el presupuesto');
        }
    }
    modal.classList.add('show');
}

//EVENT LISTNERS
// Función para cerrar el modal
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('show');
});

//funcion para generar el persupuesto
generarPresupuestoBtn.addEventListener('click', () => {
    modBudget(); // Llamar a la función para modificar presupuesto 
    const idpresupuesto = document.getElementById('idpresupuesto').value;
    console.log('Generando presupuesto con ID:', idpresupuesto);
    window.location.href = `plantillas/presuboda.html?id=${idpresupuesto}`;
});
// Evento para manejar el envío del formulario
budgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (modalActionBtn.textContent === 'Añadir') {
        addBudget(); // Llamar a la función para añadir presupuesto 
        console.log('Añadiendo presupuesto...');
    } else if (modalActionBtn.textContent === 'Guardar Cambios') {
        modBudget(); // Llamar a la función para modificar presupuesto
        console.log('Guardando cambios en el presupuesto...');
    }
});

// Abrir el modal para añadir un nuevo presupuesto
addBudgetBtn.addEventListener('click', () => {
    openModal('add');
});

//Boton cerrar modal
closeModalBtn.addEventListener('click', () => {
    modal.classList.add('hidden');
});

//Actualizar precio total
const precioInput = document.getElementById('precio');
const ivaInput = document.getElementById('precio-iva');
const precioFinalInput = document.getElementById('precio-final');
// Función para calcular el precio final
function calcularPrecioFinal() {
    const precio = parseFloat(precioInput.value) || 0; // Convertir a número o usar 0 si está vacío
    const iva = parseFloat(ivaInput.value) || 0; // Convertir a número o usar 0 si está vacío
    const precioFinal = precio * (1 + iva / 100); // Fórmula para calcular el precio final
    precioFinalInput.value = precioFinal.toFixed(2); // Mostrar el resultado con 2 decimales
}
// Añadir event listeners a los campos
precioInput.addEventListener('keyup', calcularPrecioFinal);
ivaInput.addEventListener('keyup', calcularPrecioFinal);



//ATAJOS DE TECLADO
// Abrir el formulario al pulsar Shift + N
document.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key === 'N') {
        modal.classList.remove('hidden');
        modal.classList.add('show');
        document.body.classList.add('no-scroll'); // Añadir clase para evitar scroll
    }
});