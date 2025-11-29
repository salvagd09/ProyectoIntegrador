import { useState,useEffect} from "react";
import "./tarjetasPedidos.css";
export default function Pedidos_Cocinero() {
  const [pedidos, setPedidos] = useState([]);
  const [pedidosCerrados, setPedidosCerrados] = useState([]);// ← IDs de pedidos cerrados
  const [empleadoId,setEmpleadoId]=useState(null)
    // Función para cerrar una tarjeta
    const cerrarTarjeta = (pedidoId) => {
      setPedidosCerrados([...pedidosCerrados, pedidoId]);
    };
    useEffect(() => {
    // Cargar el ID del empleado desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      setEmpleadoId(user.id);
    }
    // Cargar pedidos
    fetch(`${API_BASE_URL}/pedidosF/pedidosM`)
      .then((res) => res.json())
      .then((data) => setPedidos(data))
      .catch((err) => console.error(err));
    }, []);
    const obtenerTextoBoton = (estadoP) => {
    const textos = {
      "pendiente": "Marcar como en preparación",
      "en_preparacion": "Marcar como listo",
      "listo": "Marcar como Servido"
    };
    return textos[estadoP] || "Cambiar estado";
  };
  {/*Para pasar de un estado a otro */}
  const cambiarEstadoNombre = async (id, estadoActual) => {
    if (estadoActual === "servido") {
      alert("Este pedido ya está servido");
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/pedidosF/${id}/estado`, 
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body:JSON.stringify({empleado:empleadoId})
        }
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Error al cambiar el estado");
      }
      // Actualizar la vista de las tarjetas
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.id === id 
            ? { ...pedido, estado: data.estado_nuevo } 
            : pedido
        )
      );
  
      alert(`✅ ${data.mensaje}\nNuevo estado: ${data.estado_nuevo}`);
  
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      alert(`❌ Error: ${error.message}`);
    }
  }
   const pedidosVisibles = pedidos.filter(p => !pedidosCerrados.includes(p.id));
  return (
    <div className="pedidos-container">
        <div className="pedidos-topbar">
          <h2>Gestión de Pedidos 🐟</h2>
        </div>
  
    <div className="pedidos-grid-columnas">
    {/* Columna: Pendiente */}
    <div className="columna">
      <h3 className="columna-titulo">⏳ Pendiente</h3>
      {pedidosVisibles.filter(p => p.estado === "pendiente").map((p) => (
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
                <button
                  className={"btn-estado m-2"}
                  onClick={() => cambiarEstadoNombre(p.id, p.estado)}
                >
                  {obtenerTextoBoton(p.estado)} 
                </button>
            </div>
      ))}
    </div>
    {/* Columna: En preparación */}
    <div className="columna">
      <h3 className="columna-titulo">👨‍🍳 En Preparación</h3>
      {pedidosVisibles.filter(p => p.estado === "en_preparacion").map((p) => (
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
                <button
                  className={"btn-estado m-2"}
                  onClick={() => cambiarEstadoNombre(p.id, p.estado)}
                >
                  {obtenerTextoBoton(p.estado)} 
                </button>
            </div>
      ))}
    </div>
    {/* Columna: Listo */}
    <div className="columna">
      <h3 className="columna-titulo">✅ Listo</h3>
      {pedidosVisibles.filter(p => p.estado === "listo").map((p) => (
        <div key={p.id} className={"pedido-card"}>
              <div className="pedido-top">
                 <button
                  className="btn-cerrar-modal"
                  onClick={() => cerrarTarjeta(p.id)}
                >
                  ✖
                </button>
                <div>
                  <div className="pedido-mesa">{p.mesa}</div>
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
            </div>
      ))}
    </div>
  </div> 
  </div>
  )}
