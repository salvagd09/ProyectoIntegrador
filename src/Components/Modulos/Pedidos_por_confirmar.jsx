import { useEffect, useState } from "react";
import { Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { API_BASE_URL } from "../Configuracion/api.jsx";

export function PedidosPorConfirmar() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  const cardBg = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    border: '1px solid var(--color-muted)' 
  };
  const cargarPedidos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/delivery/webhook/pendientes`);
      if (response.ok) {
        const data = await response.json();
        setPedidos(data);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const confirmarPedido = async (pedidoId) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/delivery/webhook/${pedidoId}/confirmar`,
        { method: "PUT" }
      );
      if (response.ok) {
        alert("Pedido confirmado");
        cargarPedidos();
      }
    } catch (err) {
      console.error("Error:", err);
    }
  };
  useEffect(() => {
    cargarPedidos();
    // Polling cada 30 segundos para nuevos pedidos
    const interval = setInterval(cargarPedidos, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && pedidos.length === 0) {
    return <Alert variant="info">Cargando pedidos...</Alert>;
  }

  if (pedidos.length === 0) {
    return <Alert variant="success">No hay pedidos pendientes de confirmación</Alert>;
  }

  return (
    <Card className="mb-4" style={{...cardBg, border: '2px solid var(--color-btn-delete)'}}>
      <Card.Header style={{backgroundColor: 'var(--color-btn-delete)', color: 'white'}}>
        <h5>Pedidos de delivery a marcar como pendientes({pedidos.length})</h5>
      </Card.Header>
      <Card.Body>
        {pedidos.map((pedido) => (
          <Col md={6} lg={4} key={pedido.id} className="mb-3">
              <Card style={{...cardBg, border: '1px solid var(--color-btn)'}}>
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div>
                      <Badge 
                        style={{backgroundColor: '#ed673aff', color: 'white'}}
                        className="me-2"
                      >
                        {pedido.plataforma}
                      </Badge>
                      <small style={{color: 'var(--color-muted)'}}>
                        {pedido.codigo_externo || `#${pedido.id}`}
                      </small>
                    </div>
                    <strong style={{color: 'var(--color-accent)'}}>
                      S/ {pedido.monto_total.toFixed(2)}
                    </strong>
                  </div>
                  
                  <p className="mb-1" style={{color: 'var(--color-title)'}}>
                    <strong>{pedido.cliente}</strong>
                  </p>
                  <p className="mb-1 small" style={{color: 'var(--color-muted)'}}>
                    <i className="fa-solid fa-location-dot me-1"></i>
                    {pedido.direccion}
                  </p>
                  <p className="mb-2 small" style={{color: 'var(--color-muted)'}}>
                    <i className="fa-solid fa-phone me-1"></i>
                    {pedido.telefono}
                  </p>
                  
                  <div className="small mb-2" style={{color: 'var(--color-text)'}}>
                    {pedido.detalles.map((d, i) => (
                      <div key={i}>{d.cantidad}x {d.producto}</div>
                    ))}
                  </div>
                  
                  <div className="d-flex gap-2">
                    <Button 
                      size="sm"
                      style={{backgroundColor: 'var(--color-secondary)', border: 'none', color: 'var(--color-title)'}}
                      onClick={() => confirmarPedido(pedido.id)}
                    >
                      <i className="fa-solid fa-check me-1"></i> Marcar como pendiente
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
        ))}
      </Card.Body>
    </Card>
  );
}