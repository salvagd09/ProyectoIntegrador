import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import styles from './PedidosAplicativo.module.css';
import { PedidosPorConfirmar } from './Pedidos_por_confirmar.jsx';
const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};
function Pedidos_Aplicativo() {
  const [pedidos, setPedidos] = useState([]);
  const [estadisticas, setEstadisticas] = useState({});
  const [cargando, setCargando] = useState(true);
    const [pedidosCerrados, setPedidosCerrados] = useState(() => {
      const saved = localStorage.getItem('pedidosArchivados');
      return saved ? JSON.parse(saved) : [];
    });
  // Estilos
  const headerStyle = { 
    color: 'var(--color-title)', 
    fontFamily: 'var(--font-basic)'
  };
  const moduleBg = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)' 
  };
  const cardBg = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    border: `1px solid var(--color-muted)` 
  };
  const itemBg = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)' 
  };
  const btnCancel = { 
    backgroundColor: 'var(--color-btn-delete)', 
    borderColor: 'var(--color-btn-delete)', 
    color: 'white' 
  };
  const cerrarTarjeta = (pedidoId) => {
    const cerrado = [...pedidosCerrados, pedidoId];
    setPedidosCerrados(cerrado);
    // Persistir en local storage
    localStorage.setItem('pedidosArchivados', JSON.stringify(cerrado));
  };
  // Obtener pedidos de delivery
  const obtenerPedidos = async () => {
    try {
      const response = await fetch('http://localhost:8000/delivery/pedidos/');
      if (!response.ok) throw new Error('Error al obtener pedidos');
      const data = await response.json();
      setPedidos(data);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al cargar pedidos');
    }
  };
  // Obtener estadísticas
  const obtenerEstadisticas = async () => {
    try {
      const response = await fetch('http://localhost:8000/delivery/estadisticas/hoy');
      if (!response.ok) throw new Error('Error al obtener estadísticas');
      const data = await response.json();
      setEstadisticas(data);
    } catch (error) {
      console.error('Error:', error);
    }
  };
  // Actualizar estado del pedido
  const actualizarEstado = async (pedidoId, nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    try {
      const response = await fetch(`http://localhost:8000/delivery/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      if (response.ok) {
        obtenerPedidos();
        obtenerEstadisticas();
        alert('Estado actualizado correctamente');
      } else {
        throw new Error('Error en la respuesta');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado');
    }
  };
  // Cargar datos iniciales
  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      await Promise.all([obtenerPedidos(), obtenerEstadisticas()]);
      setCargando(false);
    };
    cargarDatos();
    // Actualizar cada 30 segundos
    const intervalo = setInterval(cargarDatos, 30000);
    return () => clearInterval(intervalo);
  }, []);
  if (cargando) {
    return <div className="text-center py-5" style={moduleBg}>Cargando pedidos...</div>;
  }
  const pedidosFiltrados = pedidos.filter(
    p => !pedidosCerrados.includes(p.pedido.id)
  );
  // Calcular contadores - TODAS LAS VARIABLES SE USAN
  const pedidosPendientes = pedidosFiltrados.filter(p => p.pedido.estado === 'pendiente').length;
  const pedidosPreparacion = pedidosFiltrados.filter(p => p.pedido.estado === 'en_preparacion').length;
  const pedidosListos = pedidosFiltrados.filter(p => p.pedido.estado === 'listo').length;
  const pedidosEntregados = pedidos.filter(p => p.pedido.estado === 'entregado').length;
  const pedidosDelivery = pedidosFiltrados.filter(p => p.pedido.tipo_pedido === 'delivery');
  const pedidosRecojo = pedidosFiltrados.filter(p => p.pedido.tipo_pedido === 'recojo_local');
  const getBadgeStyle = (plataforma) => {
    // Mapeo temático para plataformas
    if (plataforma === 'rappi') return { backgroundColor: '#ed673aff', color: 'white' };
    if (plataforma === 'uber_Eats') return { backgroundColor: '#4CAF50', color: 'white' };
    return { backgroundColor: 'var(--color-accent)', color: 'white' };
  };
  const getStatusStyle = (estado) => {
    if (estado === 'pendiente') return { backgroundColor: 'var(--color-btn-delete)', color: 'var(--color-title)' };
    if (estado === 'en_preparacion') return { backgroundColor: 'var(--color-btn)', color: 'white' };
    if (estado === 'listo') return { backgroundColor: 'var(--color-secondary)', color: 'var(--color-title)' };
    return { backgroundColor: 'var(--color-muted)', color: 'white' };
  };
  const PedidoCard = ({ pedido, detalles, pago }) => {
    // Calculamos el tiempo transcurrido en minutos desde la creación del pedido
    const creationTime = new Date(pedido.fecha_creacion).getTime();
    const currentTime = new Date().getTime();
    const minutesElapsed = Math.floor((currentTime - creationTime) / 60000); 
    let priorityStyle = {};
    if (pedido.estado === 'pendiente' && minutesElapsed >= 5) {
        priorityStyle = { border: `3px solid var(--color-btn-delete)`, animation: `${styles.pulseEffect} 2s infinite` };
    } else if (pedido.estado === 'pendiente' && minutesElapsed >= 2) {
        // Pedido pendiente por más de 2 minutos: ALERTA MEDIA
        priorityStyle = { border: `3px solid var(--color-btn)` };
    }
      return (
        <Card className={styles.pedidoCard} style={{...cardBg, ...priorityStyle}}>
            <Card.Body className="p-3">
                <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="flex-1">
                        <div className="d-flex align-items-center gap-2 mb-2 flex-wrap">
                            {(pedido.estado==="entregado" || pedido.estado==="cancelado")&&(<Button size="sm" style={btnCancel} onClick= {() => cerrarTarjeta(pedido.id)}>
                                    <i className="fa-solid fa-times me-1"></i> Cerrar
                              </Button>)}
                            {/* Plataforma Badge */}
                            <span className={styles.badgeBase} style={getBadgeStyle(pedido.plataforma)}>
                                {formatText(pedido.plataforma)}
                            </span>
                            {/* Estado Badge */}
                            <span className={styles.badgeBase} style={getStatusStyle(pedido.estado)}>
                                {formatText(pedido.estado)}
                            </span>
                            {/* Código Externo */}
                            {pedido.codigo_pedido_externo && (
                                <span className={styles.badgeCode}>
                                    #{pedido.codigo_pedido_externo}
                                </span>
                            )}
                        </div>  
                        <h3 className="font-bold text-lg" style={{color: 'var(--color-title)'}}>{pedido.nombre_cliente}</h3>
                        <p 
                            className="text-sm" 
                            style={{color: 'var(--color-muted)'}}
                        > 
                            <i className="fa-solid fa-location-dot me-1"></i>
                        {pedido.direccion_cliente}</p>
                        <p 
                            className="text-sm" 
                            style={{color: 'var(--color-muted)'}}
                        > 
                            <i className="fa-solid fa-phone me-1"></i>
                        {pedido.telefono_cliente}</p>
                    </div>
                    {/* Monto y Hora */}
                    <div className="text-right">
                        <p className="text-xl font-bold" style={{color: 'var(--color-accent)'}}>S/ {pedido.monto_total}</p>
                        <p className="text-sm" style={{color: 'var(--color-muted)'}}>
                            {new Date(pedido.fecha_creacion).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs" style={{color: 'var(--color-muted)'}}>
                            {pago?.metodo_pago} • {pago?.estado}
                        </p>
                    </div>
                </div>           
                {/* Items del pedido */}
                <div className={styles.itemsList} style={itemBg}>
                    {detalles.map(detalle => (
                        <div key={detalle.id} className="d-flex justify-content-between align-items-center text-sm">
                            <div>
                                <span className="font-medium">
                                    {detalle.cantidad}x {detalle.producto_nombre}
                                </span>
                                {detalle.notas && (
                                    <span className="text-xs d-block mt-1" style={{color: 'var(--color-muted)'}}> {detalle.notas}</span>
                                )}
                            </div>
                            <span className="font-medium" style={{color: 'var(--color-text)'}}>
                                S/ {(detalle.precio_unitario * detalle.cantidad).toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>
                {/* Botones de acción */}
                <div className="mt-3 d-flex gap-2 flex-wrap">
                    {pedido.estado === 'pendiente' && (
                        <>
                            <Button style={btnCancel} size="sm" onClick={() => actualizarEstado(pedido.id, 'cancelado')}>
                                <i className="fa-solid fa-xmark me-1"></i> Cancelar
                            </Button>
                        </>
                    )}  
                    {(pedido.estado === 'entregado' || pedido.estado === 'cancelado') && (
                        <span 
                            className={styles.completedStatus} 
                            style={{backgroundColor: getStatusStyle(pedido.estado).backgroundColor}}
                        >
                            <i className={`fa-solid me-1 ${pedido.estado === 'entregado' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {pedido.estado === 'entregado' ? 'Completado' : 'Cancelado'}
                        </span>
                    )}
                </div>
            </Card.Body>
        </Card>
      );
    };
  return (
    <Container fluid style={moduleBg} className="py-2">
        {/* Header del Módulo */}
        <div className="mb-4">
            <h1 className="text-3xl font-bold" style={headerStyle}> <i className="fa-solid fa-mobile-screen-button me-2"></i>Pedidos por Aplicativo</h1>
            <p style={{color: 'var(--color-muted)'}}>Monitoreo y gestión de pedidos de delivery y recojo</p>
        </div>
        {/* Fila de Estadísticas Generales */}
        <Row xs={1} md={2} lg={4} className="g-4 mb-4">
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-accent)`}} 
                    className={styles.statCard}>
                        <Card.Body>
                            <h3 style={{color: 'var(--color-muted)'}}>Total Hoy</h3>
                            <p style={{color: 'var(--color-title)'}} className="fs-3 fw-bold">{estadisticas.total_pedidos || 0}</p>
                        </Card.Body>
                </Card>
            </Col>
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-btn-delete)`}} 
                    className={styles.statCard}>
                      <Card.Body>
                        <h3 style={{color: 'var(--color-muted)'}}>Pendientes</h3>
                        <p style={{color: 'var(--color-btn-delete)'}} className="fs-3 fw-bold">{pedidosPendientes}</p>
                      </Card.Body>
                </Card>
            </Col>
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-btn)`}} 
                    className={styles.statCard}>
                      <Card.Body>
                        <h3 style={{color: 'var(--color-muted)'}}>En Cocina</h3>
                        <p style={{color: 'var(--color-btn)'}} className="fs-3 fw-bold">{pedidosPreparacion}</p>
                      </Card.Body>
                </Card>
            </Col>
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-secondary)`}} 
                    className={styles.statCard}>
                      <Card.Body>
                        <h3 style={{color: 'var(--color-muted)'}}>Listos</h3>
                        <p style={{color: 'var(--color-secondary)'}} className="fs-3 fw-bold">{pedidosListos}</p>
                      </Card.Body>
                </Card>
            </Col>
        </Row>
        {/* Monto e Ingresos (Estadísticas Adicionales) */}
        <Row xs={1} md={2} className="g-4 mb-4">
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-accent)`}} 
                    className={styles.statCard}>
                      <Card.Body>
                        <h3 style={{color: 'var(--color-muted)'}}>Ingresos Hoy</h3>
                        <p style={{color: 'var(--color-title)'}} className="fs-3 fw-bold">S/ {estadisticas.monto_total || '0.00'}</p>
                      </Card.Body>
                </Card>
            </Col>
            <Col>
                <Card 
                    style={{...cardBg, border: `1px solid var(--color-muted)`}} 
                    className={styles.statCard}>
                      <Card.Body>
                        <h3 style={{color: 'var(--color-muted)'}}>Entregados</h3>
                        <p style={{color: 'var(--color-title)'}} className="fs-3 fw-bold">{pedidosEntregados}</p>
                      </Card.Body>
                </Card>
            </Col>
        </Row>
        {/* Lista de Pedidos Dividida por Tipo */}
        <PedidosPorConfirmar/>
        <Row className="g-4">
            {/* Columna de Delivery */}
            <Col md={6}>
                <div className={styles.orderListContainer}>
                    <h2 
                        className="h4 fw-bold mb-3" 
                        style={{color: 'var(--color-title)'}}
                    > 
                        <i className="fa-solid fa-motorcycle me-2"></i> Pedidos de Delivery ({pedidosDelivery.length})
                    </h2>
                    {pedidosDelivery.length === 0 ? (
                        <p style={{color: 'var(--color-muted)'}}>No hay pedidos de delivery activos</p>
                    ) : (
                        <div className={styles.orderGrid}>
                            {pedidosDelivery.map(({ pedido, detalles, pago }) => (
                                <PedidoCard key={pedido.id} pedido={pedido} detalles={detalles} pago={pago} />
                            ))}
                        </div>
                    )}
                </div>
            </Col>
            {/* Columna de Recojo */}
            <Col md={6}>
                <div className={styles.orderListContainer}>
                    <h2 
                        className="h4 fw-bold mb-3" 
                        style={{color: 'var(--color-title)'}}
                    >
                        <i className="fa-solid fa-bag-shopping me-2"></i> Pedidos de Recojo ({pedidosRecojo.length})
                    </h2>
                    {pedidosRecojo.length === 0 ? (
                        <p style={{color: 'var(--color-muted)'}}>No hay pedidos de recojo activos</p>
                    ) : (
                        <div className={styles.orderGrid}>
                            {pedidosRecojo.map(({ pedido, detalles, pago }) => (
                                <PedidoCard key={pedido.id} pedido={pedido} detalles={detalles} pago={pago} />
                            ))}
                        </div>
                    )}
                </div>
            </Col>
        </Row>     
        {/* Plataformas activas */}
        {estadisticas.pedidos_por_plataforma && Object.keys(estadisticas.pedidos_por_plataforma).length > 0 && (
          <div className="mt-6 bg-white p-4 rounded-lg shadow border">
            <h3 className="text-lg font-semibold mb-3"> Distribución por Plataforma Hoy</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(estadisticas.pedidos_por_plataforma).map(([plataforma, data]) => (
                <div key={plataforma} className="text-center p-4 border-2 border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                  <p className="font-bold text-gray-700">{plataforma}</p>
                  <p className="text-2xl font-bold text-blue-600 my-2">{data.cantidad}</p>
                  <p className="text-sm text-gray-600">{data.cantidad === 1 ? 'pedido' : 'pedidos'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        </Container>
  );
}
export default Pedidos_Aplicativo;