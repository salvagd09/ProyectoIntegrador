import { useState } from "react";
import "../Modulos/CSS/Menu.css";

function Menu() {
  // Estado para controlar qué platillos están activos o desactivados
  const [platillos, setPlatillos] = useState([
    {
      id: 1,
      nombre: "Ceviche de Pota",
      descripcion: "Ceviche fresco de pota con limón, cebolla y ají limo",
      precio: 25.00,
      categoria: "Ceviches",
      disponible: true,
      ingredientes: ["Pota", "Limón", "Camote", "Ají limo"]
    },
    {
      id: 2,
      nombre: "Tiradito de Corvina",
      descripcion: "Finas láminas de corvina en salsa de ají amarillo",
      precio: 32.00,
      categoria: "Tiraditos",
      disponible: true,
      ingredientes: ["Corvina", "Ají amarillo", "Limón"]
    },
    {
      id: 3,
      nombre: "Chicharrón de Pescado",
      descripcion: "Pescado frito crocante acompañado de yuca y salsa criolla",
      precio: 28.00,
      categoria: "Chicharrones",
      disponible: false,
      ingredientes: ["Pescado", "Yuca", "Cebolla", "Tomate", "Limón"]
    },
    {
      id: 4,
      nombre: "Sudado de Pescado",
      descripcion: "Pescado cocido al vapor con cebolla, tomate y especias",
      precio: 30.00,
      categoria: "Sudados",
      disponible: true,
      ingredientes: ["Pescado", "Cebolla", "Tomate", "Ají panca", "Cilantro"]
    },
    {
      id: 5,
      nombre: "Chicha Morada",
      descripcion: "Bebida tradicional peruana a base de maíz morado",
      precio: 8.00,
      categoria: "Bebidas sin alcohol",
      disponible: true,
      ingredientes: ["Maíz morado", "Piña", "Manzana", "Canela", "Clavo de olor"]
    },
    {
      id: 6,
      nombre: "Pisco Sour",
      descripcion: "Coctel emblemático del Perú a base de pisco y limón",
      precio: 18.00,
      categoria: "Bebidas con alcohol",
      disponible: true,
      ingredientes: ["Pisco", "Limón", "Clara de huevo", "Azúcar", "Hielo", "Amargo de angostura"]
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(''); // Para agregar o editar
  const [platilloEditando, setPlatilloEditando] = useState(null);

  // Alternar la disponibilidad de los platillos
  const toggleDisponibilidad = (id) => {
    setPlatillos(platillos.map(platillo =>
      platillo.id === id
        ? { ...platillo, disponible: !platillo.disponible }
        : platillo
    ));
  };

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: ""
  });

  // Abrir el modal agregar
  const abrirModalAgregar = () => {
    setModalType('agregar');
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      categoria: ""
    });
    setShowModal(true);
  };

  // Abrir el modal editar
  const abrirModalEditar = (platillo) => {
    setModalType('editar');
    setPlatilloEditando(platillo);
    setForm({
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      categoria: platillo.categoria
    });
    setShowModal(true);
  };

  // Cerrar el modal
  const cerrarModal = () => {
    setShowModal(false);
    setPlatilloEditando(null);
  };

  // Eliminar un platillo
  const eliminarPlatillo = (id) => {
    if (window.confirm("¿Está seguro que desea eliminar este platillo?")) {
      setPlatillos(platillos.filter(platillo => platillo.id !== id));
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    setForm({ ...form, [e.target.id]: e.target.value });
  };

  // Guardar cambios del formulario para platillo
  const guardarPlatillo = () => {
    if (!form.nombre || !form.descripcion || !form.precio || !form.categoria) {
      alert("Completa todos los campos.");
      return;
    }
    if (modalType === 'agregar') {
      setPlatillos([
        ...platillos,
        {
          id: Date.now(),
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: parseFloat(form.precio),
          categoria: form.categoria,
          disponible: true,
          ingredientes: []
        }
      ]);
    } else if (modalType === 'editar') {
      setPlatillos(platillos.map(p =>
        p.id === platilloEditando.id
          ? { ...p, ...form, precio: parseFloat(form.precio) }
          : p
      ));
    }
    cerrarModal();
  };

  // Agrupar los platillos por categoría
  const platillosPorCategoria = platillos.reduce((acc, platillo) => {
    if (!acc[platillo.categoria]) {
      acc[platillo.categoria] = [];
    }
    acc[platillo.categoria].push(platillo);
    return acc;
  }, {});

  // Construcción del componente
  return (
    <div className="container-fluid py-4">
      {/* Encabezado de Menú */}
      <div className="menu-header row mb-4">
        <div className="col-md-8">
          <h1 className="h2 fw-bold">Gestión del Menú</h1>
          <p className="text-muted">Administra los platillos y bebidas del restaurante</p>
        </div>
        <div className="col-md-4 text-end">
          <button
            className="btn btn-primary"
            onClick={abrirModalAgregar}
          >
            <i className="fa-solid fa-plus me-2"></i>
            Agregar Platillo
          </button>
        </div>
      </div>

      {/* Lista de platillos por categoría */}
      {Object.keys(platillosPorCategoria).map(categoria => (
        <div key={categoria} className="mb-5">
          <h3 className="categoria-titulo h4 mb-3">{categoria}</h3>
          <div className="row">
            {platillosPorCategoria[categoria].map(platillo => (
              <div key={platillo.id} className="col-md-4 mb-4">
                <div className={`card h-100 ${!platillo.disponible ? 'card-desactivada' : ''}`}>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{platillo.nombre}</h5>
                      <span
                        className={`badge ${platillo.disponible ? 'bg-success' : 'bg-secondary'}`}
                      >
                        {platillo.disponible ? 'Disponible' : 'No disponible'}
                      </span>
                    </div>

                    <p className="card-text text-muted small">{platillo.descripcion}</p>

                    <div className="mb-2">
                      <h6 className="small fw-bold">Ingredientes principales:</h6>
                      <ul className="list-unstyled small">
                        {platillo.ingredientes.map((ingrediente, index) => (
                          <li key={index} className="d-inline-block me-2">
                            <span className="badge bg-light text-dark">{ingrediente}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-3">
                      <h5 className="text-primary">S/ {platillo.precio.toFixed(2)}</h5>
                    </div>

                    <div className="card-btn-row d-flex justify-content-between">
                      <button
                        className={`btn ${platillo.disponible ? 'btn-warning' : 'btn-success'} btn-sm btn-toggle`}
                        onClick={() => toggleDisponibilidad(platillo.id)}
                      >
                        {platillo.disponible ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        className="btn btn-outline-primary btn-sm btn-edit"
                        onClick={() => abrirModalEditar(platillo)}
                      >
                        <i className="fa-solid fa-pen"></i>
                      </button>
                      <button
                        className="btn btn-outline-danger btn-sm btn-delete"
                        onClick={() => eliminarPlatillo(platillo.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal de Agregar y Editar */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {modalType === 'agregar' ? 'Agregar Nuevo Platillo' : 'Editar Platillo'}
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={cerrarModal}
              ></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">Nombre del Platillo</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    defaultValue={modalType === 'editar' ? platilloEditando.nombre : ''}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">Descripción</label>
                  <textarea
                    className="form-control"
                    id="descripcion"
                    rows="3"
                    defaultValue={modalType === 'editar' ? platilloEditando.descripcion : ''}
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="precio" className="form-label">Precio (S/)</label>
                  <input
                    type="number"
                    className="form-control"
                    id="precio"
                    step="0.01"
                    defaultValue={modalType === 'editar' ? platilloEditando.precio : ''}
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">Categoría</label>
                  <select className="form-select" id="categoria">
                    <option value="">Selecciona una categoría</option>
                    <option value="Ceviches">Ceviches</option>
                    <option value="Tiraditos">Tiraditos</option>
                    <option value="Chicharrones">Chicharrones</option>
                    <option value="Sudados">Sudados</option>
                    <option value="Bebidas sin alcohol">Bebidas sin alcohol</option>
                    <option value="Bebidas con alcohol">Bebidas con alcohol</option>
                  </select>
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={cerrarModal}
                >
                  {modalType === 'agregar' ? 'Agregar Platillo' : 'Guardar Cambios'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Menu;
