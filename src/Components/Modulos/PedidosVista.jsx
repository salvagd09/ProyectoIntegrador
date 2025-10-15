import React, { useState } from "react";
import "./tarjetasPedidos.css";

const pedidosEjemplo = [
  {
    id: 8,
    mesa: "Mesa 8",
    cliente: "Ana",
    estado: "Pendiente",
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
    estado: "Pendiente",
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
    estado: "Pendiente",
    hora: "19:45",
    items: [{ nombre: "CHILCANO", precio: 20.0 }],
  },
  {
    id: 12,
    mesa: "Mesa 12",
    cliente: "María",
    estado: "Pendiente",
    hora: "19:15",
    items: [
      { nombre: "JALEA MIXTA", precio: 36.0 },
      { nombre: "VINO TINTO", precio: 15.0 },
    ],
  },
];

const calcularTotal = (items) =>
  items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

export default function PedidosVista() {
  const [pedidos] = useState(pedidosEjemplo);

  return (
    <div className="pedidos-container">
      <h2>Lista de Pedidos</h2>
      <div className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((p, idx) => (
            <div key={`${p.id}-${idx}`} className="pedido-card">
              <div className="pedido-top">
                <div>
                  <div className="pedido-mesa">{p.mesa}</div>
                  <div className="pedido-cliente">{p.cliente}</div>
                </div>
                <div className="pedido-id">#{p.id}</div>
              </div>

              <ul className="pedido-items">
                {Array.isArray(p.items) &&
                  p.items.map((it, i) => (
                    <li key={i}>
                      <span>{it.nombre}</span>
                      <span className="precio">
                        S/ {Number(it.precio || 0).toFixed(2)}
                      </span>
                    </li>
                  ))}
              </ul>

              <div className="pedido-footer">
                <small>{p.hora}</small>
                <strong>S/ {calcularTotal(p.items)}</strong>
              </div>
            </div>
          ))
        ) : (
          <div className="no-pedidos">No hay pedidos</div>
        )}
      </div>
    </div>
  );
}
