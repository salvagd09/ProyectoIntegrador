import { useState,useEffect} from "react";

import styles from './PedidosFisicos.module.css';

import { API_BASE_URL } from "../Configuracion/api.jsx";
import { Container, Button, Card, ListGroup, Form, Row, Col, Modal, Table } from "react-bootstrap"; 

const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .toUpperCase(' ');
};

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

  // Estilos 
  const headerStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    borderColor: 'var(--color-muted)' 
  };
    
  const cardStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-muted)' 
  };
  
  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-accent)' 
  };
  
  const btnAdd = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
  };

  const btnEdit = { 
    backgroundColor: 'var(--color-secondary)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  
  const btnDelete = { 
    backgroundColor: 'var(--color-btn-delete)', 
    borderColor: 'var(--color-btn-delete)', 
    color: 'white' 
  };
  
  const btnSecondary = { 
    backgroundColor: 'var(--color-muted)', 
    borderColor: 'var(--color-muted)', 
    color: 'white' 
  };
  
  const btnWarning = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white' 
  };

  const STATUS_COLORS = {
    pendiente: { color: 'var(--color-btn-delete)', icon: 'fa-hourglass-half' },
    en_preparacion: { color: 'var(--color-btn)', icon: 'fa-bowl-food' },
    listo: { color: 'var(--color-secondary)', icon: 'fa-check-circle' },
    servido: { color: 'var(--color-accent)', icon: 'fa-utensils' },
    entregado: { color: 'var(--color-accent)', icon: 'fa-truck' },
  };

  const pedidosVisibles = pedidos.filter(p => !pedidosCerrados.includes(p.id));

  const PedidoCardComponent = ({ p }) => {    
    const statusColors = STATUS_COLORS[p.estado] || STATUS_COLORS.pendiente;
    const mesaNumber = p.mesa;
    const isCompleted = p.estado === "servido" || p.estado === "entregado";

    return (  
        <Card key={p.id} className={styles.pedidoCard} style={cardStyle}>
            <Card.Header className={styles.cardHeader} style={{ backgroundColor: statusColors.color, color: 'white' }}>
                <h5 className="m-0 fw-bold">
                    <i className={`fa-solid ${statusColors.icon} me-2`}></i>
                    {mesaNumber} - #{p.id}
                </h5>
                {/* Botón de Archivar/Cerrar (solo si está en estado final) */}
                {isCompleted && (
                    <Button 
                      className={styles.btnClose} 
                      size="sm" 
                      onClick={() => cerrarTarjeta(p.id)} 
                      style={{ color: 'white', backgroundColor: 'transparent' }}
                    >
                        ✖
                    </Button>
                )}
            </Card.Header>
            <Card.Body className="p-3">
                <ListGroup variant="flush" className="mb-3">
                    {p.items.map((it, idx) => (
                        <ListGroup.Item key={idx} className={styles.itemRow} style={{ backgroundColor: cardStyle.backgroundColor, color: cardStyle.color }}>
                            <Col xs={7}>
                                <strong 
                                  style={{ display: 'block', wordWrap: 'break-word', color: 'var(--color-text)' }}
                                >
                                    {it.nombre} x{it.cantidad}
                                </strong>
                            </Col>
                            <Col xs={3} className="text-end">
                                <strong style={{ color: 'var(--color-accent)', fontSize: '0.9rem' }}>S/ {(it.precio_unitario * it.cantidad).toFixed(2)}</strong>
                            </Col>
                        </ListGroup.Item>
                    ))}
                </ListGroup>

                <div className={styles.pedidoFooter} style={{ borderTop: `1px solid var(--color-muted)` }}>
                    <small style={{ color: 'var(--color-muted)' }}>
                        Estado: <strong style={{ color: statusColors.color }}>{formatText(p.estado)}</strong> — {p.hora}
                    </small>
                    <strong style={{ color: 'var(--color-title)' }}>S/ {p.monto_total}</strong>
                </div>

                {/* Botones de acción para Cocina */}
                {(p.estado === "pendiente" || p.estado === "en_preparacion") && (
                    <Button 
                        className="w-100 mt-3"
                        style={p.estado === "pendiente" ? btnAdd : btnWarning}
                        onClick={() => cambiarEstadoNombre(p.id, p.estado)}
                    >
                        {obtenerTextoBoton(p.estado)}
                    </Button>
                )}
            </Card.Body>
        </Card>
    );
  };
  return (
    <Container fluid className="py-2" style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        <div className={`d-flex justify-content-between align-items-center mb-4`}>
          <h2 className="fs-1 fw-bold mb-1" style={{ color: 'var(--color-title)', fontFamily: 'var(--font-basic)' }}>
              <i className="fa-solid fa-fish-fins me-2"></i> Dashboard de Cocina
          </h2>
        </div>
  
        <div className={styles.pedidosGridColumnas}>
          {/* Pendiente */}
          <div className={styles.columna}>
              <h3 className={styles.columnaTitulo} style={{ color: STATUS_COLORS.pendiente.color }}> 
                  <i class="fa-solid fa-hourglass"></i> Pendiente
              </h3>
                  {pedidosVisibles.filter((p) => p.estado === "pendiente").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
          </div>

          {/* En preparación */}
          <div className={styles.columna}>
              <h3 className={styles.columnaTitulo} style={{ color: STATUS_COLORS.en_preparacion.color }}>
                  <i class="fa-solid fa-person-military-pointing"></i> En Preparación
              </h3>
                  {pedidosVisibles.filter((p) => p.estado === "en_preparacion").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
          </div>
                
          {/* Listo*/}
          <div className={styles.columna}>
              <h3 className={styles.columnaTitulo} style={{ color: STATUS_COLORS.listo.color }}>
                  <i class="fa-solid fa-square-check"></i> Listo
              </h3>
                {pedidosVisibles.filter((p) => p.estado === "listo").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
          </div>
        </div> 
  </Container>
)}