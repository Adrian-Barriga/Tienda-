const express = require('express');
const router = express.Router();
const { pool } = require('../app');
const { verificarToken, esComprador } = require('../middleware/auth');

// Procesar pago
router.post('/', [verificarToken, esComprador], async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Obtener items del carrito
        const carrito = await client.query(
            `SELECT c.id_producto, c.cantidad, p.precio, p.stock
             FROM carrito c
             JOIN productos p ON c.id_producto = p.id
             WHERE c.id_usuario = $1`,
            [req.usuario.id]
        );
        
        if (carrito.rows.length === 0) {
            return res.status(400).json({ mensaje: 'El carrito está vacío' });
        }
        
        // Calcular total
        let total = 0;
        for (const item of carrito.rows) {
            // Verificar stock
            if (item.stock < item.cantidad) {
                await client.query('ROLLBACK');
                return res.status(400).json({ 
                    mensaje: `Stock insuficiente para el producto ID: ${item.id_producto}` 
                });
            }
            total += item.precio * item.cantidad;
            
            // Actualizar stock
            await client.query(
                'UPDATE productos SET stock = stock - $1 WHERE id = $2',
                [item.cantidad, item.id_producto]
            );
        }
        
        // Registrar pago
        const pago = await client.query(
            'INSERT INTO pagos (id_usuario, total) VALUES ($1, $2) RETURNING *',
            [req.usuario.id, total]
        );
        
        // Vaciar carrito
        await client.query('DELETE FROM carrito WHERE id_usuario = $1', [req.usuario.id]);
        
        await client.query('COMMIT');
        
        res.json({
            mensaje: 'Pago procesado exitosamente',
            pago: pago.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    } finally {
        client.release();
    }
});

// Obtener historial de pagos del usuario
router.get('/', verificarToken, async (req, res) => {
    try {
        const pagos = await pool.query(
            'SELECT * FROM pagos WHERE id_usuario = $1 ORDER BY fecha DESC',
            [req.usuario.id]
        );
        res.json(pagos.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: 'Error en el servidor' });
    }
});

module.exports = router; 