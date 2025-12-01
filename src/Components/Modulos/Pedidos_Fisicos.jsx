import React, { useState, useEffect } from "react";
import { Container, Button, Card, ListGroup, Form, Row, Col, Modal, Table } from "react-bootstrap"; 
import styles from './PedidosFisicos.module.css';
import { API_BASE_URL } from "../Configuracion/api.jsx";
const formatText = (text) => {
    if (!text) return '';
    return text.replace(/_/g, ' ')
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
                .toUpperCase(' ');
};
const formatTime = (dateString) => {
    try {
        const date = new Date(dateString);
        // Si la fecha es válida, formateamos la hora
        return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch (e) {
        console.error("Error al establecer la hora:",e);
    }
};

export default function Pedidos_Fisicos() {
  // -- Estados de visibilidad -- //
  const rol = localStorage.getItem("userRole");
  const [pedidos, setPedidos] = useState([]);
  const [pedidosCerrados, setPedidosCerrados] = useState(() => {
    const saved = localStorage.getItem('pedidosArchivados');
    return saved ? JSON.parse(saved) : [];
  }); // IDs de pedidos cerrados

  // Modales principales
  const [showModal, setShowModal] = useState(false); // Crear
  const [showModalE, setShowModalE] = useState(false); // Editar
  const [showModalB, setShowModalB] = useState(false); // Eliminar

  // Constante de vista
  const [viewMode, setViewMode] = useState('kanban');
  // Estadisticas
  const pedidosServidos = pedidos.filter(p => p.estado === 'servido').length;
  const pedidosCancelados = pedidos.filter(p => p.estado === 'cancelado').length;
  const pedidosArchivados = pedidosCerrados.length;
  const totalIngresos = pedidos.reduce((sum, p) => sum + (p.monto_total || 0), 0).toFixed(2);
  const totalPedidosHoy = pedidos.length;
  const ticketPromedio = totalPedidosHoy > 0 ? (totalIngresos / totalPedidosHoy).toFixed(2) : '0.00';
  //Modal Detalles
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [detalleTipo, setDetalleTipo] = useState('');

  // Alertas de confirmación
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(true);
  const [confirmAction, setConfirmAction] = useState(() => () => {});

  // -- Estados de datos de formulario -- //
  const [platillos, setPlatillos] = useState([]); // Lista de platillos
  const [mesas, setMesas] = useState([]); // Lista de mesas
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);

  // Formulario para crear pedido
  const [nuevoPedido, setNuevoPedido] = useState({
    mesa_id: null,
    estado: "pendiente",
    tipo_pedido: "mesa",
    items: [],
  });
  const [itemTemp, setItemTemp] = useState({
    platillo_id: "",
    cantidad: 1,
  }); // Item temporal para agregar

  // Formulario para editar pedido
  const [pedidoAEditar, setPedidoAEditar] = useState(null);
  const [itemsEditados, setItemsEditados] = useState([]);
  const [itemTempEditar, setItemTempEditar] = useState({
    platillo_id: "",
    cantidad: 1,
  });

  // -- Estilos del módulo -- //
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

  // Alerta central
  const showMessageModal = (message, success = true, action = () => setShowConfirmModal(false)) => {
      setConfirmMessage(message); setIsSuccess(success); setConfirmAction(() => action); setShowConfirmModal(true);
  };

  const fetchPedidos = () => { 
    fetch(`${API_BASE_URL}/pedidosF/pedidosM`)
          .then((res) => res.json())
          .then((data) => setPedidos(data))
          .catch((err) => console.error(err));
  };

  // Fetch Platillos
  useEffect(() => {
    fetch(`${API_BASE_URL}/pedidosF/platillos`)
      .then((res) => res.json())
      .then((data) => setPlatillos(data))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Mesas
  useEffect(() => {
    fetch(`${API_BASE_URL}/pedidosF/mesas`)
      .then((res) => res.json())
      .then((data) => setMesas(data))
      .catch((err) => console.error(err));
  }, []);

  // Recarga de pedidos
  useEffect(() => {
        fetchPedidos(); // Carga inicial
        const interval = setInterval(fetchPedidos, 30000);
        return () => clearInterval(interval);
    }, []);

  // -- Lógica de tarjeta -- //
  const cerrarTarjeta = (pedidoId) => {
    const cerrado = [...pedidosCerrados, pedidoId];
    setPedidosCerrados(cerrado);
    // Persistir en local storage
    localStorage.setItem('pedidosArchivados', JSON.stringify(cerrado));
  };


  // -- Lógica de Creación/Agregación -- //
  // Para agregar pedidos
  const guardarPedido = async () => {
    if (!nuevoPedido.mesa_id || nuevoPedido.items.length === 0) {
        showMessageModal("Selecciona una mesa y agrega al menos un platillo", false);
        return;
    }
    // Transformar datos solo al enviar
    const pedidoParaEnviar = {
      mesa_id: nuevoPedido.mesa_id,
      empleado_id: 6,
      estado: nuevoPedido.estado,
      tipo_pedido: nuevoPedido.tipo_pedido,
      monto_total: parseFloat(calcularTotal()),
      items: nuevoPedido.items.map((item) => ({
        producto_id: item.producto_id,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
      })),
    };
    try {
      const response = await fetch(
        `${API_BASE_URL}/pedidosF/agregarPedido`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoParaEnviar),
        }
      );
      if (response.ok) {
        showMessageModal("Pedido creado exitosamente", true);
        setShowModal(false);
        fetchPedidos();
        // Resetear formulario
        setNuevoPedido({
          mesa_id: null,
          estado: "pendiente",
          tipo_pedido: "mesa",
          items: [],
        });
      } else {
        showMessageModal("Error al crear pedido", false);
        setShowModal(false);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessageModal("Error de conexión", false);
    }
  };
  // Modal Detalle
  const openDetalleModal = (tipo) => {
      setDetalleTipo(tipo);
      setShowDetalleModal(true);
  };
  // Obtener data filtrada para pedidos cancelados y archivados
  const getDetalleData = (tipo) => {
      if (tipo === 'cancelados') {
          return pedidos.filter(p => p.estado === 'cancelado');
      }
      if (tipo === 'archivados') {
          return pedidos.filter(p => pedidosCerrados.includes(p.id));
      }
      return [];
  };
  // Funciones para el modal de agregar 
  const handleItemTempChange = (e) => {
    const { name, value } = e.target;
    setItemTemp({ ...itemTemp, [name]: value });
  };

  const agregarPlatillo = () => {
    if (!itemTemp.platillo_id || itemTemp.cantidad <= 0) {
      alert("Selecciona un platillo y una cantidad válida");
      return;
    }
    const platilloSeleccionado = platillos.find(
      (p) => p.id === parseInt(itemTemp.platillo_id)
    );
    if (!platilloSeleccionado) {
      alert("Platillo no encontrado");
      return;
    }
    const yaExiste = nuevoPedido.items.find(
      (item) => item.platillo_id === parseInt(itemTemp.platillo_id)
    );
    if (yaExiste) {
      alert(
        "Este platillo ya fue agregado. Edita la cantidad si es necesario"
      );
      return;
    }
    const nuevoItem = {
      pedido_id: platilloSeleccionado.id,
      producto_id: parseInt(itemTemp.platillo_id),
      nombre: platilloSeleccionado.nombre,
      cantidad: parseInt(itemTemp.cantidad),
      precio_unitario: platilloSeleccionado.precio,
    };
    setNuevoPedido({
      ...nuevoPedido,
      items: [...nuevoPedido.items, nuevoItem],
    });
    setItemTemp({ platillo_id: "", cantidad: 1 });
  };
  const actualizarCantidad = (index, nuevaCantidad) => {
    if (nuevaCantidad <= 0) return;
    const nuevosItems = [...nuevoPedido.items];
    nuevosItems[index].cantidad = parseInt(nuevaCantidad);
    setNuevoPedido({ ...nuevoPedido, items: nuevosItems });
  };

  const eliminarPlatillo = (index) => {
    const nuevosItems = nuevoPedido.items.filter((_, i) => i !== index);
    setNuevoPedido({ ...nuevoPedido, items: nuevosItems });
  };
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };

  const calcularTotal = () => {
    return nuevoPedido.items
      .reduce((total, item) => total + item.precio_unitario * item.cantidad, 0)
      .toFixed(2);
  };

  // -- Lógica de Edición -- //
    
  // Funciones para el modal de editar
  const abrirModalEditar = (pedido) => {
    console.log("Pedido a editar:", pedido); 
    setPedidoAEditar(pedido);
    setItemsEditados([...pedido.items]);
    // Aqui se resetean los campos temporales
    setItemTempEditar({ platillo_id: "", cantidad: 1 });
    setShowModalE(true);
  };

  const calcularTotalEditar = () => {
    return itemsEditados
      .reduce((total, item) => total + item.precio_unitario * item.cantidad, 0)
      .toFixed(2);
  };

  const handleItemTempChangeEditar = (e) => {
    const { name, value } = e.target;
    setItemTempEditar({ ...itemTempEditar, [name]: value });
  };

  const agregarPlatilloEditar = () => {
    if (!itemTempEditar.platillo_id) return;
    
    const platillo = platillos.find(p => p.id === parseInt(itemTempEditar.platillo_id));

    const nuevoItem = {
      producto_id: platillo.id,
      nombre: platillo.nombre,
      precio_unitario: platillo.precio,
      cantidad: parseInt(itemTempEditar.cantidad),
      es_nuevo: true,
    };
    setItemsEditados([...itemsEditados, nuevoItem]);
    setItemTempEditar({ platillo_id: "", cantidad: 1 });
  };

  //Se actualizan la cantidad de platos a editar
  const actualizarCantidadEditar = (index, nuevaCantidad) => {
    const cantidad = parseInt(nuevaCantidad);
    if (cantidad < 1) return;
    
    const nuevosItems = [...itemsEditados];
    nuevosItems[index].cantidad = cantidad;
    setItemsEditados(nuevosItems);
  };

  // Eliminar platillos en edicion
  const eliminarPlatilloEditar = (index) => {
    setItemsEditados(itemsEditados.filter((_, i) => i !== index));
  };

  const guardarCambiosPedido = async () => {
    if (itemsEditados.length === 0) {
      showMessageModal("El pedido debe tener al menos un platillo", false);
      return;
    }
    
    try {
      // Agrupar items del mismo producto
      const itemsAgrupados = itemsEditados.reduce((acc, item) => {
        const productoId = parseInt(item.producto_id || item.platillo_id);
        const itemExistente = acc.find(i => i.producto_id === productoId);
        
        if (itemExistente) {
          // Si ya existe, sumar la cantidad
          itemExistente.cantidad += parseInt(item.cantidad);
        } else {
          // Si no existe, agregarlo
          acc.push({
            producto_id: productoId,
            cantidad: parseInt(item.cantidad),
            precio_unitario: parseFloat(item.precio_unitario),
            notas: item.notas || ""
          });
        }
        
        return acc;
      }, []);

      const pedidoActualizado = {
        items: itemsAgrupados,
        monto_total: parseFloat(calcularTotalEditar()),
      };

      console.log("Datos a enviar:", pedidoActualizado);

      const response = await fetch(
        `${API_BASE_URL}/pedidosF/editar/${pedidoAEditar.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pedidoActualizado),
        }
      );

      if (response.ok) {
        showMessageModal("Pedido actualizado correctamente", true);
        setShowModalE(false);
        setPedidoAEditar(null);
        setItemsEditados([]);
        fetchPedidos();
      } else {
        const error = await response.json();
        console.error("Error del servidor:", error);
        showMessageModal(`Error: ${error.error || error.detail}`, false);
      }
    } catch (error) {
      console.error("Error:", error);
      showMessageModal(`Error al actualizar el pedido`, false);
      setShowModalE(false);
    }
  };

  // -- Lógica de estado y eliminación -- /
  
  // Para cambiar el estado de cada tarjeta
  const cambiarEstadoNombre = async (id, estadoActual) => {
    if (estadoActual === "servido" || estadoActual==="entregado") {
      showMessageModal("Este pedido ya está completado y/o entregado", false);
      return;
    }
    try {
      const response = await fetch(
        `${API_BASE_URL}/pedidosF/${id}/estado`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al cambiar el estado");
      }
      const data = await response.json();
      // Actualizar la vista de las tarjetas
      setPedidos((prevPedidos) =>
        prevPedidos.map((pedido) =>
          pedido.id === id ? { ...pedido, estado: data.estado_nuevo } : pedido
        )
      );

      showMessageModal(`✅ Nuevo estado: ${data.estado_nuevo.toUpperCase()}`, true);
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      showMessageModal(`❌ Error: ${error.message}`, false);
    }
  };

  //  Para eliminar pedido
  async function EliminarPedido(id) {
    try {
      const eliminacion = await fetch(
        `${API_BASE_URL}/pedidosF/eliminarPM/${id}`,
        {
          method: "PUT",
          headers: { "Content-type": "application/json" },
        }
      );
      await fetch(`${API_BASE_URL}/pedidosF/eliminarDetalles/${id}`, {
        method: "DELETE",
      });
      if (!eliminacion.ok) return alert("Error al eliminar el pedido");
        setPedidos(pedidos.filter((pedido) => pedido.id !== id));
        showMessageModal("Pedido cancelado correctamente", true);
        setShowModalB(false);
        fetchPedidos();
    } catch (error) {
      showMessageModal("Error al eliminar el pedido",error);
      setShowModalB(false);
    }
  }

  // -- Filtro de renderizado -- //
  const pedidosVisibles = pedidos.filter(
    (p) => !pedidosCerrados.includes(p.id) && p.tipo_pedido === "mesa"
  );

  const pedidosVisiblesLyS = pedidos.filter(
    (p) => !pedidosCerrados.includes(p.id) 
  );

  // -- Rendereizado de la tarjeta -- //
  const PedidoCardComponent = ({ p }) => {
      const statusColors = STATUS_COLORS[p.estado] || STATUS_COLORS.pendiente;
      const mesaNumber = p.mesa;
      const isCompleted = p.estado === "servido" || p.estado === "entregado";

      return (
          <Card key={p.id} className={styles.pedidoCard} style={cardStyle}>
              <Card.Header className={styles.cardHeader} style={{backgroundColor: statusColors.color, color: 'white'}}>
                  <h5 className="m-0 fw-bold">
                      <i className={`fa-solid ${STATUS_COLORS[p.estado].icon} me-2`}></i> 
                          {mesaNumber} - #{p.id}
                  </h5>
              </Card.Header>
              <Card.Body className="p-3">
                  <ListGroup variant="flush" className="mb-3">
                      {p.items.map((it, idx) => (
                          <ListGroup.Item key={idx} className={styles.itemRow} style={{backgroundColor: cardStyle.backgroundColor, color: cardStyle.color}}>
                              <Col xs={7}> 
                                  <strong style={{
                                      color: 'var(--color-text)', 
                                      display: 'block', 
                                      wordWrap: 'break-word'
                                      }}
                                  >
                                    {it.nombre} x{it.cantidad}
                                  </strong>
                              </Col>
                              <Col xs={3} className="text-end">
                                  <strong style={{
                                      color: 'var(--color-accent)', 
                                      fontSize: '0.9rem'
                                      }}
                                  >
                                    S/ {(it.precio_unitario * it.cantidad).toFixed(2)}
                                  </strong>
                              </Col>
                          </ListGroup.Item>
                      ))}
                  </ListGroup>

                  <div className={styles.pedidoFooter} style={{borderTop: `1px solid var(--color-muted)`}}>
                      <small style={{color: 'var(--color-muted)'}}>
                          Estado: <strong style={{color: statusColors.color}}>{formatText(p.estado)}</strong> — {p.hora}
                      </small>
                      <strong style={{color: 'var(--color-title)'}}>S/ {p.monto_total}</strong>
                  </div>

                  {rol == 1 && (
                      <div className="d-flex flex-wrap justify-content-center mt-3 gap-2">
                          {p.estado==="pendiente" && (
                                <Button size="sm" style={btnWarning} onClick={() => abrirModalEditar(p)}>
                                    <i className="fa-solid fa-pen-to-square me-1"></i> Modificar
                                </Button>
                            )}
                                
                          {p.estado === "pendiente" && (
                              <Button size="sm" style={btnAdd} onClick={() => cambiarEstadoNombre(p.id, p.estado)}>
                                  <i className="fa-solid fa-play me-1"></i> Iniciar
                              </Button>
                          )}
                              
                          {p.estado === "en_preparacion" && (
                              <Button size="sm" style={btnWarning} onClick={() => cambiarEstadoNombre(p.id, p.estado)}>
                                  <i className="fa-solid fa-check me-1"></i> Listo
                              </Button>
                          )}
                              
                          {p.estado === "listo" && (
                              <Button size="sm" style={btnAdd} onClick={() => cambiarEstadoNombre(p.id, p.estado)}>
                                  <i className="fa-solid fa-concierge-bell me-1"></i> Servir
                              </Button>
                          )}

                          {p.estado==="pendiente" && (
                                <Button size="sm" style={btnDelete} onClick={() => { setShowModalB(true); setPedidoSeleccionado(p); }}>
                                    <i className="fa-solid fa-times me-1"></i> Cancelar
                                </Button>
                            )}
                      </div>
                  )}
                  {isCompleted && (
                      <Button className="w-100 mt-2" style={btnSecondary} onClick={() => cerrarTarjeta(p.id)}>
                            <i className="fa-solid fa-box-archive me-1"></i> Archivar 
                      </Button>
                  )}
              </Card.Body>
          </Card>
        );
      };

  // -- Renderizado principal -- //
  return (
    <Container fluid className="py-2" style={{backgroundColor: 'var(--color-bg)', color: 'var(--color-text)'}}>
        <div className="mb-2 d-flex justify-content-between align-items-center">
            <h1 className="fs-1 fw-bold mb-4" style={{ color: 'var(--color-title)', fontFamily: 'var(--font-basic)' }}>
                Gestión de Pedidos Físicos
            </h1>

            {rol == 4 && (
                <div>
                    <Button 
                        onClick={() => setViewMode('kanban')} 
                        style={{...btnEdit, opacity: viewMode === 'kanban' ? 1 : 0.6}}
                        className="me-2"
                    >
                        <i className="fa-solid fa-list-check me-1"></i> Tablero Pedidos
                    </Button>
                    <Button 
                        onClick={() => setViewMode('stats')} 
                        style={{...btnAdd, opacity: viewMode === 'stats' ? 1 : 0.6}}
                    >
                        <i className="fa-solid fa-chart-simple me-1"></i> Estadísticas
                    </Button>
                </div>
            )}

            {rol == 1 && viewMode === 'kanban' && (
                <Button style={btnAdd} onClick={() => setShowModal(true)}>
                    <i className="fa-solid fa-plus me-2"></i> Crear Pedido
                </Button>
            )}
        </div>

        {/* Columnas Grid */}
        {viewMode === 'kanban' ? (
            <div className={styles.pedidosGridColumnas}>
                {/* Pendiente */}
                <div className={styles.columna}>
                    <h3 className={styles.columnaTitulo} style={{color: STATUS_COLORS.pendiente.color}}>
                        <i class="fa-solid fa-hourglass"></i> Pendiente
                    </h3>
                    {pedidosVisibles.filter((p) => p.estado === "pendiente").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
                </div>
                {/* En preparación */}
                <div className={styles.columna}>
                    <h3 className={styles.columnaTitulo} style={{color: STATUS_COLORS.en_preparacion.color}}>
                        <i class="fa-solid fa-person-military-pointing"></i> En Preparación
                    </h3>
                    {pedidosVisibles.filter((p) => p.estado === "en_preparacion").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
                </div>

                {/* Listo */}
                <div className={styles.columna}>
                    <h3 className={styles.columnaTitulo} style={{color: STATUS_COLORS.listo.color}}>
                        <i class="fa-solid fa-square-check"></i> Listo</h3>
                    {pedidosVisibles.filter((p) => p.estado === "listo").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
                </div>

                {/* Servido y Entregado */}
                <div className={styles.columna}>
                    <h3 className={styles.columnaTitulo} style={{color: STATUS_COLORS.servido.color}}>
                        <i class="fa-solid fa-receipt"></i> Servido o Entregado</h3>
                    {pedidosVisiblesLyS.filter((p) => p.estado === "servido" || p.estado === "entregado").map((p) => (<PedidoCardComponent key={p.id} p={p} />))}
                </div>
            </div>
        ) : (
            <div className={styles.statsGrid}>
                <Row xs={1} md={2} lg={4} className="g-4 mb-4">
                    {/* Total Pedidos Hoy */}
                    <Col>
                        <Card style={{...cardStyle, border: `1px solid var(--color-accent)`}} className={styles.statCard}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Pedidos Totales Hoy</h3>
                                <p style={{color: 'var(--color-accent)'}} className="fs-3 fw-bold">{totalPedidosHoy}</p>
                                <small style={{color: 'var(--color-muted)'}}>Pedidos procesados</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Pedidos Servidos/Entregados */}
                    <Col>
                        <Card style={{...cardStyle, border: `1px solid var(--color-secondary)`}}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Pedidos Servidos</h3>
                                <p style={{color: 'var(--color-secondary)'}} className="fs-3 fw-bold">{pedidosServidos}</p>
                                <small style={{color: 'var(--color-muted)'}}>Completados y cobrados</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Pedidos Cancelados */}
                    <Col>
                        <Card style={{...cardStyle, border: `1px solid var(--color-btn-delete)`}}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Pedidos Cancelados</h3>
                                <p style={{color: 'var(--color-btn-delete)'}} className="fs-3 fw-bold">{pedidosCancelados}</p>
                                <small style={{color: 'var(--color-muted)'}}>Órdenes perdidas</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Pedidos Archivados */}
                    <Col>
                        <Card style={{...cardStyle, border: `1px solid var(--color-muted)`}}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Pedidos Archivados</h3>
                                <p style={{color: 'var(--color-muted)'}} className="fs-3 fw-bold">{pedidosArchivados}</p>
                                <small style={{color: 'var(--color-muted)'}}>Órdenes retiradas del tablero</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>

                <Row xs={1} md={2} className="g-4 mb-2">
                  {/* Ingresos Totales */}
                    <Col md={6}>
                        <Card style={{...cardStyle, border: `1px solid var(--color-accent)`}}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Ingresos Totales </h3>
                                <p style={{color: 'var(--color-title)'}} className="fs-3 fw-bold">S/ {totalIngresos}</p>
                                <small style={{color: 'var(--color-muted)'}}>Total recaudado de pedidos finalizados</small>
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Ticket Promedio*/}
                    <Col md={6}>
                        <Card style={{...cardStyle, border: `1px solid var(--color-btn)`}} className={styles.statCard}>
                            <Card.Body>
                                <h3 style={{color: 'var(--color-muted)'}}>Ticket Promedio</h3>
                                <p style={{color: 'var(--color-btn)'}} className="fs-3 fw-bold">S/ {ticketPromedio}</p>
                                <small style={{color: 'var(--color-muted)'}}>Venta promedio por pedido</small>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
                
                {/* Detalles de Pedidos Cancelados y Archivados */}
                <h2 className="h4 mt-5 mb-3" style={{ color: 'var(--color-title)' }}>
                    <i className="fa-solid fa-list-ul me-2"></i> Detalle de Pedidos Cerrados
                </h2>
                <Card style={cardStyle}>
                    <Card.Body>
                        {/* Botones de Filtro */}
                        <Button 
                            size="sm" 
                            className="me-2" 
                            style={pedidosCancelados > 0 ? btnDelete : btnSecondary}
                            onClick={() => openDetalleModal('cancelados')}
                        >
                            Ver {pedidosCancelados} Cancelados
                        </Button>
                        <Button 
                            size="sm" 
                            style={pedidosArchivados > 0 ? btnSecondary : btnSecondary}
                            onClick={() => openDetalleModal('archivados')}
                        >
                            Ver {pedidosArchivados} Archivados
                        </Button>
                        
                        <p className="mt-3 small" style={{color: 'var(--color-muted)'}}>
                            (Haga click en los botones para ver el detalle en forma de tabla)
                        </p>
                    </Card.Body>
                </Card>
            </div>
        )}
        {/* Modal de detalle */}
        {showDetalleModal && (
            <ModalDetallePedidos 
                show={showDetalleModal} 
                setShow={setShowDetalleModal} 
                detalleTipo={detalleTipo}
                getDetalleData={getDetalleData} // Filtrado
                headerStyle={headerStyle}
                cardStyle={cardStyle}
                btnSecondary={btnSecondary}
            />
        )}
        {/* Modal para crear pedido */}
        {showModal && ( 
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentWide} style={cardStyle}>
                        <div className={styles.modalHeader} style={headerStyle}>
                            <h5 style={{color: 'var(--color-title)'}}> Nuevo Pedido</h5>
                            <button type="button" className="btn-close" onClick={() => setShowModal(false)} style={{ filter: 'var(--logo-filter)'}}></button>
                        </div>
                        {/* Cuerpo del modal */}
                        <div className={styles.modalBody}>
                            <Form onSubmit={(e) => { e.preventDefault(); guardarPedido(); }}>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Label style={{ color: 'var(--color-text)' }}>Selecciona una mesa:</Form.Label>
                                            <Form.Select 
                                                name="mesa_id" 
                                                className="w-100" 
                                                style={inputStyle} 
                                                value={nuevoPedido.mesa_id || ""} 
                                                onChange={handleChange} 
                                                required
                                            >
                                                <option value="">--Selecciona una mesa</option>
                                                {mesas.map((mesa) => (<option key={mesa.id} value={mesa.id}>Mesa {mesa.numero} ({mesa.estado})</option>))}
                                            </Form.Select>
                                    </Col>
                                </Row>
                                    
                            {/* Selector de Platillos */}
                            <Form.Label style={{ color: 'var(--color-text)' }}>Selecciona platillos o bebidas:</Form.Label>
                                <Row className="g-2 mb-3 align-items-center">
                                    <Col md={7}>
                                        <Form.Select name="platillo_id" style={inputStyle} value={itemTemp.platillo_id || ""} onChange={handleItemTempChange}>
                                            <option value="">Seleccionar platillo...</option>
                                            {platillos.map((p) => (<option key={p.id} value={p.id}>{p.nombre} - S/. {p.precio}</option>))}
                                        </Form.Select>
                                    </Col>
                                    <Col md={2}>
                                        <Form.Control type="number" name="cantidad" placeholder="Cant." min="1" value={itemTemp.cantidad} onChange={handleItemTempChange} style={inputStyle} />
                                    </Col>
                                    <Col md={3}>
                                        <Button type="button" style={btnAdd} onClick={agregarPlatillo} className="w-100">
                                            Agregar
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Lista de Platillos Agregados */}
                                {nuevoPedido.items.length > 0 && (
                                    <Card style={{...cardStyle, marginTop: '1rem', border: `1px solid var(--color-accent)`}}>
                                        <Card.Header style={headerStyle}><strong>Platillos del Pedido</strong></Card.Header>
                                        <ListGroup variant="flush">
                                            {nuevoPedido.items.map((item, index) => (
                                                <ListGroup.Item key={index} className={styles.itemRow} style={{backgroundColor: cardStyle.backgroundColor}}>
                                                    <Row className="w-100 align-items-center">
                                                        <Col xs={5}><strong style={{color: 'var(--color-text)', margin: '10px'}}>{item.nombre}</strong></Col>
                                                        <Col xs={3}>
                                                            <Form.Control type="number" min="1" value={item.cantidad} onChange={(e) => actualizarCantidad(index, e.target.value)} className="form-control-sm" style={inputStyle} />
                                                        </Col>
                                                        <Col xs={3} className="text-end">
                                                            <strong style={{color: 'var(--color-accent)'}}>S/. {(item.precio_unitario * item.cantidad).toFixed(2)}</strong>
                                                        </Col>
                                                        <Col xs={1} className="text-end">
                                                            <Button type="button" size="sm" style={btnDelete} onClick={() => eliminarPlatillo(index)}>
                                                                <i className="fa-solid fa-trash"></i>
                                                            </Button>
                                                        </Col>
                                                    </Row>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                        <Card.Footer style={headerStyle}>
                                            <div className="w-100 text-end">
                                                <h5>Total: <strong style={{color: 'var(--color-accent)'}}>S/. {calcularTotal()}</strong></h5>
                                            </div>
                                        </Card.Footer>
                                    </Card>
                                )}
                                  
                                <div className={styles.modalFooter} style={{ borderTop: `1px solid var(--color-muted)` }}>
                                    <Button style={btnSecondary} onClick={() => setShowModal(false)}>Cancelar</Button>
                                    <Button type="submit" style={btnAdd} disabled={nuevoPedido.items.length === 0}>Guardar Pedido</Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModal(false)}></div>
            </>
        )}

        {/* Modal para editar pedido */}
        {showModalE && pedidoAEditar && ( 
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentWide} style={cardStyle}>
                      <div className={styles.modalHeader} style={headerStyle}>
                          <h5 style={{color: 'var(--color-title)'}}>Editar Pedido #{pedidoAEditar?.id}</h5>
                          <button type="button" className="btn-close" onClick={() => setShowModalE(false)} style={{ filter: 'var(--logo-filter)'}}></button>
                      </div>
                      <div className={styles.modalBody}>
                          <Form>
                              <div className="alert mb-3" style={{backgroundColor: 'var(--color-card)', color: 'var(--color-text)', border: `1px solid var(--color-accent)`}}>
                                  <strong>Mesa:</strong> {pedidoAEditar?.mesa}
                              </div>

                              <Form.Label style={{ color: 'var(--color-text)' }}>Agregar más platillos:</Form.Label>
                              <Row className="g-2 mb-3 align-items-center">
                                  <Col md={7}>
                                      <Form.Select name="platillo_id" style={inputStyle} value={itemTempEditar.platillo_id || ""} onChange={handleItemTempChangeEditar}>
                                          <option value="">Seleccionar platillo...</option>
                                          {platillos.map((p) => (<option key={p.id} value={p.id}>{p.nombre} - S/. {p.precio}</option>))}
                                      </Form.Select>
                                  </Col>
                                  <Col md={2}>
                                      <Form.Control type="number" name="cantidad" placeholder="Cant." min="1" value={itemTempEditar.cantidad} onChange={handleItemTempChangeEditar} style={inputStyle} />
                                  </Col>
                                  <Col md={3}>
                                      <Button type="button" style={btnAdd} onClick={agregarPlatilloEditar} className="w-100">
                                          Agregar
                                      </Button>
                                  </Col>
                              </Row>
                              
                              {/* Lista de items editados */}
                              {itemsEditados.length > 0 && (
                                  <Card style={{...cardStyle, marginTop: '1rem', border: `1px solid var(--color-accent)`}}>
                                      <Card.Header style={headerStyle}><strong>Platillos del Pedido</strong></Card.Header>
                                      <ListGroup variant="flush">
                                          {itemsEditados.map((item, index) => (
                                              <ListGroup.Item key={index} className={styles.itemRow} style={{backgroundColor: cardStyle.backgroundColor}}>
                                                  <Row className="w-100 align-items-center">
                                                      <Col xs={5}>
                                                          <strong style={{color: 'var(--color-text)', margin: '10px'}}>{item.nombre}</strong>
                                                          {item.es_nuevo && (<span className="badge bg-success ms-2" style={{backgroundColor: 'var(--color-secondary)'}}>Nuevo</span>)}
                                                      </Col>
                                                      <Col xs={3}>
                                                          <Form.Control type="number" min="1" value={item.cantidad} onChange={(e) => actualizarCantidadEditar(index, e.target.value)} className="form-control-sm" style={inputStyle} />
                                                      </Col>
                                                      <Col xs={3} className="text-end">
                                                          <strong style={{color: 'var(--color-accent)'}}>S/. {(item.precio_unitario * item.cantidad).toFixed(2)}</strong>
                                                      </Col>
                                                      <Col xs={1} className="text-end">
                                                          <Button type="button" size="sm" style={btnDelete} onClick={() => eliminarPlatilloEditar(index)}>
                                                              <i className="fa-solid fa-trash"></i>
                                                          </Button>
                                                      </Col>
                                                  </Row>
                                              </ListGroup.Item>
                                          ))}
                                      </ListGroup>
                                      <Card.Footer style={headerStyle}>
                                          <div className="w-100 text-end">
                                              <h5>Total: <strong style={{color: 'var(--color-accent)'}}>S/. {calcularTotalEditar()}</strong></h5>
                                          </div>
                                      </Card.Footer>
                                  </Card>
                              )}
                          </Form>
                        </div>
                        <div className={styles.modalFooter} style={headerStyle}>
                          <Button style={btnSecondary} onClick={() => setShowModalE(false)}>Cancelar</Button>
                          <Button style={btnEdit} onClick={guardarCambiosPedido} disabled={itemsEditados.length === 0}>Guardar Cambios</Button>
                      </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModalE(false)}></div>
            </>
        )}

        {/* --- MODAL CANCELAR PEDIDO (RB) --- */}
        {showModalB && (
            <>
                <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                    <div className={styles.modalContentSmall} style={cardStyle}>
                        <div className={styles.modalHeader} style={headerStyle}>
                            <h5 style={{color: 'var(--color-title)'}}>Confirmación de Cancelación</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={() => setShowModalB(false)} 
                                style={{ filter: 'var(--logo-filter)'}}>
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <p style={{color: 'var(--color-text)'}}>
                                ¿Estás seguro de que deseas cancelar el Pedido #<strong>{pedidoSeleccionado?.id}</strong>?
                            </p>
                        </div>
                        <div className={styles.modalFooter} style={headerStyle}>
                            <Button style={btnSecondary} onClick={() => setShowModalB(false)}>No</Button>
                            <Button style={btnDelete} onClick={() => EliminarPedido(pedidoSeleccionado?.id)}>
                                Sí, Cancelar
                            </Button>
                        </div>
                    </div>
                </div>
                <div className={styles.modalBackdrop} onClick={() => setShowModalB(false)}></div>
            </>
        )}
            
        {/* Modal de alerta */}
        {showConfirmModal && (
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header style={headerStyle} closeButton>
                    <Modal.Title style={{color: 'var(--color-title)'}}>Notificación</Modal.Title>
                </Modal.Header>
                <Modal.Body style={cardStyle}>
                    <div className="text-center py-4">
                        <i 
                            className={`fa-solid mb-3 ${isSuccess ? 'fa-circle-check' : 'fa-circle-xmark'}`} 
                            style={{ 
                                fontSize: '3rem', 
                                color: isSuccess ? 'var(--color-accent)' : 'var(--color-btn-delete)' 
                            }}
                        ></i>
                        <p className="fw-bold" style={{color: 'var(--color-text)'}}>{confirmMessage}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer style={headerStyle}>
                    <Button style={btnAdd} onClick={confirmAction}>Aceptar</Button>
                </Modal.Footer>
            </Modal>
        )}
    </Container>
  );
}
export  function ModalDetallePedidos({ show, setShow, detalleTipo, getDetalleData, headerStyle, cardStyle, btnSecondary }){
    const list = getDetalleData(detalleTipo);
    const title = detalleTipo === 'cancelados' ? 'Pedidos Cancelados' : 'Pedidos Archivados';

    return show && (
        <>
            <div className={`${styles.modalOverlay} d-flex align-items-center justify-content-center`}>
                <div className={styles.modalContentWide} style={{...cardStyle, maxWidth: '900px'}}> 
                    <div className={styles.modalHeader} style={headerStyle}>
                        <h5 style={{color: 'var(--color-title)'}}>📋 {title} ({list.length})</h5>
                        <button type="button" className="btn-close" onClick={() => setShow(false)} style={{ filter: 'var(--logo-filter)'}}></button>
                    </div>
                    <div className={styles.modalBody}>
                        {list.length === 0 ? (
                            <p style={{color: 'var(--color-muted)'}}>No hay pedidos en esta categoría</p>
                        ) : (
                            <Table responsive size="sm" className={styles.themedTable} style={{border: `1px solid var(--color-muted)`}}>
                                <thead style={headerStyle}>
                                    <tr>
                                        <th>ID</th>
                                        <th>Mesa</th>
                                        <th>Total</th>
                                        <th>Hora</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.map(p => (
                                        <tr key={p.id} style={{backgroundColor: cardStyle.backgroundColor, color: cardStyle.color}}>
                                            <td className="fw-bold">#{p.id}</td>
                                            <td>{p.mesa}</td>
                                            <td>S/ {p.monto_total}</td>
                                            <td>{formatTime(p.hora)}</td>
                                            <td>{formatText(p.estado)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        )}
                    </div>
                    <div className={styles.modalFooter} style={headerStyle}>
                        <Button style={btnSecondary} onClick={() => setShow(false)}>Cerrar</Button>
                    </div>
                </div>
            </div>
            <div className={styles.modalBackdrop} onClick={() => setShow(false)}></div>
        </>
    );
};