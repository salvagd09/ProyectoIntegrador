import { useState, useRef } from 'react';

const PaymentManager = () => {
  const [payments, setPayments] = useState([
    {
      id: '1',
      orderId: 'PED-001',
      type: 'local',
      customerName: 'Juan Pérez',
      tableNumber: '5',
      items: [
        { id: '1', name: 'Ceviche Mixto', quantity: 1, price: 35 },
        { id: '2', name: 'Chicha Morada', quantity: 2, price: 6 }
      ],
      subtotal: 47,
      tax: 8.46,
      discount: 0,
      total: 55.46,
      paymentMethod: 'cash',
      cashReceived: 60,
      changeAmount: 4.54,
      status: 'completed',
      createdAt: new Date().toLocaleString('es-PE')
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  
  const [orderData, setOrderData] = useState({
    orderId: `PED-${Date.now().toString().slice(-3)}`,
    type: 'local',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    tableNumber: '',
    discount: 0
  });

  const [orderItems, setOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  const [cashData, setCashData] = useState({
    received: 0,
    change: 0
  });

  const receiptRef = useRef(null);

  // Cálculos
  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax - orderData.discount;
    
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

  // Manejo de items
  const addOrderItem = () => {
    setOrderItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0
    }]);
  };

  const updateOrderItem = (id, field, value) => {
    setOrderItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Cálculo de cambio
  const calculateChange = (received) => {
    const change = received - total;
    setCashData({ received, change: Math.max(0, change) });
  };

  // Procesar pago
  const processPayment = () => {
    if (paymentMethod === 'cash' && cashData.received < total) {
      alert('El monto recibido es insuficiente');
      return;
    }

    const newPayment = {
      id: Date.now().toString(),
      orderId: orderData.orderId,
      type: orderData.type,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone || undefined,
      customerAddress: orderData.customerAddress || undefined,
      tableNumber: orderData.tableNumber || undefined,
      items: orderItems.filter(item => item.name && item.price > 0),
      subtotal,
      tax,
      discount: orderData.discount,
      total,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'cash' ? cashData.received : undefined,
      changeAmount: paymentMethod === 'cash' ? cashData.change : undefined,
      status: 'completed',
      createdAt: new Date().toLocaleString('es-PE')
    };

    setPayments(prev => [newPayment, ...prev]);
    setCurrentStep(3);
  };

  // Resetear formulario
  const resetForm = () => {
    setOrderData({
      orderId: `PED-${Date.now().toString().slice(-3)}`,
      type: 'local',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      tableNumber: '',
      discount: 0
    });
    setOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setCashData({ received: 0, change: 0 });
    setPaymentMethod('cash');
    setCurrentStep(1);
    setShowModal(false);
  };

  // Imprimir recibo
  const printReceipt = () => {
    const receiptContent = receiptRef.current;
    if (receiptContent) {
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

  // Estadísticas
  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, payment) => sum + payment.total, 0);

  const todayPayments = payments.filter(p => {
    const today = new Date().toDateString();
    return new Date(p.createdAt).toDateString() === today;
  });

  return (
    <div className="container-fluid p-4">
      {/* Header sin título */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          {/* Sin título - espacio vacío */}
        </div>
        <button 
          className="btn btn-success fw-bold"
          onClick={() => setShowModal(true)}
        >
          <i className="fas fa-plus me-2"></i>
          Nuevo Pago
        </button>
      </div>

      {/* Estadísticas con mejor contraste */}
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
                  <h4 className="fw-bold">S/ {totalRevenue.toFixed(2)}</h4>
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
                  <h6 className="card-title fw-bold">PRODUCTOS</h6>
                  <h4 className="fw-bold">
                    {payments.reduce((sum, payment) => sum + payment.items.length, 0)}
                  </h4>
                  <small>Total vendidos</small>
                </div>
                <i className="fas fa-shopping-cart fa-2x opacity-75"></i>
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
                  {currentStep === 1 && '📝 REGISTRAR PEDIDO'}
                  {currentStep === 2 && '💳 PROCESAR PAGO'}
                  {currentStep === 3 && '✅ PAGO COMPLETADO'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>

              <div className="modal-body">
                {/* Paso 1: Información del Pedido */}
                {currentStep === 1 && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <h6 className="fw-bold text-dark mb-3">TIPO DE PEDIDO</h6>
                      <div className="btn-group w-100" role="group">
                        <button
                          type="button"
                          className={`btn ${orderData.type === 'local' ? 'btn-primary fw-bold' : 'btn-outline-primary'}`}
                          onClick={() => setOrderData(prev => ({ ...prev, type: 'local' }))}
                        >
                          🏠 EN LOCAL
                        </button>
                        <button
                          type="button"
                          className={`btn ${orderData.type === 'delivery' ? 'btn-success fw-bold' : 'btn-outline-success'}`}
                          onClick={() => setOrderData(prev => ({ ...prev, type: 'delivery' }))}
                        >
                          🛵 DELIVERY
                        </button>
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">NOMBRE DEL CLIENTE *</label>
                      <input
                        type="text"
                        className="form-control border-dark"
                        value={orderData.customerName}
                        onChange={(e) => setOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Ingrese nombre completo"
                      />
                    </div>

                    {orderData.type === 'local' ? (
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold text-dark">NÚMERO DE MESA</label>
                        <input
                          type="text"
                          className="form-control border-dark"
                          value={orderData.tableNumber}
                          onChange={(e) => setOrderData(prev => ({ ...prev, tableNumber: e.target.value }))}
                          placeholder="Ej: 5"
                        />
                      </div>
                    ) : (
                      <div className="col-md-6 mb-3">
                        <label className="form-label fw-bold text-dark">TELÉFONO *</label>
                        <input
                          type="tel"
                          className="form-control border-dark"
                          value={orderData.customerPhone}
                          onChange={(e) => setOrderData(prev => ({ ...prev, customerPhone: e.target.value }))}
                          placeholder="+51 987 654 321"
                        />
                      </div>
                    )}

                    {orderData.type === 'delivery' && (
                      <div className="col-12 mb-3">
                        <label className="form-label fw-bold text-dark">DIRECCIÓN DE ENTREGA *</label>
                        <input
                          type="text"
                          className="form-control border-dark"
                          value={orderData.customerAddress}
                          onChange={(e) => setOrderData(prev => ({ ...prev, customerAddress: e.target.value }))}
                          placeholder="Dirección completa"
                        />
                      </div>
                    )}

                    <div className="col-12 mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="form-label mb-0 fw-bold text-dark">ITEMS DEL PEDIDO</label>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary fw-bold"
                          onClick={addOrderItem}
                        >
                          <i className="fas fa-plus me-1"></i>AGREGAR ITEM
                        </button>
                      </div>
                      
                      {orderItems.map((item, index) => (
                        <div key={item.id} className="row g-2 mb-2 align-items-center">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm border-dark"
                              value={item.name}
                              onChange={(e) => updateOrderItem(item.id, 'name', e.target.value)}
                              placeholder={`Producto ${index + 1}`}
                            />
                          </div>
                          <div className="col-2">
                            <input
                              type="number"
                              className="form-control form-control-sm border-dark"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              className="form-control form-control-sm border-dark"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </div>
                          <div className="col-1 text-center small fw-bold text-primary">
                            S/ {(item.price * item.quantity).toFixed(2)}
                          </div>
                          <div className="col-1">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeOrderItem(item.id)}
                              disabled={orderItems.length === 1}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">DESCUENTO (S/)</label>
                      <input
                        type="number"
                        className="form-control border-dark"
                        min="0"
                        step="0.01"
                        value={orderData.discount}
                        onChange={(e) => setOrderData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="card border-dark">
                        <div className="card-body">
                          <h6 className="card-title fw-bold text-dark">RESUMEN DEL PEDIDO</h6>
                          <div className="d-flex justify-content-between small fw-bold text-dark">
                            <span>Subtotal:</span>
                            <span>S/ {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between small fw-bold text-dark">
                            <span>IGV (18%):</span>
                            <span>S/ {tax.toFixed(2)}</span>
                          </div>
                          {orderData.discount > 0 && (
                            <div className="d-flex justify-content-between small fw-bold text-success">
                              <span>Descuento:</span>
                              <span>- S/ {orderData.discount.toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="my-2 border-dark" />
                          <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                            <span>TOTAL:</span>
                            <span>S/ {total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Método de Pago */}
                {currentStep === 2 && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="alert alert-dark text-center border-0">
                        <h4 className="mb-0 fw-bold">TOTAL A PAGAR: S/ {total.toFixed(2)}</h4>
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
                            {/* QR Mejorado */}
                            <div className="bg-white p-4 rounded border border-warning mb-4">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=YAPE-${total}-${orderData.orderId}&format=png&margin=10&color=000000&bgcolor=FFFFFF`}
                                alt="QR Yape" 
                                className="img-fluid"
                                style={{ maxWidth: '200px' }}
                              />
                            </div>
                            <h5 className="text-warning fw-bold">PAGA CON YAPE</h5>
                            <p className="mb-2 fw-bold text-dark">NÚMERO: <span className="fs-4 text-primary">999 888 777</span></p>
                            <h4 className="text-warning fw-bold mb-3">S/ {total.toFixed(2)}</h4>
                            <div className="alert alert-warning fw-bold">
                              REFERENCIA: <strong>{orderData.orderId}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'plin' && (
                      <div className="col-12 text-center">
                        <div className="card border-info">
                          <div className="card-body">
                            {/* QR Mejorado */}
                            <div className="bg-white p-4 rounded border border-info mb-4">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PLIN-${total}-${orderData.orderId}&format=png&margin=10&color=000000&bgcolor=FFFFFF`}
                                alt="QR Plin" 
                                className="img-fluid"
                                style={{ maxWidth: '200px' }}
                              />
                            </div>
                            <h5 className="text-info fw-bold">PAGA CON PLIN</h5>
                            <p className="mb-2 fw-bold text-dark">NÚMERO: <span className="fs-4 text-primary">999 888 777</span></p>
                            <h4 className="text-info fw-bold mb-3">S/ {total.toFixed(2)}</h4>
                            <div className="alert alert-info fw-bold">
                              REFERENCIA: <strong>{orderData.orderId}</strong>
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
                            <h4 className="text-primary fw-bold">S/ {total.toFixed(2)}</h4>
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
                                <tr key={item.id}>
                                  <td className="text-dark">{item.quantity}x {item.name}</td>
                                  <td className="text-end fw-bold text-dark">S/ {(item.price * item.quantity).toFixed(2)}</td>
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
                            {payments[0].discount > 0 && (
                              <div className="d-flex justify-content-between small fw-bold text-success">
                                <span>Descuento:</span>
                                <span>- S/ {payments[0].discount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between fw-bold fs-5 mt-2 pt-2 border-top text-primary">
                              <span>TOTAL:</span>
                              <span>S/ {payments[0].total.toFixed(2)}</span>
                            </div>
                          </div>

                          <div className="text-center mt-4 pt-3 border-top">
                            <p className="text-dark fw-bold">¡GRACIAS POR SU PREFERENCIA!</p>
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
                      disabled={!orderData.customerName || orderItems.every(item => !item.name || item.price <= 0)}
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
                      onClick={processPayment}
                      disabled={paymentMethod === 'cash' && cashData.received < total}
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

      {/* Lista de Pagos Recientes */}
      <div className="row">
        <div className="col-12">
          <h3 className="h4 mb-3 fw-bold text-dark">PAGOS RECIENTES</h3>
          {payments.length === 0 ? (
            <div className="card border-dark">
              <div className="card-body text-center text-dark">
                <p className="mb-0 fw-bold">NO HAY PAGOS REGISTRADOS</p>
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
                        {payment.tableNumber && (
                          <><i className="fas fa-utensils me-1"></i>MESA {payment.tableNumber}</>
                        )}
                        {!payment.tableNumber && (
                          <><i className="fas fa-motorcycle me-1"></i>DELIVERY</>
                        )}
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
