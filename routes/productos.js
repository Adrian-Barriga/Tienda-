const express = require('express');
const router = express.Router();
const { pool } = require('../app');
const { verificarToken, esAdmin } = require('../middleware/auth');

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const productos = await pool.query('SELECT * FROM productos ORDER BY id ASC');
        res.json(productos.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Obtener un producto específico
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const producto = await pool.query('SELECT * FROM productos WHERE id = $1', [id]);
        
        if (producto.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        
        res.json(producto.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Crear un nuevo producto (solo admin)
router.post('/', [verificarToken, esAdmin], async (req, res) => {
    try {
        const { nombre, descripcion, precio, stock, imagen_url } = req.body;
        const nuevoProducto = await pool.query(
            'INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [nombre, descripcion, precio, stock, imagen_url]
        );
        
        res.json(nuevoProducto.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Actualizar un producto (solo admin)
router.put('/:id', [verificarToken, esAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, precio, stock, imagen_url } = req.body;
        
        const productoActualizado = await pool.query(
            'UPDATE productos SET nombre = $1, descripcion = $2, precio = $3, stock = $4, imagen_url = $5 WHERE id = $6 RETURNING *',
            [nombre, descripcion, precio, stock, imagen_url, id]
        );
        
        if (productoActualizado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        
        res.json(productoActualizado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Eliminar un producto (solo admin)
router.delete('/:id', [verificarToken, esAdmin], async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await pool.query('DELETE FROM productos WHERE id = $1 RETURNING *', [id]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        
        res.json({ mensaje: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

module.exports = router; 