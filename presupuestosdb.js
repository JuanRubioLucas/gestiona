// Obtener los presupuestos del servidor
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
    const tableBody = document.getElementById('presupuestos-body');
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
            window.location.href = `/detallesPresupuesto.html?id=${presupuesto.IdPresupuesto}`;
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

//AÑADIR PRESUPUESTO

// Obtener los grupos desde la base de datos y llenar el desplegable
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


// Mostrar el modal al hacer clic en el botón flotante
const addBudgetBtn = document.getElementById('add-budget-btn');
const addBudgetModal = document.getElementById('add-budget-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const addBudgetForm = document.getElementById('add-budget-form');

addBudgetBtn.addEventListener('click', () => {
    addBudgetModal.classList.remove('hidden');
});

closeModalBtn.addEventListener('click', () => {
    addBudgetModal.classList.add('hidden');
});

// Enviar el formulario para añadir un nuevo presupuesto
addBudgetForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const grupo = document.getElementById('grupo').value;
    const concepto = document.getElementById('concepto').value;
    const localizacion = document.getElementById('localizacion').value;
    const fecha = document.getElementById('fecha').value;

    fetch('/presupuestos', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ grupo, concepto, localizacion, fecha })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Error al añadir el presupuesto');
        }
        return response.json();
    })
    .then(newPresupuesto => {
        // Añadir el nuevo presupuesto a la tabla
        const tableBody = document.getElementById('presupuestos-body');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${newPresupuesto.Nombre}</td>
            <td>${newPresupuesto.Concepto}</td>
            <td>${newPresupuesto.Localizacion}</td>
            <td>${new Date(newPresupuesto.Fecha).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-')}</td>               
        `
       tableBody.appendChild(row);

        // Cerrar el modal y limpiar el formulario
        addBudgetModal.classList.add('hidden');
        addBudgetForm.reset();
    })
    .catch(error => {
        console.error('Error al añadir el presupuesto:', error);
        alert('Error al añadir el presupuesto');
    });
});



 // Abrir el formulario al pulsar Shift + N
document.addEventListener('keydown', (event) => {
    if (event.shiftKey && event.key === 'N') {
        addBudgetModal.classList.remove('hidden');
    }
});