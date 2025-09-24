import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Badge, Alert } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

function Insumos() {
  // Determinar el rol basado en la ruta actual
  const obtenerRol = () => {
    const path = window.location.pathname;
    return path.includes('/cocina/') ? 'cocina' : 'admin';
  };

  const [rol] = useState(obtenerRol());
  const [insumos, setInsumos] = useState([
    { id: 1, nombre: 'Pescado', cantidad: 50, precio: 18.00, categoria: 'Pescados', unidad: 'kg', minimo: 10 },
    { id: 2, nombre: 'Limón', cantidad: 200, precio: 4.00, categoria: 'Frutas', unidad: 'kg', minimo: 20 },
    { id: 3, nombre: 'Cebolla', cantidad: 30, precio: 3.50, categoria: 'Verduras', unidad: 'kg', minimo: 5 },
    { id: 4, nombre: 'Camote', cantidad: 40, precio: 2.80, categoria: 'Tubérculos', unidad: 'kg', minimo: 10 },
    { id: 5, nombre: 'Maíz Choclo', cantidad: 25, precio: 5.00, categoria: 'Granos', unidad: 'kg', minimo: 8 },
    { id: 6, nombre: 'Ají Limo', cantidad: 2, precio: 15.00, categoria: 'Condimentos', unidad: 'kg', minimo: 1 },
    { id: 7, nombre: 'Cilantro', cantidad: 15, precio: 2.00, categoria: 'Hierbas', unidad: 'hojas', minimo: 5 },
    { id: 8, nombre: 'Kion (Jengibre)', cantidad: 5, precio: 12.00, categoria: 'Condimentos', unidad: 'kg', minimo: 2 },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [insumoEditando, setInsumoEditando] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');
  const [solicitudRealizada, setSolicitudRealizada] = useState(false);
  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const datosGuardados = localStorage.getItem('insumosCevicheria');
    if (datosGuardados) {
      setInsumos(JSON.parse(datosGuardados));
    }
  }, []);

  // Guardar en localStorage cuando cambien los insumos
  useEffect(() => {
    localStorage.setItem('insumosCevicheria', JSON.stringify(insumos));
  }, [insumos]);

  // Funcionalidades CRUD - Solo admin
  const agregarInsumo = (nuevoInsumo) => {
    const insumoConId = { ...nuevoInsumo, id: Date.now() };
    const nuevosInsumos = [...insumos, insumoConId];
    setInsumos(nuevosInsumos);
  };

  const editarInsumo = (insumoActualizado) => {
    const nuevosInsumos = insumos.map(i => 
      i.id === insumoActualizado.id ? insumoActualizado : i
    );
    setInsumos(nuevosInsumos);
  };

  const eliminarInsumo = (id) => {
    const nuevosInsumos = insumos.filter(i => i.id !== id);
    setInsumos(nuevosInsumos);
  };

  // Funcionalidad para cocina - Solicitar insumos
  const solicitarInsumo = (insumo) => {
    setSolicitudRealizada(true);
    setTimeout(() => setSolicitudRealizada(false), 3000);
    
    // Guardar solicitud en localStorage
    const solicitudes = JSON.parse(localStorage.getItem('solicitudesInsumos') || '[]');
    const nuevaSolicitud = {
      id: Date.now(),
      insumo: insumo.nombre,
      cantidad: insumo.minimo - insumo.cantidad,
      fecha: new Date().toLocaleString(),
      estado: 'pendiente'
    };
    localStorage.setItem('solicitudesInsumos', JSON.stringify([...solicitudes, nuevaSolicitud]));
  };

  // Filtrar insumos
  const categorias = ['Todas', ...new Set(insumos.map(insumo => insumo.categoria))];
  
  const insumosFiltrados = insumos.filter(insumo =>
    (categoriaFiltro === 'Todas' || insumo.categoria === categoriaFiltro) &&
    (insumo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
     insumo.categoria.toLowerCase().includes(busqueda.toLowerCase()))
  );

  // Calcular totales
  const totalInsumos = insumos.length;
  const valorTotal = insumos.reduce((total, i) => total + (i.cantidad * i.precio), 0);
  const stockBajo = insumos.filter(i => i.cantidad <= i.minimo).length;
  const categoriasActivas = new Set(insumos.map(i => i.categoria)).size;

  // Insumos con stock bajo para alertas
  const insumosBajos = insumos.filter(i => i.cantidad <= i.minimo);

  return (
    <Container fluid className="py-4">
      {/* Header con info de rol */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <p className="text-muted">📦 Control de inventario para cevichería</p>
            </div>
            <Badge bg={rol === "admin" ? "primary" : "success"}>
              {rol === "admin" ? "👑 Administrador" : "👨‍🍳 Área de Cocina"}
            </Badge>
          </div>
        </Col>
      </Row>

      {/* Alertas de stock bajo - Visible para ambos roles */}
      {insumosBajos.length > 0 && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading>⚠️ Alerta de Stock Bajo</Alert.Heading>
          <div className="mb-2">
            {insumosBajos.map(insumo => (
              <Badge key={insumo.id} bg="warning" text="dark" className="me-2 mb-1">
                {insumo.nombre}: {insumo.cantidad} {insumo.unidad} (Mín: {insumo.minimo})
              </Badge>
            ))}
          </div>
          {rol === "cocina" && (
            <Button variant="outline-warning" size="sm">
              📞 Notificar al Administrador
            </Button>
          )}
        </Alert>
      )}

      {/* Confirmación de solicitud - Solo cocina */}
      {solicitudRealizada && (
        <Alert variant="success" className="mb-4">
          ✅ Solicitud enviada al administrador
        </Alert>
      )}

      {/* Tarjetas de resumen */}
      <Row className="mb-4">
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-primary mb-2">📦</div>
              <Card.Title className="fs-6">Total Insumos</Card.Title>
              <h3 className="text-primary">{totalInsumos}</h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-success mb-2">💰</div>
              <Card.Title className="fs-6">Valor Total</Card.Title>
              <h3 className="text-success">S/ {valorTotal.toFixed(2)}</h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-warning mb-2">⚠️</div>
              <Card.Title className="fs-6">Stock Bajo</Card.Title>
              <h3 className="text-warning">{stockBajo}</h3>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3} className="mb-3">
          <Card className="h-100 border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="text-info mb-2">🏷️</div>
              <Card.Title className="fs-6">Categorías</Card.Title>
              <h3 className="text-info">{categoriasActivas}</h3>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Barra de búsqueda y filtros */}
      <Card className="mb-4 border-0 shadow-sm">
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Control
                  type="text"
                  placeholder="🔍 Buscar por nombre o categoría..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
              >
                {categorias.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </Form.Select>
            </Col>
            <Col md={5} className="text-end">
              {/* SOLO ADMIN puede agregar */}
              {rol === "admin" && (
                <Button 
                  variant="primary" 
                  onClick={() => {
                    setInsumoEditando(null);
                    setShowModal(true);
                  }}
                  className="px-4"
                >
                  ➕ Agregar Insumo
                </Button>
              )}
              {/* COCINA puede solicitar */}
              {rol === "cocina" && (
                <Button 
                  variant="success"
                  onClick={() => {
                    // Solicitud general de insumos
                    const solicitudes = JSON.parse(localStorage.getItem('solicitudesInsumos') || '[]');
                    const solicitudGeneral = {
                      id: Date.now(),
                      tipo: 'general',
                      mensaje: 'Solicitud general de revisión de insumos',
                      fecha: new Date().toLocaleString(),
                      estado: 'pendiente'
                    };
                    localStorage.setItem('solicitudesInsumos', JSON.stringify([...solicitudes, solicitudGeneral]));
                    setSolicitudRealizada(true);
                    setTimeout(() => setSolicitudRealizada(false), 3000);
                  }}
                >
                  📋 Solicitar Insumos
                </Button>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabla de insumos */}
      <Card className="border-0 shadow-sm">
        <Card.Header className="bg-white border-0">
          <h5 className="mb-0">📋 Lista de Insumos</h5>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>Insumo</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Categoría</th>
                <th>Valor Total</th>
                <th width="200">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumosFiltrados.map(insumo => {
                const estaBajoStock = insumo.cantidad <= insumo.minimo;
                return (
                  <tr key={insumo.id} className={estaBajoStock ? 'table-warning' : ''}>
                    <td>
                      <div>
                        <strong>{insumo.nombre}</strong>
                        {estaBajoStock && (
                          <Badge bg="warning" text="dark" className="ms-2">Stock Bajo</Badge>
                        )}
                      </div>
                      <small className="text-muted">Unidad: {insumo.unidad}</small>
                    </td>
                    <td>
                      <span className={estaBajoStock ? 'text-danger fw-bold' : 'text-success'}>
                        {insumo.cantidad} {insumo.unidad}
                      </span>
                      <br/>
                      <small className="text-muted">Mín: {insumo.minimo} {insumo.unidad}</small>
                    </td>
                    <td>S/ {insumo.precio.toFixed(2)}</td>
                    <td>
                      <Badge bg="secondary">{insumo.categoria}</Badge>
                    </td>
                    <td>
                      <strong>S/ {(insumo.cantidad * insumo.precio).toFixed(2)}</strong>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        {/* SOLO ADMIN puede editar/eliminar */}
                        {rol === "admin" && (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => {
                                setInsumoEditando(insumo);
                                setShowModal(true);
                              }}
                              title="Editar insumo"
                            >
                              ✏️ Editar
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => {
                                if (window.confirm(`¿Eliminar ${insumo.nombre}?`)) {
                                  eliminarInsumo(insumo.id);
                                }
                              }}
                              title="Eliminar insumo"
                            >
                              🗑️ Eliminar
                            </Button>
                          </>
                        )}
                        
                        {/* COCINA solo puede solicitar */}
                        {rol === "cocina" && (
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => solicitarInsumo(insumo)}
                            title="Solicitar este insumo"
                            disabled={!estaBajoStock}
                          >
                            📝 Solicitar
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          
          {insumosFiltrados.length === 0 && (
            <div className="text-center py-5">
              <div className="text-muted">📭 No se encontraron insumos</div>
              {rol === "admin" && (
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => setShowModal(true)}
                >
                  Agregar primer insumo
                </Button>
              )}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Modal de formulario - Solo visible para admin */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {insumoEditando ? '✏️ Editar Insumo' : '➕ Agregar Nuevo Insumo'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rol === "admin" ? (
            <FormInsumo
              insumo={insumoEditando}
              onGuardar={(datos) => {
                if (insumoEditando) {
                  editarInsumo({ ...datos, id: insumoEditando.id });
                } else {
                  agregarInsumo(datos);
                }
                setShowModal(false);
              }}
              onCancelar={() => setShowModal(false)}
            />
          ) : (
            <div className="text-center p-4">
              <h5>❌ Acceso Denegado</h5>
              <p>No tienes permisos para modificar insumos</p>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}

// Componente del formulario (solo usado por admin)
function FormInsumo({ insumo, onGuardar, onCancelar }) {
  const [formData, setFormData] = useState({
    nombre: insumo?.nombre || '',
    cantidad: insumo?.cantidad || '',
    precio: insumo?.precio || '',
    categoria: insumo?.categoria || 'Pescados',
    unidad: insumo?.unidad || 'kg',
    minimo: insumo?.minimo || 0
  });

  const categorias = ['Pescados', 'Mariscos', 'Frutas', 'Verduras', 'Tubérculos', 'Granos', 'Condimentos', 'Hierbas', 'Otros'];
  const unidades = ['kg', 'gr', 'litro', 'unidad', 'hojas', 'paquete', 'caja'];

  const manejarEnvio = (e) => {
    e.preventDefault();
    onGuardar({
      ...formData,
      cantidad: parseInt(formData.cantidad),
      precio: parseFloat(formData.precio),
      minimo: parseInt(formData.minimo)
    });
  };

  return (
    <Form onSubmit={manejarEnvio}>
      <Form.Group className="mb-3">
        <Form.Label>Nombre del Insumo *</Form.Label>
        <Form.Control
          type="text"
          value={formData.nombre}
          onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
          placeholder="Ej: Pescado, Limón, Cebolla, etc."
          required
        />
      </Form.Group>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Cantidad Actual *</Form.Label>
            <Form.Control
              type="number"
              value={formData.cantidad}
              onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Stock Mínimo *</Form.Label>
            <Form.Control
              type="number"
              value={formData.minimo}
              onChange={(e) => setFormData({ ...formData, minimo: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Precio Unitario (S/) *</Form.Label>
            <Form.Control
              type="number"
              step="0.01"
              value={formData.precio}
              onChange={(e) => setFormData({ ...formData, precio: e.target.value })}
              min="0"
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Unidad de Medida *</Form.Label>
            <Form.Select
              value={formData.unidad}
              onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
              required
            >
              {unidades.map(unidad => (
                <option key={unidad} value={unidad}>{unidad}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-4">
        <Form.Label>Categoría *</Form.Label>
        <Form.Select
          value={formData.categoria}
          onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
          required
        >
          {categorias.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </Form.Select>
      </Form.Group>

      <div className="d-flex gap-2 justify-content-end">
        <Button variant="outline-secondary" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button variant="primary" type="submit">
          {insumo ? 'Actualizar' : 'Guardar Insumo'}
        </Button>
      </div>
    </Form>
  );
}

export default Insumos;