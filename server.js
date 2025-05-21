const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2'); // O usa otro cliente de base de datos como pg para PostgreSQL
const app = express();
const port = 3000;
const jwt = require('jsonwebtoken');
const secretKey = 'asdfSDF6G12SDF65GS65DF1G65S0FD,G21S366Sd16sxdf51g3sdf4g6s13243262938864,50e5y35,60345-------gbs535767asdf'; // Cambia esto por una clave secreta más segura

// Configurar el middleware para servir archivos estáticos
app.use(express.static('/Users/lucas/Desktop/Gestiona')); // Cambia 'public' por el directorio donde están tus archivos estáticos
// Configurar middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Middleware para verificar el token JWT
function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401).send("No autorizado"); // Si no hay token, devolver 401

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403).send('Token inválido o expirado'); // Si el token no es válido, devolver 403
        req.user = user; // Guardar la información del usuario en la solicitud
        next(); // Pasar al siguiente middleware o ruta
    });
}

//CONFIGURACION DE LA BASE DE DATOS
// Configurar conexión a la base de datos
const db = mysql.createConnection({
    host: 'localhost', // Cambia esto si tu base de datos está en otro servidor
    user: 'root',      // Usuario de la base de datos
    password: '12341234',      // Contraseña de la base de datos
    database: 'Empresa_Conciertos' // Nombre de tu base de datos
});
// Conectar a la base de datos
db.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conexión exitosa a la base de datos');
});

//SOLICITUDES DE DATOS
// Ruta para manejar el inicio de sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Consulta para verificar las credenciales
    const query = 'SELECT * FROM Usuarios WHERE NombreUsuario = ? AND Contraseña = ?';
    db.query(query, [username, password], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log("Se consultó la base de datos (usuarios)");
        if (results.length > 0) {
            // Credenciales correctas, generar un token JWT
            const user = results[0]; // Información del usuario desde la base de datos
            const token = jwt.sign({ id: user.IdUsuario, username: user.NombreUsuario, role: user.Rol }, secretKey, { expiresIn: '1h' });

            // Redirigir al usuario a /presupuestos con el token
            res.json({ message: 'Inicio de sesión exitoso', token });

        } else {
            res.status(401).send('Credenciales incorrectas');
        }
    });
});

// Ruta protegida para acceder a presupuestos
app.get('/presupuestos', authenticateToken, (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado

    // Agregar encabezados para desactivar la caché
    res.set('Cache-Control', 'no-store'); // Evita que el navegador almacene en caché la respuesta


    // Consulta para obtener los presupuestos del usuario
    const query = `
        SELECT p.IdPresupuesto, g.Nombre, p.Concepto, p.Localizacion, p.Fecha
        FROM presupuestos p
        JOIN Grupos g ON p.IdGrupo = g.IdGrupo
        WHERE p.IdUsuario = ?
    `;
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log("Se consultó la base de datos (presupuestos), para el usuario: " + userId);
        res.json(results); // Enviar los presupuestos al cliente
    });
});

// Ruta para obtener los detalles de un presupuesto específico
app.get('/presupuesto', authenticateToken, (req, res) => {
    const idPresupuesto = req.headers['idpresupuesto']; // ID del usuario autenticado


    if (!idPresupuesto) {
        return res.status(400).json({ error: 'El ID del presupuesto es requerido' });
    }

    // Agregar encabezados para desactivar la caché
    res.set('Cache-Control', 'no-store'); // Evita que el navegador almacene en caché la respuesta


    // Consulta para obtener los presupuestos del usuario
    const query = `
        SELECT * FROM presupuestos
        WHERE IdPresupuesto = ?
    `;
    db.query(query, [idPresupuesto], (err, results) => {
        if (err) {
            console.error('Error al ejecutar la consulta:', err);
            res.status(500).send('Error interno del servidor');
            return;
        }
        console.log("Se consultaron los datos del presupuesto " + idPresupuesto, results);
        res.json(results[0]); // Enviar los presupuestos al cliente
    });
});

// Ruta protegida para obtener información del usuario
app.get('/user-info', authenticateToken, (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado

    // Consulta para obtener el rol del usuario
    const query = 'SELECT Rol FROM Usuarios WHERE IdUsuario = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener la información del usuario:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (results.length === 0) {
            return res.status(404).send('Usuario no encontrado');
        }

        const role = results[0].Rol; // Obtener el rol del usuario
        res.json({ role }); // Enviar el rol al cliente
    });
});

// Ruta para protegida para obtener la ifnormación de los grupos
app.get('/grupos', authenticateToken, (req, res) => {
    const query = 'SELECT IdGrupo, Nombre FROM Grupos';

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los grupos:', err);
            return res.status(500).send('Error interno del servidor');
        }

        res.json(results); // Enviar los grupos como JSON
    });
});

//INSERCIÓN DE DATOS
// Ruta para manejar la creación de un nuevo presupuesto
app.post('/presupuestos', authenticateToken, (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado (extraído del token)
    const { grupo, concepto, localizacion, fecha, hora, estado, precio, precio_iva, precio_final,idcontacto} = req.body; // Datos enviados desde el cliente

    // Validar que todos los campos estén presentes
    if (!grupo || !concepto || !localizacion ) {
        return res.status(400).send('Todos los campos son obligatorios');
    }
    
    // Si no se proporciona una fecha, usar NULL
    const fechaFinal = fecha || null;
    const horaFinal = hora || null;
    const estadoFinal = estado || "Sin Responder"; // Estado por defecto
    const precioFinal = precio || null; // Precio por defecto
    const precio_ivaFinal = precio_iva || 21; // Precio IVA por defecto
    const idcontactoFinal = idcontacto || null; // ID de contacto por defecto
    const precio_finalFinal = precio_final || null; // Precio final por defecto



    // Consulta SQL para insertar un nuevo presupuesto
    const query = 'INSERT INTO presupuestos (IdGrupo, Concepto, Localizacion, Fecha, Hora, Estado, Precio, Precio_iva, Precio_final, Idcontacto, IdUsuario) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [grupo, concepto, localizacion, fechaFinal, horaFinal, estadoFinal, precioFinal, precio_ivaFinal, precio_finalFinal, idcontactoFinal, userId];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al insertar el presupuesto:', err);
            return res.status(500).send('Error interno del servidor');
        }

        console.log('Presupuesto añadido con éxito:', result);

        // Enviar la fila recién insertada al cliente
        res.status(201).json({ message: "Presupuesto añadido con éxito" });
    });
});

//Ruta para manejar la modificación de datos de un presupuesto
app.post('/presupuestos-mod', authenticateToken, (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado (extraído del token)
    const { idpresupuesto, grupo, concepto, localizacion, fecha, hora, estado, precio, precio_iva, precio_final, idcontacto } = req.body; // Datos enviados desde el cliente

    // Validar que el ID del presupuesto esté presente
    if (!idpresupuesto) {
        return res.status(400).send('El ID del presupuesto es obligatorio');
    }

    // Validar que los campos obligatorios estén presentes
    if (!grupo || !concepto || !localizacion) {
        return res.status(400).send('Todos los campos obligatorios deben estar presentes');
    }

    // Si no se proporciona una fecha, usar NULL
    const fechaFinal = fecha || null;
    const horaFinal = hora || null;
    const estadoFinal = estado || "Sin Responder"; // Estado por defecto
    const precioFinal = precio || null; // Precio por defecto
    const precio_ivaFinal = precio_iva || 21; // Precio IVA por defecto
    const idcontactoFinal = idcontacto || null; // ID de contacto por defecto
    const precio_finalFinal = precio_final || null; // Precio final por defecto

    // Consulta SQL para actualizar el presupuesto existente
    const query = `
        UPDATE presupuestos
        SET IdGrupo = ?, Concepto = ?, Localizacion = ?, Fecha = ?, Hora = ?, Estado = ?, 
            Precio = ?, Precio_iva = ?, Precio_final = ?, Idcontacto = ?, IdUsuario = ?
        WHERE IdPresupuesto = ?
    `;
    const values = [
        grupo,
        concepto,
        localizacion,
        fechaFinal,
        horaFinal,
        estadoFinal,
        precioFinal,
        precio_ivaFinal,
        precio_finalFinal,
        idcontactoFinal,
        userId,
        idpresupuesto
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el presupuesto:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Presupuesto no encontrado');
        }

        console.log('Presupuesto actualizado con éxito:', result);
        res.status(200).json({ message: 'Presupuesto actualizado con éxito' });
    });
});

// Ruta para obtener los Grupos
app.get('/grupos', authenticateToken, (req, res) => {
    const query = 'SELECT * FROM Grupos';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los grupos:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.json(results);
    });
});

app.post('/grupos', authenticateToken, (req, res) => {
    const { idGrupo, nombreGrupo } = req.body;

    const query = 'INSERT INTO Grupos (IdGrupo, Nombre) VALUES (?, ?)';
    db.query(query, [idGrupo, nombreGrupo], (err, result) => {
        if (err) {
            console.error('Error al guardar el grupo:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.status(201).send('Grupo guardado con éxito');
    });
});

// Ruta para obtener los usuarios
app.get('/usuarios', authenticateToken, (req, res) => {
    const query = 'SELECT IdUsuario, NombreUsuario, Rol FROM Usuarios';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error al obtener los usuarios:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.json(results);
    });
});

app.post('/usuarios', authenticateToken, (req, res) => {
    const { idUsuario, nombreUsuario, rol } = req.body;

    // Validar que todos los campos estén presentes
    if (!idUsuario || !nombreUsuario || !rol) {
        return res.status(400).send('Todos los campos son obligatorios');
    }

    const query = 'INSERT INTO Usuarios (IdUsuario, NombreUsuario, Rol) VALUES (?, ?, ?)';
    db.query(query, [idUsuario, nombreUsuario, rol], (err, result) => {
        if (err) {
            console.error('Error al guardar el usuario:', err);
            return res.status(500).send('Error interno del servidor');
        }
        res.status(201).send('Usuario guardado con éxito');
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

app.get('/presupuestos/:id', authenticateToken, (req, res) => {
    const presupuestoId = req.params.id;
    const query = `
        SELECT IdPresupuesto, IdGrupo, Concepto, Localizacion, Fecha, Hora, Estado, 
               Precio, Precio_iva, Precio_final, Idcontacto, IdUsuario
        FROM presupuestos
        WHERE IdPresupuesto = ?
    `;

    db.query(query, [presupuestoId], (err, results) => {
        if (err) {
            console.error('Error al obtener los detalles del presupuesto:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (results.length === 0) {
            return res.status(404).send('Presupuesto no encontrado');
        }

        res.json(results[0]); // Enviar el primer resultado como JSON
    });
});

app.put('/presupuestos/:id', authenticateToken, (req, res) => {
    const presupuestoId = req.params.id;
    const {
        IdGrupo,
        Concepto,
        Localizacion,
        Fecha,
        Hora,
        Estado,
        Precio,
        Precio_iva,
        Precio_final,
        Idcontacto,
        IdUsuario
    } = req.body;

    const query = `
        UPDATE presupuestos
        SET IdGrupo = ?, Concepto = ?, Localizacion = ?, Fecha = ?, Hora = ?, Estado = ?, 
            Precio = ?, Precio_iva = ?, Precio_final = ?, Idcontacto = ?, IdUsuario = ?
        WHERE IdPresupuesto = ?
    `;

    db.query(query, [IdGrupo, Concepto, Localizacion, Fecha, Hora, Estado, Precio, Precio_iva, Precio_final, Idcontacto, IdUsuario, presupuestoId], (err, result) => {
        if (err) {
            console.error('Error al actualizar el presupuesto:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (result.affectedRows === 0) {
            return res.status(404).send('Presupuesto no encontrado');
        }

        res.json({ message: 'Presupuesto actualizado con éxito' });
    });
});

app.get('/usuarios/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    console.log('ID del usuario recibido:', userId); // Verificar el ID recibido

    const query = `
        SELECT IdUsuario, NombreUsuario, Rol, Contraseña, DNI, InstrumentoPrincipal, 
               InstrumentoSecundario, NumeroArtistitamente, NumeroSeguridadSocial
        FROM Usuarios
        WHERE IdUsuario = ?
    `;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error al obtener los detalles del usuario:', err);
            return res.status(500).send('Error interno del servidor');
        }

        if (results.length === 0) {
            console.log('Usuario no encontrado'); // Depuración
            return res.status(404).send('Usuario no encontrado');
        }

        console.log('Detalles del usuario encontrados:', results[0]); // Depuración
        res.json(results[0]); // Enviar el primer resultado como JSON
    });
});

app.put('/usuarios/:id', authenticateToken, (req, res) => {
    const userId = req.params.id;
    const {
        NombreUsuario,
        Rol,
        Contraseña,
        DNI,
        InstrumentoPrincipal,
        InstrumentoSecundario,
        NumeroArtistitamente,
        NumeroSeguridadSocial
    } = req.body;

    const query = `
        UPDATE Usuarios
        SET NombreUsuario = ?, Rol = ?, Contraseña = ?, DNI = ?, 
            InstrumentoPrincipal = ?, InstrumentoSecundario = ?, 
            NumeroArtistitamente = ?, NumeroSeguridadSocial = ?
        WHERE IdUsuario = ?
    `;

    const values = [
        NombreUsuario,
        Rol,
        Contraseña,
        DNI,
        InstrumentoPrincipal,
        InstrumentoSecundario,
        NumeroArtistitamente,
        NumeroSeguridadSocial,
        userId
    ];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al actualizar el usuario:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado con éxito' }); // Respuesta en formato JSON
    });
});

app.delete('/presupuestos/:id', authenticateToken, (req, res) => {
    const budgetId = req.params.id;

    const query = 'DELETE FROM Presupuestos WHERE IdPresupuesto = ?';
    db.query(query, [budgetId], (err, result) => {
        if (err) {
            console.error('Error al eliminar el presupuesto:', err);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Presupuesto no encontrado' });
        }

        res.status(200).json({ message: 'Presupuesto eliminado con éxito' });
    });
});