import React, { useState } from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Fisicos() {
  const [pedidos, setPedidos] = useState([
    {
      id: 8,
      mesa: "Mesa 8",
      cliente: "Ana Martínez",
      estado: "Pendiente",
      hora: "20:00",
      items: [
        { nombre: "Hamburguesa Clásica", precio: 16.5 },
        { nombre: "Papas Fritas", precio: 8.0 },
      ],
    },
    {
      id: 5,
      mesa: "Mesa 5",
      cliente: "Juan Pérez",
      estado: "En preparación",
      hora: "19:30",
      items: [
        { nombre: "Pizza Margherita", precio: 24.5 },
        { nombre: "Ensalada César", precio: 12.5 },
      ],
    },
    {
      id: 3,
      mesa: "Mesa 3",
      cliente: "Carlos López",
      estado: "Listo",
      hora: "19:45",
      items: [{ nombre: "Salmón Grillado", precio: 32.0 }],
    },
    {
      id: 12,
      mesa: "Mesa 12",
      cliente: "María García",
      estado: "Servido",
      hora: "19:15",
      items: [
        { nombre: "Pasta Carbonara", precio: 36.0 },
        { nombre: "Vino Tinto", precio: 15.0 },
      ],
    },
  ]);

  const [showModal, setShowModal] = useState(false);

  const [nuevoPedido, setNuevoPedido] = useState({
    mesa: "",
    cliente: "",
    comida: "",
    bebida: "",
    total: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };

  const calcularTotal = (items) =>
    items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nuevoPedido.mesa || !nuevoPedido.cliente || !nuevoPedido.comida) {
      alert("Por favor, completa los campos obligatorios.");
      return;
    }

    const horaActual = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const nuevo = {
      id: pedidos.length + 1,
      mesa: `Mesa ${nuevoPedido.mesa}`,
      cliente: nuevoPedido.cliente,
      estado: "Pendiente",
      hora: horaActual,
      items: [
        { nombre: nuevoPedido.comida, precio: parseFloat(nuevoPedido.total) || 0 },
        ...(nuevoPedido.bebida ? [{ nombre: nuevoPedido.bebida, precio: 0 }] : []),
      ],
    };

    setPedidos([...pedidos, nuevo]);
    setShowModal(false);
    setNuevoPedido({ mesa: "", cliente: "", comida: "", bebida: "", total: "" });
  };

  return (
    <div className="pedidos-container">
      {/* ENCABEZADO */}
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos 🐟</h2>
      </div>

      {/* LISTADO DE TARJETAS */}
      <div className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((p) => (
            <div key={p.id} className="pedido-card">
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
                <small>
                  {p.estado} — {p.hora}
                </small>
                <strong>S/ {calcularTotal(p.items)}</strong>
              </div>
            </div>
          ))
        ) : (
          <div className="no-pedidos">No hay pedidos</div>
        )}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nuevo Pedido 🦐</h3>
              <button className="btn-cerrar-modal" onClick={() => setShowModal(false)}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <label>Número de Mesa:</label>
              <input
                type="text"
                name="mesa"
                value={nuevoPedido.mesa}
                onChange={handleChange}
                placeholder="Ej: 10"
                required
              />

              <label>Nombre del Cliente:</label>
              <input
                type="text"
                name="cliente"
                value={nuevoPedido.cliente}
                onChange={handleChange}
                placeholder="Ej: Luis García"
                required
              />

              <label>Comida:</label>
              <input
                type="text"
                name="comida"
                value={nuevoPedido.comida}
                onChange={handleChange}
                placeholder="Ej: Ceviche Mixto"
                required
              />

              <label>Bebida:</label>
              <input
                type="text"
                name="bebida"
                value={nuevoPedido.bebida}
                onChange={handleChange}
                placeholder="Ej: Inca Kola"
              />

              <label>Monto Total (S/):</label>
              <input
                type="number"
                step="0.01"
                name="total"
                value={nuevoPedido.total}
                onChange={handleChange}
                placeholder="Ej: 35.00"
              />

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
    </div>
  );
}