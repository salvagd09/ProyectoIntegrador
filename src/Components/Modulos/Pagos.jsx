import { useState, useRef, useEffect } from 'react';

const PaymentManager = () => {
  // ========== ESTADOS COMBINADOS ==========
  
  const [payments, setPayments] = useState([
    {
      id: '1',
      orderId: 'PED-001',
      type: 'local',
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
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

  const [pedidosDeliveryPendientes, setPedidosDeliveryPendientes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [modalMode, setModalMode] = useState('local');
  const [selectedPedido, setSelectedPedido] = useState(null);

  // Estados para pedidos locales
  const [orderData, setOrderData] = useState({
    orderId: `PED-${Date.now().toString().slice(-3)}`,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    tableNumber: '',
    discount: 0
  });

  const [orderItems, setOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  // Estados para pedidos DELIVERY
  const [deliveryOrderData, setDeliveryOrderData] = useState({
    orderId: `DEL-${Date.now().toString().slice(-3)}`,
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    discount: 0
  });

  const [deliveryOrderItems, setDeliveryOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  // Estados de pago
  const [cashData, setCashData] = useState({
    received: 0,
    change: 0
  });

  const [culqiData, setCulqiData] = useState({
    processing: false,
    success: false,
    cargoId: null
  });

  // NUEVO ESTADO PARA LINK DE PAGO
  const [linkPago, setLinkPago] = useState({
    loading: false,
    paymentUrl: null,
    qrUrl: null,
    linkId: null,
    verificando: false
  });

  const receiptRef = useRef(null);

  // ========== EFFECTS ==========
  
  useEffect(() => {
    obtenerPedidosDeliveryPendientes();
  }, []);

  // ========== FUNCIONES DELIVERY ==========

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

  // ========== FUNCIONES LOCALES ==========

  const calculateTotals = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax - orderData.discount;
    return { subtotal, tax, total };
  };

  const { subtotal, tax, total } = calculateTotals();

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

  // ========== FUNCIONES DELIVERY ITEMS ==========

  const calculateDeliveryTotals = () => {
    const subtotal = deliveryOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax - deliveryOrderData.discount;
    return { subtotal, tax, total };
  };

  const { subtotal: deliverySubtotal, tax: deliveryTax, total: deliveryTotal } = calculateDeliveryTotals();

  const addDeliveryOrderItem = () => {
    setDeliveryOrderItems(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      quantity: 1,
      price: 0
    }]);
  };

  const updateDeliveryOrderItem = (id, field, value) => {
    setDeliveryOrderItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const removeDeliveryOrderItem = (id) => {
    if (deliveryOrderItems.length > 1) {
      setDeliveryOrderItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // ========== FUNCIONES DE PAGO ==========

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

  // 🔹 NUEVA FUNCIÓN: Generar Link de Pago (SOLO PARA LOCAL)
  const generarLinkPago = async () => {
    setLinkPago({ loading: true, paymentUrl: null, qrUrl: null, linkId: null, verificando: false });
    
    try {
      const monto = getTotalAmount();
      const email = orderData.customerEmail;
      
      const response = await fetch("http://127.0.0.1:8000/api/pagos/generar-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido_id: parseInt(orderData.orderId.split('-')[1]),
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
          linkId: data.link_id,
          verificando: false
        });
        
        // Iniciar verificación automática
        iniciarVerificacionAutomatica(data.link_id);
      } else {
        alert('Error: ' + data.mensaje);
        setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null, verificando: false });
      }
    } catch (error) {
      console.error('Error generando link:', error);
      alert('Error al generar link de pago');
      setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null, verificando: false });
    }
  };

  // 🔄 NUEVA FUNCIÓN: Verificar Pago Automáticamente (SOLO PARA LOCAL)
  const iniciarVerificacionAutomatica = (linkId) => {
    const verificar = async () => {
      if (!linkPago.verificando) return;
      
      try {
        const response = await fetch("http://127.0.0.1:8000/api/pagos/verificar-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ link_id: linkId })
        });
        
        const data = await response.json();
        
        if (data.success && data.verificado) {
          // ✅ PAGO CONFIRMADO - Proceder al siguiente paso
          setLinkPago(prev => ({ ...prev, verificando: false }));
          setCulqiData({ processing: false, success: true, cargoId: linkId });
          alert('✅ Pago confirmado! El cliente pagó exitosamente.');
          
          // Procesar automáticamente el pago
          setTimeout(() => {
            processPayment(linkId);
          }, 1000);
        } else if (data.success && !data.verificado) {
          // ⏳ Seguir verificando cada 3 segundos
          setTimeout(() => verificar(), 3000);
        }
      } catch (error) {
        console.error('Error verificando pago:', error);
        setTimeout(() => verificar(), 3000);
      }
    };
    
    setLinkPago(prev => ({ ...prev, verificando: true }));
    setTimeout(() => verificar(), 3000);
  };

  // ========== PROCESAR PAGO ==========

  const processPayment = (cargoId = null) => {
    // Validaciones según método de pago
    if (paymentMethod === 'cash' && cashData.received < getTotalAmount()) {
      alert('El monto recibido es insuficiente');
      return;
    }

    if (modalMode === 'local' && paymentMethod === 'digital' && !culqiData.success) {
      alert('⚠️ El pago digital no se ha completado');
      return;
    }

    // Crear la tarjeta en el sistema de pagos
    createPaymentCard(cargoId);
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

  // 🔹 CREAR TARJETA EN EL SISTEMA DE PAGOS
  const createPaymentCard = async (cargoId = null) => {
    try {
      let paymentData;

      if (modalMode === 'local') {
        // Para pago local
        paymentData = {
          id: Date.now().toString(),
          orderId: orderData.orderId,
          type: 'local',
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          tableNumber: orderData.tableNumber,
          items: orderItems.filter(item => item.name && item.price > 0),
          subtotal,
          tax,
          discount: orderData.discount,
          total,
          paymentMethod,
          cashReceived: paymentMethod === 'cash' ? cashData.received : undefined,
          changeAmount: paymentMethod === 'cash' ? cashData.change : undefined,
          cargoId: cargoId || culqiData.cargoId,
          status: 'completed',
          createdAt: new Date().toLocaleString('es-PE')
        };
      } else {
        // ✅ CORRECCIÓN: Para pago delivery - SOLO REGISTRO LOCAL
        console.log("🎯 Registrando pago delivery localmente...");
        
        // Calcular subtotal e IGV correctamente
        let subtotalCalculado, taxCalculado, totalCalculado;
        
        if (selectedPedido) {
          // Si hay pedido seleccionado de la lista
          subtotalCalculado = selectedPedido.pedido.monto_total / 1.18;
          taxCalculado = selectedPedido.pedido.monto_total - subtotalCalculado;
          totalCalculado = selectedPedido.pedido.monto_total;
        } else {
          // Si es desde formulario
          subtotalCalculado = deliverySubtotal;
          taxCalculado = deliveryTax;
          totalCalculado = deliveryTotal;
        }
        
        paymentData = {
          id: Date.now().toString(),
          orderId: selectedPedido ? `DEL-${selectedPedido.pedido.id}` : deliveryOrderData.orderId,
          type: 'delivery',
          customerName: selectedPedido ? selectedPedido.delivery_info.nombre_cliente : deliveryOrderData.customerName,
          customerPhone: selectedPedido ? selectedPedido.delivery_info.telefono_cliente : deliveryOrderData.customerPhone,
          customerAddress: selectedPedido ? selectedPedido.delivery_info.direccion_cliente : deliveryOrderData.customerAddress,
          items: selectedPedido ? selectedPedido.detalles : deliveryOrderItems.filter(item => item.name && item.price > 0),
          subtotal: subtotalCalculado,
          tax: taxCalculado,
          discount: 0,
          total: totalCalculado,
          paymentMethod: paymentMethod,
          cashReceived: paymentMethod === 'cash' ? cashData.received : undefined,
          changeAmount: paymentMethod === 'cash' ? cashData.change : undefined,
          status: 'completed',
          createdAt: new Date().toLocaleString('es-PE'),
          plataforma: selectedPedido ? selectedPedido.delivery_info.plataforma : 'Directo'
        };

        console.log('✅ Pago delivery registrado localmente:', paymentData);
      }

      // Agregar la tarjeta al sistema de pagos
      setPayments(prev => [paymentData, ...prev]);
      setCurrentStep(3);
      
      console.log('✅ Tarjeta de pago creada:', paymentData);
      
    } catch (error) {
      console.error('❌ Error al crear tarjeta de pago:', error);
      alert('Error al procesar el pago: ' + error.message);
    }
  };

  const getPaymentMethodText = () => {
    if (paymentMethod === 'cash') return 'Efectivo';
    if (paymentMethod === 'card') return 'Tarjeta';
    if (paymentMethod === 'digital') return 'Billetera Digital';
    return 'Efectivo';
  };

  // ========== RESET Y UTILIDADES ==========

  const resetForm = () => {
    setOrderData({
      orderId: `PED-${Date.now().toString().slice(-3)}`,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      tableNumber: '',
      discount: 0
    });
    setOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setDeliveryOrderData({
      orderId: `DEL-${Date.now().toString().slice(-3)}`,
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      discount: 0
    });
    setDeliveryOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setCashData({ received: 0, change: 0 });
    setCulqiData({ processing: false, success: false, cargoId: null });
    setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null, verificando: false });
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

  // ========== ESTADÍSTICAS ==========
  const totalRevenue = payments.reduce((sum, payment) => sum + payment.total, 0);
  const todayPayments = payments.filter(payment => 
    new Date(payment.createdAt).toDateString() === new Date().toDateString()
  );

  // ========== RENDER ==========
  return (
    <div className="container-fluid p-4">
      {/* Header con dos botones */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h4 fw-bold text-dark">SISTEMA DE PAGOS</h2>
        </div>
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
            <i className="fas fa-truck me-2"></i>
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
            <i className="fas fa-plus me-2"></i>
            Nuevo Pago Local
          </button>
        </div>
      </div>

      {/* Estadísticas combinadas */}
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
                  <small>Delivery por cobrar</small>
                </div>
                <i className="fas fa-clock fa-2x opacity-75"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Pago Combinado */}
      {showModal && (
        <div className="modal show d-block" tabIndex={-1} style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title fw-bold">
                  {currentStep === 1 && modalMode === 'local' && '🏠 REGISTRAR PEDIDO LOCAL'}
                  {currentStep === 1 && modalMode === 'delivery' && '🛵 REGISTRAR PEDIDO DELIVERY'}
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
                {/* Paso 1: FORMULARIO LOCAL - SOLO CAMPOS PARA LOCAL */}
                {currentStep === 1 && modalMode === 'local' && (
                  <div className="row">
                    <div className="col-12 mb-4">
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

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">EMAIL *</label>
                      <input
                        type="email"
                        className="form-control border-dark"
                        value={orderData.customerEmail}
                        onChange={(e) => setOrderData(prev => ({ ...prev, customerEmail: e.target.value }))}
                        placeholder="cliente@ejemplo.com"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">NÚMERO DE MESA *</label>
                      <input
                        type="text"
                        className="form-control border-dark"
                        value={orderData.tableNumber}
                        onChange={(e) => setOrderData(prev => ({ ...prev, tableNumber: e.target.value }))}
                        placeholder="Ej: 5"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">TELÉFONO</label>
                      <input
                        type="tel"
                        className="form-control border-dark"
                        value={orderData.customerPhone}
                        onChange={(e) => setOrderData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+51 987 654 321"
                      />
                    </div>

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

                {/* PASO 1 - FORMULARIO DELIVERY */}
                {modalMode === 'delivery' && currentStep === 1 && (
                  <div className="row">
                    <div className="col-12 mb-4">
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">NOMBRE DEL CLIENTE *</label>
                      <input
                        type="text"
                        className="form-control border-dark"
                        value={deliveryOrderData.customerName}
                        onChange={(e) => setDeliveryOrderData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Ingrese nombre completo"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label fw-bold text-dark">TELÉFONO *</label>
                      <input
                        type="tel"
                        className="form-control border-dark"
                        value={deliveryOrderData.customerPhone}
                        onChange={(e) => setDeliveryOrderData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="+51 987 654 321"
                      />
                    </div>

                    <div className="col-12 mb-3">
                      <label className="form-label fw-bold text-dark">DIRECCIÓN DE ENTREGA *</label>
                      <input
                        type="text"
                        className="form-control border-dark"
                        value={deliveryOrderData.customerAddress}
                        onChange={(e) => setDeliveryOrderData(prev => ({ ...prev, customerAddress: e.target.value }))}
                        placeholder="Dirección completa para la entrega"
                      />
                    </div>

                    <div className="col-12 mb-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <label className="form-label mb-0 fw-bold text-dark">ITEMS DEL PEDIDO</label>
                        <button 
                          type="button" 
                          className="btn btn-sm btn-primary fw-bold"
                          onClick={addDeliveryOrderItem}
                        >
                          <i className="fas fa-plus me-1"></i>AGREGAR ITEM
                        </button>
                      </div>
                      
                      {deliveryOrderItems.map((item, index) => (
                        <div key={item.id} className="row g-2 mb-2 align-items-center">
                          <div className="col-5">
                            <input
                              type="text"
                              className="form-control form-control-sm border-dark"
                              value={item.name}
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'name', e.target.value)}
                              placeholder={`Producto ${index + 1}`}
                            />
                          </div>
                          <div className="col-2">
                            <input
                              type="number"
                              className="form-control form-control-sm border-dark"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                            />
                          </div>
                          <div className="col-3">
                            <input
                              type="number"
                              className="form-control form-control-sm border-dark"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => updateDeliveryOrderItem(item.id, 'price', parseFloat(e.target.value) || 0)}
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
                              onClick={() => removeDeliveryOrderItem(item.id)}
                              disabled={deliveryOrderItems.length === 1}
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
                        value={deliveryOrderData.discount}
                        onChange={(e) => setDeliveryOrderData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <div className="card border-dark">
                        <div className="card-body">
                          <h6 className="card-title fw-bold text-dark">RESUMEN DEL PEDIDO</h6>
                          <div className="d-flex justify-content-between small fw-bold text-dark">
                            <span>Subtotal:</span>
                            <span>S/ {deliverySubtotal.toFixed(2)}</span>
                          </div>
                          <div className="d-flex justify-content-between small fw-bold text-dark">
                            <span>IGV (18%):</span>
                            <span>S/ {deliveryTax.toFixed(2)}</span>
                          </div>
                          {deliveryOrderData.discount > 0 && (
                            <div className="d-flex justify-content-between small fw-bold text-success">
                              <span>Descuento:</span>
                              <span>- S/ {deliveryOrderData.discount.toFixed(2)}</span>
                            </div>
                          )}
                          <hr className="my-2 border-dark" />
                          <div className="d-flex justify-content-between fw-bold fs-5 text-primary">
                            <span>TOTAL:</span>
                            <span>S/ {deliveryTotal.toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paso 2: Método de Pago - VERSIÓN LOCAL (Con QR) */}
                {currentStep === 2 && modalMode === 'local' && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="alert alert-dark text-center border-0">
                        <h4 className="mb-0 fw-bold">
                          TOTAL A PAGAR: S/ {getTotalAmount().toFixed(2)}
                        </h4>
                        <small className="text-muted">
                          Cliente: {orderData.customerName}
                        </small>
                      </div>
                    </div>

                    <div className="col-12 mb-4">
                      <h6 className="fw-bold text-dark mb-3">SELECCIONE MÉTODO DE PAGO</h6>
                      <div className="row g-2">
                        <div className="col-md-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'cash' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            <i className="fas fa-money-bill-wave me-2"></i>
                            EFECTIVO
                          </button>
                        </div>
                        <div className="col-md-6">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'digital' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setPaymentMethod('digital')}
                          >
                            <i className="fas fa-mobile-alt me-2"></i>
                            PAGO DIGITAL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Efectivo - Para Local */}
                    {paymentMethod === 'cash' && modalMode === 'local' && (
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

                    {/* Pago Digital con LINK DE PAGO - SOLO PARA LOCAL */}
                    {paymentMethod === 'digital' && modalMode === 'local' && (
                      <div className="col-12">
                        <div className="card border-primary">
                          <div className="card-body text-center">
                            <h5 className="text-primary fw-bold mb-3">
                              <i className="fas fa-link me-2"></i>
                              PAGO DIGITAL
                            </h5>
                            <p className="text-muted mb-4">
                              Genera un link de pago para que el cliente pague desde su celular
                            </p>
                            
                            {!linkPago.paymentUrl ? (
                              <div>
                                <div className="alert alert-info mb-4">
                                  <strong>📱 Flujo del Pago Digital:</strong>
                                  <ol className="text-start mb-0 mt-2">
                                    <li>Generas link/QR de pago</li>
                                    <li>Cliente escanea o recibe el link</li>
                                    <li>Cliente paga con: <b>Tarjeta, Yape, Plin, etc.</b></li>
                                    <li>Sistema confirma automáticamente</li>
                                  </ol>
                                </div>
                                
                                <button 
                                  className="btn btn-primary btn-lg fw-bold"
                                  onClick={generarLinkPago}
                                  disabled={linkPago.loading}
                                >
                                  {linkPago.loading ? (
                                    <>
                                      <span className="spinner-border spinner-border-sm me-2"></span>
                                      Generando Link...
                                    </>
                                  ) : (
                                    <>
                                      <i className="fas fa-link me-2"></i>
                                      GENERAR LINK DE PAGO
                                    </>
                                  )}
                                </button>
                              </div>
                            ) : (
                              <div>
                                {/* QR PARA ESCANEAR */}
                                <div className="mb-4">
                                  <h6 className="fw-bold text-dark">📱 ESCANEAR CÓDIGO QR</h6>
                                  <div className="bg-white p-3 rounded d-inline-block border">
                                    <img 
                                      src={linkPago.qrUrl} 
                                      alt="QR de pago" 
                                      className="img-fluid"
                                      style={{ maxWidth: '250px' }}
                                    />
                                  </div>
                                  <p className="small text-muted mt-2">
                                    El cliente escanea con su celular para pagar
                                  </p>
                                </div>
                                
                                {/* LINK PARA COMPARTIR */}
                                <div className="mb-4">
                                  <h6 className="fw-bold text-dark">🔗 LINK DE PAGO</h6>
                                  <div className="input-group">
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
                                        alert('Link copiado al portapapeles');
                                      }}
                                    >
                                      <i className="fas fa-copy"></i>
                                    </button>
                                  </div>
                                  <p className="small text-muted mt-2">
                                    Copia y comparte este link con el cliente
                                  </p>
                                </div>
                                
                                {/* ESTADO DE VERIFICACIÓN */}
                                <div className="alert alert-warning">
                                  <div className="d-flex align-items-center">
                                    <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                                    <div>
                                      <strong>⏳ Esperando pago del cliente...</strong>
                                      <br />
                                      <small>El sistema verificará automáticamente cuando el cliente pague</small>
                                    </div>
                                  </div>
                                </div>
                                
                                <button 
                                  className="btn btn-outline-secondary me-2"
                                  onClick={() => setLinkPago({ loading: false, paymentUrl: null, qrUrl: null, linkId: null, verificando: false })}
                                >
                                  <i className="fas fa-sync me-1"></i>
                                  Generar Nuevo Link
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Paso 2: Método de Pago - VERSIÓN DELIVERY (Sin QR) */}
                {currentStep === 2 && modalMode === 'delivery' && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="alert alert-dark text-center border-0">
                        <h4 className="mb-0 fw-bold">
                          TOTAL A PAGAR: S/ {getTotalAmount().toFixed(2)}
                        </h4>
                        {selectedPedido && (
                          <small className="text-muted">
                            Cliente: {selectedPedido.delivery_info.nombre_cliente}
                          </small>
                        )}
                        {!selectedPedido && (
                          <small className="text-muted">
                            Cliente: {deliveryOrderData.customerName}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-12 mb-4">
                      <h6 className="fw-bold text-dark mb-3">SELECCIONE MÉTODO DE PAGO</h6>
                      <div className="row g-2">
                        {/* 3 MÉTODOS DE PAGO PARA DELIVERY */}
                        <div className="col-md-4">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'cash' ? 'btn-success' : 'btn-outline-success'}`}
                            onClick={() => setPaymentMethod('cash')}
                          >
                            <i className="fas fa-money-bill-wave me-2"></i>
                            EFECTIVO
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'card' ? 'btn-primary' : 'btn-outline-primary'}`}
                            onClick={() => setPaymentMethod('card')}
                          >
                            <i className="fas fa-credit-card me-2"></i>
                            TARJETA
                          </button>
                        </div>
                        <div className="col-md-4">
                          <button
                            className={`btn w-100 fw-bold ${paymentMethod === 'digital' ? 'btn-info' : 'btn-outline-info'}`}
                            onClick={() => setPaymentMethod('digital')}
                          >
                            <i className="fas fa-mobile-alt me-2"></i>
                            BILLETERA DIGITAL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Efectivo - Solo para Delivery */}
                    {paymentMethod === 'cash' && modalMode === 'delivery' && (
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

                    {/* Tarjeta - Solo para Delivery */}
                    {paymentMethod === 'card' && modalMode === 'delivery' && (
                      <div className="col-12">
                        <div className="alert alert-info">
                          <h6 className="fw-bold">💳 Pago con Tarjeta</h6>
                          <p className="mb-0">El pago se procesará con tarjeta de crédito/débito.</p>
                        </div>
                      </div>
                    )}

                    {/* Billetera Digital - Solo para Delivery */}
                    {paymentMethod === 'digital' && modalMode === 'delivery' && (
                      <div className="col-12">
                        <div className="alert alert-info">
                          <h6 className="fw-bold">📱 Pago con Billetera Digital</h6>
                          <p className="mb-0">El pago se procesará mediante Yape, Plin, o similar.</p>
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
                            <h4 className="fw-bold text-dark">Cevicheria el Puerto"</h4>
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
                                {paymentMethod === 'digital' && modalMode === 'local' && 'PAGO DIGITAL'}
                                {paymentMethod === 'digital' && modalMode === 'delivery' && 'BILLETERA DIGITAL'}
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
                              {payments[0].items.map((item, index) => (
                                <tr key={item.id || index}>
                                  <td className="text-dark">
                                    {item.quantity}x {item.name || item.nombre_producto}
                                  </td>
                                  <td className="text-end fw-bold text-dark">
                                    S/ {((item.price || item.precio_unitario) * item.quantity).toFixed(2)}
                                  </td>
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

                            {paymentMethod === 'cash' && payments[0].cashReceived && (
                              <>
                                <div className="d-flex justify-content-between small fw-bold text-dark mt-2">
                                  <span>Recibido:</span>
                                  <span>S/ {payments[0].cashReceived.toFixed(2)}</span>
                                </div>
                                <div className="d-flex justify-content-between small fw-bold text-success">
                                  <span>Cambio:</span>
                                  <span>S/ {payments[0].changeAmount.toFixed(2)}</span>
                                </div>
                              </>
                            )}

                            {(paymentMethod === 'digital' || payments[0].cargoId) && (
                              <div className="mt-2 text-center small">
                                <span className="text-muted">Ref. Pago: {payments[0].cargoId}</span>
                              </div>
                            )}
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
                      disabled={
                        (modalMode === 'local' && (
                          !orderData.customerName || 
                          !orderData.customerEmail ||
                          !orderData.tableNumber ||
                          orderItems.every(item => !item.name || item.price <= 0)
                        )) ||
                        (modalMode === 'delivery' && (
                          !deliveryOrderData.customerName || 
                          !deliveryOrderData.customerPhone ||
                          !deliveryOrderData.customerAddress ||
                          deliveryOrderItems.every(item => !item.name || item.price <= 0)
                        ))
                      }
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
                      onClick={() => processPayment()}
                      disabled={
                        (paymentMethod === 'cash' && cashData.received < getTotalAmount()) ||
                        (modalMode === 'local' && paymentMethod === 'digital' && !culqiData.success)
                      }
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

      {/* Lista de Pagos Recientes Combinada */}
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
                        <strong>{payment.customerName}</strong>
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
                        <small>{payment.createdAt}</small>
                      </p>
                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <span className={`badge fw-bold ${
                          payment.paymentMethod === 'cash' ? 'bg-success' : 
                          payment.paymentMethod === 'card' ? 'bg-primary' : 'bg-info'
                        }`}>
                          {payment.paymentMethod === 'cash' && 'EFECTIVO'}
                          {payment.paymentMethod === 'card' && 'TARJETA'}
                          {payment.paymentMethod === 'digital' && payment.type === 'local' && 'PAGO DIGITAL'}
                          {payment.paymentMethod === 'digital' && payment.type === 'delivery' && 'BILLETERA DIGITAL'}
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