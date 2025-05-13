const express = require('express');
const router = express.Router();
const { pool } = require('../app');
const { verificarToken, esComprador } = require('../middleware/auth');

// Obtener carrito del usuario
router.get('/', verificarToken, async (req, res) => {
    try {
        const carrito = await pool.query(
            `SELECT c.id, c.cantidad, p.* 
             FROM carrito c 
             JOIN productos p ON c.id_producto = p.id 
             WHERE c.id_usuario = $1`,
            [req.usuario.id]
        );
        res.json(carrito.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Agregar producto al carrito
router.post('/', [verificarToken, esComprador], async (req, res) => {
    const { id_producto, cantidad } = req.body;
    
    try {
        // Verificar stock disponible
        const producto = await pool.query('SELECT stock FROM productos WHERE id = $1', [id_producto]);
        
        if (producto.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }
        
        if (producto.rows[0].stock < cantidad) {
            return res.status(400).json({ mensaje: 'Stock insuficiente' });
        }
        
        // Verificar si el producto ya está en el carrito
        const itemExistente = await pool.query(
            'SELECT * FROM carrito WHERE id_usuario = $1 AND id_producto = $2',
            [req.usuario.id, id_producto]
        );
        
        let resultado;
        if (itemExistente.rows.length > 0) {
            // Actualizar cantidad
            resultado = await pool.query(
                'UPDATE carrito SET cantidad = cantidad + $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
                [cantidad, req.usuario.id, id_producto]
            );
        } else {
            // Agregar nuevo item
            resultado = await pool.query(
                'INSERT INTO carrito (id_usuario, id_producto, cantidad) VALUES ($1, $2, $3) RETURNING *',
                [req.usuario.id, id_producto, cantidad]
            );
        }
        
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Actualizar cantidad de un producto en el carrito
router.put('/:id_producto', [verificarToken, esComprador], async (req, res) => {
    const { id_producto } = req.params;
    const { cantidad } = req.body;
    
    try {
        // Verificar stock disponible
        const producto = await pool.query('SELECT stock FROM productos WHERE id = $1', [id_producto]);
        
        if (producto.rows[0].stock < cantidad) {
            return res.status(400).json({ mensaje: 'Stock insuficiente' });
        }
        
        const resultado = await pool.query(
            'UPDATE carrito SET cantidad = $1 WHERE id_usuario = $2 AND id_producto = $3 RETURNING *',
            [cantidad, req.usuario.id, id_producto]
        );
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito' });
        }
        
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Eliminar producto del carrito
router.delete('/:id_producto', [verificarToken, esComprador], async (req, res) => {
    try {
        const { id_producto } = req.params;
        const resultado = await pool.query(
            'DELETE FROM carrito WHERE id_usuario = $1 AND id_producto = $2 RETURNING *',
            [req.usuario.id, id_producto]
        );
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado en el carrito' });
        }
        
        res.json({ mensaje: 'Producto eliminado del carrito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

// Vaciar carrito
router.delete('/', [verificarToken, esComprador], async (req, res) => {
    try {
        await pool.query('DELETE FROM carrito WHERE id_usuario = $1', [req.usuario.id]);
        res.json({ mensaje: 'Carrito vaciado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

module.exports = router; 