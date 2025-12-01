import { useState, useEffect, useCallback, useRef } from "react";
import { Container, Button, Card, Row, Col, Form, InputGroup, Modal } from 'react-bootstrap';
import styles from '../Modulos/Menu.module.css';
import { API_BASE_URL } from "../Configuracion/api.jsx";
import ImageUploader from '../Modulos/ImageUploader';

function Menu() {
  // Constantes de categorías
  const [productos, setProductos] = useState([]); // Almacena todos los productos cargados de la API
  const [categorias, setCategorias] = useState([]); // Almacena la lista de categorías con ID
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Cargar productos desde la API
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // Para agregar o editar
  const [platilloEditando, setPlatilloEditando] = useState(null);
  const [categoriaSeleccionadaId, setCategoriaSeleccionadaId] = useState(null); // Usaremos el ID
  // Constante para mensajes
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // Almacena la función a ejecutar
  const [confirmMessage, setConfirmMessage] = useState("");
  // Constantes para mensajes de éxito
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  // Constante para la referencia del nav de categorías
  const navRef = useRef(null);
  const [form, setForm] = useState({
    codigo_producto: "",
    nombre: "",
    descripcion: "",
    precio: "",
    categoria_id: null,
    imagen_url: "",
    tiempo_preparacion: ""
  });
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
  const priceColor = { 
    color: 'var(--color-accent)', 
    fontWeight: 'bold' 
  };
  // Cargar datos iniciales (categorías y productos)
  const fetchDatosIniciales = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Cargar Categorías
      const catResponse = await fetch(`${API_BASE_URL}/categorias/`);
      if (!catResponse.ok) throw new Error("Fallo al cargar categorías");
      const catData = await catResponse.json();
      setCategorias(catData);
      // Cargar todos los productos
      const prodResponse = await fetch(`${API_BASE_URL}/menu/`);
      if (!prodResponse.ok) throw new Error("Fallo al cargar productos");
      const prodData = await prodResponse.json();
      setProductos(prodData);
      // Inicializar la categoría seleccionada con el ID de la primera categoría
      if (catData.length > 0) {
        {/*const firstCatId = catData[0].id.toString();*/}
        setCategoriaSeleccionadaId(catData[0].id);
        setForm(prev => ({ ...prev, categoria_id: catData[0].id }));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  // Manejar la disponibilidad (activar/desactivar)
  const toggleDisponibilidad = (platillo, estadoActual) => {
    const action = async () => {
      // Construir el endpoint correcto
      const endpoint = estadoActual 
        ? `${API_BASE_URL}/menu/${platillo.id}` // DELETE para desactivar
        : `${API_BASE_URL}/menu/reactivar/${platillo.id}`; // PUT para reactivar
      // Determinar el método HTTPS
      const method = estadoActual ? 'DELETE' : 'PUT';
      // Realizar la solicitud
      try {
        const response = await fetch(endpoint, { method });
        if (response.ok || response.status === 204) {
          setSuccessMessage(`Platillo ${estadoActual ? 'desactivado' : 'activado'} correctamente`);
          setIsSuccess(true);
          setShowSuccessModal(true);
          // Actualiza el estado
          setProductos(prevProductos => 
            prevProductos.map(p => p.id === platillo.id ? { ...p, producto_activo: !estadoActual } : p)
          );
        } else {
          if (response.status === 500) {
            throw new Error("Error interno del servidor. Contacte al administrador.");
          } else {
            const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
            throw new Error(errorData.detail || "Fallo al cambiar disponibilidad");
          }
        }
      } catch (error) {
        console.error(error);
        setSuccessMessage(`Error al cambiar disponibilidad: ${error.message}`);
        setIsSuccess(false);
        setShowSuccessModal(true);
      }
    };
    // Configurar el mensaje de confirmación y la acción
    setConfirmMessage(`¿Está seguro que desea ${estadoActual ? 'DESACTIVAR' : 'ACTIVAR'} el platillo "${platillo.nombre}"?`);
    setConfirmAction(() => action); // Almacena la función sin ejecutarla
    setShowConfirmModal(true);
  };
  // Guardar platillo (agregar o editar)
  const guardarPlatillo = async () => {
    const { precio, categoria_id, imagen_url, tiempo_preparacion, ...restForm } = form;
    if (!restForm.nombre || !restForm.descripcion || !precio || !categoria_id) {
      setSuccessMessage("Completa todos los campos obligatorios");
      setIsSuccess(false);
      setShowSuccessModal(true);
      return;
    }
    const payload = {
      ...restForm,
      precio: parseFloat(precio),
      categoria_id: parseInt(categoria_id),
      imagen_url: imagen_url.trim() === "" ? null : imagen_url,
      tiempo_preparacion: tiempo_preparacion ? parseInt(tiempo_preparacion) : null,
      producto_activo: true // Por defecto
    };
    const method = modalType === 'agregar' ? 'POST' : 'PUT';
    const url = modalType === 'agregar' 
    ? `${API_BASE_URL}/menu/`    
    : `${API_BASE_URL}/menu/${platilloEditando.id}`;
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        throw new Error(errorData.detail || "Error al guardar platillo. Verifique el código del producto");
      }
      // Éxito
      setSuccessMessage(`Platillo ${modalType === 'agregar' ? 'agregado' : 'actualizado'} con éxito`, true);
      setIsSuccess(true);
      cerrarModal();
      setShowSuccessModal(true);
    } catch (error) {
      console.error("Error al guardar:", error);
      setSuccessMessage(`Error al guardar: ${error.message}`, false);
      setIsSuccess(false);
      setShowSuccessModal(true);
    }
  };
  // Función para desplazar categorías
  const scrollCategorias = (direction) => {
    if (navRef.current) {
      const scrollAmount = 250; // Pixeles a desplazar
      navRef.current.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
    }
  };
  // Efecto para cargar datos al montar el componente
  useEffect(() => {
    fetchDatosIniciales();
  }, [fetchDatosIniciales]);
  // Handlers y métodos para el modal
  // Modal de Editar
  const abrirModalEditar = (platillo) => {
    setModalType('editar');
    setPlatilloEditando({ id: platillo.id, codigo_producto: platillo.codigo_producto });
    setForm({
      codigo_producto: platillo.codigo_producto,
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio, // Precio ya viene como float de la API
      categoria_id: platillo.categoria_id.toString(), // Asegurar que sea string para el select
      imagen_url: platillo.imagen_url || "",
      tiempo_preparacion: platillo.tiempo_preparacion || ""
    });
    setShowModal(true);  
  };
  // Modal de Agregar
  const abrirModalAgregar = () => {
    setModalType('agregar');
    setPlatilloEditando(null);
    setForm({
      codigo_producto: "",
      nombre: "",
      descripcion: "",
      precio: "",
      categoria_id: categoriaSeleccionadaId ? categoriaSeleccionadaId.toString() : "", // Asegurar string
      imagen_url: "",
      tiempo_preparacion: ""
    });
    setShowModal(true);
  };
  // Cerrar Modal
  const cerrarModal = () => {
    setShowModal(false);
    setPlatilloEditando(null);
  };
  // Handle form changes
  const handleChange = (e) => {
    const { id, value } = e.target;
    setForm({ ...form, [id]: value });
  };
  // Filtra productos por la categoría ID seleccionada
  const platillosFiltrados = productos.filter(p => p.categoria_id === categoriaSeleccionadaId);
  // Función helper para obtener el nombre de la categoría por ID
  {/*const getCategoriaNombre = (id) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.nombre : 'Sin Categoría';
  }*/}
  // Función para cerrar el modal de éxito/falla
  const cerrarSuccessModal = () => {
    setShowSuccessModal(false);
    if (isSuccess && (successMessage.includes('agregado') || successMessage.includes('actualizado'))) {
      fetchDatosIniciales();
    }
  };
  // Muestra pantalla de carga o error
  if (loading) return <div className="text-center py-5">Cargando menú... </div>;
  if (error) return <div className="text-center py-5 text-danger">Error: {error}</div>;
  // Construcción del componente
  return (
    <Container fluid style={moduleBg} className="py-2"> 
      {/* Encabezado de Menú */}
        <div className={styles.menuHeader} style={headerStyle}>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h1 className="h2 fw-bold mb-1" style={{color: 'var(--color-title)'}}>
              Gestión del Menú
            </h1>
            <button
              type="button"
              style={btnPrimary}
              className="p-1"
              onClick={abrirModalAgregar}
            >
              <i className="fa-solid fa-plus me-2"></i>
              Agregar Platillo
            </button>
          </div>
          <p style={{color: 'var(--color-muted)'}} className="mb-1">Administra los platillos y bebidas del restaurante</p>
        </div>
        {/* Navegación de categorías */}
        <div className={styles.categoriasNavContainer}>
          <button className={styles.scrollBtn} onClick={() => scrollCategorias('left')}>
            <i className="fa-solid fa-chevron-left" style={{color: 'var(--color-title)'}}></i>
          </button>
          <div className={styles.categoriasNav} ref={navRef}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                className={`${styles.categoriaBtn} ${categoriaSeleccionadaId === cat.id ? styles.categoriaSelected : ''}`}
                onClick={() => setCategoriaSeleccionadaId(cat.id)}
                style={{
                    backgroundColor: categoriaSeleccionadaId === cat.id ? 'var(--color-accent)' : 'var(--color-card)',
                    color: categoriaSeleccionadaId === cat.id ? 'white' : 'var(--color-title)',
                    borderColor: 'var(--color-accent)'
                  }}
                >
                  {cat.nombre}
              </button>
            ))}
        </div>
        <button className={styles.scrollBtn} onClick={() => scrollCategorias('right')} style={{ border: 'none', background: 'transparent' }}>
            <i className="fa-solid fa-chevron-right" style={{color: 'var(--color-title)'}}></i>
        </button>
        </div>
        {/* Lista de platillos filtrados */}
        <Row>
          {platillosFiltrados.length === 0 && (
            <Col xs={12} className="text-center py-5" style={{color: 'var(--color-muted)'}}>
                No hay platillos en esta categoría...
            </Col>
          )}
          {platillosFiltrados.map(platillo => (
            <Col key={platillo.id} md={4} className="mb-4">
              <Card className={`${styles.platilloCard} ${!platillo.producto_activo ? styles.cardDesactivada : ''}`} style={cardStyle}>
                <Card.Body className="text-center">
                  {/* Imagen y Estado */}
                  <div className={styles.imageContainer}>
                      <img
                          src={platillo.imagen_url || "https://via.placeholder.com/400x200?text=SIN+IMAGEN"}
                          alt={platillo.nombre}
                          className={styles.cardImg}
                      />
                  </div>
                  {/* Detalles del platillo  */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className={styles.cardTitle} style={{color: 'var(--color-title)'}}>{platillo.nombre}</h5>
                    {/* Badge de Disponibilidad */}
                    <span
                        className={`badge ${platillo.producto_activo ? styles.badgeSuccess : styles.badgeSecondary}`}
                        style={{backgroundColor: platillo.producto_activo ? 'var(--color-secondary)' : 'var(--color-muted)'}}
                    >
                        {platillo.producto_activo ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  {/* Descripción */}
                  <p className={styles.cardText} style={{color: 'var(--color-text)'}}>{platillo.descripcion}</p>
                  {/* Ingredientes */}
                  <div className="mb-2">
                    <h6 className="small fw-bold" style={{color: 'var(--color-text)'}}>Ingredientes principales:</h6>
                    <ul className={styles.ingredientsList}>
                      {/* Muestra los 3 primeros ingredientes de la receta real */}
                      {platillo.ingredientes_receta.slice(0, 3).map((ingrediente, index) => (
                          <li key={index} className="d-inline-block me-2">
                              <span className="badge bg-light text-dark">{ingrediente.nombre_ingrediente}</span>
                          </li>
                          ))}
                          {platillo.ingredientes_receta.length > 3 && (
                          <li className="d-inline-block me-2">
                              <span className="badge bg-light text-dark">+{platillo.ingredientes_receta.length - 3} más</span>
                          </li>
                          )}
                          {platillo.ingredientes_receta.length === 0 && (
                            <li className="d-inline-block me-2">
                                <span className="badge bg-danger">Sin Receta Asignada</span>
                            </li>
                          )}
                    </ul>
                  </div>
                  {/* Código y Precio */}
                  <div className="d-flex flex-column justify-content-center mb-3">
                    <h5 style={priceColor}>S/ {platillo.precio.toFixed(2)}</h5>
                    <p className="small mb-0" style={{color: 'var(--color-muted)'}}>Cód: {platillo.codigo_producto}</p>
                  </div>
                  <div className={styles.cardBtnRow}>
                    {/* Botón de Activar/Desactivar */}
                    <button
                      className={styles.btnToggle}
                      style={{ backgroundColor: platillo.producto_activo ? 'var(--color-btn-delete)' : 'var(--color-secondary)' }}
                      onClick={() => toggleDisponibilidad(platillo, platillo.producto_activo)}
                    >
                      {platillo.producto_activo ? 'Desactivar' : 'Activar'}
                    </button>
                    {/* Botón de Editar */}
                    <button
                      className={styles.btnEdit}
                      style={btnWarning}
                      onClick={() => abrirModalEditar(platillo)}
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        {/* Modal de Agregar y Editar */}
        {showModal && (
          <ModalFormPlatillo 
              show={showModal} onClose={cerrarModal} modalType={modalType}
              platilloEditando={platilloEditando} form={form} categorias={categorias}
              handleChange={handleChange} guardarPlatillo={guardarPlatillo}
              headerStyle={headerStyle} cardStyle={cardStyle} inputStyle={inputStyle}
              btnPrimary={btnPrimary} btnSecondary={btnSecondary}
          />
        )}
      {/* Modal de Confirmación Centralizado */}
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
                        <button 
                            style={btnSecondary}
                            onClick={() => setShowConfirmModal(false)}
                        >
                            Cancelar
                        </button>
                        <button 
                            style={btnAccent}
                            onClick={() => {
                                if (confirmAction) {
                                    confirmAction();
                                }
                                setShowConfirmModal(false);
                            }}
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
      )}
      {/* Modal de Notificación Centralizado */}
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
                >
                </i>
                <p className="mb-0" style={{color: 'var(--color-text)'}}>{successMessage}</p>
              </div>
              <div className={styles.modalFooter} style={headerStyle}>
                <button 
                  style={btnAccent}
                  onClick={cerrarSuccessModal}
                >
                  Aceptar
                </button>
              </div>
            </div>
          </div>
      )}
    </Container>
  );
}
export default Menu;
const ModalFormPlatillo = ({ show, onClose, modalType, form, categorias, handleChange, guardarPlatillo, headerStyle, cardStyle, inputStyle, btnPrimary, btnSecondary }) => {
    const isEditing = modalType === 'editar';
    
    const handleImageUploadSuccess = (url) => {
        // Actualiza el form state con la URL obtenida de Cloudinary
        handleChange({ target: { id: 'imagen_url', value: url } });
    }
    return show && (
        <div className={`${styles.modalOverlay}`}>
                <div className={styles.modalContent} style={{...cardStyle}}>
                    <div className={styles.modalHeader} style={headerStyle}>
                        <h5 className={styles.modalTitle} style={{color: 'var(--color-title)'}}>
                            {isEditing ? ` Editando: ${form.nombre}` : 'Agregar Nuevo Platillo'}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} style={{ filter: 'var(--logo-filter)'}}></button>
                    </div>
                    {/* Cuerpo del Modal */}
                    <div className={styles.modalBody}>
                        <Form>
                            {/* Título del Formulario */}
                            <h4 className="mb-4 text-center" style={{ color: "var(--color-title)" }}>
                                {modalType === 'agregar' ? 'Detalles del Nuevo Platillo' : `Editando: ${form.nombre}`}
                            </h4>
                            <Row className="mb-3">
                                {/* Código y Nombre */}
                                <Col md={5}>
                                    <label className={styles.formLabel}>Código</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      style={inputStyle} 
                                      id="codigo_producto" 
                                      value={form.codigo_producto} 
                                      onChange={handleChange} 
                                      disabled={isEditing} 
                                      placeholder="ABC-001" 
                                      required 
                                    />
                                </Col>
                                <Col md={7}>
                                    <label className={styles.formLabel}>Nombre del Platillo</label>
                                    <input 
                                      type="text" 
                                      className="form-control" 
                                      style={inputStyle} 
                                      id="nombre" 
                                      value={form.nombre} 
                                      onChange={handleChange} 
                                      placeholder="Ej: Lomo Saltado" required 
                                    />
                                </Col>
                            </Row>
                            {/* Descripción */}
                            <div className="mb-3">
                                <label className={styles.formLabel}>Descripción</label>
                                <textarea 
                                  className="form-control" 
                                  style={inputStyle} 
                                  id="descripcion" rows="2"
                                  value={form.descripcion} 
                                  onChange={handleChange} 
                                  placeholder="Describe brevemente el platillo" required
                                  >
                                </textarea>
                            </div>
                            <Row>
                                {/* Precio - Categoría - Tiempo de Preparación */}
                                <Col md={3} className="mb-3">
                                    <label className={styles.formLabel}>Precio (S/)</label>
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={inputStyle} 
                                      id="precio" 
                                      step="0.10" 
                                      value={form.precio} 
                                      onChange={handleChange} 
                                      placeholder="0.00" required 
                                    />
                                </Col>
                                <Col md={5} className="mb-3">
                                    <label className={styles.formLabel}>Categoría</label>
                                    <select className="form-select" style={inputStyle} id="categoria_id" value={form.categoria_id} onChange={handleChange} required>
                                        {categorias.map(cat => (<option key={cat.id} value={cat.id}>{cat.nombre}</option>))}
                                    </select>
                                </Col>
                                <Col md={4} className="mb-3">
                                    <label className={styles.formLabel}>Tiempo Preparación</label>
                                    <input 
                                      type="number" 
                                      className="form-control" 
                                      style={inputStyle} 
                                      id="tiempo_preparacion" 
                                      value={form.tiempo_preparacion} 
                                      onChange={handleChange} 
                                      placeholder="En minutos" 
                                    />
                                </Col>
                            </Row>
                            {/* URL de Imagen */}
                            <ImageUploader
                                onUploadSuccess={handleImageUploadSuccess}
                                currentImageUrl={form.imagen_url}
                                inputStyle={inputStyle}
                            />
                            {/* Botones */}
                            <div className={styles.modalFooter}>
                                <Button style={btnSecondary} onClick={onClose}>Cancelar</Button>
                                <Button 
                                  type="button" 
                                  style={btnPrimary} 
                                  onClick={guardarPlatillo}
                                  >
                                    {isEditing ? 'Guardar Cambios' : 'Agregar Platillo'}
                                </Button>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
    );
};
