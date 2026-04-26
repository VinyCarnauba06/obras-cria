require('dotenv').config();
const express = require('express');
const cors = require('cors');
const conectarDB = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Conexão com MongoDB
conectarDB();

// Rotas
app.use('/api/obras', require('./api/obras'));
app.use('/api', require('./api/tarefas'));
app.use('/api', require('./api/relatorios'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Erro:', err.message);
  res.status(err.status || 500).json({
    erro: err.message || 'Erro interno do servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
});
