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

//INSECIÓN DE DATOS
// Ruta para manejar la creación de un nuevo presupuesto
app.post('/presupuestos', authenticateToken, (req, res) => {
    const userId = req.user.id; // ID del usuario autenticado (extraído del token)
    const { grupo, concepto, localizacion, fecha } = req.body; // Datos enviados desde el cliente

    // Validar que todos los campos estén presentes
    if (!grupo || !concepto || !localizacion ) {
        return res.status(400).send('Todos los campos son obligatorios');
    }
    
    // Si no se proporciona una fecha, usar NULL
    const fechaFinal = fecha || null;

    // Consulta SQL para insertar un nuevo presupuesto
    const query = 'INSERT INTO presupuestos (IdGrupo, Concepto, Localizacion, IdUsuario, Fecha) VALUES (?, ?, ?, ?, ?)';
    const values = [grupo, concepto, localizacion, userId, fechaFinal];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error('Error al insertar el presupuesto:', err);
            return res.status(500).send('Error interno del servidor');
        }

        console.log('Presupuesto añadido con éxito:', result);

        // Enviar la fila recién insertada al cliente
        const newPresupuesto = {
            IdGrupo: grupo,
            Concepto: concepto,
            Localizacion: localizacion,
            IdUsuario: userId,
            Fecha: fecha
        };

        res.status(201).json(newPresupuesto); // Respuesta con el nuevo presupuesto
    });
});




// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});