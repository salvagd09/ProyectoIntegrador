// src/Components/Modulos/Pedidos_Fisicos.jsx
import React from "react";
import "./tarjetasPedidos.css";

const pedidosEjemplo = [
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
];

const estados = ["Pendiente", "En preparación", "Listo", "Servido", "Pagado"];

const calcularTotal = (items) =>
  items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

export default function Pedidos_Fisicos() {
  return (
    <div className="pedidos-container">
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos</h2>
      </div>

      <div className="pedidos-columns">
        {estados.map((estado) => {
          const lista = pedidosEjemplo.filter((p) => p.estado === estado);
          return (
            <div key={estado} className="estado-column">
              <div className="estado-header">
                <h5>{estado}</h5>
                <div className="badge-count">{lista.length}</div>
              </div>

              <div className="estado-list">
                {lista.length > 0 ? (
                  lista.map((p) => (
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
                            <span className="precio">
                              S/ {it.precio.toFixed(2)}
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
        })}
      </div>
    </div>
  );
}
