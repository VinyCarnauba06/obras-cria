const mongoose = require('mongoose');

const MONGO_OPTS = {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000
};

const conectarDB = async (tentativa = 1) => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, MONGO_OPTS);
    console.log(`✅ MongoDB conectado: ${conn.connection.host}`);

    mongoose.connection.on('error', err => {
      console.error('❌ MongoDB erro de conexão:', err.message);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
    });
  } catch (error) {
    console.error(`❌ Tentativa ${tentativa}/3 - Erro MongoDB: ${error.message}`);
    if (tentativa < 3) {
      await new Promise(r => setTimeout(r, 3000 * tentativa));
      return conectarDB(tentativa + 1);
    }
    process.exit(1);
  }
};

module.exports = conectarDB;
