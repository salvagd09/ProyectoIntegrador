import { useState, useRef, useEffect } from 'react';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [pedidosDeliveryPendientes, setPedidosDeliveryPendientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [selectedPedido, setSelectedPedido] = useState(null);
  
  const [cashData, setCashData] = useState({
    received: 0,
    change: 0
  });

  const receiptRef = useRef(null);

  // ✅ OBTENER PEDIDOS DELIVERY PENDIENTES DE PAGO
  const obtenerPedidosDeliveryPendientes = async () => {
    try {
      const response = await fetch('http://localhost:8000/pedidosF/delivery-pendientes-pago/');
      if (response.ok) {
        const data = await response.json();
        setPedidosDeliveryPendientes(data);
      }
    } catch (error) {
      console.error('Error al obtener pedidos delivery:', error);
    }
  };

  // ✅ OBTENER PAGOS COMPLETADOS
  const obtenerPagosCompletados = async () => {
    try {
      const response = await fetch('http://localhost:8000/pedidosF/pagos-completados/');
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error al obtener pagos:', error);
    }
  };

  useEffect(() => {
    obtenerPedidosDeliveryPendientes();
    obtenerPagosCompletados();
  }, []);

  // ✅ CÁLCULO DE CAMBIO
  const calculateChange = (received) => {
    if (!selectedPedido) return;
    const change = received - selectedPedido.pedido.monto_total;
    setCashData({ received, change: Math.max(0, change) });
  };

  // ✅ PROCESAR PAGO DELIVERY
  const procesarPagoDelivery = async () => {
    if (!selectedPedido) {
      alert('No hay pedido delivery seleccionado');
      return;
    }

    if (paymentMethod === 'cash' && cashData.received < selectedPedido.pedido.monto_total) {
      alert('El monto recibido es insuficiente');
      return;
    }

    try {
      const pagoData = {
        pedido_id: selectedPedido.pedido.id,
        metodo_pago: paymentMethod === 'cash' ? 'Efectivo' : 
                     paymentMethod === 'card' ? 'Tarjeta' :
                     paymentMethod === 'yape' ? 'Yape' : 'Plin',
        referencia_pago: `REF-${Date.now()}`
      };

      const response = await fetch('http://localhost:8000/pedidosF/procesar-pago-delivery/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pagoData),
      });

      if (response.ok) {
        const resultado = await response.json();
        
        // Crear pago para mostrar en el frontend
        const nuevoPago = {
          id: resultado.pago_id,
          orderId: `DEL-${selectedPedido.pedido.id}`,
          type: 'delivery',
          customerName: resultado.datos_cliente.nombre,
          customerPhone: resultado.datos_cliente.telefono,
          customerAddress: resultado.datos_cliente.direccion,
          items: selectedPedido.detalles,
          subtotal: selectedPedido.pedido.monto_total / 1.18,
          tax: selectedPedido.pedido.monto_total * 0.18,
          discount: 0,
          total: selectedPedido.pedido.monto_total,
          paymentMethod: paymentMethod,
          cashReceived: paymentMethod === 'cash' ? cashData.received : undefined,
          changeAmount: paymentMethod === 'cash' ? cashData.change : undefined,
          status: 'completed',
          createdAt: new Date().toLocaleString('es-PE'),
          plataforma: resultado.datos_cliente.plataforma
        };

        setPayments(prev => [nuevoPago, ...prev]);
        setCurrentStep(3);
        
        // Actualizar lista de pedidos pendientes
        obtenerPedidosDeliveryPendientes();
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error('Error al procesar pago delivery:', error);
      alert('Error al procesar el pago');
    }
  };

  // ✅ RESET FORMULARIO
  const resetForm = () => {
    setSelectedPedido(null);
    setCashData({ received: 0, change: 0 });
    setPaymentMethod('cash');
    setCurrentStep(1);
    setShowModal(false);
  };

  // ✅ IMPRIMIR RECIBO
  const printReceipt = () => {
    const receiptContent = receiptRef.current;
    if (receiptContent && payments[0]) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Recibo - ${payments[0]?.orderId}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .section { margin: 10px 0; }
                .total { font-weight: bold; font-size: 1.2em; }
                .items { width: 100%; border-collapse: collapse; }
                .items td { padding: 5px; border-bottom: 1px solid #ddd; }
              </style>
            </head>
            <body>
              ${receiptContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  // ✅ ESTADÍSTICAS ACTUALIZADAS - DEFINIDAS ANTES DE USARSE
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.total, 0);
  const todayPayments = payments.filter(payment => 
    new Date(payment.createdAt).toDateString() === new Date().toDateString()
  );

  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {/* Espacio vacío */}
        </div>
        <button 
          className="btn btn-success fw-bold"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Pago Delivery
        </button>
      </div>

      {/* Estadísticas */}
      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title fw-bold">PAGOS HOY</h6>
                  <h4 className="fw-bold">{todayPayments.length}</h4>
                  <small>Total del día</small>
                </div>
                <i className="fas fa-calendar fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title fw-bold">INGRESOS</h6>
                  <h4 className="fw-bold">S/ {(totalRevenue || 0).toFixed(2)}</h4>
                  <small>Total acumulado</small>
                </div>
                <i className="fas fa-dollar-sign fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title fw-bold">COMPLETADOS</h6>
                  <h4 className="fw-bold">{payments.filter(p => p.status === 'completed').length}</h4>
                  <small>Pagos exitosos</small>
                </div>
                <i className="fas fa-check-circle fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title fw-bold">PENDIENTES</h6>
                  <h4 className="fw-bold">{pedidosDeliveryPendientes.length}</h4>
                  <small>Por cobrar</small>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {currentStep === 1 && '🛵 SELECCIONAR PEDIDO DELIVERY'}
                  {currentStep === 2 && '💳 PROCESAR PAGO DELIVERY'}
                  {currentStep === 3 && '✅ PAGO COMPLETADO'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>

              <div className="modal-body">
                {/* Paso 1: Seleccionar Pedido Delivery */}
                {currentStep === 1 && (
                  <div className="row">
                    <div className="col-12">
                      <h6 className="fw-bold text-dark mb-3">PEDIDOS DELIVERY PENDIENTES DE PAGO</h6>
                      
                      {pedidosDeliveryPendientes.length === 0 ? (
                        <div className="alert alert-info text-center">
                          <i className="fas fa-info-circle me-2"></i>
                          No hay pedidos delivery pendientes de pago
                        </div>
                      ) : (
                        <div className="row">
                          {pedidosDeliveryPendientes.map((pedido) => (
                            <div key={pedido.pedido.id} className="col-md-6 mb-3">
                              <div 
                                className={`card cursor-pointer ${selectedPedido?.pedido.id === pedido.pedido.id ? 'border-primary bg-light' : 'border-dark'}`}
                                onClick={() => setSelectedPedido(pedido)}
                                style={{ cursor: 'pointer' }}
                              >
                                <div className="card-body">
                                  <div className="d-flex justify-content-between align-items-start mb-2">
                                    <h6 className="card-title fw-bold text-dark">
                                      Pedido #{pedido.pedido.id}
                                    </h6>
                                    <span className="badge bg-warning text-dark">PENDIENTE</span>
                                  </div>
                                  
                                  <p className="card-text small text-dark mb-2">
                                    <i className="fas fa-user me-1"></i>
                                    <strong>{pedido.delivery_info.nombre_cliente}</strong>
                                  </p>
                                  
                                  <p className="card-text small text-dark mb-2">
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {pedido.delivery_info.direccion_cliente}
                                  </p>
                                  
                                  <p className="card-text small text-dark mb-2">
                                    <i className="fas fa-phone me-1"></i>
                                    {pedido.delivery_info.telefono_cliente}
                                  </p>

                                  <div className="mt-3">
                                    <small className="text-muted">Productos:</small>
                                    {pedido.detalles.slice(0, 2).map((detalle, idx) => (
                                      <div key={idx} className="small text-dark">
                                        • {detalle.cantidad}x {detalle.nombre_producto}
                                      </div>
                                    ))}
                                    {pedido.detalles.length > 2 && (
                                      <div className="small text-muted">
                                        ...y {pedido.detalles.length - 2} más
                                      </div>
                                    )}
                                  </div>

                                  <div className="d-flex justify-content-between align-items-center mt-3">
                                    <span className="badge bg-secondary">
                                      {pedido.delivery_info.plataforma}
                                    </span>
                                    <strong className="h5 mb-0 text-primary">
                                      S/ {pedido.pedido.monto_total.toFixed(2)}
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
                )}

                {/* Paso 2: Método de Pago */}
                {currentStep === 2 && selectedPedido && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="alert alert-dark text-center border-0">
                        <h4 className="mb-0 fw-bold">
                          TOTAL A PAGAR: S/ {selectedPedido.pedido.monto_total.toFixed(2)}
                        </h4>
                        <small className="text-muted">
                          Cliente: {selectedPedido.delivery_info.nombre_cliente}
                        </small>
                      </div>
                    </div>

                    <div className="col-12 mb-4">
                      <h6 className="fw-bold text-dark mb-3">SELECCIONE MÉTODO DE PAGO</h6>
                      <div className="row g-2">
                        <div className="col-md-3 col-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'cash' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            <i className="fas fa-money-bill-wave me-2"></i>
                            EFECTIVO
                          </button>
                        </div>
                        <div className="col-md-3 col-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            <i className="fas fa-credit-card me-2"></i>
                            TARJETA
                          </button>
                        </div>
                        <div className="col-md-3 col-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'yape' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                            onClick={() => setPaymentMethod('yape')}
                          >
                            <i className="fas fa-mobile-alt me-2"></i>
                            YAPE
                          </button>
                        </div>
                        <div className="col-md-3 col-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'plin' ? 'btn-info text-dark' : 'btn-outline-info'}`}
                            onClick={() => setPaymentMethod('plin')}
                          >
                            <i className="fas fa-comment-dollar me-2"></i>
                            PLIN
                          </button>
                        </div>
                      </div>
                    </div>

                    {paymentMethod === 'cash' && (
                      <div className="col-12">
                        <label className="form-label fw-bold text-dark">MONTO RECIBIDO (S/)</label>
                        <input
                          type="number"
                          className="form-control form-control-lg border-dark fw-bold"
                          min="0"
                          step="0.01"
                          value={cashData.received}
                          onChange={(e) => calculateChange(parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                        {cashData.received > 0 && (
                          <div className={`mt-3 p-3 rounded fw-bold ${cashData.change >= 0 ? 'bg-success text-white' : 'bg-danger text-white'}`}>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-5">CAMBIO A ENTREGAR:</span>
                              <span className="h3 mb-0">S/ {cashData.change.toFixed(2)}</span>
                            </div>
                            {cashData.change < 0 && (
                              <div className="mt-2">
                                <small>FALTAN: S/ {Math.abs(cashData.change).toFixed(2)}</small>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {paymentMethod === 'yape' && (
                      <div className="col-12 text-center">
                        <div className="card border-warning">
                          <div className="card-body">
                            <div className="bg-white p-4 rounded border border-warning mb-4">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=YAPE-${selectedPedido.pedido.monto_total}-${selectedPedido.pedido.id}&format=png&margin=10&color=000000&bgcolor=FFFFFF`}
                                alt="QR Yape" 
                                className="img-fluid"
                                style={{ maxWidth: '200px' }}
                              />
                            </div>
                            <h5 className="text-warning fw-bold">PAGA CON YAPE</h5>
                            <p className="mb-2 fw-bold text-dark">NÚMERO: <span className="fs-4 text-primary">999 888 777</span></p>
                            <h4 className="text-warning fw-bold mb-3">S/ {selectedPedido.pedido.monto_total.toFixed(2)}</h4>
                            <div className="alert alert-warning fw-bold">
                              REFERENCIA: <strong>DEL-{selectedPedido.pedido.id}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'plin' && (
                      <div className="col-12 text-center">
                        <div className="card border-info">
                          <div className="card-body">
                            <div className="bg-white p-4 rounded border border-info mb-4">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PLIN-${selectedPedido.pedido.monto_total}-${selectedPedido.pedido.id}&format=png&margin=10&color=000000&bgcolor=FFFFFF`}
                                alt="QR Plin" 
                                className="img-fluid"
                                style={{ maxWidth: '200px' }}
                              />
                            </div>
                            <h5 className="text-info fw-bold">PAGA CON PLIN</h5>
                            <p className="mb-2 fw-bold text-dark">NÚMERO: <span className="fs-4 text-primary">999 888 777</span></p>
                            <h4 className="text-info fw-bold mb-3">S/ {selectedPedido.pedido.monto_total.toFixed(2)}</h4>
                            <div className="alert alert-info fw-bold">
                              REFERENCIA: <strong>DEL-{selectedPedido.pedido.id}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="col-12 text-center">
                        <div className="card border-primary">
                          <div className="card-body">
                            <i className="fas fa-credit-card fa-5x text-primary mb-3"></i>
                            <h5 className="text-primary fw-bold">PAGO CON TARJETA</h5>
                            <p className="text-dark fw-bold">PROCESAR CON DATÁFONO</p>
                            <h4 className="text-primary fw-bold">S/ {selectedPedido.pedido.monto_total.toFixed(2)}</h4>
                            <div className="alert alert-primary fw-bold mt-3">
                              REFERENCIA: <strong>DEL-{selectedPedido.pedido.id}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 3: Confirmación */}
                {currentStep === 3 && payments[0] && (
                  <div className="row">
                    <div className="col-12 text-center mb-4">
                      <i className="fas fa-check-circle fa-5x text-success mb-3"></i>
                      <h3 className="text-success fw-bold">¡PAGO COMPLETADO EXITOSAMENTE!</h3>
                      <p className="text-dark fw-bold">PEDIDO: {payments[0].orderId}</p>
                    </div>

                    <div ref={receiptRef} className="col-12">
                      <div className="card border-dark">
                        <div className="card-body">
                          <div className="text-center border-bottom pb-3 mb-3">
                            <h4 className="fw-bold text-dark">CEVICHERÍA "EL PUERTO"</h4>
                            <p className="text-dark small">
                              Av. Principal 123, Lima<br />
                              RUC: 20123456789
                            </p>
                          </div>

                          <div className="row mb-3">
                            <div className="col-6">
                              <strong className="text-dark">FECHA:</strong><br />
                              <span className="text-dark">{payments[0].createdAt}</span>
                            </div>
                            <div className="col-6">
                              <strong className="text-dark">PEDIDO:</strong><br />
                              <span className="text-primary fw-bold">{payments[0].orderId}</span>
                            </div>
                            <div className="col-6 mt-2">
                              <strong className="text-dark">CLIENTE:</strong><br />
                              <span className="text-dark fw-bold">{payments[0].customerName}</span>
                            </div>
                            <div className="col-6 mt-2">
                              <strong className="text-dark">MÉTODO:</strong><br />
                              <span className="fw-bold text-success">
                                {paymentMethod === 'cash' && 'EFECTIVO'}
                                {paymentMethod === 'card' && 'TARJETA'}
                                {paymentMethod === 'yape' && 'YAPE'}
                                {paymentMethod === 'plin' && 'PLIN'}
                              </span>
                            </div>
                          </div>

                          <table className="table table-sm mb-3">
                            <thead>
                              <tr>
                                <th className="fw-bold text-dark">PRODUCTO</th>
                                <th className="text-end fw-bold text-dark">TOTAL</th>
                              </tr>
                            </thead>
                            <tbody>
                              {payments[0].items.map((item) => (
                                <tr key={item.producto_id || item.id}>
                                  <td className="text-dark">{item.cantidad}x {item.nombre_producto}</td>
                                  <td className="text-end fw-bold text-dark">S/ {(item.precio_unitario * item.cantidad).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          <div className="border-top pt-3">
                            <div className="d-flex justify-content-between small fw-bold text-dark">
                              <span>Subtotal:</span>
                              <span>S/ {payments[0].subtotal.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between small fw-bold text-dark">
                              <span>IGV (18%):</span>
                              <span>S/ {payments[0].tax.toFixed(2)}</span>
                            </div>
                            <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top text-primary">
                              <span>TOTAL:</span>
                              <span>S/ {payments[0].total.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="text-center mt-4 pt-3 border-top">
                            <p className="text-dark fw-bold">¡GRACIAS POR SU PREFERENCIA!</p>
                            {payments[0].plataforma && (
                              <small className="text-muted">Plataforma: {payments[0].plataforma}</small>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-12 text-center mt-4">
                      <button className="btn btn-outline-primary me-2 fw-bold" onClick={printReceipt}>
                        <i className="fas fa-print me-2"></i>IMPRIMIR RECIBO
                      </button>
                      <button className="btn btn-primary fw-bold" onClick={resetForm}>
                        NUEVO PAGO
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {currentStep === 1 && (
                  <>
                    <button type="button" className="btn btn-secondary fw-bold" onClick={resetForm}>
                      CANCELAR
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-primary fw-bold"
                      onClick={() => setCurrentStep(2)}
                      disabled={!selectedPedido}
                    >
                      CONTINUAR AL PAGO
                    </button>
                  </>
                )}
                {currentStep === 2 && (
                  <>
                    <button type="button" className="btn btn-secondary fw-bold" onClick={() => setCurrentStep(1)}>
                      VOLVER
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-success fw-bold"
                      onClick={procesarPagoDelivery}
                      disabled={paymentMethod === 'cash' && cashData.received < selectedPedido?.pedido.monto_total}
                    >
                      CONFIRMAR PAGO
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Pagos Recientes - SOLO DELIVERY */}
      <div className="row">
        <div className="col-12">
          <h3 className="h4 mb-3 fw-bold text-dark">PAGOS DELIVERY RECIENTES</h3>
          {payments.length === 0 ? (
            <div className="card border-dark">
              <div className="card-body text-center text-dark">
                <p className="mb-0 fw-bold">NO HAY PAGOS DELIVERY REGISTRADOS</p>
              </div>
            </div>
          ) : (
            <div className="row">
              {payments.map((payment) => (
                <div key={payment.id} className="col-md-6 col-lg-4 mb-3">
                  <div className="card h-100 border-dark">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title fw-bold text-primary">{payment.orderId}</h6>
                        <span className="badge bg-success fw-bold">COMPLETADO</span>
                      </div>
                      <p className="card-text small text-dark">
                        <i className="fas fa-user me-1"></i>
                        <strong>{payment.customerName}</strong>
                        <br />
                        <i className="fas fa-map-marker-alt me-1"></i>
                        {payment.customerAddress}
                        <br />
                        <i className="fas fa-phone me-1"></i>
                        {payment.customerPhone}
                      </p>
                      <div className="d-flex justify-content-between align-items-center">
                        <span className={`badge fw-bold ${
                          payment.paymentMethod === 'cash' ? 'bg-success' :
                          payment.paymentMethod === 'card' ? 'bg-primary' :
                          payment.paymentMethod === 'yape' ? 'bg-warning text-dark' : 'bg-info text-dark'
                        }`}>
                          {payment.paymentMethod === 'cash' && 'EFECTIVO'}
                          {payment.paymentMethod === 'card' && 'TARJETA'}
                          {payment.paymentMethod === 'yape' && 'YAPE'}
                          {payment.paymentMethod === 'plin' && 'PLIN'}
                        </span>
                        <strong className="h5 mb-0 text-dark">S/ {payment.total.toFixed(2)}</strong>
                      </div>
                      {payment.plataforma && (
                        <div className="mt-2">
                          <small className="text-muted">
                            <i className="fas fa-truck me-1"></i>
                            {payment.plataforma}
                          </small>
                        </div>
                      )}
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