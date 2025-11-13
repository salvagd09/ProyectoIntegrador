import { useState, useEffect, useCallback, useRef } from "react";
import "../Modulos/CSS/Menu.css";

const API_BASE_URL = "http://localhost:8000";

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

  // Cargar datos iniciales (categorías y productos)
  const fetchDatosIniciales = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Cargar Categorías
      const catResponse = await fetch(`${API_BASE_URL}/categorias`);
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
        const firstCatId = catData[0].id.toString();
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

      // Determinar el método HTTP
      const method = estadoActual ? 'DELETE' : 'PUT';

      // Realizar la solicitud
      try {
        const response = await fetch(endpoint, { method });
        if (response.ok || response.status === 204) {
          setSuccessMessage(`Platillo ${estadoActual ? 'desactivado' : 'activado'} correctamente`);
          setShowSuccessModal(true);
          setProductos(prevProductos => 
            prevProductos.map(p => p.id === platillo.id ? { ...p, producto_activo: !estadoActual } : p)
          );
        } else {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Fallo al cambiar disponibilidad");
        }
      } catch (error) {
        console.error(error);
        setSuccessMessage(`Error al cambiar disponibilidad: ${error.message}`);
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
      alert("Completa todos los campos obligatorios");
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
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al guardar platillo. Verifique el código del producto");
      }
      // Éxito
      alert(`Platillo ${modalType === 'agregar' ? 'agregado' : 'actualizado'} con éxito`);
      cerrarModal();
      fetchDatosIniciales(); // Recargar data
    } catch (error) {
      console.error("Error al guardar:", error);
      alert(`Error al guardar: ${error.message}`);
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
  const getCategoriaNombre = (id) => {
    const cat = categorias.find(c => c.id === id);
    return cat ? cat.nombre : 'Sin Categoría';
  }

  // Muestra pantalla de carga o error
  if (loading) return <div className="text-center py-5">Cargando menú... </div>;
  if (error) return <div className="text-center py-5 text-danger">Error: {error}</div>;

  // Construcción del componente
  return (
    <div className="theme-deep-ocean">
      <div className="container-fluid py-4">
        {/* Encabezado de Menú */}
        <div className="menu-header">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h1 className="h2 fw-bold mb-0">Gestión del Menú</h1>
            <button
              className="btn"
              style={{ background: "#FF7F50", color: "#fff", fontWeight: "700" }}
              onClick={abrirModalAgregar}
            >
              <i className="fa-solid fa-plus me-2"></i>
              Agregar Platillo
            </button>
          </div>
          <p className="text-muted">Administra los platillos y bebidas del restaurante</p>
        </div>

        {/* Navegación de categorías */}
        <div className="categorias-nav-container">
          <button className="btn btn-sm text-muted me-2" onClick={() => scrollCategorias('left')} style={{ border: 'none', background: 'transparent' }}>
            <i className="fa-solid fa-chevron-left"></i>
          </button>
          <div className="categorias-nav flex-grow-1" ref={navRef}>
            {categorias.map(cat => (
              <button
                key={cat.id}
                className={`categoria-btn${categoriaSeleccionadaId === cat.id ? " selected" : ""}`}
                onClick={() => setCategoriaSeleccionadaId(cat.id)}
                >
                  {cat.nombre}
              </button>
            ))}
        </div>
        <button className="btn btn-sm text-muted ms-2" onClick={() => scrollCategorias('right')} style={{ border: 'none', background: 'transparent' }}>
            <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

        {/* Lista de platillos filtrados */}
        <div className="row">
          {platillosFiltrados.length === 0 && (
            <div className="col-12 text-center text-muted py-5">
              No hay platillos en esta categoría...
            </div>
          )}
          {platillosFiltrados.map(platillo => (
            <div key={platillo.id} className="col-md-4 mb-4">
              <div className={`card h-100 ${!platillo.producto_activo ? 'card-desactivada' : ''}`}>
                <div className="card-body">
                  {/* Imagen del platillo */}
                  <img
                    src={platillo.imagen_url || "https://via.placeholder.com/300x160?text=Sin+Imagen"}
                    alt={platillo.nombre}
                    className="card-img"
                  />
                  {/* Detalles del platillo  */}
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title">{platillo.nombre}</h5>
                    <span
                      className={`badge ${platillo.producto_activo ? 'bg-success' : 'bg-secondary'}`}
                    >
                      {platillo.producto_activo ? 'Disponible' : 'No disponible'}
                    </span>
                  </div>
                  <p className="card-text text-muted small">{platillo.descripcion}</p>
                  <div className="mb-2">
                    <h6 className="small fw-bold">Ingredientes principales:</h6>
                    <ul className="list-unstyled small">
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
                  <div className="mb-3">
                    <h5 className="text-primary">S/ {platillo.precio.toFixed(2)}</h5>
                    <p className="text-muted small">Cód: {platillo.codigo_producto}</p>
                  </div>
                  <div className="card-btn-row">
                    {/* Botón de Activar/Desactivar */}
                    <button
                      className="btn btn-toggle btn-sm"
                      onClick={() => toggleDisponibilidad(platillo, platillo.producto_activo)}
                    >
                      {platillo.producto_activo ? 'Desactivar' : 'Activar'}
                    </button>
                    {/* Botón de Editar */}
                    <button
                      className="btn btn-edit btn-sm"
                      onClick={() => abrirModalEditar(platillo)}
                    >
                      <i className="fa-solid fa-pen"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal de Agregar y Editar */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalType === 'agregar' ? 'Agregar Nuevo Platillo' : 'Editar Platillo'}
                </h5>
                <button type="button" className="btn-close" onClick={cerrarModal}></button>
              </div>
              {/* Cuerpo del Modal */}
              <div className="modal-body">
                <form>
                  {/* Título del Formulario */}
                  <h4 className="mb-4 text-center" style={{ color: "var(--color-title)" }}>
                      {modalType === 'agregar' ? 'Detalles del Nuevo Platillo' : `Editando: ${form.nombre}`}
                  </h4>
                  {/* Campo Código de Producto y Nombre de Platillo */}
                  <div className="row codigo-nombre-row mb-3">
                    <div className="col-codigo">
                      <label htmlFor="codigo_producto" className="form-label">Código</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="codigo_producto" 
                        value={form.codigo_producto} 
                        onChange={handleChange} 
                        disabled={modalType === 'editar'}
                        placeholder="ABC-001"
                      />
                    </div>
                    <div className="col-nombre">
                      <label htmlFor="nombre" className="form-label">Nombre del Platillo</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        id="nombre" 
                        value={form.nombre} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {/* Campo Descripción */}
                  <div className="mb-3">
                    <label htmlFor="descripcion" className="form-label">Descripción</label>
                    <textarea
                      className="form-control"
                      id="descripcion"
                      rows="2"
                      value={form.descripcion}
                      onChange={handleChange}
                      placeholder="Describe el platillo"
                    ></textarea>
                  </div>
                  {/* Campo Precio y Categoria */}
                  <div className="row precio-categoria-row mb-3">
                    <div className="col-precio">
                      <label htmlFor="precio" className="form-label">Precio (S/)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="precio"
                        step="0.10"
                        value={form.precio}
                        onChange={handleChange}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="col-categoria">
                      <label htmlFor="categoria_id" className="form-label">Categoría</label>
                      <select
                        className="form-select"
                        id="categoria_id"
                        value={form.categoria_id}
                        onChange={handleChange}
                      >
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {/* Campo URL Imagen y Tiempo Preparación */}
                  <div className="row tiempo-imagen-row mb-4">
                    <div className="col-tiempo">
                        <label htmlFor="tiempo_preparacion" className="form-label">Tiempo de Preparación (min)</label>
                        <input
                          type="number"
                          className="form-control"
                          id="tiempo_preparacion"
                          value={form.tiempo_preparacion}
                          onChange={handleChange}
                          placeholder="Opcional"
                        />
                    </div>
                    <div className="col-imagen">
                      <label htmlFor="imagen_url" className="form-label">URL de Imagen</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          id="imagen_url"
                          value={form.imagen_url}
                          onChange={handleChange}
                          placeholder="URL de la imagen"
                        />
                        <button className="btn btn-outline-secondary" type="button" title="Simular Subida de Imagen">
                          <i className="fa-solid fa-cloud-arrow-up"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Botón Guardar */}
                  <button
                    type="button"
                    className="btn w-100 py-2"
                    style={{ background: "#FF7F50", color: "#fff", fontWeight: "700" }}
                    onClick={guardarPlatillo}
                  >
                    {modalType === 'agregar' ? 'Agregar Platillo' : 'Guardar Cambios'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Modal de Confirmación Centralizado */}
      {showConfirmModal && (
          <div className="modal-overlay">
              <div className="modal-content" style={{ maxWidth: '450px' }}>
                  <div className="modal-header">
                      <h5 className="modal-title">Confirmar Acción</h5>
                      <button type="button" className="btn-close" onClick={() => setShowConfirmModal(false)}></button>
                  </div>
                  <div className="modal-body text-center">
                      <p className="fw-bold">{confirmMessage}</p>
                  </div>
                  <div className="p-3 d-flex justify-content-between border-top">
                      <button 
                          className="btn btn-secondary" 
                          onClick={() => setShowConfirmModal(false)}
                      >
                          Cancelar
                      </button>
                      <button 
                          className="btn" 
                          style={{ background: "#FF7F50", color: "#fff", fontWeight: "700" }}
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
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h5 className="modal-title">Operación Exitosa</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setShowSuccessModal(false)}
              ></button>
            </div>
            <div className="modal-body text-center py-4">
              <i className="fa-solid fa-circle-check text-success mb-3" style={{ fontSize: '3rem' }}></i>
              <p className="mb-0">{successMessage}</p>
            </div>
            <div className="modal-footer">
              <button 
                className="btn btn-primary w-100" 
                onClick={() => setShowSuccessModal(false)}
              >
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
