import { useState, useRef, useEffect } from 'react';

import {API_BASE_URL} from '../Configuracion/api.jsx';

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
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold text-dark">SISTEMA DE PAGOS</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-success fw-bold"
            onClick={() => setShowPedidosFisicos(true)}
          >
            🍽️ Pedidos Servidos ({pedidosServidos.length})
          </button>
          <button 
            className="btn btn-primary fw-bold"
            onClick={() => setShowPedidosDelivery(true)}
          >
            🛵 Delivery Entregados ({pedidosDelivery.length})
          </button>
        </div>
      </div>

      {/* Filtros por fecha */}
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-light">
          <h5 className="mb-0 fw-bold">📅 FILTROS POR FECHA</h5>
        </div>
        <div className="card-body">
          <div className="row align-items-end">
            <div className="col-md-6">
              <label className="form-label fw-bold">Seleccionar período:</label>
              <div className="d-flex flex-wrap gap-2">
                <button
                  className={`btn btn-sm ${dateFilter === 'all' ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => setDateFilter('all')}
                >
                  TODOS
                </button>
                <button
                  className={`btn btn-sm ${dateFilter === 'today' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setDateFilter('today')}
                >
                  HOY
                </button>
                <button
                  className={`btn btn-sm ${dateFilter === 'yesterday' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  onClick={() => setDateFilter('yesterday')}
                >
                  AYER
                </button>
                <button
                  className={`btn btn-sm ${dateFilter === 'week' ? 'btn-info' : 'btn-outline-info'}`}
                  onClick={() => setDateFilter('week')}
                >
                  ÚLTIMA SEMANA
                </button>
                <button
                  className={`btn btn-sm ${dateFilter === 'month' ? 'btn-warning' : 'btn-outline-warning'}`}
                  onClick={() => setDateFilter('month')}
                >
                  ÚLTIMO MES
                </button>
                <button
                  className={`btn btn-sm ${dateFilter === 'custom' ? 'btn-success' : 'btn-outline-success'}`}
                  onClick={() => setDateFilter('custom')}
                >
                  PERSONALIZADO
                </button>
              </div>
            </div>
            
            {dateFilter === 'custom' && (
              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Fecha inicio:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-bold">Fecha fin:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Resumen del filtro aplicado */}
          <div className="mt-3 p-3 bg-light rounded">
            <div className="row text-center">
              <div className="col-md-6">
                <h6 className="fw-bold text-muted">PAGOS FILTRADOS</h6>
                <h4 className="fw-bold text-primary">{filteredCount}</h4>
              </div>
              <div className="col-md-6">
                <h6 className="fw-bold text-muted">INGRESOS FILTRADOS</h6>
                <h4 className="fw-bold text-success">S/ {filteredRevenue.toFixed(2)}</h4>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas en tiempo real */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <h6 className="fw-bold">PAGOS HOY</h6>
              <h4 className="fw-bold">{todayPayments.length}</h4>
              <small>Total del día</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body">
              <h6 className="fw-bold">INGRESOS</h6>
              <h4 className="fw-bold">S/ {totalRevenue.toFixed(2)}</h4>
              <small>Total acumulado</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <h6 className="fw-bold">COMPLETADOS</h6>
              <h4 className="fw-bold">{completedPayments.length}</h4>
              <small>Pagos exitosos</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body">
              <h6 className="fw-bold">PENDIENTES</h6>
              <h4 className="fw-bold">{pedidosServidos.length + pedidosDelivery.length}</h4>
              <small>Pedidos por cobrar</small>
            </div>
          </div>
        </div>
      </div>

      {/* Los modales se mantienen igual... */}
      {showPedidosFisicos && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title fw-bold">
                  🍽️ PEDIDOS FÍSICOS SERVIDOS - LISTOS PARA PAGAR
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowPedidosFisicos(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                {pedidosServidos.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No hay pedidos físicos servidos pendientes de pago</p>
                  </div>
                ) : (
                  <div className="row">
                    {pedidosServidos.map((pedido) => (
                      <div key={pedido.id} className="col-md-6 mb-3">
                        <div 
                          className="card h-100 cursor-pointer border-success"
                          style={{cursor: 'pointer'}}
                          onClick={() => cargarPedidoServido(pedido)}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="card-title">
                                🍽️ Pedido #{pedido.id}
                              </h6>
                              <span className="badge bg-success">
                                MESA {pedido.mesa}
                              </span>
                            </div>
                            
                            <p className="mb-2">
                              <strong>{pedido.cliente_nombre}</strong>
                              {pedido.cliente_telefono && <><br/>📞 {pedido.cliente_telefono}</>}
                              <br/>🍽️ {pedido.mesa}
                            </p>
                            
                            <div className="small mb-2">
                              {pedido.items.slice(0, 3).map((item, idx) => (
                                <div key={idx}>
                                  {item.cantidad}x {item.nombre} - S/ {item.subtotal.toFixed(2)}
                                </div>
                              ))}
                              {pedido.items.length > 3 && (
                                <small>+{pedido.items.length - 3} más...</small>
                              )}
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <strong className="h5 mb-0 text-success">
                                S/ {pedido.monto_pendiente.toFixed(2)}
                              </strong>
                              <button className="btn btn-sm btn-success">
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
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPedidosFisicos(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPedidosDelivery && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  🛵 PEDIDOS DELIVERY ENTREGADOS - LISTOS PARA PAGAR
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowPedidosDelivery(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                {pedidosDelivery.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No hay pedidos delivery entregados pendientes de pago</p>
                  </div>
                ) : (
                  <div className="row">
                    {pedidosDelivery.map((pedido) => (
                      <div key={pedido.id} className="col-md-6 mb-3">
                        <div 
                          className="card h-100 cursor-pointer border-primary"
                          style={{cursor: 'pointer'}}
                          onClick={() => cargarPedidoServido(pedido)}
                        >
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="card-title">
                                🛵 Pedido #{pedido.id}
                              </h6>
                              <span className="badge bg-primary">
                                DELIVERY
                              </span>
                            </div>
                            
                            <p className="mb-2">
                              <strong>{pedido.cliente_nombre}</strong>
                              {pedido.cliente_telefono && <><br/>📞 {pedido.cliente_telefono}</>}
                              {pedido.direccion && <><br/>📍 {pedido.direccion}</>}
                            </p>
                            
                            <div className="small mb-2">
                              {pedido.items.slice(0, 3).map((item, idx) => (
                                <div key={idx}>
                                  {item.cantidad}x {item.nombre} - S/ {item.subtotal.toFixed(2)}
                                </div>
                              ))}
                              {pedido.items.length > 3 && (
                                <small>+{pedido.items.length - 3} más...</small>
                              )}
                            </div>
                            
                            <div className="d-flex justify-content-between align-items-center mt-2">
                              <strong className="h5 mb-0 text-success">
                                S/ {pedido.monto_pendiente.toFixed(2)}
                              </strong>
                              <button className="btn btn-sm btn-primary">
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
              
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowPedidosDelivery(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de pago */}
      {showModal && selectedPedido && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {selectedPedido.tipo === 'delivery' ? '🛵 REGISTRAR PAGO DELIVERY' : '🍽️ PROCESAR PAGO'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>

              <div className="modal-body">
                <div className="card mb-4">
                  <div className="card-header bg-light">
                    <h6 className="mb-0">
                      {selectedPedido.tipo === 'delivery' ? '🛵' : '🍽️'} Pedido #{selectedPedido.id}
                      <span className={`badge ms-2 ${selectedPedido.tipo === 'fisico' ? 'bg-success' : 'bg-primary'}`}>
                        {selectedPedido.tipo === 'fisico' ? 'MESA' : 'DELIVERY'}
                      </span>
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Cliente:</strong> {selectedPedido.cliente_nombre}</p>
                        <p><strong>Teléfono:</strong> {selectedPedido.cliente_telefono || 'No especificado'}</p>
                      </div>
                      <div className="col-md-6">
                        {selectedPedido.mesa && <p><strong>Mesa:</strong> {selectedPedido.mesa}</p>}
                        {selectedPedido.direccion && <p><strong>Dirección:</strong> {selectedPedido.direccion}</p>}
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h6>Items del Pedido:</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Producto</th>
                              <th>Cantidad</th>
                              <th>Precio Unit.</th>
                              <th>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedPedido.items.map((item, index) => (
                              <tr key={index}>
                                <td>{item.nombre}</td>
                                <td>{item.cantidad}</td>
                                <td>S/ {item.precio_unitario.toFixed(2)}</td>
                                <td>S/ {item.subtotal.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr>
                              <td colSpan="3" className="text-end"><strong>Total:</strong></td>
                              <td><strong>S/ {selectedPedido.monto_pendiente.toFixed(2)}</strong></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedPedido.tipo === 'delivery' && (
                  <div className="text-center">
                    <div className="alert alert-info">
                      <h4 className="mb-3">TOTAL A COBRAR: S/ {selectedPedido.monto_pendiente.toFixed(2)}</h4>
                      <p className="mb-0">Confirma el pago recibido del repartidor</p>
                    </div>

                    <button
                      className="btn btn-success btn-lg"
                      onClick={procesarPagoDelivery}
                    >
                      ✅ REGISTRAR PAGO DELIVERY
                    </button>
                  </div>
                )}

                {selectedPedido.tipo === 'fisico' && (
                  <div>
                    <div className="alert alert-info text-center mb-4">
                      <h4>TOTAL A PAGAR: S/ {selectedPedido.monto_pendiente.toFixed(2)}</h4>
                    </div>

                    <div className="row mb-4">
                      <div className="col-6">
                        <button
                          className={'btn w-100 ' + (paymentMethod === 'cash' ? 'btn-success' : 'btn-outline-success')}
                          onClick={() => setPaymentMethod('cash')}
                        >
                          EFECTIVO
                        </button>
                      </div>
                      <div className="col-6">
                        <button
                          className={'btn w-100 ' + (paymentMethod === 'digital' ? 'btn-primary' : 'btn-outline-primary')}
                          onClick={() => setPaymentMethod('digital')}
                        >
                          PAGO DIGITAL
                        </button>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div>
                        <label className="form-label fw-bold">MONTO RECIBIDO</label>
                        <input
                          type="number"
                          className="form-control form-control-lg"
                          value={cashData.received}
                          onChange={(e) => calculateChange(parseFloat(e.target.value) || 0)}
                          step="0.01"
                        />
                        {cashData.received > 0 && (
                          <div className="alert alert-success mt-3">
                            <h5>CAMBIO: S/ {cashData.change.toFixed(2)}</h5>
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'digital' && (
                      <div className="text-center">
                        {!linkPago.paymentUrl ? (
                          <button
                            className="btn btn-primary btn-lg"
                            onClick={generarLinkPago}
                            disabled={linkPago.loading}
                          >
                            {linkPago.loading ? 'Generando...' : 'GENERAR LINK DE PAGO'}
                          </button>
                        ) : (
                          <div>
                            <img src={linkPago.qrUrl} alt="QR" className="img-fluid mb-3" style={{maxWidth: '250px'}} />
                            <div className="input-group mb-3">
                              <input
                                type="text"
                                className="form-control"
                                value={linkPago.paymentUrl}
                                readOnly
                              />
                              <button
                                className="btn btn-outline-primary"
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

              {selectedPedido.tipo === 'fisico' && (
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={processPaymentFisico}
                    disabled={paymentMethod === 'cash' && cashData.received < selectedPedido.monto_pendiente}
                  >
                    CONFIRMAR PAGO
                  </button>
                </div>
              )}

              {selectedPedido.tipo === 'delivery' && (
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={resetForm}>
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Historial de pagos FILTRADO */}
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="h4 fw-bold text-dark">PAGOS {dateFilter.toUpperCase()}</h3>
            <div className="text-muted">
              Mostrando {filteredPayments.length} de {payments.length} pagos
            </div>
          </div>
          
          {filteredPayments.length === 0 ? (
            <div className="card border-dark">
              <div className="card-body text-center text-dark">
                <p className="mb-0 fw-bold">NO HAY PAGOS REGISTRADOS PARA EL PERÍODO SELECCIONADO</p>
                <small className="text-muted">Prueba con otro filtro de fecha</small>
              </div>
            </div>
          ) : (
            <div className="row">
              {filteredPayments.map((payment) => (
                <div key={payment.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-dark shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title fw-bold text-primary">
                          {payment.orderId || `PAGO-${payment.id}`}
                        </h6>
                        <span className="badge bg-success fw-bold">COMPLETADO</span>
                      </div>
                      <p className="card-text small text-dark mb-2">
                        <i className="fas fa-user me-1"></i>
                        <strong>{payment.customerName || 'Cliente'}</strong>
                        <br />
                        {payment.tableNumber && (
                          <><i className="fas fa-utensils me-1"></i>MESA {payment.tableNumber}<br /></>
                        )}
                        {payment.customerAddress && !payment.tableNumber && (
                          <><i className="fas fa-map-marker-alt me-1"></i>{payment.customerAddress}<br /></>
                        )}
                        {payment.customerPhone && (
                          <><i className="fas fa-phone me-1"></i>{payment.customerPhone}<br /></>
                        )}
                        <i className="fas fa-clock me-1"></i>
                        <small>{payment.fecha_pago ? new Date(payment.fecha_pago).toLocaleString('es-PE') : 'Fecha no disponible'}</small>
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className={`badge fw-bold ${
                          payment.metodo_pago === 'efectivo' ? 'bg-success' : 'bg-primary'
                        }`}>
                          {payment.metodo_pago?.toUpperCase() || 'EFECTIVO'}
                        </span>
                        <strong className="h5 mb-0 text-dark">S/ {payment.monto.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentManager;
