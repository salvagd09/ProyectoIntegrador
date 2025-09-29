import React, { useState, useEffect } from "react";
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
      { nombre: "LECHE DE TIGRE", precio: 9.0 }
    ]
  },
  {
    id: 5,
    mesa: "Mesa 5",
    cliente: "Juan",
    estado: "Pendiente",
    hora: "19:30",
    items: [
      { nombre: "PARIHUELA", precio: 24.5 },
      { nombre: "LANGOSTINOS", precio: 12.5 }
    ]
  },
  {
    id: 3,
    mesa: "Mesa 3",
    cliente: "Carlos",
    estado: "Pendiente",
    hora: "19:45",
    items: [{ nombre: "CHILCANO", precio: 20.0 }]
  },
  {
    id: 12,
    mesa: "Mesa 12",
    cliente: "María",
    estado: "Pendiente",
    hora: "19:15",
    items: [
      { nombre: "JALEA MIXTA", precio: 36.0 },
      { nombre: "VINO TINTO", precio: 15.0 }
    ]
  }
];

const calcularTotal = (items) =>
  items.reduce((s, it) => s + (it.precio || 0), 0).toFixed(2);

export default function Pedidos_Fisicos() {
  const [pedidos, setPedidos] = useState(pedidosEjemplo);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoPedido, setNuevoPedido] = useState({
    id: "",
    mesa: "",
    cliente: "",
    menu: "",
    precio: ""
  });

  // bloquear scroll del body cuando modal abierto
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (mostrarModal) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mostrarModal]);

  // cerrar con ESC
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMostrarModal(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const actualizarEstado = (id) => {
    setPedidos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, estado: "En preparación" } : p))
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido((prev) => ({ ...prev, [name]: value }));
  };

  const handleCrearPedido = (e) => {
    e.preventDefault();

    // validaciones básicas
    if (!nuevoPedido.id || !nuevoPedido.mesa || !nuevoPedido.menu || nuevoPedido.precio === "") {
      alert("Completa todos los campos (Mesa, ID, Menú, Precio).");
      return;
    }
    const idNum = Number(nuevoPedido.id);
    if (Number.isNaN(idNum)) {
      alert("ID debe ser un número.");
      return;
    }
    const precioNum = Number(String(nuevoPedido.precio).replace(",", "."));
    if (Number.isNaN(precioNum) || precioNum < 0) {
      alert("Precio inválido.");
      return;
    }

    const hora = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const pedido = {
      id: idNum,
      mesa: nuevoPedido.mesa.startsWith("Mesa") ? nuevoPedido.mesa : `Mesa ${nuevoPedido.mesa}`,
      cliente: nuevoPedido.cliente || "Cliente",
      estado: "Pendiente",
      hora,
      items: [{ nombre: nuevoPedido.menu, precio: precioNum }],
      __createdAt: Date.now()
    };

    // insertar al inicio (aparece arriba)
    setPedidos((prev) => [pedido, ...prev]);
    setMostrarModal(false);
    setNuevoPedido({ id: "", mesa: "", cliente: "", menu: "", precio: "" });
  };

  // evitar que clic dentro del modal cierre (overlay tiene onClick)
  const stop = (e) => e.stopPropagation();

  return (
    <div className="pedidos-container">
      <div className="pedidos-topbar">
        <h2>Gestión de Pedidos</h2>
        <button
          className="btn-crear"
          onClick={() => setMostrarModal(true)}
        >
          Crear Pedido
        </button>
      </div>

      <div className="pedidos-list">
        {pedidos.length > 0 ? (
          pedidos.map((p, idx) => (
            <div key={`${p.id}-${p.__createdAt || idx}`} className="pedido-card">
              <div className="pedido-top">
                <div>
                  <div className="pedido-mesa">{p.mesa}</div>
                  <div className="pedido-cliente">{p.cliente}</div>
                </div>
                <div className="pedido-id">#{p.id}</div>
              </div>

              <ul className="pedido-items">
                {Array.isArray(p.items) && p.items.map((it, i) => (
                  <li key={i}>
                    <span>{it.nombre}</span>
                    <span className="precio">S/ {Number(it.precio || 0).toFixed(2)}</span>
                  </li>
                ))}
              </ul>

              <div className="pedido-footer">
                <small>{p.hora}</small>
                <strong>S/ {calcularTotal(p.items)}</strong>
              </div>

              <div className="pedido-acciones">
                {p.estado !== "En preparación" ? (
                  <button
                    className="btn-preparacion"
                    onClick={() => actualizarEstado(p.id)}
                  >
                    EN PREPARACIÓN
                  </button>
                ) : (
                  <span className="estado-ok">✅ En preparación</span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="no-pedidos">No hay pedidos</div>
        )}
      </div>

      {mostrarModal && (
        <div
          className="pedidos-modal-overlay"
          onClick={() => setMostrarModal(false)}
          aria-hidden="true"
        >
          <div className="pedidos-modal" onClick={stop} role="dialog" aria-modal="true">
            <h3>Crear Pedido</h3>

            <form onSubmit={handleCrearPedido}>
              <input
                name="mesa"
                placeholder="Número de mesa (ej: 5 o Mesa 5)"
                value={nuevoPedido.mesa}
                onChange={handleChange}
                required
              />

              <input
                name="id"
                type="number"
                placeholder="ID (número)"
                value={nuevoPedido.id}
                onChange={handleChange}
                required
              />

              <input
                name="cliente"
                placeholder="Cliente (opcional)"
                value={nuevoPedido.cliente}
                onChange={handleChange}
              />

              <input
                name="menu"
                placeholder="Menú (ej: Ceviche Mixto)"
                value={nuevoPedido.menu}
                onChange={handleChange}
                required
              />

              <input
                name="precio"
                type="number"
                step="0.01"
                placeholder="Precio (ej: 25.50)"
                value={nuevoPedido.precio}
                onChange={handleChange}
                required
              />

              <div className="pedidos-modal-actions">
                <button type="submit">Guardar</button>
                <button type="button" onClick={() => setMostrarModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
