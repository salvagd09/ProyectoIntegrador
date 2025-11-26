import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Modulos/CSS/Metricas.css';
import { metricasAPI } from '../../api/metricasAPI'; // 👈 IMPORTA TU API

const Metricas = () => {
  const [metricas, setMetricas] = useState({
    ticketPromedio: 0,
    tiempoPromedio: 0,
    ventasMensuales: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // 👈 Agregar manejo de errores
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Cargar métricas desde el backend
  const cargarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);

      // 👇 USA TU API EN VEZ DE FETCH DIRECTO
      const [ticketData, tiempoData, ventasData] = await Promise.all([
        metricasAPI.getTicketPromedio(fechaInicio, fechaFin),
        metricasAPI.getTiempoPromedio(fechaInicio, fechaFin),
        metricasAPI.getVentasMensuales(fechaInicio, fechaFin)
      ]);

      // 🔍 DEBUG: Ver qué datos llegan
      console.log('Ticket:', ticketData);
      console.log('Tiempo:', tiempoData);
      console.log('Ventas:', ventasData);

      setMetricas({
        ticketPromedio: ticketData.ticket_promedio || 0,
        tiempoPromedio: tiempoData.tiempo_promedio || 0,
        ventasMensuales: ventasData || []
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
      setError('Error al cargar las métricas. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
  }, [fechaInicio, fechaFin]);

  // Formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(valor);
  };

  if (loading) {
    return (
      <div className="metricas-container">
        <div className="loading">Cargando métricas...</div>
      </div>
    );
  }

  // 👇 MOSTRAR ERROR SI EXISTE
  if (error) {
    return (
      <div className="metricas-container">
        <div className="error-message" style={{color: 'red', padding: '20px'}}>
          {error}
        </div>
        <button onClick={cargarMetricas}>Reintentar</button>
      </div>
    );
  }

  return (
    <div className="metricas-container">
      <h1>📊 Dashboard de Métricas</h1>
      
      {/* Filtros de fecha */}
      <div className="filtros">
        <div className="filtro-group">
          <label>Fecha Inicio:</label>
          <input 
            type="date" 
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>
        <div className="filtro-group">
          <label>Fecha Fin:</label>
          <input 
            type="date" 
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        <button onClick={cargarMetricas} className="btn-actualizar">
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      <div className="kpis-container">
        <div className="kpi-card">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <h3>Ticket Promedio</h3>
            <p className="kpi-value">{formatearMoneda(metricas.ticketPromedio)}</p>
            <span className="kpi-description">Monto promedio por venta</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon">⏱️</div>
          <div className="kpi-content">
            <h3>Tiempo Promedio Pedido</h3>
            <p className="kpi-value">{metricas.tiempoPromedio} min</p>
            <span className="kpi-description">Tiempo promedio de preparación</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Ventas Mensuales */}
      <div className="chart-container">
        <h2>Ventas por Mes</h2>
        {metricas.ventasMensuales.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={metricas.ventasMensuales}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value) => [formatearMoneda(value), 'Ventas']}
              />
              <Legend />
              <Bar 
                dataKey="ventas" 
                fill="#8884d8" 
                name="Ventas (S/)"
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="no-data">No hay datos de ventas para el período seleccionado</div>
        )}
      </div>

      {/* Tabla de Ventas Detallada */}
      <div className="tabla-container">
        <h2>Detalle de Ventas Mensuales</h2>
        <table className="tabla-ventas">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Ventas Totales</th>
              <th>Cantidad de Pedidos</th>
            </tr>
          </thead>
          <tbody>
            {metricas.ventasMensuales.map((item, index) => (
              <tr key={index}>
                <td>{item.mes}</td>
                <td>{formatearMoneda(item.ventas)}</td>
                <td>{item.cantidad_pedidos || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Metricas;
