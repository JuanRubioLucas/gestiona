// PresupuestosDB.js

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
    });
})
.catch(error => {
    console.error('Error al obtener los presupuestos:', error);
    alert('No autorizado');
    window.location.href = '/index.html';
});