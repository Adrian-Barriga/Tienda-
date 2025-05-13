// Variables globales
let carrito = [];
const IVA = 0.12;

// Cargar carrito
async function loadCarrito() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    try {
        toggleSpinner();
        const response = await fetch(`${API_URL}/carrito`, {
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        });
        carrito = await response.json();
        displayCarrito();
        updateTotals();
    } catch (error) {
        console.error('Error al cargar el carrito:', error);
        showToast('Error al cargar el carrito', 'danger');
    } finally {
        toggleSpinner(false);
    }
}

// Mostrar carrito
function displayCarrito() {
    const carritoItems = document.getElementById('carritoItems');
    const carritoVacio = document.getElementById('carritoVacio');
    const carritoContenido = document.getElementById('carritoContenido');

    if (carrito.length === 0) {
        carritoVacio.style.display = 'block';
        carritoContenido.style.display = 'none';
        return;
    }

    carritoVacio.style.display = 'none';
    carritoContenido.style.display = 'block';

    carritoItems.innerHTML = carrito.map(item => `
        <tr>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${item.imagen_url}" alt="${item.nombre}" 
                         style="width: 50px; height: 50px; object-fit: cover" class="me-2">
                    <div>
                        <h6 class="mb-0">${item.nombre}</h6>
                        <small class="text-muted">${item.descripcion}</small>
                    </div>
                </div>
            </td>
            <td>$${item.precio}</td>
            <td>
                <div class="input-group" style="width: 120px">
                    <button class="btn btn-outline-secondary btn-sm" 
                            onclick="updateCantidad(${item.id}, ${item.cantidad - 1})">-</button>
                    <input type="number" class="form-control form-control-sm text-center" 
                           value="${item.cantidad}" min="1" max="${item.stock}"
                           onchange="updateCantidad(${item.id}, this.value)">
                    <button class="btn btn-outline-secondary btn-sm" 
                            onclick="updateCantidad(${item.id}, ${item.cantidad + 1})">+</button>
                </div>
            </td>
            <td>$${(item.precio * item.cantidad).toFixed(2)}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="removeFromCart(${item.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// Actualizar cantidad
async function updateCantidad(productId, newCantidad) {
    if (newCantidad < 1) {
        await removeFromCart(productId);
        return;
    }

    const item = carrito.find(i => i.id === productId);
    if (!item || newCantidad > item.stock) {
        showToast('Cantidad no válida', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/carrito/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('token')
            },
            body: JSON.stringify({ cantidad: newCantidad })
        });

        if (!response.ok) throw new Error('Error al actualizar cantidad');

        await loadCarrito();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al actualizar la cantidad', 'danger');
    }
}

// Eliminar del carrito
async function removeFromCart(productId) {
    try {
        const response = await fetch(`${API_URL}/carrito/${productId}`, {
            method: 'DELETE',
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) throw new Error('Error al eliminar del carrito');

        showToast('Producto eliminado del carrito');
        await loadCarrito();
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al eliminar el producto', 'danger');
    }
}

// Actualizar totales
function updateTotals() {
    const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    const ivaAmount = subtotal * IVA;
    const total = subtotal + ivaAmount;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${ivaAmount.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;

    // Habilitar/deshabilitar botón de pago
    document.getElementById('btnProcesarPago').disabled = carrito.length === 0;
}

// Procesar pago
function procesarPago() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    new bootstrap.Modal(document.getElementById('paymentModal')).show();
}

// Confirmar pago
async function confirmarPago() {
    const form = document.getElementById('paymentForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }

    try {
        toggleSpinner();
        const response = await fetch(`${API_URL}/pagos`, {
            method: 'POST',
            headers: {
                'x-auth-token': localStorage.getItem('token')
            }
        });

        if (!response.ok) throw new Error('Error al procesar el pago');

        const data = await response.json();
        bootstrap.Modal.getInstance(document.getElementById('paymentModal')).hide();
        showToast('Pago procesado exitosamente');
        
        // Limpiar formulario y recargar carrito
        form.reset();
        await loadCarrito();
        
        // Redirigir a la página de confirmación después de 2 segundos
        setTimeout(() => {
            window.location.href = '/pedidos.html';
        }, 2000);
    } catch (error) {
        console.error('Error:', error);
        showToast('Error al procesar el pago', 'danger');
    } finally {
        toggleSpinner(false);
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadCarrito();

    // Formatear número de tarjeta
    const cardNumber = document.getElementById('cardNumber');
    if (cardNumber) {
        cardNumber.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 16) value = value.slice(0, 16);
            e.target.value = value;
        });
    }

    // Formatear fecha de vencimiento
    const expiryDate = document.getElementById('expiryDate');
    if (expiryDate) {
        expiryDate.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) value = value.slice(0, 4);
            if (value.length > 2) {
                value = value.slice(0, 2) + '/' + value.slice(2);
            }
            e.target.value = value;
        });
    }

    // Formatear CVV
    const cvv = document.getElementById('cvv');
    if (cvv) {
        cvv.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length > 4) value = value.slice(0, 4);
            e.target.value = value;
        });
    }
}); 