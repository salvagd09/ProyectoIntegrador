import React from 'react';
import { Container, Card, Row, Col, Form, Button } from 'react-bootstrap';
// 
import ThemeSelector from '../Configuracion/ThemeSelector';
import { useTheme } from '../../context/ThemeContext';

function Configuracion() {
  // Estilos para las cards
  const cardStyle = {
    backgroundColor: 'var(--color-card)',
    borderColor: 'var(--color-accent)',
    color: 'var(--color-text)',
  };

  // Estilo para los títulos
  const titleStyle = {
    color: 'var(--color-title)',
    fontFamily: 'var(--font-title)',
  };

  // Estilo para los subtítulos
  const subtitleStyle = {
    color: 'var(--color-accent)',
  };

  // Estado de fuente
  const { currentFontScale, changeFontScale } = useTheme();

  return (
    <Container className="py-5" style={{ backgroundColor: 'var(--color-bg)', minHeight: '90vh' }}>
        <h2 
            className="text-center mb-5 fs-2" 
            style={titleStyle}
        >
            Ajustes de la Aplicación
        </h2>

        {/* Sección de temas de la página */}
        <Row className="justify-content-center mb-5">
            <Col md={8} lg={6}>
                <Card style={cardStyle}>
                  <Card.Body>
                    <h3 className="fs-4 mb-4" style={subtitleStyle}>
                        Aspecto y Visualización
                    </h3>

                    {/* Selector de Tema */}
                    <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                        <span style={{ color: 'var(--color-text)' }}>
                            Tema de la Interfaz:
                        </span>
                          <ThemeSelector />
                    </div>

                    {/* Configuración del tamaño de fuente */}
                    <div className="d-flex align-items-center justify-content-between">
                        <span style={{ color: 'var(--color-text)' }}>
                            Tamaño de Fuente Base:
                        </span>
                        <Form.Select style={{ 
                            width: '170px', 
                            backgroundColor: 'var(--color-bg)',
                            borderColor: 'var(--color-accent)',
                            color: 'var(--color-text)'
                          }}
                            value={currentFontScale}
                            onChange={(e) => changeFontScale(e.target.value)}
                        >
                          <option value="medium"> Mediana </option>
                          <option value="large"> Grande </option>
                          <option value="small"> Pequeña </option>
                        </Form.Select>
                    </div>
                  </Card.Body>
                </Card>
            </Col>
        </Row>

        {/* Sección de ajustes de usuario */}
        <Row className="justify-content-center">
            <Col md={8} lg={6}>
                <Card style={cardStyle}>
                  <Card.Body>
                      <h3 className="fs-4 mb-4" style={subtitleStyle}>
                          Configuración de Cuenta
                      </h3>

                      {/* Ejemplo de un botón temático */}
                      <Button 
                          variant="primary" 
                          style={{ 
                              backgroundColor: 'var(--color-btn)', 
                              borderColor: 'var(--color-accent)',
                              color: 'white',
                              marginBottom: '1rem'
                          }}
                          className="w-100"
                      >
                          Cambiar Contraseña
                      </Button>

                      {/* Ejemplo de un botón de acción destructiva */}
                      <Button 
                          variant="danger" 
                          style={{ 
                              backgroundColor: 'var(--color-btn-delete)', 
                              borderColor: 'var(--color-btn-delete)',
                              color: 'var(--color-text)', 
                          }}
                          className="w-100"
                      >
                          Cerrar Sesión en Todos los Dispositivos
                      </Button>
                  </Card.Body>
                </Card>
            </Col>
        </Row>
    </Container>
  );
}
export default Configuracion;
