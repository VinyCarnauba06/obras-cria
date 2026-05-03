const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Tarefa = require('../db/models/Tarefa');
const Obra = require('../db/models/Obra');

const validarId = (id, res) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    res.status(400).json({ erro: 'ID inválido' });
    return false;
  }
  return true;
};

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

// POST /api/obras/:obraId/tarefas/importar — recebe tarefas parseadas pelo frontend
router.post('/obras/:obraId/tarefas/importar', async (req, res) => {
  try {
    const { obraId } = req.params;
    const { tarefas } = req.body;

    if (!Array.isArray(tarefas) || tarefas.length === 0) {
      return res.status(400).json({ erro: 'Lista de tarefas inválida ou vazia' });
    }
    if (tarefas.length > 100) {
      return res.status(400).json({ erro: 'Máximo de 100 tarefas por importação' });
    }

    const obra = await Obra.findById(obraId);
    if (!obra) return res.status(404).json({ erro: 'Obra não encontrada' });

    const docs = tarefas.map(t => ({
      obraId,
      descricao: String(t.descricao || '').trim().slice(0, 500),
      observacoes: t.observacoes || '',
      motivoAtraso: t.motivoAtraso || '',
      status: 'nao-iniciada',
      mes: t.mes || null,
      dataCriacao: t.dataCriacao ? new Date(t.dataCriacao) : new Date(),
      historico: [{
        data: new Date(),
        statusAnterior: null,
        statusNovo: 'nao-iniciada',
        mudancas: { criacao: true, importacao: true },
        autor: 'Importação PDF'
      }]
    }));

    const inseridas = await Tarefa.insertMany(docs);
    res.status(201).json({ inseridas: inseridas.length, tarefas: inseridas });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// POST /api/obras/:obraId/tarefas/padrao  — bulk insert da programação padrão
router.post('/obras/:obraId/tarefas/padrao', async (req, res) => {
  const TAREFAS_PADRAO = [
    'Terraplanagem do Terreno',
    'Projetos na Obra',
    'Sondagem',
    'Topografia',
    'Instalação de Conteiners/Almoxarifado',
    'Tapumes e Portões',
    'Placas de Segurança e de Obra',
    'Área de Vivência / Refeitório',
    'Escavação dos Muros e Muretas',
    "Escavação Base do Castelo D'água",
    "Execução/Concretagem da Base do Castelo D'água",
    'Alvenaria Singela Muros e Muretas',
    'Impermeabilização com Neutrol',
    'Escavação Fundações dos Pilares',
    'Concretagem Laje Radier'
  ];

  try {
    const existentes = await Tarefa.countDocuments({ obraId: req.params.obraId, ativo: true });
    if (existentes > 0) {
      return res.status(409).json({ erro: 'Esta obra já possui tarefas cadastradas' });
    }

    const tarefas = TAREFAS_PADRAO.map(descricao => ({
      obraId: req.params.obraId,
      descricao,
      status: 'nao-iniciada',
      historico: [{
        data: new Date(),
        statusAnterior: null,
        statusNovo: 'nao-iniciada',
        mudancas: { criacao: true },
        autor: 'Sistema'
      }]
    }));

    const inseridas = await Tarefa.insertMany(tarefas);
    res.status(201).json({ inseridas: inseridas.length, tarefas: inseridas });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// POST /api/obras/:obraId/tarefas
router.post('/obras/:obraId/tarefas', async (req, res) => {
  try {
    const { descricao, observacoes, motivoAtraso, status, dependencias, mes, dataCriacao } = req.body;
    const tarefa = await Tarefa.create({
      obraId: req.params.obraId,
      descricao,
      observacoes,
      motivoAtraso,
      status: status || 'nao-iniciada',
      mes: mes || null,
      dataCriacao: dataCriacao ? new Date(dataCriacao) : new Date(),
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
  if (!validarId(req.params.id, res)) return;
  try {
    const tarefaAtual = await Tarefa.findById(req.params.id);
    if (!tarefaAtual) return res.status(404).json({ erro: 'Tarefa não encontrada' });

    const { descricao, observacoes, motivoAtraso, status, dependencias, mes } = req.body;
    const statusAnterior = tarefaAtual.status;

    const atualizacao = {
      descricao,
      observacoes,
      motivoAtraso,
      status,
      mes,
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
  if (!validarId(req.params.id, res)) return;
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
