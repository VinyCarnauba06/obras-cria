const express = require('express');
const router = express.Router();
const Relatorio = require('../db/models/Relatorio');
const { cloudinary, upload } = require('../config/cloudinary');

function parseFotosPayload(body) {
  if (Array.isArray(body?.fotos)) return body.fotos;
  if (typeof body?.fotos === 'string') {
    try {
      const fotos = JSON.parse(body.fotos);
      return Array.isArray(fotos) ? fotos : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

function parseObservacoesPayload(body) {
  if (Array.isArray(body?.observacoes)) return body.observacoes;
  if (Array.isArray(body?.['observacoes[]'])) return body['observacoes[]'];
  if (typeof body?.observacoes === 'string') {
    try {
      const observacoes = JSON.parse(body.observacoes);
      return Array.isArray(observacoes) ? observacoes : [];
    } catch (error) {
      return [];
    }
  }
  return [];
}

// GET /api/obras/:obraId/relatorios
router.get('/obras/:obraId/relatorios', async (req, res) => {
  try {
    const relatorios = await Relatorio.find({
      obraId: req.params.obraId,
      ativo: true
    }).sort({ dataRelatorio: -1 });
    res.json(relatorios);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// GET /api/relatorios/:id
router.get('/relatorios/:id', async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);
    if (!relatorio || !relatorio.ativo) {
      return res.status(404).json({ erro: 'Relatório não encontrado' });
    }
    res.json(relatorio);
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/obras/:obraId/relatorios
router.post('/obras/:obraId/relatorios', async (req, res) => {
  try {
    const { dataRelatorio, supervisor, endereco, observacaoGeral, status } = req.body;
    const relatorio = await Relatorio.create({
      obraId: req.params.obraId,
      dataRelatorio: dataRelatorio || new Date(),
      supervisor,
      endereco,
      observacaoGeral,
      status: status || 'rascunho',
      fotos: []
    });
    res.status(201).json(relatorio);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// PUT /api/relatorios/:id
router.put('/relatorios/:id', async (req, res) => {
  try {
    const { dataRelatorio, supervisor, endereco, observacaoGeral, status } = req.body;
    const fotos = parseFotosPayload(req.body);
    const update = { dataRelatorio, supervisor, endereco, observacaoGeral, status };
    if (fotos.length > 0 || Array.isArray(req.body.fotos)) {
      update.fotos = fotos;
    }
    const relatorio = await Relatorio.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true, runValidators: true }
    );
    if (!relatorio) return res.status(404).json({ erro: 'Relatório não encontrado' });
    res.json(relatorio);
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/relatorios/:id - Remove + limpa fotos Cloudinary
router.delete('/relatorios/:id', async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);
    if (!relatorio) return res.status(404).json({ erro: 'Relatório não encontrado' });

    // Limpa fotos do Cloudinary
    for (const foto of relatorio.fotos) {
      try {
        if (foto.public_id) {
          await cloudinary.uploader.destroy(foto.public_id);
        }
      } catch (err) {
        console.error('Erro ao deletar foto Cloudinary:', err.message);
      }
    }

    relatorio.ativo = false;
    await relatorio.save();

    res.json({ mensagem: 'Relatório removido', relatorio });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

// POST /api/relatorios/:id/fotos - Upload de fotos
router.post('/relatorios/:id/fotos', upload.array('fotos', 20), async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);
    if (!relatorio) return res.status(404).json({ erro: 'Relatório não encontrado' });

    const ordemInicial = relatorio.fotos.length;
    const observacoes = parseObservacoesPayload(req.body);
    const novasFotos = (req.files || []).map((file, idx) => ({
      url: file.path,
      public_id: file.filename,
      dataHora: new Date(),
      observacao: observacoes[idx] || '',
      ordem: ordemInicial + idx
    }));

    relatorio.fotos.push(...novasFotos);
    await relatorio.save();

    res.status(201).json({ mensagem: 'Fotos adicionadas', fotos: novasFotos, relatorio });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// PATCH /api/relatorios/:id/fotos/:fotoId
router.patch('/relatorios/:id/fotos/:fotoId', async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);
    if (!relatorio) return res.status(404).json({ erro: 'Relatório não encontrado' });

    const foto = relatorio.fotos.id(req.params.fotoId);
    if (!foto) return res.status(404).json({ erro: 'Foto não encontrada' });

    foto.observacao = req.body.observacao ?? foto.observacao;
    await relatorio.save();

    res.json({ mensagem: 'Foto atualizada', foto, relatorio });
  } catch (error) {
    res.status(400).json({ erro: error.message });
  }
});

// DELETE /api/relatorios/:id/fotos/:fotoId
router.delete('/relatorios/:id/fotos/:fotoId', async (req, res) => {
  try {
    const relatorio = await Relatorio.findById(req.params.id);
    if (!relatorio) return res.status(404).json({ erro: 'Relatório não encontrado' });

    const foto = relatorio.fotos.id(req.params.fotoId);
    if (!foto) return res.status(404).json({ erro: 'Foto não encontrada' });

    if (foto.public_id) {
      try {
        await cloudinary.uploader.destroy(foto.public_id);
      } catch (err) {
        console.error('Erro Cloudinary:', err.message);
      }
    }

    relatorio.fotos.pull(req.params.fotoId);
    await relatorio.save();

    res.json({ mensagem: 'Foto removida', relatorio });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

module.exports = router;
