import { useState,useEffect} from "react";
import "./CSS/Menu.css";
function Menu() {
  // Estado para controlar qué platillos están activos o desactivados
const[platillos,setPlatillos]=useState([])
useEffect(() => {
    fetch("http://127.0.0.1:8000/menu/")
      .then((res) => res.json())
      .then((data) => setPlatillos(data))
      .catch((err) => console.error(err));
}, []);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState(""); // Para agregar o editar
  const [platilloEditando, setPlatilloEditando] = useState(null);
  const [platilloActual,setPlatilloActual]=useState(true)
  // Actualizar un ingrediente específico
  const actualizarIngrediente = (index, campo, valor) => {
    const nuevaReceta = form.receta.map((item, i) =>
      i === index ? { ...item, [campo]: valor } : item
    );
    setForm({ ...form, receta: nuevaReceta });
  };
  // Alternar la disponibilidad de los platillos
  const toggleDisponibilidad = async(id,productoActual) => {
    try{
      const response=await fetch(`http://127.0.0.1:8000/menu/deshabilitar/${id}`,{
        method:'PUT',
        headers:{
          'Content-Type':'application/json'
        },
       body: JSON.stringify({
        producto_activo: !platilloActual.producto_activo  // ⭐ Enviar el nuevo estado
      })
      })
    const data = await response.json();
    setPlatillos(
      platillos.map((platillo) =>
        platillo.id === id
          ? { ...platillo, producto_activo: !productoActual}
          : platillo
      )
    )
    alert(data.mensaje)
    ;}
    catch(error){
      console.log("Error interno:",error)
      alert("Error al actualizar el estado del platillo.")
    }
  };

  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    categoria: "",
    receta: [],
  });
  const agregarIngrediente = () => {
    setForm({
      ...form,
      receta: [...form.receta, { ingrediente_id: "", cantidad: "" }],
    });
  };
  // Abrir el modal agregar
  const abrirModalAgregar = () => {
    setModalType("agregar");
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      categoria: "",
      receta: [] 
    });
    setShowModal(true);
  };

  // Abrir el modal editar
  const abrirModalEditar = (platillo) => {
    setModalType("editar");
    setPlatilloEditando(platillo);
    setForm({
      nombre: platillo.nombre,
      descripcion: platillo.descripcion,
      precio: platillo.precio,
      categoria: platillo.categoria,
    });
    setShowModal(true);
  };

  // Cerrar el modal
  const cerrarModal = () => {
    setShowModal(false);
    setPlatilloEditando(null);
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
    if (modalType === "agregar") {
      setPlatillos([
        ...platillos,
        {
          id: Date.now(),
          nombre: form.nombre,
          descripcion: form.descripcion,
          precio: parseFloat(form.precio),
          categoria: form.categoria,
          disponible: true,
          ingredientes: [],
        },
      ]);
    } else if (modalType === "editar") {
      setPlatillos(
        platillos.map((p) =>
          p.id === platilloEditando.id
            ? { ...p, ...form, precio: parseFloat(form.precio) }
            : p
        )
      );
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
          <p className="text-muted">
            Administra los platillos y bebidas del restaurante
          </p>
        </div>
        <div className="col-md-4 text-end">
          <button className="btn btn-primary" onClick={abrirModalAgregar}>
            <i className="fa-solid fa-plus me-2"></i>
            Agregar Platillo
          </button>
        </div>
      </div>

      {/* Lista de platillos por categoría */}
      {Object.keys(platillosPorCategoria).map((categoria) => (
        <div key={categoria} className="mb-5">
          <h3 className="categoria-titulo h4 mb-3">{categoria}</h3>
          <div className="row">
            {platillosPorCategoria[categoria].map((platillo) => (
              <div key={platillo.id} className="col-md-4 mb-4">
                <div
                  className={`card h-100 bg-white ${
                    !platillo.producto_activo? "card-desactivada" : ""
                  }`}
                >
                  <div className="card-body ">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="card-title">{platillo.nombre}</h5>
                      <span
                        className={`badge ${
                          platillo.producto_activo ? "bg-success" : "bg-secondary"
                        }`}
                      >
                        {platillo.producto_activo ? "Disponible" : "No disponible"}
                      </span>
                    </div>

                    <p className="card-text text-muted small">
                      {platillo.descripcion}
                    </p>

                    <div className="mb-2">
                      <h6 className="small fw-bold">
                        Ingredientes principales:
                      </h6>
                      <ul className="list-unstyled small">
                        {platillo.ingredientes.map((ingrediente, index) => (
                          <li key={index} className="d-inline-block me-2">
                            <span className="badge bg-light text-dark">
                              {ingrediente.nombre}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mb-3">
                      <h5 className="text-primary">
                        Precio:S/ {platillo.precio.toFixed(2)}
                      </h5>
                    </div>

                    <div className="card-btn-row d-flex justify-content-between">
                      <button
                        className={`btn mx-2 ${
                          platillo.producto_activo ? "btn-warning" : "btn-success"
                        } btn-sm btn-toggle`}
                        onClick={() => toggleDisponibilidad(platillo.id,platillo.producto_activo)}
                      >
                        {platillo.producto_activo ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        className="btn btn-outline-primary btn-sm btn-edit mx-1"
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
        </div>
      ))}

      {/* Modal de Agregar y Editar */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {modalType === "agregar"
                  ? "Agregar Nuevo Platillo"
                  : "Editar Platillo"}
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
                  <label htmlFor="nombre" className="form-label">
                    Nombre del Platillo
                  </label>
                  <input
                    type="text"
                    className="form-control mx-auto"
                    id="nombre"
                    defaultValue={
                      modalType === "editar" ? platilloEditando.nombre : ""
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="descripcion" className="form-label">
                    Descripción
                  </label>
                  <textarea
                    className="form-control w-100"
                    id="descripcion"
                    rows="3"
                    defaultValue={
                      modalType === "editar" ? platilloEditando.descripcion : ""
                    }
                  ></textarea>
                </div>
                <div className="mb-3">
                  <label htmlFor="precio" className="form-label">
                    Precio (S/)
                  </label>
                  <input
                    type="number"
                    className="form-control mx-auto"
                    id="precio"
                    step="0.01"
                    defaultValue={
                      modalType === "editar" ? platilloEditando.precio : ""
                    }
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="categoria" className="form-label">
                    Categoría
                  </label>
                  <select className="form-select mx-auto" id="categoria">
                    <option value="">Selecciona una categoría</option>
                    <option value="Ceviches">Ceviches</option>
                    <option value="Tiraditos">Tiraditos</option>
                    <option value="Chicharrones">Chicharrones</option>
                    <option value="Sudados">Sudados</option>
                    <option value="Bebidas sin alcohol">
                      Bebidas sin alcohol
                    </option>
                    <option value="Bebidas con alcohol">
                      Bebidas con alcohol
                    </option>
                  </select>
                </div>
                {/* Sección de Ingredientes - Agregar antes del botón de guardar */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold">
                      Ingredientes
                    </label>
                    <button
                      type="button"
                      className="btn btn-sm btn-success"
                      onClick={agregarIngrediente}
                    >
                      + Agregar Ingrediente
                    </button>
                  </div>

                  {form.receta.length === 0 ? (
                    <p className="text-muted small">
                      No hay ingredientes agregados
                    </p>
                  ) : (
                    <div className="border rounded p-2">
                      {form.receta.map((item, index) => (
                        <div
                          key={index}
                          className="row mb-2 align-items-center"
                        >
                          <div className="col-6">
                            <select
                              className="form-select form-select-sm"
                              value={item.ingrediente_id}
                              onChange={(e) =>
                                actualizarIngrediente(
                                  index,
                                  "ingrediente_id",
                                  parseInt(e.target.value)
                                )
                              }
                            >
                              <option value="">Selecciona ingrediente</option>
                              {/* Aquí cargarás los ingredientes desde tu BD */}
                              <option value="1">Pota</option>
                              <option value="2">Limón</option>
                              <option value="3">Corvina</option>
                              {/* ...más ingredientes */}
                            </select>
                          </div>
                          <div className="col-4">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              placeholder="Cantidad"
                              step="0.01"
                              value={item.cantidad}
                              onChange={(e) =>
                                actualizarIngrediente(
                                  index,
                                  "cantidad",
                                  parseFloat(e.target.value)
                                )
                              }
                            />
                          </div>
                          <div className="col-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => eliminarIngrediente(index)}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-primary w-100"
                  onClick={cerrarModal}
                  onChange={guardarPlatillo}
                >
                  {modalType === "agregar"
                    ? "Agregar Platillo"
                    : "Guardar Cambios"}
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
