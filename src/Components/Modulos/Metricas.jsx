import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import '../Modulos/Metricas.css';

import { API_BASE_URL } from "../Configuracion/api.jsx";

const Metricas = () => {
  const [metricas, setMetricas] = useState({
    ticketPromedio: 0,
    tiempoPromedio: 0,
    ventasMensuales: []
  });
  const [loading, setLoading] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [topPlatillos, setTopPlatillos] = useState([]);
  const [mesSeleccionado, setMesSeleccionado] = useState('');

  // Todos los meses del año para el filtro
  const mesesDelAño = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  // Cargar métricas desde el backend
  const cargarMetricas = async () => {
    try {
      setLoading(true);
      
      // Parámetros de fecha si existen
      const params = new URLSearchParams();
      if (fechaInicio) params.append('fecha_inicio', fechaInicio);
      if (fechaFin) params.append('fecha_fin', fechaFin);

      const [ticketRes, tiempoRes, ventasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/metricas/ticket-promedio?${params}`),
        fetch(`${API_BASE_URL}/api/metricas/tiempo-promedio?${params}`),
        fetch(`${API_BASE_URL}/api/metricas/ventas-mensuales?${params}`)
      ]);

      const ticketData = await ticketRes.json();
      const tiempoData = await tiempoRes.json();
      const ventasData = await ventasRes.json();

      setMetricas({
        ticketPromedio: ticketData.ticket_promedio || 0,
        tiempoPromedio: tiempoData.tiempo_promedio || 0,
        ventasMensuales: ventasData || []
      });
    } catch (error) {
      console.error('Error cargando métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar top platillos por mes
  const cargarTopPlatillos = async (mes = '') => {
    try {
      const params = new URLSearchParams();
      if (mes) params.append('mes', mes);
      
      const response = await fetch(`${API_BASE_URL}/api/metricas/top5-platillos-mensual?${params}`);
      const data = await response.json();
      setTopPlatillos(data.top_platillos_por_mes || []);
    } catch (error) {
      console.error('Error cargando top platillos:', error);
    }
  };

  useEffect(() => {
    cargarMetricas();
    cargarTopPlatillos(mesSeleccionado);
  }, [fechaInicio, fechaFin, mesSeleccionado]);

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

  return (
    <div className="metricas-container">
      <h1>Nuestras Métricas</h1>
      
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

      {/* NUEVA SECCIÓN: Top 5 Platillos Más Vendidos (AHORA SEGUNDO) */}
      <div className="tabla-container">
        <div className="filtro-superior">
          <h2>🏆 Top 5 Platillos Más Vendidos</h2>
          <div className="filtro-mes">
            <label>Filtrar por mes:</label>
            <select 
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
            >
              <option value="">Todos los meses</option>
              {mesesDelAño.map((mes, index) => (
                <option key={index} value={mes}>
                  {mes}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {topPlatillos.length > 0 ? (
          topPlatillos.map((mes) => (
            <div key={`${mes.año}-${mes.mes_numero}`} className="mes-container">
              <h3 className="mes-titulo">{mes.mes_nombre} {mes.año}</h3>
              <table className="tabla-top-platillos">
                <thead>
                  <tr>
                    <th>Posición</th>
                    <th>Platillo</th>
                    <th>Total Vendido</th>
                    <th>Veces Pedido</th>
                  </tr>
                </thead>
                <tbody>
                  {mes.platillos.map((platillo, index) => (
                    <tr key={platillo.producto_id}>
                      <td>#{index + 1}</td>
                      <td>{platillo.nombre}</td>
                      <td>{platillo.total_vendido} unidades</td>
                      <td>{platillo.veces_pedido} veces</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <div className="no-data">
            {mesSeleccionado 
              ? `No hay datos de platillos para ${mesSeleccionado}`
              : 'No hay datos de platillos para el período seleccionado'
            }
          </div>
        )}
      </div>

      {/* Gráfico de Ventas Mensuales (AHORA AL FINAL) */}
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

      {/* Tabla de Ventas Detallada (AHORA AL FINAL) */}
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
