const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configuración de la base de datos
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Verificar conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
        return console.error('Error al conectar a la base de datos:', err);
    }
    console.log('Conexión exitosa a la base de datos');
    release();
});

// Exportar pool para usar en otros archivos
module.exports.pool = pool;

// Rutas
app.use('/api/auth', require('./routes/auth'));
app.use('/api/productos', require('./routes/productos'));
app.use('/api/carrito', require('./routes/carrito'));
app.use('/api/pagos', require('./routes/pagos'));

// Ruta para servir la aplicación frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
}); 