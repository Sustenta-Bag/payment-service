const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const router = express.Router();
const logger = require('../utils/logger');
const methodValidation = require('../middlewares/methodValidationMiddleware');
const cacheMiddleware = require('../middlewares/cacheMiddleware');

// Middleware para validação de preflight CORS
router.use(methodValidation.handlePreflight());

/**
 * @swagger
 * /profiles/{type}:
 *   get:
 *     summary: Obtém a documentação de profile para um tipo de recurso
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de recurso (payment, user, etc)
 *     responses:
 *       200:
 *         description: Documentação de profile
 *       404:
 *         description: Profile não encontrado
 */
router.get(
  '/:type',
  methodValidation.readOnly(),
  cacheMiddleware.setCacheHeaders(86400), // Cache por 24 horas
  cacheMiddleware.setEtagHeader(),
  async (req, res) => {
    try {
      const { type } = req.params;
      const profilePath = path.join(__dirname, '..', 'profiles', type, 'index.md');
      
      try {
        const content = await fs.readFile(profilePath, 'utf8');
        
        // Defina o tipo de conteúdo como texto ou HTML
        res.set('Content-Type', 'text/markdown');
        return res.send(content);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({
            success: false,
            message: `Profile para ${type} não encontrado`
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Erro ao obter profile: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter profile',
        error: error.message
      });
    }
  }
);

/**
 * @swagger
 * /profiles/{type}/schema:
 *   get:
 *     summary: Obtém o schema JSON para um tipo de recurso
 *     tags: [Profiles]
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *         description: Tipo de recurso (payment, user, etc)
 *     responses:
 *       200:
 *         description: Schema JSON
 *       404:
 *         description: Schema não encontrado
 */
router.get(
  '/:type/schema',
  methodValidation.readOnly(),
  cacheMiddleware.setCacheHeaders(86400), // Cache por 24 horas
  cacheMiddleware.setEtagHeader(),
  async (req, res) => {
    try {
      const { type } = req.params;
      const schemaPath = path.join(__dirname, '..', 'profiles', type, 'schema.json');
      
      try {
        const content = await fs.readFile(schemaPath, 'utf8');
        
        // Defina o tipo de conteúdo como JSON
        res.set('Content-Type', 'application/schema+json');
        
        // Adiciona Link header para profile
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        res.set('Link', `<${baseUrl}/profiles/${type}>; rel="profile"`);
        
        return res.send(content);
      } catch (error) {
        if (error.code === 'ENOENT') {
          return res.status(404).json({
            success: false,
            message: `Schema para ${type} não encontrado`
          });
        }
        throw error;
      }
    } catch (error) {
      logger.error(`Erro ao obter schema: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Erro ao obter schema',
        error: error.message
      });
    }
  }
);

module.exports = router;
