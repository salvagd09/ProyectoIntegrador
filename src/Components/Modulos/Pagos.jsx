import { useState, useRef, useEffect } from 'react';

import {API_BASE_URL} from '../Configuracion/api.jsx';
import styles from './Pagos.module.css';
import { Card, Container, Table } from 'react-bootstrap';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [allPayments, setAllPayments] = useState([]);
  const [pedidosServidos, setPedidosServidos] = useState([]);
  const [pedidosDelivery, setPedidosDelivery] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPedidosFisicos, setShowPedidosFisicos] = useState(false);
  const [showPedidosDelivery, setShowPedidosDelivery] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedPedido, setSelectedPedido] = useState(null);

  // Estados para filtros
  const [dateFilter, setDateFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [filteredPayments, setFilteredPayments] = useState([]);

  const [cashData, setCashData] = useState({
    received: 0,
    change: 0
  });

  const [linkPago, setLinkPago] = useState({
    loading: false,
    paymentUrl: null,
    qrUrl: null,
    linkId: null
  });

  const receiptRef = useRef(null);

  useEffect(() => {
    obtenerHistorialPagos();
    obtenerPedidosServidos();
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [dateFilter, customStartDate, customEndDate, payments]);

  const moduleBg = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)' 
  }; 
  const headerStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    border: `1px solid var(--color-header)` 
  };
  const cardStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)', 
    border: `2px solid var(--color-accent)` 
  };
  const inputStyle = { 
    backgroundColor: 'var(--color-bg)', 
    color: 'var(--color-text)', 
    borderColor: 'var(--color-title)' 
  };
  const btnPrimary = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  const btnSecondary = { 
    backgroundColor: 'var(--color-secondary)', 
    borderColor: 'var(--color-secondary)', 
    color: 'white',
    fontWeight: 'bold'
  };
  const btnWarning = { 
    backgroundColor: 'var(--color-btn-delete)', 
    borderColor: 'var(--color-btn-delete)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  const btnAccent = { 
    backgroundColor: 'var(--color-accent)', 
    borderColor: 'var(--color-accent)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  const btnSuccess = { 
    backgroundColor: 'var(--color-btn)', 
    borderColor: 'var(--color-btn)', 
    color: 'white', 
    fontWeight: 'bold' 
  };
  const priceColor = { 
    color: 'var(--color-secondary)', 
    fontWeight: 'bold' 
  };
  const tableHeaderStyle = { 
    backgroundColor: 'var(--color-header)', 
    color: 'var(--color-title)', 
    borderBottom: `2px solid var(--color-accent)`
  };  
  const tableRowStyle = { 
    backgroundColor: 'var(--color-card)', 
    color: 'var(--color-text)' 
  };
  // Función para obtener pagos de hoy
  const getTodayPayments = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return payments.filter(payment => {
      const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
      paymentDate.setHours(0, 0, 0, 0);
      return paymentDate.getTime() === today.getTime();
    });
  };

  // Función para obtener pagos completados
  const getCompletedPayments = () => {
    return payments.filter(p => p.estado === 'pagado' || p.estado === 'completado' || !p.estado);
  };

  const obtenerHistorialPagos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/pagos/historial`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayments(data.pagos);
          setAllPayments(data.pagos);
        }
      }
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
    }
  };

  const obtenerPedidosServidos = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/pedidosF/pedidos-servidos-pago/`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const fisicos = data.pedidos.filter(pedido => pedido.tipo === 'fisico');
          const delivery = data.pedidos.filter(pedido => pedido.tipo === 'delivery');
          
          setPedidosServidos(fisicos);
          setPedidosDelivery(delivery);
        }
      }
    } catch (error) {
      console.error('Error al obtener pedidos servidos:', error);
    }
  };

  // Función para aplicar filtros de fecha
  const applyDateFilter = () => {
    let filtered = [...payments];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'today':
        filtered = getTodayPayments();
        break;
      
      case 'yesterday':
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        filtered = payments.filter(payment => {
          const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
          paymentDate.setHours(0, 0, 0, 0);
          return paymentDate.getTime() === yesterday.getTime();
        });
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        filtered = payments.filter(payment => {
          const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
          return paymentDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        filtered = payments.filter(payment => {
          const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
          return paymentDate >= monthAgo;
        });
        break;
      
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          
          filtered = payments.filter(payment => {
            const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
            return paymentDate >= start && paymentDate <= end;
          });
        }
        break;
      
      case 'all':
      default:
        filtered = [...payments];
        break;
    }
    
    setFilteredPayments(filtered);
  };

  // Calcular estadísticas en tiempo real
  const todayPayments = getTodayPayments();
  const completedPayments = getCompletedPayments();
  const totalRevenue = payments.reduce((sum, payment) => sum + (payment.monto || 0), 0);
  const filteredRevenue = filteredPayments.reduce((sum, payment) => sum + (payment.monto || 0), 0);
  const filteredCount = filteredPayments.length;

  const cargarPedidoServido = (pedido) => {
    setSelectedPedido(pedido);
    setShowModal(true);
    setShowPedidosFisicos(false);
    setShowPedidosDelivery(false);
  };

  // Resto de las funciones se mantienen igual...
  const calculateChange = (received) => {
    const amount = selectedPedido ? selectedPedido.monto_pendiente : 0;
    const change = received - amount;
    setCashData({ received, change: Math.max(0, change) });
  };

  const generarLinkPago = async () => {
    setLinkPago({ loading: true, paymentUrl: null, qrUrl: null, linkId: null });
    
    try {
      const monto = selectedPedido.monto_pendiente;

      const response = await fetch(`${API_BASE_URL}/api/pagos/generar-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: selectedPedido.id,
          monto: monto,
          email_cliente: "cliente@restaurante.com"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLinkPago({
          loading: false,
          paymentUrl: data.payment_url,
          qrUrl: data.qr_url,
          linkId: data.link_id
        });
      } else {
        alert('Error: ' + data.mensaje);
        setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
      }
    } catch (error) {
      console.error('Error generando link:', error);
      alert('Error al generar link de pago');
      setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
    }
  };

  const processPaymentFisico = async () => {
    if (paymentMethod === 'cash' && cashData.received < selectedPedido.monto_pendiente) {
      alert('El monto recibido es insuficiente');
      return;
    }

    const timestamp = Date.now().toString();
    const referenciaPago = paymentMethod === 'digital' 
      ? (linkPago.linkId || 'LINK-' + timestamp)
      : ('EFECTIVO-' + timestamp);

    await createPaymentInDatabase(referenciaPago);
  };

  const procesarPagoDelivery = async () => {
    try {
      const pagoData = {
        pedido_id: selectedPedido.id,
        monto: selectedPedido.monto_pendiente,
        metodo_pago: 'efectivo',
        referencia_pago: `DELIVERY-${selectedPedido.id}-${Date.now()}`
      };

      const response = await fetch(`${API_BASE_URL}/api/pagos/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al registrar pago');
      }

      await obtenerHistorialPagos();
      await obtenerPedidosServidos();
      
      alert('✅ Pago registrado exitosamente');
      resetForm();
      
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      alert('Error: ' + error.message);
    }
  };

  const createPaymentInDatabase = async (cargoId) => {
    try {
      const pagoData = {
        pedido_id: selectedPedido.id,
        monto: selectedPedido.monto_pendiente,
        metodo_pago: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        referencia_pago: cargoId
      };

      const response = await fetch(`${API_BASE_URL}/api/pagos/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al registrar pago');
      }

      await obtenerHistorialPagos();
      await obtenerPedidosServidos();
      
      alert('✅ Pago registrado exitosamente');
      resetForm();
      
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      alert(error.message);
    }
  };

  const resetForm = () => {
    setCashData({ received: 0, change: 0 });
    setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
    setPaymentMethod('cash');
    setSelectedPedido(null);
    setShowModal(false);
  };

  return (
    <Container fluid style={moduleBg} className="py-2">
      <div className={styles.menuHeader} style={headerStyle}>
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h1 className="h2 fw-bold mt-1 mb-1" style={{color: 'var(--color-title)'}}>Sistema de Pagos</h1>
          <div className="d-flex gap-2">
            <button 
              type="button"
              style={btnSecondary}
              className='p-2 mt-1 fw-bold'
              onClick={() => setShowPedidosFisicos(true)}
            >
              <i class="fa-solid fa-utensils"></i> Pedidos Servidos ({pedidosServidos.length})
            </button>
            <button 
              type="button"
              style={btnWarning}
              className="p-2 mt-1 fw-bold"
              onClick={() => setShowPedidosDelivery(true)}
            >
              <i class="fa-solid fa-motorcycle"></i> Delivery Entregados ({pedidosDelivery.length})
            </button>
          </div>
        </div>
      </div>

      {/* Filtros por fecha */}
      <Card className="mb-4 border-0 shadow-sm" style={cardStyle}>
        <div className="card-header" style={headerStyle}>
          <h5 className="py-1 mb-0 fw-bold"><i class="fa-solid fa-calendar-days"></i> Filtros por Fecha</h5>
        </div>
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6">
              <label className="form-label fw-bold" style={{color: 'var(--color-title)'}}>Seleccionar período:</label>
              <div className="d-flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'TODOS', style: btnPrimary },
                  { key: 'today', label: 'HOY', style: btnAccent },
                  { key: 'yesterday', label: 'AYER', style: btnSecondary },
                  { key: 'week', label: 'ÚLTIMA SEMANA', style: btnWarning },
                  { key: 'month', label: 'ÚLTIMO MES', style: btnSuccess},
                  { key: 'custom', label: 'PERSONALIZADO', style: btnPrimary }
                ].map((filter) => (
                  <button
                    key={filter.key}
                    className={`btn btn-sm fw-bold ${dateFilter === filter.key ? '' : 'btn-outline'}`}
                    style={dateFilter === filter.key ? filter.style : {
                      ...filter.style,
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-muted)'
                    }}
                    onClick={() => setDateFilter(filter.key)}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Filtro personalizado */}
            {dateFilter === 'custom' && (
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{color: 'var(--color-title)'}}>Fecha inicio:</label>
                    <input
                      type="date"
                      className="form-control"
                      style={inputStyle}
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold" style={{color: 'var(--color-title)'}}>Fecha fin:</label>
                    <input
                      type="date"
                      className="form-control"
                      style={inputStyle}
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Resumen del filtro aplicado */}
          <div className="mt-3 p-3 rounded" style={{ backgroundColor: 'var(--color-header)', border: `1px solid var(--color-muted)`}}>
            <div className="row text-center">
              <div className="col-md-6">
                <h6 className="fw-bold" style={{color: 'var(--color-text)'}}>PAGOS FILTRADOS</h6>
                <h4 className="fw-bold" style={priceColor}>{filteredCount}</h4>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold" style={{color: 'var(--color-text)'}}>INGRESOS FILTRADOS</h6>
                <h4 className="fw-bold" style={priceColor}>S/ {filteredRevenue.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Estadísticas en tiempo real */}
      <div className="row mb-4">
        {[
          {
            title: 'PAGOS HOY',
            value: todayPayments.length,
            subtitle: 'Total del día',
            style: btnAccent,
            icon: <i class="fa-solid fa-chart-column"></i>
          },
          {
            title: 'INGRESOS',
            value: `S/ ${totalRevenue.toFixed(2)}`,
            subtitle: 'Total acumulado',
            style: btnPrimary,
            icon: <i class="fa-solid fa-sack-dollar"></i>
          },
          {
            title: 'COMPLETADOS',
            value: completedPayments.length,
            subtitle: 'Pagos exitosos',
            style: btnPrimary,
            icon: <i class="fa-solid fa-circle-check"></i>
          },
          {
            title: 'PENDIENTES',
            value: pedidosServidos.length + pedidosDelivery.length,
            subtitle: 'Pedidos por cobrar',
            style: btnAccent,
            icon: <i class="fa-solid fa-hourglass-half"></i>
          }
        ].map((stat, index) => (
          <div key={index} className="col-md-3 col-6 mb-3">
            <div className="card h-100 border-0 statCard" style={{
              backgroundColor: stat.style.backgroundColor,
              borderColor: stat.style.borderColor,
              color: stat.style.color,
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
              <div className="card-body text-center">
                <div className="mb-2" style={{fontSize: '1.5rem'}}>{stat.icon}</div>
                <h6 className="fw-bold mb-1">{stat.title}</h6>
                <h4 className="fw-bold mb-1">{stat.value}</h4>
                <small style={{opacity: 0.9}}>{stat.subtitle}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Los modales se mantienen igual... */}
      {showPedidosFisicos && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={cardStyle}>
            <div className={styles.modalHeader} style={headerStyle}>
              <h5 className={styles.modalTitle} style={{color: 'var(--color-title)'}}>
                <i class="fa-solid fa-utensils"></i> PEDIDOS FÍSICOS SERVIDOS - LISTOS PARA PAGAR
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowPedidosFisicos(false)}
                style={{ filter: 'var(--logo-filter)'}}
              ></button>
            </div>
            
            <div className={styles.modalBody} style={{backgroundColor: 'var(--color-bg)'}}>
              {pedidosServidos.length === 0 ? (
                <div className="text-center py-4" style={{color: 'var(--color-text)'}}>
                  <p>No hay pedidos físicos servidos pendientes de pago</p>
                </div>
              ) : (
                <div className="row">
                  {pedidosServidos.map((pedido) => (
                    <div key={pedido.id} className="col-md-6 mb-3">
                      <div 
                        className={`card h-100 ${styles.clickableCard}`}
                        style={{
                          cursor: 'pointer',
                          border: `2px solid var(--color-success)`,
                          backgroundColor: 'var(--color-card)',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => cargarPedidoServido(pedido)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className="card-title" style={{color: 'var(--color-title)'}}>
                              <i class="fa-solid fa-fish-fins"></i> Pedido #{pedido.id}
                            </h6>
                            <span className="badge" style={btnSecondary}>
                              {pedido.mesa}
                            </span>
                          </div>
                          
                          <p className="mb-2" style={{color: 'var(--color-text)'}}>
                            <strong>{pedido.cliente_nombre}</strong>
                            {pedido.cliente_telefono && <><br/> <i class="fa-solid fa-phone"></i>{pedido.cliente_telefono}</>}
                            <br/> <i class="fa-solid fa-table"></i> {pedido.mesa}
                          </p>
                          
                          <div className="small mb-3" style={{color: 'var(--color-text)'}}>
                            {pedido.items.slice(0, 3).map((item, idx) => (
                              <div key={idx}>
                                {item.cantidad}x {item.nombre} - S/ {item.subtotal.toFixed(2)}
                              </div>
                            ))}
                            {pedido.items.length > 3 && (
                              <small style={{color: 'var(--color-muted)'}}>
                                +{pedido.items.length - 3} más...
                              </small>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <strong className="h5 mb-1" style={priceColor}>
                              S/ {pedido.monto_pendiente.toFixed(2)}
                            </strong>
                            <button className="btn btn-sm" style={btnSuccess}>
                              Procesar Pago
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.modalFooterM}>
              <button 
                className="btn"
                style={btnWarning}
                onClick={() => setShowPedidosFisicos(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showPedidosDelivery && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={cardStyle}>
            <div className={styles.modalHeader} style={headerStyle}>
              <h5 className={styles.modalTitle} style={{color: 'var(--color-title)'}}>
                <i class="fa-solid fa-truck"></i> PEDIDOS DELIVERY ENTREGADOS - LISTOS PARA PAGAR
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={() => setShowPedidosDelivery(false)}
                style={{ filter: 'var(--logo-filter)'}}
              ></button>
            </div>
            
            <div className={styles.modalBody} style={{backgroundColor: 'var(--color-bg)'}}>
              {pedidosDelivery.length === 0 ? (
                <div className="text-center py-4" style={{color: 'var(--color-text)'}}>
                  <p>No hay pedidos delivery entregados pendientes de pago</p>
                </div>
              ) : (
                <div className="row">
                  {pedidosDelivery.map((pedido) => (
                    <div key={pedido.id} className="col-md-6 mb-3">
                      <div 
                        className={`card h-100 ${styles.clickableCard}`}
                        style={{
                          cursor: 'pointer',
                          border: `2px solid var(--color-btn)`,
                          backgroundColor: 'var(--color-card)',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => cargarPedidoServido(pedido)}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-5px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start">
                            <h6 className="card-title" style={{color: 'var(--color-title)'}}>
                              <i class="fa-solid fa-motorcycle"></i> Pedido #{pedido.id}
                            </h6>
                            <span className="badge" style={btnWarning}>
                              DELIVERY
                            </span>
                          </div>
                          
                          <p className="mb-2" style={{color: 'var(--color-text)'}}>
                            <strong>{pedido.cliente_nombre}</strong> 
                            {pedido.cliente_telefono && <><br/><i class="fa-solid fa-phone"></i> {pedido.cliente_telefono}</>}
                            {pedido.direccion && <><br/><i class="fa-solid fa-location-arrow"></i> {pedido.direccion}</>}
                          </p>
                          
                          <div className="small mb-3" style={{color: 'var(--color-text)'}}>
                            {pedido.items.slice(0, 3).map((item, idx) => (
                              <div key={idx}>
                                {item.cantidad}x {item.nombre} - S/ {item.subtotal.toFixed(2)}
                              </div>
                            ))}
                            {pedido.items.length > 3 && (
                              <small style={{color: 'var(--color-muted)'}}>
                                +{pedido.items.length - 3} más...
                              </small>
                            )}
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <strong className="h5 mb-0" style={priceColor}>
                              S/ {pedido.monto_pendiente.toFixed(2)}
                            </strong>
                            <button className="btn btn-sm" style={btnPrimary}>
                              Registrar Pago
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.modalFooterM}>
              <button 
                className="btn"
                style={btnSecondary}
                onClick={() => setShowPedidosDelivery(false)}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showModal && selectedPedido && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={cardStyle}>
            <div className={styles.modalHeader} style={headerStyle}>
              <h5 className={styles.modalTitle} style={{color: 'var(--color-title)', fontWeight: 'bold'}}>
                {selectedPedido.tipo === 'delivery' ? (<>
                    <i className="fa-solid fa-motorcycle" style={{ marginRight: 8 }}></i>
                    REGISTRAR PAGO DELIVERY
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-utensils" style={{ marginRight: 8 }}></i>
                    PROCESAR PAGO
                  </>
                )}
              </h5>
              <button 
                type="button" 
                className="btn-close"
                onClick={resetForm}
                style={{ filter: 'var(--logo-filter)'}}
              ></button>
            </div>

            <div className={styles.modalBody} style={{backgroundColor: 'var(--color-bg)'}}>
              {/* Card de Información del Pedido */}
              <div className="card mb-4" style={cardStyle}>
                <div className="card-header" style={headerStyle}>
                  <h6 className="mb-0">
                    {selectedPedido.tipo === 'delivery' ? (
                      <>
                        <i className="fa-solid fa-motorcycle" style={{ marginRight: 5 }}></i>
                      </>
                    ) : (
                      <>
                        <i className="fa-solid fa-utensils" style={{ marginRight: 5 }}></i>
                      </>
                    )} Pedido #{selectedPedido.id}
                    <span className="badge ms-2" style={
                      selectedPedido.tipo === 'fisico' ? btnSuccess : btnPrimary
                    }>
                      {selectedPedido.tipo === 'fisico' ? 'MESA' : 'DELIVERY'}
                    </span>
                  </h6>
                </div>
                <div className="card-body" style={{backgroundColor: 'var(--color-card)'}}>
                  <div className="row">
                    <div className="col-md-6">
                      <p style={{color: 'var(--color-text)'}}>
                        <strong>Cliente:</strong> {selectedPedido.cliente_nombre}
                      </p>
                      <p style={{color: 'var(--color-text)'}}>
                        <strong>Teléfono:</strong> {selectedPedido.cliente_telefono || 'No especificado'}
                      </p>
                    </div>
                    <div className="col-md-6">
                      {selectedPedido.mesa && (
                        <p style={{color: 'var(--color-text)'}}>
                          <strong>Mesa:</strong> {selectedPedido.mesa}
                        </p>
                      )}
                      {selectedPedido.direccion && (
                        <p style={{color: 'var(--color-text)'}}>
                          <strong>Dirección:</strong> {selectedPedido.direccion}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Tabla de Items */}
                  <div className="mt-3">
                    <h6 className="mb-2" style={{color: 'var(--color-title)', fontWeight: 'bold'}}>Items del Pedido:</h6>
                    <Table responsive hover className={styles.themedTable}>
                        <thead style={tableHeaderStyle}>
                          <tr>
                            <th className={styles.tableHead}>Producto</th>
                            <th className={styles.tableHead}>Cantidad</th>
                            <th className={styles.tableHead}>Precio Unit.</th>
                            <th className={styles.tableHead}>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedPedido.items.map((item, index) => (
                            <tr key={index} style={{color: 'var(--color-text)'}}>
                              <td>{item.nombre}</td>
                              <td>{item.cantidad}</td>
                              <td>S/ {item.precio_unitario.toFixed(2)}</td>
                              <td>S/ {item.subtotal.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot style={{backgroundColor: 'var(--color-header)'}}>
                          <tr>
                            <td className="text-center align-middle">
                            </td>
                            <td className="text-center align-middle">
                            </td>
                            <td className="text-center align-middle">
                              <strong style={{color: 'var(--color-title)'}}>TOTAL:</strong>
                            </td>
                            <td>
                              <strong>S/ {selectedPedido.monto_pendiente.toFixed(2)}</strong>
                            </td>
                          </tr>
                        </tfoot>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Sección de Pago para Delivery */}
              {selectedPedido.tipo === 'delivery' && (
                <div className="text-center">
                  <div className="alert" style={{
                    backgroundColor: 'var(--color-header)',
                    color: 'var(--color-title)',
                    border: `1px solid var(--color-accent)`
                  }}>
                    <h4 className="mb-3" style={priceColor}>
                      TOTAL A COBRAR: S/ {selectedPedido.monto_pendiente.toFixed(2)}
                    </h4>
                    <p className="mb-0" style={{color: 'var(--color-text)'}}>
                      Confirma el pago recibido del repartidor
                    </p>
                  </div>

                  <button
                    className="btn btn-lg"
                    style={btnSuccess}
                    onClick={procesarPagoDelivery}
                  >
                    <i class="fa-solid fa-circle-check"></i> REGISTRAR PAGO DELIVERY
                  </button>
                </div>
              )}

              {/* Sección de Pago para Pedido Físico */}
              {selectedPedido.tipo === 'fisico' && (
                <div>
                  {/* Alerta de Total */}
                  <div className="alert text-center mt-4 mb-4" 
                    style={{
                      backgroundColor: 'var(--color-header)',
                      color: 'var(--color-title)',
                      border: `1px solid var(--color-accent)`
                  }}>
                    <h4 style={{...priceColor, margin: 0}}>
                      TOTAL A PAGAR: S/ {selectedPedido.monto_pendiente.toFixed(2)}
                    </h4>
                  </div>

                  {/* Selección de Método de Pago */}
                  <div className="row mb-4">
                    <div className="col-6">
                      <button
                        className={'btn w-100 fw-bold ' + (paymentMethod === 'cash' ? '' : 'btn-outline')}
                        style={paymentMethod === 'cash' ? btnSuccess : {
                          ...btnSecondary,
                          backgroundColor: 'transparent',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-muted)'
                        }}
                        onClick={() => setPaymentMethod('cash')}
                      >
                        EFECTIVO
                      </button>
                    </div>
                    <div className="col-6">
                      <button
                        className={'btn w-100 fw-bold ' + (paymentMethod === 'digital' ? '' : 'btn-outline')}
                        style={paymentMethod === 'digital' ? btnPrimary : {
                          ...btnSecondary,
                          backgroundColor: 'transparent',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-muted)'
                        }}
                        onClick={() => setPaymentMethod('digital')}
                      >
                        PAGO DIGITAL
                      </button>
                    </div>
                  </div>

                  {/* Pago en Efectivo */}
                  {paymentMethod === 'cash' && (
                    <div>
                      <label className="form-label fw-bold" style={{color: 'var(--color-title)'}}>
                        MONTO RECIBIDO
                      </label>
                      <input
                        type="number"
                        className="form-control form-control-lg"
                        style={inputStyle}
                        value={cashData.received}
                        onChange={(e) => calculateChange(parseFloat(e.target.value) || 0)}
                        step="0.01"
                      />
                      {cashData.received > 0 && (
                        <div className="mt-3 p-3 rounded text-center" style={{
                          backgroundColor: cashData.change >= 0 ? 'var(--color-secondary)' : 'var(--color-btn-delete)',
                          color: 'white'
                        }}>
                          <h5 style={{margin: 0}}>CAMBIO: S/ {cashData.change.toFixed(2)}</h5>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pago Digital */}
                  {paymentMethod === 'digital' && (
                    <div className="text-center">
                      {!linkPago.paymentUrl ? (
                        <button
                          className="btn btn-lg"
                          style={btnPrimary}
                          onClick={generarLinkPago}
                          disabled={linkPago.loading}
                        >
                          {linkPago.loading ? 'Generando...' : 'GENERAR LINK DE PAGO'}
                        </button>
                      ) : (
                        <div>
                          {/* QR Code */}
                          <div style={{
                            backgroundColor: 'white',
                            border: `2px solid var(--color-muted)`,
                            padding: '1rem',
                            display: 'inline-block',
                            marginBottom: '1rem'
                          }}>
                            <img 
                              src={linkPago.qrUrl} 
                              alt="QR" 
                              className="img-fluid" 
                              style={{maxWidth: '250px'}} 
                            />
                          </div>
                          
                          {/* Link para Compartir */}
                          <div className="input-group mb-3">
                            <input
                              type="text"
                              className="form-control"
                              style={inputStyle}
                              value={linkPago.paymentUrl}
                              readOnly
                            />
                            <button
                              className="btn"
                              style={btnSecondary}
                              onClick={() => {
                                navigator.clipboard.writeText(linkPago.paymentUrl);
                                alert('Link copiado');
                              }}
                            >
                              Copiar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer del Modal */}
            <div className={styles.modalFooterM}>
              <button 
                className="btn" 
                style={btnSecondary}
                onClick={resetForm}
              >
                Cancelar
              </button>
              
              {selectedPedido.tipo === 'fisico' && (
                <button
                  className="btn"
                  style={btnSuccess}
                  onClick={processPaymentFisico}
                  disabled={paymentMethod === 'cash' && cashData.received < selectedPedido.monto_pendiente}
                >
                  CONFIRMAR PAGO
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial de pagos FILTRADO */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h4 fw-bold" style={{color: 'var(--color-title)'}}>
              PAGOS {dateFilter.toUpperCase()}
            </h3>
            <div style={{color: 'var(--color-muted)'}}>
              Mostrando {filteredPayments.length} de {payments.length} pagos
            </div>
          </div>
          
          {filteredPayments.length === 0 ? (
            <div className="card" style={cardStyle}>
              <div className="card-body text-center">
                <p className="mb-0 fw-bold" style={{color: 'var(--color-title)'}}>
                  NO HAY PAGOS REGISTRADOS PARA EL PERÍODO SELECCIONADO
                </p>
                <small style={{color: 'var(--color-muted)'}}>
                  Prueba con otro filtro de fecha
                </small>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100" style={{
                    ...cardStyle,
                    transition: 'all 0.3s ease'
                  }}>
                    <div className="card-body">
                      {/* Header de la Tarjeta */}
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title fw-bold" style={{color: 'var(--color-title)'}}>
                          {payment.orderId || `PAGO-${payment.id}`}
                        </h6>
                        <span className="badge" style={btnSuccess}>COMPLETADO</span>
                      </div>
                      
                      {/* Información del Pago */}
                      <div className="card-text small mb-2" style={{color: 'var(--color-text)'}}>
                        <div className="d-flex align-items-center mb-1">
                          <i className="fas fa-user me-1" style={{color: 'var(--color-accent)'}}></i>
                          <strong>{payment.customerName || 'Cliente'}</strong>
                        </div>
                        
                        {payment.tableNumber && (
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-utensils me-1" style={{color: 'var(--color-accent)'}}></i>
                            MESA {payment.tableNumber}
                          </div>
                        )}
                        
                        {payment.customerAddress && !payment.tableNumber && (
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-map-marker-alt me-1" style={{color: 'var(--color-accent)'}}></i>
                            {payment.customerAddress}
                          </div>
                        )}
                        
                        {payment.customerPhone && (
                          <div className="d-flex align-items-center mb-1">
                            <i className="fas fa-phone me-1" style={{color: 'var(--color-accent)'}}></i>
                            {payment.customerPhone}
                          </div>
                        )}
                        
                        <div className="d-flex align-items-center mb-1">
                          <i className="fas fa-clock me-1" style={{color: 'var(--color-accent)'}}></i>
                          <small>
                            {payment.fecha_pago ? 
                              new Date(payment.fecha_pago).toLocaleString('es-PE') : 
                              'Fecha no disponible'}
                          </small>
                        </div>
                      </div>
                      
                      {/* Footer de la Tarjeta */}
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className="badge fw-bold" style={
                          payment.metodo_pago === 'efectivo' ? btnSuccess : btnPrimary
                        }>
                          {payment.metodo_pago?.toUpperCase() || 'EFECTIVO'}
                        </span>
                        <strong className="h5 mb-0" style={priceColor}>
                          S/ {payment.monto.toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Container>
  );
};

export default PaymentManager;
