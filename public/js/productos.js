// Variables globales
let productos = [];
let currentPage = 1;
const itemsPerPage = 9;
let filteredProducts = [];

// Cargar productos
async function loadProducts() {
    try {
        toggleSpinner();
        const response = await fetch(`${API_URL}/productos`);
        productos = await response.json();
        filteredProducts = [...productos];
        displayProducts();
        setupPagination();
        checkAdminStatus();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showToast('Error al cargar los productos', 'danger');
    } finally {
        toggleSpinner(false);
    }
}

// Mostrar productos
function displayProducts() {
    const grid = document.getElementById('productsGrid');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    grid.innerHTML = paginatedProducts.map(product => `
        <div class="col-md-4 mb-4">
            <div class="card product-card h-100">
                <img src="${product.imagen_url}" class="card-img-top" alt="${product.nombre}">
                <div class="card-body">
                    <h5 class="card-title">${product.nombre}</h5>
                    <p class="card-text">${product.descripcion}</p>
                    <p class="card-text">
                        <strong>Precio: $${product.precio}</strong><br>
                        <small class="text-muted">Stock: ${product.stock} unidades</small>
                    </p>
                </div>
                <div class="card-footer bg-white border-top-0">
                    <div class="d-flex justify-content-between align-items-center">
                        <button onclick="addToCart(${product.id})" class="btn btn-primary" 
                                ${product.stock === 0 ? 'disabled' : ''}>
                            ${product.stock === 0 ? 'Agotado' : 'Agregar al Carrito'}
                        </button>
                        <div class="admin-controls" style="display: none;">
                            <button onclick="editProduct(${product.id})" class="btn btn-sm btn-warning">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteProduct(${product.id})" class="btn btn-sm btn-danger">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Configurar paginación
function setupPagination() {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Anterior</a>
        </li>
    `;

    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${currentPage === i ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
    }

    paginationHTML += `
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Siguiente</a>
        </li>
    `;

    pagination.innerHTML = paginationHTML;
}

// Cambiar página
function changePage(page) {
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    displayProducts();
    setupPagination();
}

// Verificar si el usuario es administrador
async function checkAdminStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        document.getElementById('adminControls').style.display = 'none';
        document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'none');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/verificar`, {
            headers: { 'x-auth-token': token }
        });
        const data = await response.json();

        if (data.usuario.rol === 'administrador') {
            document.getElementById('adminControls').style.display = 'block';
            document.querySelectorAll('.admin-controls').forEach(el => el.style.display = 'block');
        }
    } catch (error) {
        console.error('Error al verificar rol:', error);
    }
}

// Funciones de filtrado y búsqueda
function filterProducts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const sortBy = document.getElementById('sortSelect').value;
    const filterBy = document.getElementById('filterSelect').value;

    filteredProducts = productos.filter(product => {
        const matchesSearch = product.nombre.toLowerCase().includes(searchTerm) ||
                            product.descripcion.toLowerCase().includes(searchTerm);
        const matchesFilter = filterBy === 'all' ||
                            (filterBy === 'available' && product.stock > 0) ||
                            (filterBy === 'unavailable' && product.stock === 0);
        return matchesSearch && matchesFilter;
    });

    // Aplicar ordenamiento
    switch (sortBy) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.precio - b.precio);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.precio - a.precio);
            break;
        case 'name-asc':
            filteredProducts.sort((a, b) => a.nombre.localeCompare(b.nombre));
            break;
        case 'name-desc':
            filteredProducts.sort((a, b) => b.nombre.localeCompare(a.nombre));
            break;
    }

    currentPage = 1;
    displayProducts();
    setupPagination();
}

// Funciones CRUD para administradores
async function addProduct() {
    const formData = {
        nombre: document.getElementById('productName').value,
        descripcion: document.getElementById('productDescription').value,
        precio: parseFloat(document.getElementById('productPrice').value),
        stock: parseInt(document.getElementById('productStock').value),
        imagen_url: document.getElementById('productImage').value
    };

    try {
        const response = await fetch(`${API_URL}/productos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al agregar producto');

        showToast('Producto agregado exitosamente');
        document.getElementById('addProductForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al agregar el producto', 'danger');
    }
}

async function editProduct(id) {
    const product = productos.find(p => p.id === id);
    if (!product) return;

    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.nombre;
    document.getElementById('editProductDescription').value = product.descripcion;
    document.getElementById('editProductPrice').value = product.precio;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductImage').value = product.imagen_url;

    new bootstrap.Modal(document.getElementById('editProductModal')).show();
}

async function updateProduct() {
    const id = document.getElementById('editProductId').value;
    const formData = {
        nombre: document.getElementById('editProductName').value,
        descripcion: document.getElementById('editProductDescription').value,
        precio: parseFloat(document.getElementById('editProductPrice').value),
        stock: parseInt(document.getElementById('editProductStock').value),
        imagen_url: document.getElementById('editProductImage').value
    };

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) throw new Error('Error al actualizar producto');

        showToast('Producto actualizado exitosamente');
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
        loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al actualizar el producto', 'danger');
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
        const response = await fetch(`${API_URL}/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) throw new Error('Error al eliminar producto');

        showToast('Producto eliminado exitosamente');
        loadProducts();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar el producto', 'danger');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();

    // Búsqueda y filtros
    document.getElementById('searchButton').addEventListener('click', filterProducts);
    document.getElementById('searchInput').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') filterProducts();
    });
    document.getElementById('sortSelect').addEventListener('change', filterProducts);
    document.getElementById('filterSelect').addEventListener('change', filterProducts);

    // Formularios de productos
    document.getElementById('saveProductBtn').addEventListener('click', addProduct);
    document.getElementById('updateProductBtn').addEventListener('click', updateProduct);
}); 