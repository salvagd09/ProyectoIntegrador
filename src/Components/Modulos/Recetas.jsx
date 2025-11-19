import { useState, useEffect, useCallback } from "react";
import { Container, Button, Card, Row, Col, Form, InputGroup, Modal, Table } from 'react-bootstrap';
import styles from '../Modulos/Menu.module.css';

const API_BASE_URL = "http://localhost:8000";

function Recetas() {
// Estados principales
const [productos, setProductos] = useState([]);
const [ingredientes, setIngredientes] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Estados para filtros
const [filtroActivo, setFiltroActivo] = useState('todos'); // 'Todos', 'Con receta', 'Sin receta'
const [terminoBusqueda, setTerminoBusqueda] = useState('');

// Estados para modales
const [showModal, setShowModal] = useState(false);
const [modalType, setModalType] = useState(''); // 'agregar' o 'editar'
const [productoEditando, setProductoEditando] = useState(null);

 // Estados para mensajes
const [showConfirmModal, setShowConfirmModal] = useState(false);
const [confirmAction, setConfirmAction] = useState(null);
const [confirmMessage, setConfirmMessage] = useState("");

// Estados para mensajes de éxito
const [showSuccessModal, setShowSuccessModal] = useState(false);
const [successMessage, setSuccessMessage] = useState("");
const [isSuccess, setIsSuccess] = useState(true);

  // Estado del formulario
const [form, setForm] = useState({
    ingredientes: [{ ingrediente_id: "", cantidad_requerida: "" }]
});

  // Estilos
const moduleBg = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)' 
};
    
const headerStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    border: `1px solid var(--color-header)` 
};

const cardStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    border: `2px solid var(--color-accent)` 
};

const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
};

const btnPrimary = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
};

const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white'
};

const btnWarning = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
};

const btnAccent = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
};

const btnFilter = { 
    backgroundColor: 'var(--color-card)', 
    borderColor: 'var(--color-accent)', 
    color: 'var(--color-text)',
    fontWeight: 'normal'
};

const btnFilterActive = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white',
    fontWeight: 'bold'
};

  // Cargar datos iniciales
const fetchDatosIniciales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
        // Cargar productos activos con sus recetas
        const prodResponse = await fetch(`${API_BASE_URL}/menu/`);
        if (!prodResponse.ok) throw new Error("Fallo al cargar productos");
        const prodData = await prodResponse.json();
        setProductos(prodData);

        // Cargar ingredientes disponibles
        const ingResponse = await fetch(`${API_BASE_URL}/ingredientes/`);
        if (!ingResponse.ok) throw new Error("Fallo al cargar ingredientes");
        const ingData = await ingResponse.json();
        setIngredientes(ingData);

    } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
    } finally {
        setLoading(false);
    }
}, []);

// Obtener receta específica de un producto
const fetchRecetaProducto = async (productoId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/menu/${productoId}/receta`);
        if (!response.ok) throw new Error("Fallo al cargar receta del producto");
        return await response.json();
    } catch (error) {
        console.error("Error fetching receta:", error);
        return [];
    }
};

// Guardar receta (Agregar o Editar)
const guardarReceta = async () => {
    if (!productoEditando || form.ingredientes.length === 0) {
        setSuccessMessage("Selecciona un producto y agrega al menos un ingrediente");
        setIsSuccess(false);
        setShowSuccessModal(true);
        return;
    }

    // Validar que todos los ingredientes tengan ID y cantidad
    const ingredientesInvalidos = form.ingredientes.some(ing => !ing.ingrediente_id || !ing.cantidad_requerida);
    if (ingredientesInvalidos) {
        setSuccessMessage("Todos los ingredientes deben tener un ingrediente seleccionado y una cantidad");
        setIsSuccess(false);
        setShowSuccessModal(true);
        return;
    }

    const payload = form.ingredientes.map(ing => ({
        ingrediente_id: parseInt(ing.ingrediente_id),
        cantidad_requerida: parseFloat(ing.cantidad_requerida)
    }));

    const url = `${API_BASE_URL}/menu/${productoEditando.id}/receta`;

    try {
        const response = await fetch(url, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },    
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
            throw new Error(errorData.detail || "Error al guardar receta");
        }

        setSuccessMessage(`Receta ${modalType === 'agregar' ? 'agregada' : 'actualizada'} con éxito`);
        setIsSuccess(true);
        cerrarModal();
        setShowSuccessModal(true);

    } catch (error) {
        console.error("Error al guardar:", error);
        setSuccessMessage(`Error al guardar: ${error.message}`);
        setIsSuccess(false);
        setShowSuccessModal(true);
    }
};

// Efecto para cargar datos al montar
useEffect(() => {
    fetchDatosIniciales();
}, [fetchDatosIniciales]);

// Handlers para el modal
const abrirModalEditar = async (producto) => {
    setModalType('editar');
    setProductoEditando(producto);
    
    // Cargar la receta existente del producto
    const recetaExistente = await fetchRecetaProducto(producto.id);
    
    setForm({
        ingredientes: recetaExistente.length > 0 
        ? recetaExistente.map(ing => ({
            ingrediente_id: ing.ingrediente_id.toString(),
            cantidad_requerida: ing.cantidad_requerida.toString()
        }))
        : [{ ingrediente_id: "", cantidad_requerida: "" }]
    });
    setShowModal(true);  
};

const abrirModalAgregar = (producto) => {
    setModalType('agregar');
    setProductoEditando(producto);
    setForm({
        ingredientes: [{ ingrediente_id: "", cantidad_requerida: "" }]
    });
    setShowModal(true);
};

const cerrarModal = () => {
    setShowModal(false);
    setProductoEditando(null);
};

// Handlers para el formulario
const handleIngredienteChange = (index, field, value) => {
    const nuevosIngredientes = [...form.ingredientes];
    nuevosIngredientes[index][field] = value;
    setForm({ ...form, ingredientes: nuevosIngredientes });
};

const agregarIngrediente = () => {
    setForm({
        ...form,
        ingredientes: [...form.ingredientes, { ingrediente_id: "", cantidad_requerida: "" }]
    });
};

const eliminarIngrediente = (index) => {
    if (form.ingredientes.length > 1) {
        const nuevosIngredientes = form.ingredientes.filter((_, i) => i !== index);
        setForm({ ...form, ingredientes: nuevosIngredientes });
    }
};

// Función para cerrar modal de éxito
const cerrarSuccessModal = () => {
    setShowSuccessModal(false);
    if (isSuccess) {
        fetchDatosIniciales();
    }
};

// Separar productos con y sin receta
const productosConReceta = productos.filter(p => p.ingredientes_receta && p.ingredientes_receta.length > 0);
const productosSinReceta = productos.filter(p => !p.ingredientes_receta || p.ingredientes_receta.length === 0);

// Filtrar productos según el filtro activo y búsqueda
const productosFiltrados = () => {
    let productosFiltrados = [];
    
    switch (filtroActivo) {
        case 'con-receta':
            productosFiltrados = productosConReceta;
            break;

        case 'sin-receta':      
            productosFiltrados = productosSinReceta;
            break;
        default:
        productosFiltrados = [...productosConReceta, ...productosSinReceta];
    }

    // Aplicar búsqueda    
    if (terminoBusqueda) {
        productosFiltrados = productosFiltrados.filter(producto =>
            producto.nombre.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
            producto.codigo_producto.toLowerCase().includes(terminoBusqueda.toLowerCase()) ||
            producto.descripcion.toLowerCase().includes(terminoBusqueda.toLowerCase())    
        );
    }
    return productosFiltrados;
};

  // Contador de productos
const contarProductos = () => {
    return {
        todos: productos.length,
        conReceta: productosConReceta.length,
        sinReceta: productosSinReceta.length
    };
};

const contadores = contarProductos()

// Muestra pantalla de carga o error
if (loading) return <div className="text-center py-5">Cargando recetas...</div>;
if (error) return <div className="text-center py-5 text-danger">Error: {error}</div>;

return (
    <Container fluid style={moduleBg} className="py-2">
        {/* Encabezado de Recetas */}
        <div className={styles.menuHeader} style={headerStyle}>
            <div className="d-flex align-items-center justify-content-between mb-2">
                <h1 className="h2 fw-bold mb-1" style={{color: 'var(--color-title)'}}>
                    Gestión de Recetas
                </h1>
            </div>
            <p style={{color: 'var(--color-muted)'}} className="mb-1">
                Administra las recetas y sus ingredientes
            </p>
        </div>
        {/* Filtro de Búsqueda */}
        <Row className="mb-4">
            <Col md={8}>
                <div className="d-flex flex-wrap gap-2 mb-3">
                    <button
                        className={`btn ${filtroActivo === 'todos' ? 'active' : ''}`}
                        style={filtroActivo === 'todos' ? btnFilterActive : btnFilter}
                        onClick={() => setFiltroActivo('todos')}
                    >
                        Todos ({contadores.todos})
                    </button>
                    <button
                        className={`btn ${filtroActivo === 'con-receta' ? 'active' : ''}`}
                        style={filtroActivo === 'con-receta' ? btnFilterActive : btnFilter}
                        onClick={() => setFiltroActivo('con-receta')}
                    >
                        Con Receta ({contadores.conReceta})
                    </button>
                    <button
                        className={`btn ${filtroActivo === 'sin-receta' ? 'active' : ''}`}
                        style={filtroActivo === 'sin-receta' ? btnFilterActive : btnFilter}
                        onClick={() => setFiltroActivo('sin-receta')}
                    >
                        Sin Receta ({contadores.sinReceta})
                    </button>
                </div>
            </Col>
            <Col md={4}>
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Buscar producto..."
                        value={terminoBusqueda}
                        onChange={(e) => setTerminoBusqueda(e.target.value)}
                        style={inputStyle}
                    />
                    <Button 
                        variant="outline-secondary" 
                        style={{borderColor: 'var(--color-muted)', color: 'var(--color-muted)'}}
                        onClick={() => setTerminoBusqueda('')}
                    >
                        <i className="fa-solid fa-times"></i>
                    </Button>
                </InputGroup>
            </Col>
        </Row>

        {/* Lista de Productos Filtrados */}
        <div className={styles.menuHeader} style={headerStyle}>
            <Row>
                {productosFiltrados().length === 0 ? (
                <Col xs={12} className="text-center py-5" style={{color: 'var(--color-muted)'}}>
                    {terminoBusqueda 
                        ? `No se encontraron productos que coincidan con "${terminoBusqueda}"`
                        : `No hay productos ${filtroActivo === 'con-receta' ? 'con receta' : filtroActivo === 'sin-receta' ? 'sin receta' : ''}`
                    }
                </Col>
                ) : (
                productosFiltrados().map(producto => {
                    const tieneReceta = producto.ingredientes_receta && producto.ingredientes_receta.length > 0;
                    
                    return (
                    <Col key={producto.id} md={6} className="mb-4">
                        <Card className={styles.platilloCard} style={cardStyle}>
                            <Card.Body>
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <h5 className={styles.cardTitle} style={{color: 'var(--color-title)'}}>
                                        {producto.nombre}
                                    </h5>
                                    <span
                                        className={`badge ${tieneReceta ? styles.badgeSuccess : styles.badgeSecondary}`}
                                        style={{backgroundColor: tieneReceta ? 'var(--color-secondary)' : 'var(--color-muted)'}}
                                    >
                                        {tieneReceta ? 'Con Receta' : 'Sin Receta'}
                                    </span>
                                </div>

                                {/* Información del producto */}
                                <div className="mb-3">
                                    <p className="small mb-1" style={{color: 'var(--color-muted)'}}>
                                        Código: {producto.codigo_producto} | Precio: S/ {parseFloat(producto.precio).toFixed(2)}
                                    </p>
                                    <p className="small mb-2" style={{color: 'var(--color-text)'}}>
                                        {producto.descripcion}
                                    </p>
                                </div>

                                {/* Tabla de Ingredientes (solo platillos con receta) */}
                                {tieneReceta && (
                                    <div className="mb-3">
                                        <h6 className="small fw-bold mb-2" style={{color: 'var(--color-text)'}}>
                                            Ingredientes:
                                        </h6>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                            <Table responsive size="sm" style={{backgroundColor: 'var(--color-bg)'}}>
                                                <thead>
                                                    <tr>
                                                        <th style={{color: 'var(--color-text)', fontSize: '0.8rem', position: 'sticky', top: 0, backgroundColor: 'var(--color-card)'}}>Ingrediente</th>
                                                        <th style={{color: 'var(--color-text)', fontSize: '0.8rem', position: 'sticky', top: 0, backgroundColor: 'var(--color-card)'}}>Cantidad</th>
                                                        <th style={{color: 'var(--color-text)', fontSize: '0.8rem', position: 'sticky', top: 0, backgroundColor: 'var(--color-card)'}}>Unidad</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                {producto.ingredientes_receta.map((ingrediente, index) => (
                                                    <tr key={index}>
                                                        <td style={{color: 'var(--color-bg)', fontSize: '0.8rem'}}>
                                                            {ingrediente.nombre_ingrediente}
                                                        </td>
                                                        <td style={{color: 'var(--color-bg)', fontSize: '0.8rem'}}>
                                                            {ingrediente.cantidad_requerida}
                                                        </td>
                                                        <td style={{color: 'var(--color-bg)', fontSize: '0.8rem'}}>
                                                            {ingrediente.unidad_medida}
                                                        </td>
                                                    </tr>
                                                ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {!tieneReceta && (
                                    <p className="small mb-3" style={{color: 'var(--color-muted'}}>
                                        Este producto no tiene una receta asignada. Puedes agregar una receta con los ingredientes necesarios.
                                    </p>
                                )}

                                <div className={styles.cardBtnRow}>
                                    {tieneReceta ? (
                                        <button
                                            className={styles.btnEdit}
                                            style={btnWarning}
                                            onClick={() => abrirModalEditar(producto)}
                                        >
                                        <i className="fa-solid fa-pen me-1"></i>
                                            Editar Receta
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.btnToggle}
                                            style={btnPrimary}
                                            onClick={() => abrirModalAgregar(producto)}
                                        >
                                        <i className="fa-solid fa-plus me-1"></i>
                                            Agregar Receta
                                        </button>
                                    )}
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                    );
                })
                )}
            </Row>
        </div>

        {/* Modal de Agregar/Editar Receta */}
        {showModal && (
            <ModalReceta
                show={showModal} 
                onClose={cerrarModal}
                modalType={modalType} 
                productoEditando={productoEditando}
                form={form}
                ingredientes={ingredientes} 
                handleIngredienteChange={handleIngredienteChange}
                agregarIngrediente={agregarIngrediente} eliminarIngrediente={eliminarIngrediente}
                guardarReceta={guardarReceta}
                headerStyle={headerStyle} cardStyle={cardStyle}
                inputStyle={inputStyle}
                btnPrimary={btnPrimary} btnSecondary={btnSecondary}
            />
        )}

        {/* Modal de Notificación */}
        {showSuccessModal && (
            <div className={`${styles.modalOverlay}`}>
                <div className={styles.modalContentSmall} style={cardStyle}>
                    <div className={styles.modalHeader} style={headerStyle}>
                        <h5 style={{color: 'var(--color-title)'}}>
                            {isSuccess ? 'Operación Exitosa' : 'Error'}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close"
                            style={{ filter: 'var(--logo-filter)'}}
                            onClick={cerrarSuccessModal}
                        >
                        </button>
                    </div>
                    <div className={styles.modalBody} style={{textAlign: 'center'}}>
                        <i 
                            className={`fa-solid ${isSuccess ? 'fa-circle-check text-success' : 'fa-circle-exclamation text-danger'} mb-3`}
                            style={{ fontSize: '3rem' }}
                        ></i>
                        <p className="mb-0" style={{color: 'var(--color-text)'}}>{successMessage}</p>
                    </div>
                    <div className={styles.modalFooter} style={headerStyle}>
                        <button style={btnAccent} onClick={cerrarSuccessModal}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        )}
    </Container>
);
}
// Componente Modal para Recetas
const ModalReceta = ({ 
    show, onClose, modalType, productoEditando, form, ingredientes,
    handleIngredienteChange, agregarIngrediente, eliminarIngrediente,
    guardarReceta, headerStyle, cardStyle, inputStyle, btnPrimary, btnSecondary 
}) => {
    const isEditing = modalType === 'editar';
    return show && (
        <div className={`${styles.modalOverlay}`}>
            <div className={styles.modalContent} style={{...cardStyle, maxWidth: '700px'}}>
                <div className={styles.modalHeader} style={headerStyle}>
                    <h5 className={styles.modalTitle} style={{color: 'var(--color-title)'}}>
                        {isEditing ? 'Editar Receta' : 'Agregar Nueva Receta'}
                    </h5>
                    <button 
                        type="button" 
                        className="btn-close" 
                        onClick={onClose} 
                        style={{ filter: 'var(--logo-filter)'}}
                        >
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    <Form>
                        <h4 className="mb-4 text-center" style={{ color: "var(--color-title)" }}>
                            {modalType === 'agregar' ? 'Detalles de la Nueva Receta' : `Editando Receta de ${productoEditando.nombre}`}
                        </h4>
                        
                        {/* Información del Producto */}
                        <div className="mb-4 p-3 rounded" style={{backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-muted)'}}>
                            <h6 className="fw-bold" style={{color: 'var(--color-title)'}}>Producto:</h6>
                            <p className="mb-1" style={{color: 'var(--color-text)'}}><strong>{productoEditando.nombre}</strong></p>
                            <p className="mb-1 small" style={{color: 'var(--color-muted)'}}>Código: {productoEditando.codigo_producto}</p>
                            <p className="mb-0 small" style={{color: 'var(--color-text)'}}>{productoEditando.descripcion}</p>
                        </div>

                        {/* Ingredientes */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <label className={styles.formLabel}>
                                    Ingredientes de la Receta ({form.ingredientes.length})
                                </label>
                                <button
                                    type="button"
                                    className="btn btn-sm"
                                    style={btnPrimary}
                                    onClick={agregarIngrediente}
                                >
                                <i className="fa-solid fa-plus me-1"></i>
                                    Agregar Ingrediente
                                </button>
                            </div>

                            <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                                {form.ingredientes.map((ingrediente, index) => (
                                    <div key={index} className="ingrediente-row mb-3 p-3 rounded" style={{backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-muted)'}}>
                                        <div className="row g-2 align-items-end">
                                            <div className="col-md-6">
                                                <label className="small form-label">Ingrediente</label>
                                                <select
                                                    className="form-select"
                                                    style={inputStyle}
                                                    value={ingrediente.ingrediente_id}
                                                    onChange={(e) => handleIngredienteChange(index, 'ingrediente_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">Selecciona un ingrediente</option>
                                                    {ingredientes.map(ing => (
                                                        <option key={ing.id} value={ing.id}>
                                                            {ing.nombre} - {ing.unidad_de_medida}
                                                            {ing.nombre_categoria && ` (${ing.nombre_categoria})`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-md-4">
                                                <label className="small form-label">Cantidad Requerida</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    style={inputStyle}
                                                    step="0.01"
                                                    min="0.01"
                                                    value={ingrediente.cantidad_requerida}
                                                    onChange={(e) => handleIngredienteChange(index, 'cantidad_requerida', e.target.value)}
                                                    placeholder="0.00"
                                                    required
                                                />
                                            </div>
                                            <div className="col-md-2 d-flex">
                                                {form.ingredientes.length > 1 && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger w-100"
                                                        onClick={() => eliminarIngrediente(index)}
                                                        title="Eliminar ingrediente"
                                                        style={{ height: '38px' }}
                                                    >
                                                        <i className="fa-solid fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Botones */}
                        <div className={styles.modalFooter}>
                            <Button style={btnSecondary} onClick={onClose}>Cancelar</Button>
                            <Button 
                                type="button" 
                                style={btnPrimary} 
                                onClick={guardarReceta}
                            >
                                {isEditing ? 'Guardar Cambios' : 'Agregar Receta'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
};
export default Recetas;