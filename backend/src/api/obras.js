const express = require('express');
const router = express.Router();
const Obra = require('../db/models/Obra');
const Tarefa = require('../db/models/Tarefa');
const Relatorio = require('../db/models/Relatorio');

// GET /api/obras - Lista todas obras ativas
router.get('/', async (req, res) => {
  try {
    const obras = await Obra.find({ ativo: true }).sort({ dataCriacao: -1 });
    res.json(obras);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/obras/:id - Detalhe de uma obra
router.get('/:id', async (req, res) => {
  try {
    const obra = await Obra.findById(req.params.id);
    if (!obra || !obra.ativo) {
      return res.status(404).json({ erro: 'Obra não encontrada' });
    }
    res.json(obra);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/obras - Criar nova obra
router.post('/', async (req, res) => {
  try {
    const { nome, endereco, descricao } = req.body;
    const obra = await Obra.create({ nome, endereco, descricao });
    res.status(201).json(obra);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/obras/:id - Atualizar obra
router.put('/:id', async (req, res) => {
  try {
    const { nome, endereco, descricao } = req.body;
    const obra = await Obra.findByIdAndUpdate(
      req.params.id,
      { nome, endereco, descricao },
      { new: true, runValidators: true }
    );
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada' });
    res.json(obra);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/obras/:id - Soft delete
router.delete('/:id', async (req, res) => {
  try {
    const obra = await Obra.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada' });
    // Soft delete cascata
    await Tarefa.updateMany({ obraId: obra._id }, { ativo: false });
    await Relatorio.updateMany({ obraId: obra._id }, { ativo: false });
    res.json({ mensagem: 'Obra removida', obra });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
