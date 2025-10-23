import React, { useState,useEffect} from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Fisicos() {

  const [pedidos, setPedidos] = useState([
    { id: 8, mesa: "Mesa 8", cliente: "Ana", estado: "Pendiente", hora: "20:00", items: [{ nombre: "CEVICHE MIXTO", precio: 16.5,cantidad:2 }, { nombre: "LECHE DE TIGRE", precio: 9.0,cantidad:1 }] },
    { id: 5, mesa: "Mesa 5", cliente: "Juan", estado: "EnPreparacion", hora: "19:30", items: [{ nombre: "PARIHUELA", precio: 24.5,cantidad:1 }, { nombre: "LANGOSTINOS", precio: 12.5,cantidad:3 }] },
    { id: 3, mesa: "Mesa 3", cliente: "Carlos", estado: "Listo", hora: "19:45", items: [{ nombre: "CHILCANO", precio: 20.0,cantidad:4 }] },
    { id: 12, mesa: "Mesa 12", cliente: "María", estado: "Servido", hora: "19:15", items: [{ nombre: "JALEA MIXTA", precio: 36.0,cantidad:1 }, { nombre: "VINO TINTO", precio: 15.0,cantidad:2 }] },
  ]);
  const rol = localStorage.getItem("userRole");
  const [showModal, setShowModal] = useState(false);
  const [platillos,setPlatillos]=useState([])
  const [nuevoPedido, setNuevoPedido] = useState({ id: "", mesa: "", cliente: "", items:[{nombre:"",cantidad:""}], total: "" });
  useEffect(() => {
    fetch("http://127.0.0.1:8000/pedidosF/platillos")
      .then((res) => res.json())
      .then((data) => setPlatillos(data))
      .catch((err) => console.error(err));
  }, []);
  // 🔹 Función que cambia el estado del pedido a "En preparación"
  const cambiarEstado = (id,estado) => {
    if(estado==="Pendiente"){
    setPedidos(
      pedidos.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: "EnPreparacion" } : pedido
      )
    );
    };
    if(estado==="EnPreparacion"){
      setPedidos(
      pedidos.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: "Listo" } : pedido
      )
    );
    }
    if(estado==="Listo"){
      setPedidos(
      pedidos.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: "Servido" } : pedido
      )
    );
    }
  }
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };

  const calcularTotal = (items) =>
    items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevoPedido.id || !nuevoPedido.mesa || !nuevoPedido.cliente || !nuevoPedido.platillo) {
      alert("Por favor, completa todos los campos obligatorios.");
      return;
    }

    const horaActual = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const nuevo = {
      id: parseInt(nuevoPedido.id),
      mesa: `Mesa ${nuevoPedido.mesa}`,
      cliente: nuevoPedido.cliente,
      estado: "Pendiente",
      hora: horaActual,
      items: [{ nombre: nuevoPedido.platillo, precio: parseFloat(nuevoPedido.total) || 0 }],
    };

    setPedidos([...pedidos, nuevo]);
    setShowModal(false);
    setNuevoPedido({ id: "", mesa: "", cliente: "", platillo: "", total: "" });
  };
  const estado=(estadoP)=>{
    if(estadoP==="Pendiente"){
      return "Marcar como en preparación"
    }
    else if(estadoP==="EnPreparacion"){
      return "Marcar como listo"
    }
    else if(estadoP==="Listo"){
      return "Marcar como Servido"
    }
  }

  return (
    <div className="pedidos-container">
      {/* ENCABEZADO */}
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos 🐟</h2>
        {rol==1 &&(<button className="btn-crear" onClick={() => setShowModal(true)}>➕ Crear Pedido</button>)}
      </div>
      {/* LISTADO DE TARJETAS */}
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
              {p.items.map((it, idx) => (
                <li key={idx}>
                  <span>{it.nombre}</span>
                  <span className="precio">S/ {it.precio.toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <div className="pedido-footer">
              <small>Estado: <strong>{p.estado}</strong> — {p.hora}</small>
              <strong>S/ {calcularTotal(p.items)}</strong>
            </div>

            {/* BOTÓN PARA CAMBIAR DE PENDIENTE A EN PREPARACIÓN */}
            {(p.estado!="Servido" && rol==1 ) &&(<button
              className={"btn-estado m-2"}
              onClick={() => cambiarEstado(p.id,p.estado)}
            >
              {estado(p.estado)}
            </button>)}
            {(p.estado==="Pendiente" && rol==1) &&(
              <>
                <button className="btn btn-warning m-1">Modificar pedido</button>
                <button className="btn btn-danger m-1">Eliminar pedido</button>
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
              <button className="btn-cerrar-modal" onClick={() => setShowModal(false)}>✖</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label>ID del Pedido:</label>
              <input type="number" name="id" value={nuevoPedido.id} onChange={handleChange} required />

              <label>Número de Mesa:</label>
              <input type="text" name="mesa" value={nuevoPedido.mesa} onChange={handleChange} required />

              <label>Nombre del Cliente:</label>
              <input type="text" name="cliente" value={nuevoPedido.cliente} onChange={handleChange} required />

              <label>Selecciona platillos:</label>
              <div>
              <select>
                {platillos.map((platillo)=>(
                  <option value={platillo.nombre}>{platillo.nombre}</option>
                ))}
              </select>
              <input type="number" name="cantidad" value={nuevoPedido.items["Nombre"]} onChange={handleChange}/>
              </div>
              <label>Monto Total (S/):</label>
              <input type="number" step="0.01" name="total" value={nuevoPedido.total} onChange={handleChange} required />

              <div className="modal-buttons">
                <button type="submit" className="btn-guardar">Guardar Pedido</button>
                <button type="button" className="btn-cancelar" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
