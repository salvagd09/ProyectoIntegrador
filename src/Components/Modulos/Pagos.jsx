import { useState, useRef, useEffect } from 'react';
import CulqiTester from "./CulqiTester";

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
    type: 'local',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    tableNumber: '',
    discount: 0
  });

  const [orderItems, setOrderItems] = useState([
    { id: '1', name: '', quantity: 1, price: 0 }
  ]);

  // Estados de pago
  const [cashData, setCashData] = useState({
    received: 0,
    change: 0
  });

  const [qrData, setQrData] = useState({
    url: null,
    loading: false,
    verified: false,
    orderId: null,
    paymentCode: null
  });

  const [culqiData, setCulqiData] = useState({
    processing: false,
    success: false,
    cargoId: null
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

  // ========== FUNCIONES DE PAGO ==========

  const calculateChange = (received) => {
    let amount = 0;
    
    if (modalMode === 'delivery' && selectedPedido) {
      amount = selectedPedido.pedido.monto_total;
    } else {
      amount = total;
    }
    
    const change = received - amount;
    setCashData({ received, change: Math.max(0, change) });
  };

  // 🔹 Generar QR 
  const generateQr = async () => {
    setQrData({ url: null, loading: true, verified: false, orderId: null, paymentCode: null });
    
    try {
      const pedidoId = modalMode === 'local' 
        ? parseInt(orderData.orderId.split('-')[1]) || Date.now()
        : selectedPedido.pedido.id;
      
      const response = await fetch("http://127.0.0.1:8000/api/pagos/crear-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido_id: pedidoId })
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      if (data.success && data.qr_url) {
        setQrData({
          url: data.qr_url,
          loading: false,
          verified: false,
          orderId: data.order_id,
          paymentCode: data.payment_code
        });
      } else {
        throw new Error("Respuesta inválida del servidor");
      }
    } catch (err) {
      console.error("❌ Error al generar QR:", err);
      alert("Error al generar QR: " + err.message);
      setQrData({ url: null, loading: false, verified: false, orderId: null, paymentCode: null });
    }
  };

  // 🔹 Verificar pago QR
  const verifyQrPayment = async () => {
    if (!qrData.orderId) {
      alert('No hay una orden para verificar');
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/pagos/verificar-orden-culqi/${qrData.orderId}`, {
        method: "POST"
      });
      
      const data = await response.json();
      
      if (data.success && data.verificado) {
        setQrData(prev => ({ ...prev, verified: true }));
        alert('✅ Pago verificado correctamente con Culqi');
      } else {
        alert(`⚠️ ${data.mensaje}`);
      }
    } catch (error) {
      console.error('Error al verificar pago:', error);
      alert('Error al verificar el pago: ' + error.message);
    }
  };

  // 🔹 Callbacks Culqi
  const handleCulqiSuccess = (paymentData) => {
    console.log("✅ Pago Culqi exitoso:", paymentData);
    setCulqiData({
      processing: false,
      success: true,
      cargoId: paymentData.cargoId
    });
    
    alert('✅ Pago con tarjeta procesado exitosamente');
    
    // Procesar automáticamente el pago
    setTimeout(() => {
      processPayment(paymentData.cargoId);
    }, 1000);
  };

  const handleCulqiError = (error) => {
    console.error("❌ Error en Culqi:", error);
    setCulqiData({
      processing: false,
      success: false,
      cargoId: null
    });
    alert('❌ Error al procesar el pago con tarjeta: ' + error);
  };

  // ========== PROCESAR PAGO ==========

  const processPayment = (cargoId = null) => {
    // Validaciones según método de pago
    if (paymentMethod === 'cash' && cashData.received < getTotalAmount()) {
      alert('El monto recibido es insuficiente');
      return;
    }

    if (paymentMethod === 'qr' && !qrData.verified) {
      alert('⚠️ Debe verificar el pago QR antes de continuar');
      return;
    }

    if (paymentMethod === 'card' && !culqiData.success) {
      alert('⚠️ El pago con tarjeta no se ha completado');
      return;
    }

    // Crear la tarjeta en el sistema de pagos
    createPaymentCard(cargoId);
  };

  const getTotalAmount = () => {
    return modalMode === 'delivery' && selectedPedido 
      ? selectedPedido.pedido.monto_total 
      : total;
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
          type: orderData.type,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          customerAddress: orderData.customerAddress,
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
        // Para pago delivery
        const pagoData = {
          pedido_id: selectedPedido.pedido.id,
          metodo_pago: getPaymentMethodText(),
          referencia_pago: cargoId || `REF-${Date.now()}`
        };

        // Procesar pago en backend
        const response = await fetch('http://localhost:8000/pedidosF/procesar-pago-delivery/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pagoData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Error al procesar pago delivery');
        }

        const resultado = await response.json();
        
        paymentData = {
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
          cargoId: cargoId,
          status: 'completed',
          createdAt: new Date().toLocaleString('es-PE'),
          plataforma: resultado.datos_cliente.plataforma
        };

        // Actualizar lista de pedidos pendientes
        obtenerPedidosDeliveryPendientes();
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
    return paymentMethod === 'cash' ? 'Efectivo' : 
           paymentMethod === 'card' ? 'Tarjeta' : 'Yape/Plin';
  };

  // ========== RESET Y UTILIDADES ==========

  const resetForm = () => {
    setOrderData({
      orderId: `PED-${Date.now().toString().slice(-3)}`,
      type: 'local',
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerAddress: '',
      tableNumber: '',
      discount: 0
    });
    setOrderItems([{ id: '1', name: '', quantity: 1, price: 0 }]);
    setCashData({ received: 0, change: 0 });
    setQrData({ url: null, loading: false, verified: false });
    setCulqiData({ processing: false, success: false, cargoId: null });
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
                  {currentStep === 1 && modalMode === 'local' && '📝 REGISTRAR PEDIDO LOCAL'}
                  {currentStep === 1 && modalMode === 'delivery' && '🛵 SELECCIONAR PEDIDO DELIVERY'}
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
                {/* Paso 1: Dependiendo del modo */}
                {currentStep === 1 && modalMode === 'local' && (
                  <div className="row">
                    {/* ... (formulario local completo igual al anterior) */}
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
                      <>
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
                      </>
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

                {currentStep === 1 && modalMode === 'delivery' && (
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

                {/* Paso 2: Método de Pago - SOLO 3 OPCIONES */}
                {currentStep === 2 && (
                  <div className="row">
                    <div className="col-12 mb-4">
                      <div className="alert alert-dark text-center border-0">
                        <h4 className="mb-0 fw-bold">
                          TOTAL A PAGAR: S/ {getTotalAmount().toFixed(2)}
                        </h4>
                        {modalMode === 'delivery' && selectedPedido && (
                          <small className="text-muted">
                            Cliente: {selectedPedido.delivery_info.nombre_cliente}
                          </small>
                        )}
                        {modalMode === 'local' && (
                          <small className="text-muted">
                            Cliente: {orderData.customerName}
                          </small>
                        )}
                      </div>
                    </div>

                    <div className="col-12 mb-4">
                      <h6 className="fw-bold text-dark mb-3">SELECCIONE MÉTODO DE PAGO</h6>
                      <div className="row g-2">
                        {/* SOLO 3 MÉTODOS DE PAGO */}
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
                            className={`btn w-100 fw-bold ${paymentMethod === 'qr' ? 'btn-warning text-dark' : 'btn-outline-warning'}`}
                            onClick={() => {
                              setPaymentMethod('qr');
                              if (!qrData.url) {
                                generateQr();
                              }
                            }}
                          >
                            <i className="fas fa-qrcode me-2"></i>
                            QR YAPE/PLIN
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Efectivo */}
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

                    {/* Tarjeta con Culqi */}
                    {paymentMethod === 'card' && (
                      <div className="col-12">
                        <div className="card border-primary">
                          <div className="card-body">
                            <div className="text-center mb-3">
                              <i className="fas fa-credit-card fa-5x text-primary mb-3"></i>
                              <h5 className="text-primary fw-bold">PAGO CON TARJETA</h5>
                              <h4 className="text-primary fw-bold">S/ {getTotalAmount().toFixed(2)}</h4>
                            </div>
                            
                            {culqiData.success ? (
                              <div className="alert alert-success">
                                <i className="fas fa-check-circle me-2"></i>
                                ¡Pago procesado exitosamente!
                                <br />
                                <small>ID: {culqiData.cargoId}</small>
                              </div>
                            ) : (
                              <CulqiTester 
                                total={getTotalAmount()}
                                pedidoId={modalMode === 'local' ? parseInt(orderData.orderId.split('-')[1]) : selectedPedido.pedido.id}
                                email={modalMode === 'local' ? orderData.customerEmail : selectedPedido.delivery_info.email}
                                onPaymentSuccess={handleCulqiSuccess}
                                onPaymentError={handleCulqiError}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* QR Yape/Plin */}
                    {paymentMethod === 'qr' && (
                      <div className="col-12">
                        <div className="card border-warning">
                          <div className="card-body text-center">
                            <h5 className="text-dark fw-bold mb-3">
                              <i className="fas fa-qrcode me-2"></i>
                              PAGO CON QR
                            </h5>
                            
                            {qrData.loading ? (
                              <div className="py-5">
                                <div className="spinner-border text-warning" role="status">
                                  <span className="visually-hidden">Generando QR...</span>
                                </div>
                                <p className="mt-3">Generando código QR...</p>
                              </div>
                            ) : qrData.url ? (
                              <>
                                <div className="bg-white p-4 rounded d-inline-block mb-3" style={{ border: '2px solid #ffc107' }}>
                                  <img 
                                      src={qrData.url} 
                                      alt="QR de pago" 
                                      className="img-fluid"
                                      style={{ maxWidth: '200px', display: 'block' }}  // ← 200px
                                    />
                                </div>
                                
                                <div className="alert alert-info">
                                  <strong>📱 Instrucciones:</strong>
                                  <ol className="text-start mb-0 mt-2">
                                    <li>Abre tu app <b>Yape</b> o <b>Plin</b></li>
                                    <li>Escanea este código QR</li>
                                    <li>Confirma el pago de <b>S/ {getTotalAmount().toFixed(2)}</b></li>
                                    <li>Haz clic en "Verificar Pago"</li>
                                  </ol>
                                </div>

                                {!qrData.verified ? (
                                  <button 
                                    className="btn btn-success fw-bold btn-lg"
                                    onClick={verifyQrPayment}
                                  >
                                    <i className="fas fa-check-circle me-2"></i>
                                    Verificar Pago
                                  </button>
                                ) : (
                                  <div className="alert alert-success">
                                    <i className="fas fa-check-circle me-2"></i>
                                    ¡Pago verificado exitosamente!
                                  </div>
                                )}
                              </>
                            ) : (
                              <button 
                                className="btn btn-warning fw-bold btn-lg"
                                onClick={generateQr}
                              >
                                <i className="fas fa-qrcode me-2"></i>
                                GENERAR CÓDIGO QR
                              </button>
                            )}
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
                                {paymentMethod === 'qr' && 'QR YAPE/PLIN'}
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

                            {(paymentMethod === 'card' || payments[0].cargoId) && (
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
                          orderItems.every(item => !item.name || item.price <= 0)
                        )) ||
                        (modalMode === 'delivery' && !selectedPedido)
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
                        (paymentMethod === 'qr' && !qrData.verified) ||
                        (paymentMethod === 'card' && !culqiData.success)
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
                          payment.paymentMethod === 'card' ? 'bg-primary' :
                          'bg-warning text-dark'
                        }`}>
                          {payment.paymentMethod === 'cash' && 'EFECTIVO'}
                          {payment.paymentMethod === 'card' && 'TARJETA'}
                          {payment.paymentMethod === 'qr' && 'QR YAPE/PLIN'}
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