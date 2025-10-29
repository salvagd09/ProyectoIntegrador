import React, { useState, useEffect } from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Fisicos() {
  const [pedidos, setPedidos] = useState([]);
  const rol = localStorage.getItem("userRole");
  const [showModalB, setShowModalB] = useState(false);
  {/*Estados para el modal de edicion */}
  const [showModalE, setShowModalE] = useState(false);
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [itemsEditados, setItemsEditados] = useState([]);
  const [itemTempEditar, setItemTempEditar] = useState({
    platillo_id: "",
    cantidad: 1,
  });
  {/*Estados para el modal de agregacion */}
  const [showModal, setShowModal] = useState(false);
  const [platillos, setPlatillos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [itemTemp, setItemTemp] = useState({
    platillo_id: "",
    cantidad: 1,
  });
  const [mesas, setMesas] = useState([]);
  const [nuevoPedido, setNuevoPedido] = useState({
    mesa_id: null,
    estado: "pendiente",
    tipo_pedido: "mesa",
    items: [],
  });
  const [pedidosCerrados, setPedidosCerrados] = useState([]); // ← IDs de pedidos cerrados
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
  useEffect(() => {
    fetch("http://127.0.0.1:8000/pedidosF/pedidosM")
      .then((res) => res.json())
      .then((data) => setPedidos(data))
      .catch((err) => console.error(err));
  }, []);
  // Función para cerrar una tarjeta
  const cerrarTarjeta = (pedidoId) => {
    setPedidosCerrados([...pedidosCerrados, pedidoId]);
  };
  // Para agregar pedidos
  const guardarPedido = async () => {
    if (!nuevoPedido.mesa_id) {
      alert("Selecciona una mesa");
      return;
    }

    if (nuevoPedido.items.length === 0) {
      alert("Agrega al menos un platillo");
      return;
    }

    // Transformar datos solo al enviar
    const pedidoParaEnviar = {
      mesa_id: nuevoPedido.mesa_id,
      empleado_id: 6,
      estado: nuevoPedido.estado,
      tipo_pedido: nuevoPedido.tipo_pedido,
      monto_total: parseFloat(calcularTotal()),
      items: nuevoPedido.items.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/pedidosF/agregarPedido",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoParaEnviar),
        }
      );

      if (response.ok) {
        alert("Pedido creado exitosamente");
        // Resetear formulario
        setNuevoPedido({
          mesa_id: null,
          estado: "pendiente",
          tipo_pedido: "mesa",
          items: [],
        });
      } else {
        alert("Error al crear pedido");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error de conexión");
    }
  };
  {/*Funciones para el modal de agregar */}
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
      (p) => p.id === parseInt(itemTemp.platillo_id)
    );

    if (!platilloSeleccionado) {
      alert("Platillo no encontrado");
      return;
    }

    const yaExiste = nuevoPedido.items.find(
      (item) => item.platillo_id === parseInt(itemTemp.platillo_id)
    );

    if (yaExiste) {
      alert(
        "Este platillo ya fue agregado. Edita la cantidad si es necesario"
      );
      return;
    }

    const nuevoItem = {
      pedido_id: platilloSeleccionado.id,
      producto_id: parseInt(itemTemp.platillo_id),
      nombre: platilloSeleccionado.nombre,
      cantidad: parseInt(itemTemp.cantidad),
      precio_unitario: platilloSeleccionado.precio,
    };

    setNuevoPedido({
      ...nuevoPedido,
      items: [...nuevoPedido.items, nuevoItem],
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
  {/*Funciones para el modal de editar */}
  const abrirModalEditar = (pedido) => {
    // Aqui se guarda referencia al pedido original
    console.log("Pedido a editar:", pedido); 
    setPedidoAEditar(pedido);
    // Aqui se copian los items
    setItemsEditados([...pedido.items]);
    // Aqui se resetean los campos temporales
    setItemTempEditar({ platillo_id: "", cantidad: 1 });
    // Aqui se abre el modal
    setShowModalE(true);
  };
  const calcularTotalEditar = () => {
    return itemsEditados
      .reduce((total, item) => total + item.precio_unitario * item.cantidad, 0)
      .toFixed(2);
  };
  const handleItemTempChangeEditar = (e) => {
    const { name, value } = e.target;
    setItemTempEditar({ ...itemTempEditar, [name]: value });
  };
  const agregarPlatilloEditar = () => {
  if (!itemTempEditar.platillo_id) return;
  
  const platillo = platillos.find(p => p.id === parseInt(itemTempEditar.platillo_id));
  const nuevoItem = {
    producto_id: platillo.id,
    nombre: platillo.nombre,
    precio_unitario: platillo.precio,
    cantidad: parseInt(itemTempEditar.cantidad),
    es_nuevo: true,
  };
  setItemsEditados([...itemsEditados, nuevoItem]);
  setItemTempEditar({ platillo_id: "", cantidad: 1 });
};
//Se actualizan la cantidad de platos a editar
const actualizarCantidadEditar = (index, nuevaCantidad) => {
  const cantidad = parseInt(nuevaCantidad);
  if (cantidad < 1) return;
  
  const nuevosItems = [...itemsEditados];
  nuevosItems[index].cantidad = cantidad;
  setItemsEditados(nuevosItems);
};
// Eliminar platillos en edicion
const eliminarPlatilloEditar = (index) => {
  setItemsEditados(itemsEditados.filter((_, i) => i !== index));
};
const cargarPedidos = async () => {
  // ...
  const data = await response.json();
  console.log("Pedido completo del backend:", data); // 🔍 Esto
};
const guardarCambiosPedido = async () => {
  if (itemsEditados.length === 0) {
    alert("El pedido debe tener al menos un platillo");
    return;
  }
  
  try {
    // Agrupar items del mismo producto
    const itemsAgrupados = itemsEditados.reduce((acc, item) => {
      const productoId = parseInt(item.producto_id || item.platillo_id);
      const itemExistente = acc.find(i => i.producto_id === productoId);
      
      if (itemExistente) {
        // Si ya existe, sumar la cantidad
        itemExistente.cantidad += parseInt(item.cantidad);
      } else {
        // Si no existe, agregarlo
        acc.push({
          producto_id: productoId,
          cantidad: parseInt(item.cantidad),
          precio_unitario: parseFloat(item.precio_unitario),
          notas: item.notas || ""
        });
      }
      
      return acc;
    }, []);

    const pedidoActualizado = {
      items: itemsAgrupados,
      monto_total: parseFloat(calcularTotalEditar()),
    };

    console.log("Datos a enviar:", pedidoActualizado);

    const response = await fetch(
      `http://127.0.0.1:8000/pedidosF/editar/${pedidoAEditar.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pedidoActualizado),
      }
    );

    if (response.ok) {
      alert("Pedido actualizado correctamente");
      setShowModalE(false);
      setPedidoAEditar(null);
      setItemsEditados([]);
      cargarPedidos();
    } else {
      const error = await response.json();
      console.error("Error del servidor:", error);
      alert(`Error: ${error.detail || JSON.stringify(error)}`);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("Error al actualizar el pedido");
  }
};
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };
  const calcularTotal = () => {
    return nuevoPedido.items
      .reduce((total, item) => total + item.precio_unitario * item.cantidad, 0)
      .toFixed(2);
  };
  //  NUEVA FUNCIÓN: Eliminar pedido
  async function EliminarPedido(id) {
    try {
      const eliminacion = await fetch(
        `http://127.0.0.1:8000/pedidosF/eliminarPM/${id}`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
        }
      );
      await fetch(`http://127.0.0.1:8000/pedidosF/eliminarDetalles/${id}`, {
        method: "DELETE",
      });
      if (!eliminacion.ok) return alert("Error al eliminar el pedido");
      const mensajeEliminacion = await eliminacion.json();
      alert(mensajeEliminacion.mensaje);
      setPedidos(pedidos.filter((pedido) => pedido.id !== id));
      setShowModalB(false);
    } catch (error) {
      console.error("Hubo un error en la conexión", error);
    }
  }
  //Para cambiar el nombre de los botones que cambian el estado de pedido
const obtenerTextoBoton = (estadoP, tipoServicio) => {
  const textos = {
    pendiente: "Marcar como en preparación",
    "en_preparacion": "Marcar como listo",
    listo: tipoServicio === "delivery" 
      ? "Marcar como entregado" 
      : "Marcar como servido"
  };
  return textos[estadoP] || "Cambiar estado";
};
    //Para cambiar el estado de cada tarjeta
  const cambiarEstadoNombre = async (id, estadoActual) => {
    if (estadoActual === "servido" || estadoActual==="entregado") {
      alert("Este pedido ya está servido y/o entregado");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/pedidosF/${id}/estado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al cambiar el estado");
      }
      const data = await response.json();
      // Actualizar la vista de las tarjetas
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, estado: data.estado_nuevo } : pedido
        )
      );

      alert(`✅ ${data.mensaje}\nNuevo estado: ${data.estado_nuevo}`);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert(`❌ Error: ${error.message}`);
    }
  };
  const pedidosVisibles = pedidos.filter(
    (p) => !pedidosCerrados.includes(p.id) && p.tipo_pedido === "mesa"
  );
  const pedidosVisiblesLyS = pedidos.filter(
    (p) => !pedidosCerrados.includes(p.id) 
  );
  return (
    <div className="pedidos-container">
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos 🐟</h2>
        {rol == 4 && (
          <button className="btn-crear" onClick={() => setShowModal(true)}>
            ➕ Crear Pedido
          </button>
        )}
      </div>

      <div className="pedidos-grid-columnas">
        {/* Columna: Pendiente */}
        <div className="columna">
          <h3 className="columna-titulo">⏳ Pendiente</h3>
          {pedidosVisibles
            .filter((p) => p.estado === "pendiente")
            .map((p) => (
              <div key={p.id} className={"pedido-card"}>
                <div className="pedido-top">
                  <div>
                    <div className="pedido-mesa">{p.mesa}</div>
                  </div>
                  <div className="pedido-id">#{p.id}</div>
                </div>
                <ul className="pedido-items">
                  {p.items.map((it, idx) => (
                    <li key={idx}>
                      <span>
                        {it.nombre} x{it.cantidad}
                      </span>
                      <span className="precio">
                        S/ {(it.precio_unitario * it.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pedido-footer">
                  <small>
                    Estado: <strong>{p.estado}</strong> — {p.hora}
                  </small>
                  <strong>S/ {p.monto_total}</strong>
                </div>

                {p.estado === "listo" && rol == 1 && (
                  <button
                    className={"btn-estado m-2"}
                    onClick={() => cambiarEstadoNombre(p.id, p.estado)}
                  >
                    {obtenerTextoBoton(p.estado,p.tipo_pedido)}
                  </button>
                )}
                {rol == 4 &&(<><button
                  className="btn btn-warning m-1"
                  onClick={() => {
                    abrirModalEditar(p);
                  }}
                >
                  Modificar pedido
                </button>
                <button
                  className="btn btn-danger m-1"
                  onClick={() => {
                    setShowModalB(true);
                    setPedidoSeleccionado(p);
                  }}
                >
                  Cancelar pedido
                </button></>)}
              </div>
            ))}
        </div>

        {/* Columna: En preparación */}
        <div className="columna">
          <h3 className="columna-titulo">👨‍🍳 En Preparación</h3>
          {pedidosVisibles
            .filter((p) => p.estado === "en_preparacion")
            .map((p) => (
              <div key={p.id} className={"pedido-card"}>
                <div className="pedido-top">
                  <div>
                    <div className="pedido-mesa">{p.mesa}</div>
                    <div className="pedido-cliente">{p.cliente}</div>
                  </div>
                  <div className="pedido-id">#{p.id}</div>
                </div>
                <ul className="pedido-items">
                  {p.items.map((it, idx) => (
                    <li key={idx}>
                      <span>
                        {it.nombre} x{it.cantidad}
                      </span>
                      <span className="precio">
                        S/ {(it.precio_unitario * it.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pedido-footer">
                  <small>
                    Estado: <strong>{p.estado}</strong> — {p.hora}
                  </small>
                  <strong>S/ {p.monto_total}</strong>
                </div>
              </div>
            ))}
        </div>

        {/* Columna: Listo */}
        <div className="columna">
          <h3 className="columna-titulo">✅ Listo</h3>
          {pedidosVisiblesLyS
            .filter((p) => p.estado === "listo")
            .map((p) => (
              <div key={p.id} className={"pedido-card"}>
                <div className="pedido-top">
                  <div>
                    <div className="pedido-mesa">{p.mesa}</div>
                    <div className="pedido-cliente">{p.cliente}</div>
                  </div>
                  <div className="pedido-id">#{p.id}</div>
                </div>
                <ul className="pedido-items">
                  {p.items.map((it, idx) => (
                    <li key={idx}>
                      <span>
                        {it.nombre} x{it.cantidad}
                      </span>
                      <span className="precio">
                        S/ {(it.precio_unitario * it.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pedido-footer">
                  <small>
                    Estado: <strong>{p.estado}</strong> — {p.hora}
                  </small>
                  <strong>S/ {p.monto_total}</strong>
                </div>
                {rol==4 &&(<button
                  className={"btn-estado m-2"}
                  onClick={() => cambiarEstadoNombre(p.id, p.estado)}
                >
                  {obtenerTextoBoton(p.estado,p.tipo_pedido)}
                </button>)}
              </div>
            ))}
        </div>

        {/* Columna: Servido y Entregado */}
        <div className="columna">
          <h3 className="columna-titulo">🍽️ Servido o Entregado</h3>
          {pedidosVisiblesLyS
            .filter((p) => p.estado === "servido" || p.estado ==="entregado")
            .map((p) => (
              <div key={p.id} className={"pedido-card"}>
                <div className="pedido-top">
                  {(p.estado === "servido" || p.estado==="entregado") && (
                    <button
                      className="btn-cerrar-modal"
                      onClick={() => cerrarTarjeta(p.id)}
                    >
                      ✖
                    </button>
                  )}
                  <div>
                    <div className="pedido-mesa">{p.mesa}</div>
                    <div className="pedido-cliente">{p.cliente}</div>
                  </div>
                  <div className="pedido-id">#{p.id}</div>
                </div>
                <ul className="pedido-items">
                  {p.items.map((it, idx) => (
                    <li key={idx}>
                      <span>
                        {it.nombre} x{it.cantidad}
                      </span>
                      <span className="precio">
                        S/ {(it.precio_unitario * it.cantidad).toFixed(2)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="pedido-footer">
                  <small>
                    Estado: <strong>{p.estado}</strong> — {p.hora}
                  </small>
                  <strong>S/ {p.monto_total}</strong>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* MODAL CREAR PEDIDO */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nuevo Pedido</h3>
              <button
                className="btn-cerrar-modal"
                onClick={() => setShowModal(false)}
              >
                ✖
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                guardarPedido();
              }}
              className="modal-form"
            >
              <div className="col-md-12">
                <label>Selecciona una mesa:</label>
                <select
                  name="mesa_id"
                  className="form-control w-100"
                  value={nuevoPedido.mesa_id || ""}
                  onChange={handleChange}
                >
                  <option value="">--Selecciona una mesa</option>
                  {mesas.map((mesa) => (
                    <option key={mesa.id} value={mesa.id}>
                      {mesa.numero}
                    </option>
                  ))}
                </select>
              </div>
              <label>Selecciona platillos o bebidas:</label>
              <div className="row d-flex align-items-center g-2 mb-2">
                <div className="col-md-6">
                  <select
                    name="platillo_id"
                    className="form-control w-100"
                    value={itemTemp.platillo_id || ""}
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
                                onChange={(e) =>
                                  actualizarCantidad(index, e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-2 text-end">
                              <strong>
                                S/.{" "}
                                {(item.precio_unitario * item.cantidad).toFixed(
                                  2
                                )}
                              </strong>
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
                          <h5>
                            Total: <strong>S/. {calcularTotal()}</strong>
                          </h5>
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

      {/* MODAL Cancelar */}
      {showModalB && (
        <>
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            aria-hidden="false"
          >
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-title">Confirmación de cancelación</div>
                <div className="modal-body">
                  <label>
                    ¿Estás seguro de que deseas cancelar el Pedido #
                    {pedidoSeleccionado?.id}?
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
      {showModalE && pedidoAEditar && (
        <>
          <div className="modal fade show d-block ">
            <div className="modal-dialog modal-lg">
              <div className="modal-content mx-auto">
                <div className="modal-header">
                  <h5>Editar Pedido #{pedidoAEditar.id}</h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowModalE(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {/* Info del pedido */}
                  <div className="alert alert-info">
                    <strong>Mesa:</strong> {pedidoAEditar.mesa}
                  </div>
                  {/* Selector de platillos */}
                  <label>Agregar más platillos:</label>
                  <div className="d-flex align-items-center flex-wrap justify-content-center gap-2 my-1">
                    <div className="col-8">
                      <select
                        name="platillo_id"
                        className="form-control w-100"
                        value={itemTempEditar.platillo_id}
                        onChange={handleItemTempChangeEditar}
                      >
                        <option value="">Seleccionar platillo...</option>
                        {platillos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombre} - S/. {p.precio}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-3 my-2">
                      <input
                        type="number"
                        name="cantidad"
                        className="form-control fs-6"
                        min="1"
                        value={itemTempEditar.cantidad}
                        onChange={handleItemTempChangeEditar}
                      />
                    </div>
                    <div className="col-5 my-2">
                      <button
                        className="btn btn-success w-100"
                        onClick={agregarPlatilloEditar}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  {/* Lista de items editados */}
                  {itemsEditados.length > 0 ? (
                    <div className="card">
                      <div className="card-header">
                        <strong>Platillos del Pedido</strong>
                      </div>
                      <ul className="list-group list-group-flush">
                        {itemsEditados.map((item, index) => (
                          <li key={index} className="list-group-item">
                            <div className="row align-items-center">
                              <div className="col-4">
                                <strong>{item.nombre}</strong>
                                {item.es_nuevo && (
                                  <span className="badge bg-success ms-2 my-2">
                                    Nuevo
                                  </span>
                                )}
                              </div>
                              <div className="col-4">
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  min="1"
                                  value={item.cantidad}
                                  onChange={(e) =>
                                    actualizarCantidadEditar(
                                      index,
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="col-4 text-end">
                                <strong>
                                  S/.{" "}
                                  {(
                                    item.precio_unitario * item.cantidad
                                  ).toFixed(2)}
                                </strong>
                              </div>
                              <div className="col-4">
                                <button
                                  className="btn btn-danger btn-sm mx-auto"
                                  onClick={() => eliminarPlatilloEditar(index)}
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="card-footer">
                        <h5>
                          Total: <strong>S/. {calcularTotalEditar()}</strong>
                        </h5>
                      </div>
                    </div>
                  ) : (
                    <div className="alert alert-warning">
                      El pedido debe tener al menos un platillo.
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModalE(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={guardarCambiosPedido}
                    disabled={itemsEditados.length === 0}
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
}
