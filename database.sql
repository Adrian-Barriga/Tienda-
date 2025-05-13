CREATE DATABASE time_store
    
/*
DROP TABLE IF EXISTS pagos CASCADE;
DROP TABLE IF EXISTS carrito CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;*/

-- Crear tablas
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) CHECK (rol IN ('administrador', 'comprador')) NOT NULL
);

CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    stock INTEGER NOT NULL,
    imagen_url TEXT
);

CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id),
    id_producto INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    UNIQUE(id_usuario, id_producto)
);

CREATE TABLE pagos (
    id SERIAL PRIMARY KEY,
    id_usuario INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos de ejemplo con contraseña simple (123456)
INSERT INTO usuarios (nombre, correo, password, rol) VALUES
('Admin Usuario', 'admin@timestore.com', '$2a$10$GlsGSNhkbVon6ZOSNMptOu5RikedRzlCAhMa7YpxmnnP.LAKSHOie', 'administrador'),
('Cliente Demo', 'cliente@ejemplo.com', '$2a$10$GlsGSNhkbVon6ZOSNMptOu5RikedRzlCAhMa7YpxmnnP.LAKSHOie', 'comprador');

-- Insertar productos de ejemplo
INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url) VALUES
('Reloj Clásico Elite', 'Reloj analógico con correa de cuero genuino', 299.99, 50, '/images/reloj-clasico.jpg'),
('Smartwatch Pro', 'Reloj inteligente con monitor cardíaco y GPS', 499.99, 30, '/images/smartwatch.jpg'),
('Reloj Deportivo X-treme', 'Resistente al agua hasta 100m, ideal para deportes', 199.99, 40, '/images/reloj-deportivo.jpg'); 
