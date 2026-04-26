const mongoose = require('mongoose');

const obraSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true,
    maxlength: [200, 'Nome não pode ter mais que 200 caracteres']
  },
  endereco: {
    type: String,
    required: [true, 'Endereço é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    trim: true,
    default: ''
  },
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

obraSchema.index({ ativo: 1, dataCriacao: -1 });

module.exports = mongoose.model('Obra', obraSchema);
