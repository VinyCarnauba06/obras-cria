const mongoose = require('mongoose');

const historicoSchema = new mongoose.Schema({
  data: { type: Date, default: Date.now },
  statusAnterior: String,
  statusNovo: String,
  mudancas: mongoose.Schema.Types.Mixed,
  autor: { type: String, default: 'Sistema' }
}, { _id: false });

const tarefaSchema = new mongoose.Schema({
  obraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Obra',
    required: true,
    index: true
  },
  descricao: {
    type: String,
    required: [true, 'Descrição é obrigatória'],
    trim: true
  },
  status: {
    type: String,
    enum: ['nao-iniciada', 'em-andamento', 'concluida', 'nao-executada'],
    default: 'nao-iniciada'
  },
  observacoes: {
    type: String,
    trim: true,
    default: ''
  },
  motivoAtraso: {
    type: String,
    trim: true,
    default: ''
  },
  dependencias: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tarefa'
  }],
  dataCriacao: {
    type: Date,
    default: Date.now
  },
  dataAtualizacao: {
    type: Date,
    default: Date.now
  },
  historico: [historicoSchema],
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

tarefaSchema.pre('save', function(next) {
  this.dataAtualizacao = Date.now();
  next();
});

module.exports = mongoose.model('Tarefa', tarefaSchema);
