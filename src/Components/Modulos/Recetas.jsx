import { useState, useEffect, useCallback } from "react";
import { Container, Button, Card, Row, Col, Form, InputGroup, Modal, Table } from 'react-bootstrap';
import styles from '../Modulos/Menu.module.css';

const API_BASE_URL = "http://localhost:8000";

function Recetas() {
  // Estados principales
    const [recetas, setRecetas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [ingredientes, setIngredientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para modales
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState(''); // 'agregar' o 'editar'
    const [recetaEditando, setRecetaEditando] = useState(null);

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
        producto_id: "",
        ingredientes: [{ ingrediente_id: "", cantidad: "", unidad_medida: "" }]
    });

    // Estilos (iguales al módulo de Menú)
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

    // Cargar datos iniciales
    const fetchDatosIniciales = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
        // Cargar productos (para asignar recetas)
        const prodResponse = await fetch(`${API_BASE_URL}/menu/`);
        if (!prodResponse.ok) throw new Error("Fallo al cargar productos");
        const prodData = await prodResponse.json();
        setProductos(prodData);

        // Cargar ingredientes disponibles
        const ingResponse = await fetch(`${API_BASE_URL}/ingredientes/`);
        if (!ingResponse.ok) throw new Error("Fallo al cargar ingredientes");
        const ingData = await ingResponse.json();
        setIngredientes(ingData);

        // Cargar recetas existentes
        const recResponse = await fetch(`${API_BASE_URL}/recetas/`);
        if (!recResponse.ok) throw new Error("Fallo al cargar recetas");
        const recData = await recResponse.json();
        setRecetas(recData);

        } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message);
        } finally {
        setLoading(false);
        }
    }, []);

    // Manejar activar/desactivar receta
    const toggleEstadoReceta = (receta, estadoActual) => {
        const action = async () => {
        const endpoint = `${API_BASE_URL}/recetas/${receta.id}`;
        const method = estadoActual ? 'DELETE' : 'PUT';

        try {
            const response = await fetch(endpoint, { method });

            if (response.ok || response.status === 204) {
            setSuccessMessage(`Receta ${estadoActual ? 'desactivada' : 'activada'} correctamente`);
            setIsSuccess(true);
            setShowSuccessModal(true);
            setRecetas(prevRecetas => 
                prevRecetas.map(r => r.id === receta.id ? { ...r, activa: !estadoActual } : r)
            );
            } else {
            const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
            throw new Error(errorData.detail || "Fallo al cambiar estado");
            }
        } catch (error) {
            console.error(error);
            setSuccessMessage(`Error al cambiar estado: ${error.message}`);
            setIsSuccess(false);
            setShowSuccessModal(true);
        }
        };

        setConfirmMessage(`¿Está seguro que desea ${estadoActual ? 'DESACTIVAR' : 'ACTIVAR'} la receta?`);
        setConfirmAction(() => action);
        setShowConfirmModal(true);
    };

    // Guardar receta (agregar o editar)
    const guardarReceta = async () => {
        if (!form.producto_id || form.ingredientes.length === 0) {
        setSuccessMessage("Selecciona un producto y agrega al menos un ingrediente");
        setIsSuccess(false);
        setShowSuccessModal(true);
        return;
        }

        const payload = {
        producto_id: parseInt(form.producto_id),
        ingredientes: form.ingredientes.map(ing => ({
            ingrediente_id: parseInt(ing.ingrediente_id),
            cantidad: parseFloat(ing.cantidad),
            unidad_medida: ing.unidad_medida
        }))
        };

        const method = modalType === 'agregar' ? 'POST' : 'PUT';
        const url = modalType === 'agregar' 
        ? `${API_BASE_URL}/recetas/`    
        : `${API_BASE_URL}/recetas/${recetaEditando.id}`;

        try {
        const response = await fetch(url, {
            method,
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
    const abrirModalEditar = (receta) => {
        setModalType('editar');
        setRecetaEditando(receta);
        setForm({
        producto_id: receta.producto_id.toString(),
        ingredientes: receta.ingredientes_receta.map(ing => ({
            ingrediente_id: ing.ingrediente_id.toString(),
            cantidad: ing.cantidad.toString(),
            unidad_medida: ing.unidad_medida
        }))
        });
        setShowModal(true);  
    };
    const abrirModalAgregar = () => {
        setModalType('agregar');
        setRecetaEditando(null);
        setForm({
        producto_id: "",
        ingredientes: [{ ingrediente_id: "", cantidad: "", unidad_medida: "g" }]
        });
        setShowModal(true);
    };
    const cerrarModal = () => {
        setShowModal(false);
        setRecetaEditando(null);
    };
    // Handlers para el formulario
    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm({ ...form, [id]: value });
    };
    const handleIngredienteChange = (index, field, value) => {
        const nuevosIngredientes = [...form.ingredientes];
        nuevosIngredientes[index][field] = value;
        setForm({ ...form, ingredientes: nuevosIngredientes });
    };
    const agregarIngrediente = () => {
        setForm({
        ...form,
        ingredientes: [...form.ingredientes, { ingrediente_id: "", cantidad: "", unidad_medida: "g" }]
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
        if (isSuccess && (successMessage.includes('agregada') || successMessage.includes('actualizada'))) {
        fetchDatosIniciales();
        }
    };
    // Filtrar productos que no tienen receta asignada (para agregar)
    const productosSinReceta = productos.filter(producto => 
        !recetas.some(receta => receta.producto_id === producto.id)
    );
    // Función helper para obtener nombre de producto
    const getProductoNombre = (productoId) => {
        const producto = productos.find(p => p.id === productoId);
        return producto ? producto.nombre : 'Producto no encontrado';
    };
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
            <button
                type="button"
                style={btnPrimary}
                className="p-1"
                onClick={abrirModalAgregar}
                disabled={productosSinReceta.length === 0}
            >
                <i className="fa-solid fa-plus me-2"></i>
                Agregar Receta
            </button>
            </div>
            <p style={{color: 'var(--color-muted)'}} className="mb-1">
            Administra las recetas y sus ingredientes
            </p>
        </div>
        {/* Lista de Recetas */}
        <Row>
            {recetas.length === 0 ? (
            <Col xs={12} className="text-center py-5" style={{color: 'var(--color-muted)'}}>
                No hay recetas registradas...
            </Col>
            ) : (
            recetas.map(receta => (
                <Col key={receta.id} md={6} className="mb-4">
                <Card className={styles.platilloCard} style={cardStyle}>
                    <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <h5 className={styles.cardTitle} style={{color: 'var(--color-title)'}}>
                        {getProductoNombre(receta.producto_id)}
                        </h5>
                        <span
                        className={`badge ${receta.activa ? styles.badgeSuccess : styles.badgeSecondary}`}
                        style={{backgroundColor: receta.activa ? 'var(--color-secondary)' : 'var(--color-muted)'}}
                        >
                        {receta.activa ? 'Activa' : 'Inactiva'}
                        </span>
                    </div>

                    {/* Tabla de Ingredientes */}
                    <div className="mb-3">
                        <h6 className="small fw-bold" style={{color: 'var(--color-text)'}}>
                        Ingredientes:
                        </h6>
                        <Table responsive size="sm" style={{backgroundColor: 'var(--color-bg)'}}>
                        <thead>
                            <tr>
                            <th style={{color: 'var(--color-text)'}}>Ingrediente</th>
                            <th style={{color: 'var(--color-text)'}}>Cantidad</th>
                            <th style={{color: 'var(--color-text)'}}>Unidad</th>
                            </tr>
                        </thead>
                        <tbody>
                            {receta.ingredientes_receta.map((ingrediente, index) => (
                            <tr key={index}>
                                <td style={{color: 'var(--color-text)'}}>
                                {ingrediente.nombre_ingrediente}
                                </td>
                                <td style={{color: 'var(--color-text)'}}>
                                {ingrediente.cantidad}
                                </td>
                                <td style={{color: 'var(--color-text)'}}>
                                {ingrediente.unidad_medida}
                                </td>
                            </tr>
                            ))}
                        </tbody>
                        </Table>
                    </div>

                    <div className={styles.cardBtnRow}>
                        <button
                        className={styles.btnToggle}
                        style={{ backgroundColor: receta.activa ? 'var(--color-btn-delete)' : 'var(--color-secondary)' }}
                        onClick={() => toggleEstadoReceta(receta, receta.activa)}
                        >
                        {receta.activa ? 'Desactivar' : 'Activar'}
                        </button>
                        <button
                        className={styles.btnEdit}
                        style={btnWarning}
                        onClick={() => abrirModalEditar(receta)}
                        >
                        <i className="fa-solid fa-pen"></i>
                        </button>
                    </div>
                    </Card.Body>
                </Card>
                </Col>
            ))
            )}
        </Row>
        {/* Modal de Agregar/Editar Receta */}
        {showModal && (
            <ModalReceta
            show={showModal}
            onClose={cerrarModal}
            modalType={modalType}
            recetaEditando={recetaEditando}
            form={form}
            productos={modalType === 'agregar' ? productosSinReceta : productos}
            ingredientes={ingredientes}
            handleChange={handleChange}
            handleIngredienteChange={handleIngredienteChange}
            agregarIngrediente={agregarIngrediente}
            eliminarIngrediente={eliminarIngrediente}
            guardarReceta={guardarReceta}
            headerStyle={headerStyle}
            cardStyle={cardStyle}
            inputStyle={inputStyle}
            btnPrimary={btnPrimary}
            btnSecondary={btnSecondary}
            />
        )}
        {/* Modal de Confirmación */}
        {showConfirmModal && (
            <div className={`${styles.modalOverlay}`}>
            <div className={styles.modalContentSmall} style={cardStyle}>
                <div className={styles.modalHeader} style={headerStyle}>
                <h5 style={{color: 'var(--color-title)'}}>Confirmar Acción</h5>
                <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)} style={{ filter: 'var(--logo-filter)'}}></button>
                </div>
                <div className={styles.modalBody} style={{textAlign: 'center'}}>
                <p className="fw-bold" style={{color: 'var(--color-text)'}}>{confirmMessage}</p>
                </div>
                <div className={styles.modalFooter} style={headerStyle}>
                <button style={btnSecondary} onClick={() => setShowConfirmModal(false)}>
                    Cancelar
                </button>
                <button style={btnAccent} onClick={() => {
                    if (confirmAction) confirmAction();
                    setShowConfirmModal(false);
                }}>
                    Confirmar
                </button>
                </div>
            </div>
            </div>
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
                ></button>
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
    show, onClose, modalType, form, productos, ingredientes,
    handleChange, handleIngredienteChange, agregarIngrediente, eliminarIngrediente,
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
            <button type="button" className="btn-close" onClick={onClose} style={{ filter: 'var(--logo-filter)'}}></button>
            </div>
            
            <div className={styles.modalBody}>
            <Form>
                <h4 className="mb-4 text-center" style={{ color: "var(--color-title)" }}>
                {modalType === 'agregar' ? 'Detalles de la Nueva Receta' : `Editando Receta`}
                </h4>
                
                {/* Selección de Producto */}
                <div className="mb-4">
                <label className={styles.formLabel}>Producto</label>
                <select 
                    className="form-select" 
                    style={inputStyle} 
                    id="producto_id" 
                    value={form.producto_id} 
                    onChange={handleChange}
                    required
                    disabled={isEditing}
                >
                    <option value="">Selecciona un producto</option>
                    {productos.map(producto => (
                    <option key={producto.id} value={producto.id}>
                        {producto.nombre} - {producto.codigo_producto}
                    </option>
                    ))}
                </select>
                {modalType === 'agregar' && productos.length === 0 && (
                    <small className="text-warning">
                    No hay productos disponibles sin receta asignada
                    </small>
                )}
                </div>

                {/* Ingredientes */}
                <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <label className={styles.formLabel}>Ingredientes</label>
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
                {form.ingredientes.map((ingrediente, index) => (
                    <div key={index} className="ingrediente-row mb-3 p-3 rounded" style={{backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-muted)'}}>
                    <div className="row g-2">
                        <div className="col-md-5">
                        <label className="small form-label">Ingrediente</label>
                        <select
                            className="form-select form-select-sm"
                            style={inputStyle}
                            value={ingrediente.ingrediente_id}
                            onChange={(e) => handleIngredienteChange(index, 'ingrediente_id', e.target.value)}
                            required
                        >
                            <option value="">Selecciona ingrediente</option>
                            {ingredientes.map(ing => (
                            <option key={ing.id} value={ing.id}>
                                {ing.nombre}
                            </option>
                            ))}
                        </select>
                        </div>
                        <div className="col-md-3">
                        <label className="small form-label">Cantidad</label>
                        <input
                            type="number"
                            className="form-control form-control-sm"
                            style={inputStyle}
                            step="0.01"
                            value={ingrediente.cantidad}
                            onChange={(e) => handleIngredienteChange(index, 'cantidad', e.target.value)}
                            placeholder="0.00"
                            required
                        />
                        </div>
                        <div className="col-md-3">
                        <label className="small form-label">Unidad</label>
                        <select
                            className="form-select form-select-sm"
                            style={inputStyle}
                            value={ingrediente.unidad_medida}
                            onChange={(e) => handleIngredienteChange(index, 'unidad_medida', e.target.value)}
                            required
                        >
                            <option value="g">Gramos (g)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="ml">Mililitros (ml)</option>
                            <option value="l">Litros (l)</option>
                            <option value="unidades">Unidades</option>
                            <option value="cucharadas">Cucharadas</option>
                            <option value="cucharaditas">Cucharaditas</option>
                        </select>
                        </div>
                        <div className="col-md-1 d-flex align-items-end">
                        {form.ingredientes.length > 1 && (
                            <button
                            type="button"
                            className="btn btn-sm btn-danger"
                            onClick={() => eliminarIngrediente(index)}
                            title="Eliminar ingrediente"
                            >
                            <i className="fa-solid fa-trash"></i>
                            </button>
                        )}
                        </div>
                    </div>
                    </div>
                ))}
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