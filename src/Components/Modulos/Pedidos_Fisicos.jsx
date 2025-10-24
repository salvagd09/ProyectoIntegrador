import React, { useState, useEffect } from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Fisicos() {
  const [pedidos, setPedidos] = useState([]);
  const [itemTemp, setItemTemp] = useState({
    platillo_id: "",
    cantidad: 1
  });
  const rol = localStorage.getItem("userRole");
  const [showModalB, setShowModalB] = useState(false);
  const [showModalE, setShowModalE] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [platillos, setPlatillos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mesas,setMesas]=useState([])
  const [nuevoPedido, setNuevoPedido] = useState({
    id: "",
    numero: "",
    cliente: "",
    items: [], 
  });

  const handleItemTempChange = (e) => {
    const { name, value } = e.target;
    setItemTemp({ ...itemTemp, [name]: value });
  };

  const agregarPlatillo = () => {
    if (!itemTemp.platillo_id || itemTemp.cantidad <= 0) {
      alert("Selecciona un platillo y una cantidad válida");
      return;
    }

    const platilloSeleccionado = platillos.find(
      p => p.id === parseInt(itemTemp.platillo_id)
    );

    if (!platilloSeleccionado) {
      alert("Platillo no encontrado");
      return;
    }

    const yaExiste = nuevoPedido.items.find(
      item => item.platillo_id === itemTemp.platillo_id
    );

    if (yaExiste) {
      alert("Este platillo ya fue agregado. Edita la cantidad si es necesario.");
      return;
    }

    const nuevoItem = {
      platillo_id: itemTemp.platillo_id,
      nombre: platilloSeleccionado.nombre,
      cantidad: parseInt(itemTemp.cantidad),
      precio: platilloSeleccionado.precio
    };

    setNuevoPedido({
      ...nuevoPedido,
      items: [...nuevoPedido.items, nuevoItem]
    });

    setItemTemp({ platillo_id: "", cantidad: 1 });
  };
  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;
    const nuevosItems = [...nuevoPedido.items];
    nuevosItems[index].cantidad = parseInt(nuevaCantidad);
    setNuevoPedido({ ...nuevoPedido, items: nuevosItems });
  };
  const eliminarPlatillo = (index) => {
    const nuevosItems = nuevoPedido.items.filter((_, i) => i !== index);
    setNuevoPedido({ ...nuevoPedido, items: nuevosItems });
  };
  useEffect(() => {
    fetch("http://127.0.0.1:8000/pedidosF/platillos")
      .then((res) => res.json())
      .then((data) => setPlatillos(data))
      .catch((err) => console.error(err));
  }, []);
  useEffect(() => {
    fetch("http://127.0.0.1:8000/pedidosF/mesas")
      .then((res) => res.json())
      .then((data) => setMesas(data))
      .catch((err) => console.error(err));
  }, []);
  useEffect(()=> {
    fetch("http://127.0.0.1:8000/pedidosF/pedidosM")
      .then((res) => res.json())
      .then((data) => setPedidos(data))
      .catch((err) => console.error(err));
  }, [])
  const cambiarEstado = (id, estado) => {
    if (estado === "Pendiente") {
      setPedidos(
        pedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, estado: "En preparacion" } : pedido
        )
      );
    }
    if (estado === "En preparacion") {
      setPedidos(
        pedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, estado: "Listo" } : pedido
        )
      );
    }
    if (estado === "Listo") {
      setPedidos(
        pedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, estado: "Servido" } : pedido
        )
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };


  // ✅ CORREGIDO: Función handleSubmit actualizada
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!nuevoPedido.id || !nuevoPedido.mesa || !nuevoPedido.cliente) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    if (nuevoPedido.items.length === 0) {
      alert("Debes agregar al menos un platillo");
      return;
    }

    const horaActual = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nuevo = {
      id: parseInt(nuevoPedido.id),
      mesa: `Mesa ${nuevoPedido.mesa}`,
      cliente: nuevoPedido.cliente,
      estado: "Pendiente",
      hora: horaActual,
      items: nuevoPedido.items
    };

    setPedidos([...pedidos, nuevo]);
    setShowModal(false);
    
    // Resetear formulario
    setNuevoPedido({ id: "", mesa: "", cliente: "", items: [] });
    setItemTemp({ platillo_id: "", cantidad: 1 });
  };

  // ✅ NUEVA FUNCIÓN: Eliminar pedido
 async function EliminarPedido(id){
   try {
      const eliminacion = await fetch(
        `http://127.0.0.1:8000/pedidosF/eliminarPM/${pedidoSeleccionado.id}`,
        {
          method: "DELETE",
        }
      );
      if (!eliminacion.ok) return alert("Error al eliminar el pedido");
      const mensajeEliminacion = await eliminacion.json();
      alert(mensajeEliminacion.mensaje);
      setPedidos(pedidos.filter((pedido) => pedido.id !== id));
      setShowModalB(false);
    } catch (error) {
      console.error("Hubo un error en la conexión", error);
    }
  };

  // ✅ NUEVA FUNCIÓN: Modificar pedido (básica)
  const ModificarPedido = (id) => {
    // Aquí puedes implementar la lógica de modificación
    alert(`Modificar pedido #${id} - Función por implementar`);
    setShowModalE(false);
  };

  const estado = (estadoP) => {
    if (estadoP === "Pendiente") {
      return "Marcar como en preparación";
    } else if (estadoP === "En preparacion") {
      return "Marcar como listo";
    } else if (estadoP === "Listo") {
      return "Marcar como Servido";
    }
  };

  return (
    <div className="pedidos-container">
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos 🐟</h2>
        {rol == 1 && (
          <button className="btn-crear" onClick={() => setShowModal(true)}>
            ➕ Crear Pedido
          </button>
        )}
      </div>

      <div className="pedidos-list">
        {pedidos.map((p) => (
          <div key={p.id} className={"pedido-card"}>
            <div className="pedido-top">
              <div>
                <div className="pedido-mesa">{p.mesa}</div>
                <div className="pedido-cliente">{p.cliente}</div>
              </div>
              <div className="pedido-id">#{p.id}</div>
            </div>
            <ul className="pedido-items">
              {p.items.map((it,idx) => (
                <li key={idx}>
                  <span>{it.nombre} x{it.cantidad}</span>
                  <span className="precio">S/ {(it.precio_unitario * it.cantidad).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="pedido-footer">
              <small>
                Estado: <strong>{p.estado}</strong> — {p.hora}
              </small>
              <strong>S/ {p.monto_total}</strong>
            </div>

            {p.estado != "Servido" && rol == 1 && (
              <button
                className={"btn-estado m-2"}
                onClick={() => cambiarEstado(p.id, p.estado)}
              >
                {estado(p.estado)}
              </button>
            )}
            
            {p.estado === "Pendiente" && rol == 1 && (
              <>
                <button 
                  className="btn btn-warning m-1"
                  onClick={() => {
                    setShowModalE(true);
                    setPedidoSeleccionado(p);
                  }}
                >
                  Modificar pedido
                </button>
                <button
                  className="btn btn-danger m-1"
                  onClick={() => {
                    setShowModalB(true);
                    setPedidoSeleccionado(p); {/* 👈 CORREGIDO */}
                  }}
                >
                  Eliminar pedido
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {/* MODAL CREAR PEDIDO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nuevo Pedido 🦐</h3>
              <button
                className="btn-cerrar-modal"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="col-md-12">
                <label>Selecciona una mesa:</label>
                  <select
                    name="platillo_id"
                    className="form-control w-100"
                    value={nuevoPedido.mesa}
                    onChange={handleChange}
                  >
                    <option value="" >--Selecciona una mesa</option>
                    {mesas.map((mesa) => (
                      <option key={mesa.id} value={mesa.id}>
                        {mesa.numero}
                      </option>
                    ))}
                  </select>
                </div>

              <label>Nombre del Cliente:</label>
              <input
                type="text"
                name="cliente"
                value={nuevoPedido.cliente}
                onChange={handleChange}
                required
              />

              <label>Selecciona platillos o bebidas:</label>
              <div className="row d-flex align-items-center g-2 mb-2">
                <div className="col-md-6">
                  <select
                    name="platillo_id"
                    className="form-control w-100"
                    value={itemTemp.platillo_id}
                    onChange={handleItemTempChange}
                  >
                    <option value="">Seleccionar platillo...</option>
                    {platillos.map((platillo) => (
                      <option key={platillo.id} value={platillo.id}>
                        {platillo.nombre} - S/. {platillo.precio}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <input
                    type="number"
                    name="cantidad"
                    className="form-control w-100"
                    placeholder="Cantidad"
                    min="1"
                    value={itemTemp.cantidad}
                    onChange={handleItemTempChange}
                  />
                </div>
                <div className="col-md-4">
                  <button
                    type="button"
                    className="btn btn-success w-100"
                    onClick={agregarPlatillo}
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Lista de Platillos Agregados */}
              {nuevoPedido.items.length > 0 ? (
                <>
                  <div className="card">
                    <div className="card-header bg-light">
                      <strong>Platillos del Pedido</strong>
                    </div>
                    <ul className="list-group list-group-flush">
                      {nuevoPedido.items.map((item, index) => (
                        <li key={index} className="list-group-item">
                          <div className="d-flex align-items-center flex-wrap">
                            <div className="col-md-4">
                              <strong>{item.nombre}</strong>
                            </div>
                            <div className="col-md-3">
                              <input
                                type="number"
                                className="form-control form-control-sm"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarCantidad(index, e.target.value)}
                              />
                            </div>
                            <div className="col-md-2 text-end">
                              <strong>S/. {(item.precio * item.cantidad).toFixed(2)}</strong>
                            </div>
                            <div className="col-md-2 text-end mx-auto">
                              <button
                                type="button"
                                className="btn btn-danger btn-sm"
                                onClick={() => eliminarPlatillo(index)}
                              >
                                Eliminar
                              </button>
                            </div>
                          </div>
                        </li>
                      ))} 
                    </ul>
                    <div className="card-footer bg-light">
                      <div className="row">
                        <div className="col text-end">
                          <h5>Total: <strong>S/. {calcularTotal(nuevoPedido.items)}</strong></h5>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="alert alert-info">
                  No hay platillos agregados. Selecciona uno para comenzar.
                </div>
              )}

              <div className="modal-buttons">
                <button type="submit" className="btn-guardar">
                  Guardar Pedido
                </button>
                <button
                  type="button"
                  className="btn-cancelar"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {showModalB && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            aria-hidden="false"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-title">Confirmación de eliminación</div>
                <div className="modal-body">
                  <label>
                    ¿Estás seguro de que deseas eliminar el Pedido #{pedidoSeleccionado?.id}?
                  </label>
                  <button
                    type="submit"
                    className="btn btn-danger mx-1"
                    onClick={() => EliminarPedido(pedidoSeleccionado?.id)}
                  >
                    Sí
                  </button>
                  <button
                    className="btn btn-success mx-1"
                    onClick={() => setShowModalB(false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModalB(false)}
          ></div>
        </>
      )}

      {/* MODAL EDITAR */}
      {showModalE && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            aria-hidden="false"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModalE(false)}
                ></button>
                <div className="modal-title">Área de edición</div>
                <div className="modal-body">
                  <label>
                    Selecciona los platillos que quieres modificar:
                  </label>
                  <button
                    type="submit"
                    className="btn btn-warning mx-1"
                    onClick={() => ModificarPedido(pedidoSeleccionado?.id)}
                  >
                    Modificar
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowModalE(false)}
          ></div>
        </>
      )}
    </div>
  );
}

