const jwt = require('jsonwebtoken');

const verificarToken = (req, res, next) => {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ mensaje: 'No hay token, acceso denegado' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.usuario = decoded;
        next();
    } catch (error) {
        res.status(401).json({ mensaje: 'Token no válido' });
    }
};

const esAdmin = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'administrador') {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado - Se requieren permisos de administrador' });
    }
};

const esComprador = (req, res, next) => {
    if (req.usuario && req.usuario.rol === 'comprador') {
        next();
    } else {
        res.status(403).json({ mensaje: 'Acceso denegado - Se requieren permisos de comprador' });
    }
};

module.exports = {
    verificarToken,
    esAdmin,
    esComprador
}; 