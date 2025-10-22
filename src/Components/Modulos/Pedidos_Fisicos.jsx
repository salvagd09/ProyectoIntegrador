import React, { useState } from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Fisicos() {
  const [pedidos, setPedidos] = useState([
    { id: 8, mesa: "Mesa 8", cliente: "Ana", estado: "Pendiente", hora: "20:00", items: [{ nombre: "CEVICHE MIXTO", precio: 16.5 }, { nombre: "LECHE DE TIGRE", precio: 9.0 }] },
    { id: 5, mesa: "Mesa 5", cliente: "Juan", estado: "Pendiente", hora: "19:30", items: [{ nombre: "PARIHUELA", precio: 24.5 }, { nombre: "LANGOSTINOS", precio: 12.5 }] },
    { id: 3, mesa: "Mesa 3", cliente: "Carlos", estado: "Pendiente", hora: "19:45", items: [{ nombre: "CHILCANO", precio: 20.0 }] },
    { id: 12, mesa: "Mesa 12", cliente: "María", estado: "Pendiente", hora: "19:15", items: [{ nombre: "JALEA MIXTA", precio: 36.0 }, { nombre: "VINO TINTO", precio: 15.0 }] },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [nuevoPedido, setNuevoPedido] = useState({ id: "", mesa: "", cliente: "", platillo: "", total: "" });

  // 🔹 Función que cambia el estado del pedido a "En preparación"
  const cambiarEstado = (id) => {
    setPedidos(
      pedidos.map((pedido) =>
        pedido.id === id ? { ...pedido, estado: "En preparación" } : pedido
      )
    );
  };

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

  return (
    <div className="pedidos-container">
      {/* ENCABEZADO */}
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos 🐟</h2>
        <button className="btn-crear" onClick={() => setShowModal(true)}>➕ Crear Pedido</button>
      </div>

      {/* LISTADO DE TARJETAS */}
      <div className="pedidos-list">
        {pedidos.map((p) => (
          <div key={p.id} className={`pedido-card ${p.estado === "En preparación" ? "en-preparacion" : ""}`}>
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
            <button
              className={`btn-estado ${p.estado === "Pendiente" ? "pendiente" : "preparacion"}`}
              onClick={() => cambiarEstado(p.id)}
            >
              {p.estado === "Pendiente" ? "Pendiente" : "En preparación"}
            </button>
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

              <label>Platillo:</label>
              <input type="text" name="platillo" value={nuevoPedido.platillo} onChange={handleChange} required />

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
