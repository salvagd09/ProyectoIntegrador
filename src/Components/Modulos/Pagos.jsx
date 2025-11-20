import { useState, useRef, useEffect } from 'react';

const PaymentManager = () => {
  const [payments, setPayments] = useState([]);
  const [pedidosDeliveryPendientes, setPedidosDeliveryPendientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [modalMode, setModalMode] = useState('local');
  const [selectedPedido, setSelectedPedido] = useState(null);

  const [orderData, setOrderData] = useState({
    orderId: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    tableNumber: '',
    discount: 0
  });

  const [orderItems, setOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  const [deliveryOrderData, setDeliveryOrderData] = useState({
    orderId: '',
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    discount: 0
  });

  const [deliveryOrderItems, setDeliveryOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

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
    obtenerPedidosDeliveryPendientes();
    obtenerHistorialPagos();
  }, []);

  const obtenerHistorialPagos = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/pagos/historial');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPayments(data.pagos);
        }
      }
    } catch (error) {
      console.error('Error al obtener historial de pagos:', error);
    }
  };

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

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax - orderData.discount;
    return { subtotal, tax, total };
  };

  const totals = calculateTotals();
  const subtotal = totals.subtotal;
  const tax = totals.tax;
  const total = totals.total;

  const addOrderItem = () => {
    const newId = Date.now().toString();
    setOrderItems([...orderItems, { id: newId, name: '', quantity: 1, price: 0 }]);
  };

  const updateOrderItem = (id, field, value) => {
    setOrderItems(orderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeOrderItem = (id) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== id));
    }
  };

  const calculateDeliveryTotals = () => {
    const subtotal = deliveryOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax - deliveryOrderData.discount;
    return { subtotal, tax, total };
  };

  const deliveryTotals = calculateDeliveryTotals();
  const deliverySubtotal = deliveryTotals.subtotal;
  const deliveryTax = deliveryTotals.tax;
  const deliveryTotal = deliveryTotals.total;

  const addDeliveryOrderItem = () => {
    const newId = Date.now().toString();
    setDeliveryOrderItems([...deliveryOrderItems, { id: newId, name: '', quantity: 1, price: 0 }]);
  };

  const updateDeliveryOrderItem = (id, field, value) => {
    setDeliveryOrderItems(deliveryOrderItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeDeliveryOrderItem = (id) => {
    if (deliveryOrderItems.length > 1) {
      setDeliveryOrderItems(deliveryOrderItems.filter(item => item.id !== id));
    }
  };

  const calculateChange = (received) => {
    let amount = 0;
    
    if (modalMode === 'delivery' && selectedPedido) {
      amount = selectedPedido.pedido.monto_total;
    } else if (modalMode === 'delivery') {
      amount = deliveryTotal;
    } else {
      amount = total;
    }
    
    const change = received - amount;
    setCashData({ received, change: Math.max(0, change) });
  };

  const generarLinkPago = async () => {
    setLinkPago({ loading: true, paymentUrl: null, qrUrl: null, linkId: null });
    
    try {
      const monto = getTotalAmount();
      const email = orderData.customerEmail;
      
      const idInput = prompt("Ingresa el ID del pedido para generar el link:");
      
      if (!idInput) {
        alert("Debes ingresar un ID de pedido");
        setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
        return;
      }
      
      const pedidoIdParaLink = parseInt(idInput);
      
      if (isNaN(pedidoIdParaLink) || pedidoIdParaLink <= 0) {
        alert("ID invalido");
        setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
        return;
      }

      const response = await fetch("http://127.0.0.1:8000/api/pagos/generar-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: pedidoIdParaLink,
          monto: monto,
          email_cliente: email
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

  const processPayment = async () => {
    if (paymentMethod === 'cash' && cashData.received < getTotalAmount()) {
      alert('El monto recibido es insuficiente');
      return;
    }

    const timestamp = Date.now().toString();
    const referenciaPago = paymentMethod === 'digital' 
      ? (linkPago.linkId || 'LINK-' + timestamp)
      : ('EFECTIVO-' + timestamp);

    await createPaymentInDatabase(referenciaPago);
  };

  const getTotalAmount = () => {
    if (modalMode === 'delivery' && selectedPedido) {
      return selectedPedido.pedido.monto_total;
    } else if (modalMode === 'delivery') {
      return deliveryTotal;
    } else {
      return total;
    }
  };

  const createPaymentInDatabase = async (cargoId) => {
    try {
      let pedidoIdReal;
      let montoReal;

      if (modalMode === 'local') {
        const idInput = prompt("Ingresa el ID de un pedido existente:");
        
        if (!idInput) {
          alert("Debes ingresar un ID de pedido");
          return;
        }
        
        pedidoIdReal = parseInt(idInput);
        
        if (isNaN(pedidoIdReal) || pedidoIdReal <= 0) {
          alert("ID invalido");
          return;
        }

        const verifyUrl = 'http://127.0.0.1:8000/api/pagos/verificar-pedido/' + pedidoIdReal.toString();
        const verifyResponse = await fetch(verifyUrl);
        const verifyData = await verifyResponse.json();

        if (!verifyData.existe) {
          throw new Error(verifyData.mensaje);
        }

        if (!verifyData.puede_pagar) {
          throw new Error(verifyData.mensaje);
        }

        montoReal = verifyData.pedido ? verifyData.pedido.monto_total : total;
        
      } else {
        pedidoIdReal = selectedPedido.pedido.id;
        montoReal = selectedPedido.pedido.monto_total;
      }

      const timestamp = Date.now().toString();
      const pagoData = {
        pedido_id: pedidoIdReal,
        monto: montoReal,
        metodo_pago: paymentMethod === 'cash' ? 'efectivo' : 'tarjeta',
        referencia_pago: cargoId || ('REF-' + timestamp)
      };

      const response = await fetch('http://127.0.0.1:8000/api/pagos/registrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pagoData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al registrar pago');
      }

      await obtenerHistorialPagos();
      await obtenerPedidosDeliveryPendientes();
      setCurrentStep(3);
      
    } catch (error) {
      console.error('Error en el proceso de pago:', error);
      alert(error.message);
    }
  };

  const resetForm = () => {
    setOrderData({
      orderId: '',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      tableNumber: '',
      discount: 0
    });
    setOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setDeliveryOrderData({
      orderId: '',
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      discount: 0
    });
    setDeliveryOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setCashData({ received: 0, change: 0 });
    setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null });
    setPaymentMethod('cash');
    setSelectedPedido(null);
    setCurrentStep(1);
    setShowModal(false);
  };

  const printReceipt = () => {
    const receiptContent = receiptRef.current;
    if (receiptContent && payments[0]) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const receiptId = payments[0].orderId || payments[0].id;
        printWindow.document.write('<html><head><title>Recibo</title></head><body>' + receiptContent.innerHTML + '</body></html>');
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const totalRevenue = payments.reduce((sum, payment) => sum + (payment.monto || 0), 0);
  const todayPayments = payments.filter(payment => {
    const paymentDate = new Date(payment.fecha_pago || payment.createdAt);
    return paymentDate.toDateString() === new Date().toDateString();
  });

  return (
    <div className="container-fluid p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 fw-bold text-dark">SISTEMA DE PAGOS</h2>
        <div className="d-flex gap-2">
          <button 
            className="btn btn-primary fw-bold"
            onClick={() => {
              setModalMode('delivery');
              setShowModal(true);
              setCurrentStep(1);
              setSelectedPedido(null);
            }}
          >
            Pago Delivery
          </button>
          <button 
            className="btn btn-success fw-bold"
            onClick={() => {
              setModalMode('local');
              setShowModal(true);
              setCurrentStep(1);
            }}
          >
            Nuevo Pago Local
          </button>
        </div>
      </div>

      <div className="row mb-4">
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-primary text-white">
            <div className="card-body">
              <h6 className="fw-bold">PAGOS HOY</h6>
              <h4 className="fw-bold">{todayPayments.length}</h4>
              <small>Total del dia</small>
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
              <h4 className="fw-bold">{payments.filter(p => p.estado === 'pagado').length}</h4>
              <small>Pagos exitosos</small>
            </div>
          </div>
        </div>
        <div className="col-md-3 col-6 mb-3">
          <div className="card border-0 shadow-sm bg-warning text-dark">
            <div className="card-body">
              <h6 className="fw-bold">PENDIENTES</h6>
              <h4 className="fw-bold">{pedidosDeliveryPendientes.length}</h4>
              <small>Delivery por cobrar</small>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {currentStep === 1 && modalMode === 'local' && 'REGISTRAR PEDIDO LOCAL'}
                  {currentStep === 1 && modalMode === 'delivery' && 'REGISTRAR PEDIDO DELIVERY'}
                  {currentStep === 2 && 'PROCESAR PAGO'}
                  {currentStep === 3 && 'PAGO COMPLETADO'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={resetForm}
                ></button>
              </div>

              <div className="modal-body" style={{maxHeight: '70vh', overflowY: 'auto'}}>
                {currentStep === 1 && modalMode === 'local' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">NOMBRE DEL CLIENTE</label>
                      <input
                        type="text"
                        className="form-control"
                        value={orderData.customerName}
                        onChange={(e) => setOrderData({...orderData, customerName: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">EMAIL</label>
                      <input
                        type="email"
                        className="form-control"
                        value={orderData.customerEmail}
                        onChange={(e) => setOrderData({...orderData, customerEmail: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">MESA</label>
                      <input
                        type="text"
                        className="form-control"
                        value={orderData.tableNumber}
                        onChange={(e) => setOrderData({...orderData, tableNumber: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">TELEFONO</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={orderData.customerPhone}
                        onChange={(e) => setOrderData({...orderData, customerPhone: e.target.value})}
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <label className="fw-bold">ITEMS</label>
                        <button className="btn btn-sm btn-primary" onClick={addOrderItem}>
                          Agregar Item
                        </button>
                      </div>
                      {orderItems.map((item, idx) => (
                        <div key={item.id} className="row g-2 mb-2">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.name}
                              onChange={(e) => updateOrderItem(item.id, 'name', e.target.value)}
                              placeholder="Producto"
                            />
                          </div>
                          <div className="col-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.price}
                              step="0.01"
                              onChange={(e) => updateOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-2">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeOrderItem(item.id)}
                              disabled={orderItems.length === 1}
                            >
                              X
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between">
                            <span>Subtotal:</span>
                            <span>S/ {subtotal.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>IGV (18%):</span>
                            <span>S/ {tax.toFixed(2)}</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>TOTAL:</span>
                            <span>S/ {total.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 1 && modalMode === 'delivery' && (
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">NOMBRE</label>
                      <input
                        type="text"
                        className="form-control"
                        value={deliveryOrderData.customerName}
                        onChange={(e) => setDeliveryOrderData({...deliveryOrderData, customerName: e.target.value})}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold">TELEFONO</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={deliveryOrderData.customerPhone}
                        onChange={(e) => setDeliveryOrderData({...deliveryOrderData, customerPhone: e.target.value})}
                      />
                    </div>
                    <div className="col-12 mb-3">
                      <label className="form-label fw-bold">DIRECCION</label>
                      <input
                        type="text"
                        className="form-control"
                        value={deliveryOrderData.customerAddress}
                        onChange={(e) => setDeliveryOrderData({...deliveryOrderData, customerAddress: e.target.value})}
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <div className="d-flex justify-content-between mb-2">
                        <label className="fw-bold">ITEMS</label>
                        <button className="btn btn-sm btn-primary" onClick={addDeliveryOrderItem}>
                          Agregar Item
                        </button>
                      </div>
                      {deliveryOrderItems.map((item) => (
                        <div key={item.id} className="row g-2 mb-2">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.name}
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'name', e.target.value)}
                            />
                          </div>
                          <div className="col-2">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.price}
                              step="0.01"
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                            />
                          </div>
                          <div className="col-2">
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => removeDeliveryOrderItem(item.id)}
                              disabled={deliveryOrderItems.length === 1}
                            >
                              X
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="col-12">
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex justify-content-between">
                            <span>Subtotal:</span>
                            <span>S/ {deliverySubtotal.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>IGV (18%):</span>
                            <span>S/ {deliveryTax.toFixed(2)}</span>
                          </div>
                          <hr />
                          <div className="d-flex justify-content-between fw-bold">
                            <span>TOTAL:</span>
                            <span>S/ {deliveryTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div>
                    <div className="alert alert-info text-center mb-4">
                      <h4>TOTAL A PAGAR: S/ {getTotalAmount().toFixed(2)}</h4>
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
                            <div className="alert alert-info">
                              Comparte el link/QR con el cliente y haz clic en CONFIRMAR PAGO
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {currentStep === 3 && payments[0] && (
                  <div ref={receiptRef} className="text-center">
                    <div className="mb-4">
                      <i className="fas fa-check-circle text-success" style={{fontSize: '4rem'}}></i>
                    </div>
                    <h3 className="text-success mb-4">PAGO COMPLETADO</h3>
                    <div className="card">
                      <div className="card-body">
                        <h5 className="mb-3">Pedido #{payments[0].pedido_id}</h5>
                        <p className="mb-2">Monto: S/ {payments[0].monto.toFixed(2)}</p>
                        <p className="mb-4">Metodo: {payments[0].metodo_pago}</p>
                        <button className="btn btn-primary me-2" onClick={printReceipt}>
                          Imprimir
                        </button>
                        <button className="btn btn-success" onClick={resetForm}>
                          Nuevo Pago
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {currentStep === 1 && (
                  <div className="w-100 d-flex justify-content-between">
                    <button className="btn btn-secondary" onClick={resetForm}>
                      Cancelar
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentStep(2)}
                      disabled={
                        (modalMode === 'local' && (!orderData.customerName || !orderData.customerEmail)) ||
                        (modalMode === 'delivery' && (!deliveryOrderData.customerName || !deliveryOrderData.customerPhone))
                      }
                    >
                      Continuar
                    </button>
                  </div>
                )}
                {currentStep === 2 && (
                  <div className="w-100 d-flex justify-content-between">
                    <button className="btn btn-secondary" onClick={() => setCurrentStep(1)}>
                      Volver
                    </button>
                    <button
                      className="btn btn-success"
                      onClick={processPayment}
                      disabled={paymentMethod === 'cash' && cashData.received < getTotalAmount()}
                    >
                      CONFIRMAR PAGO
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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
                  <div className="card h-100 border-dark shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title fw-bold text-primary">{payment.orderId}</h6>
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
