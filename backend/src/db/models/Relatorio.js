const mongoose = require('mongoose');

const tarefaSelecionadaSchema = new mongoose.Schema({
  id:        { type: String, default: '' },
  descricao: { type: String, default: '' },
  status:    { type: String, default: 'nao-iniciada' },
  observacao:{ type: String, default: '' }
}, { _id: false });

const fotoSchema = new mongoose.Schema({
  url:       { type: String, required: true },
  public_id: { type: String, required: true },
  dataHora:  { type: Date,   default: Date.now },
  observacao:{ type: String, default: '' },
  ordem:     { type: Number, default: 0 },
  tarefaId:  { type: mongoose.Schema.Types.Mixed, default: null }
});

const relatorioSchema = new mongoose.Schema({
  obraId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Obra',
    required: true,
    index: true
  },
  dataCriacao:   { type: Date,    default: Date.now },
  dataRelatorio: { type: Date,    required: true },
  supervisor:    { type: String,  default: 'Maurício Carnaúba', trim: true },
  endereco:      { type: String,  trim: true, default: '' },
  observacaoGeral:{ type: String, trim: true, default: '' },
  tarefasSelecionadas: [tarefaSelecionadaSchema],
  fotos: [fotoSchema],
  pdfGerado: { type: Boolean, default: false },
  pdfUrl:    { type: String,  default: '' },
  status: {
    type: String,
    enum: ['rascunho', 'finalizado'],
    default: 'rascunho'
  },
  ativo: { type: Boolean, default: true }
}, { timestamps: true });

relatorioSchema.index({ obraId: 1, dataRelatorio: -1 });

module.exports = mongoose.model('Relatorio', relatorioSchema);
