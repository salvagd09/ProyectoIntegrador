import React, { useState } from "react";
import "./tarjetasPedidos.css";

export default function Pedidos_Cocinero() {
  const [pedidos, setPedidos] = useState([
    {
      id: 8,
      mesa: "Mesa 8",
      cliente: "Ana",
      estado: "En preparación",
      hora: "20:00",
      items: [
        { nombre: "CEVICHE MIXTO", precio: 16.5 },
        { nombre: "LECHE DE TIGRE", precio: 9.0 },
      ],
    },
    {
      id: 5,
      mesa: "Mesa 5",
      cliente: "Juan",
      estado: "En preparación",
      hora: "19:30",
      items: [
        { nombre: "PARIHUELA", precio: 24.5 },
        { nombre: "LANGOSTINOS", precio: 12.5 },
      ],
    },
    {
      id: 3,
      mesa: "Mesa 3",
      cliente: "Carlos",
      estado: "En preparación",
      hora: "19:45",
      items: [{ nombre: "CHILCANO", precio: 20.0 }],
    },
    {
      id: 12,
      mesa: "Mesa 12",
      cliente: "María",
      estado: "En preparación",
      hora: "19:15",
      items: [
        { nombre: "JALEA MIXTA", precio: 36.0 },
        { nombre: "VINO TINTO", precio: 15.0 },
      ],
    },
  ]);

  const calcularTotal = (items) =>
    items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

  // Cambiar estado a "Listo"
  const marcarListo = (id) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: "Listo" } : p))
    );
  };

  return (
    <div className="pedidos-container">
      <div className="pedidos-topbar">
        <h2>Pedidos del Cocinero</h2>
      </div>

      <div className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((p) => (
            <div
              key={p.id}
              className={`pedido-card ${
                p.estado === "En preparación"
                  ? "en-preparacion"
                  : p.estado === "Listo"
                  ? "estado-listo"
                  : ""
              }`}
            >
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
                  Estado: <strong>{p.estado}</strong> — {p.hora}
                </small>
                <strong>S/ {calcularTotal(p.items)}</strong>
              </div>

              {/* BOTÓN PARA CAMBIAR ESTADO */}
              {p.estado === "En preparación" ? (
                <button
                  className="btn-estado preparacion"
                  onClick={() => marcarListo(p.id)}
                >
                  En preparación
                </button>
              ) : p.estado === "Listo" ? (
                <span className="estado-ok">LISTO</span>
              ) : null}
            </div>
          ))
        ) : (
          <div className="no-pedidos">No hay pedidos</div>
        )}
      </div>
    </div>
  );
}
