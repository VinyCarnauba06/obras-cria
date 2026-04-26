const express = require('express');
const router = express.Router();
const Tarefa = require('../db/models/Tarefa');

// GET /api/obras/:obraId/tarefas
router.get('/obras/:obraId/tarefas', async (req, res) => {
  try {
    const tarefas = await Tarefa.find({
      obraId: req.params.obraId,
      ativo: true
    }).sort({ dataCriacao: -1 });
    res.json(tarefas);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/obras/:obraId/tarefas
router.post('/obras/:obraId/tarefas', async (req, res) => {
  try {
    const { descricao, observacoes, motivoAtraso, status, dependencias } = req.body;
    const tarefa = await Tarefa.create({
      obraId: req.params.obraId,
      descricao,
      observacoes,
      motivoAtraso,
      status: status || 'nao-iniciada',
      dependencias: dependencias || [],
      historico: [{
        data: new Date(),
        statusAnterior: null,
        statusNovo: status || 'nao-iniciada',
        mudancas: { criacao: true },
        autor: 'Sistema'
      }]
    });
    res.status(201).json(tarefa);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/tarefas/:id
router.put('/tarefas/:id', async (req, res) => {
  try {
    const tarefaAtual = await Tarefa.findById(req.params.id);
    if (!tarefaAtual) return res.status(404).json({ erro: 'Tarefa não encontrada' });

    const { descricao, observacoes, motivoAtraso, status, dependencias } = req.body;
    const statusAnterior = tarefaAtual.status;

    const atualizacao = {
      descricao,
      observacoes,
      motivoAtraso,
      status,
      dependencias,
      dataAtualizacao: Date.now()
    };

    if (status && status !== statusAnterior) {
      tarefaAtual.historico.push({
        data: new Date(),
        statusAnterior,
        statusNovo: status,
        mudancas: { status: { de: statusAnterior, para: status } },
        autor: 'Sistema'
      });
      atualizacao.historico = tarefaAtual.historico;
    }

    const tarefa = await Tarefa.findByIdAndUpdate(
      req.params.id,
      atualizacao,
      { new: true, runValidators: true }
    );
    res.json(tarefa);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/tarefas/:id
router.delete('/tarefas/:id', async (req, res) => {
  try {
    const tarefa = await Tarefa.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
    res.json({ mensagem: 'Tarefa removida', tarefa });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
