/**
 * Middleware para negociação de conteúdo
 */
const hateoasUtils = require('../utils/hateoasUtils');
const jsonApiUtils = require('../utils/jsonApiUtils');
const profileUtils = require('../utils/profileUtils');

/**
 * Determina o formato de resposta com base no Accept header
 * @returns {Function} Middleware Express
 */
exports.contentNegotiation = () => {
  return (req, res, next) => {
    const accept = req.headers.accept || '';
    
    // Formato padrão
    let format = 'json';
    
    // Verifica o formato solicitado
    if (accept.includes('application/vnd.api+json')) {
      format = 'jsonapi';
    } else if (accept.includes('application/hal+json') || accept.includes('application/json')) {
      format = 'hateoas';
    }
    
    // Detect resource type from URL
    let resourceType = null;
    if (req.path.includes('/payments/')) {
      resourceType = 'payment';
    }
    
    // Add profile link headers for better RFC 6906 compliance
    if (resourceType) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const profileUrl = `${baseUrl}/profiles/${resourceType}`;
      res.set('Link', `<${profileUrl}>; rel="profile"`);
    }
    
    // Sobrescreve o método res.json
    const originalJson = res.json;
    res.json = function(body) {
      if (!body) return originalJson.call(this, body);
      
      // Define o Content-Type adequado
      switch (format) {
        case 'jsonapi':
          res.set('Content-Type', 'application/vnd.api+json');
          
          // Se for um erro
          if (!body.success) {
            return originalJson.call(this, jsonApiUtils.formatError(
              body.message || 'Erro',
              body.error || body.message || 'Ocorreu um erro',
              res.statusCode
            ));
          }
          
          // Se for uma coleção
          if (body.data && Array.isArray(body.data.payments)) {
            return originalJson.call(this, jsonApiUtils.formatCollection(
              body.data.payments,
              'payments',
              body.data.pagination,
              body._links
            ));
          }
          
          // Se for um recurso único
          return originalJson.call(this, jsonApiUtils.formatSingleResource(
            body.data,
            'payment',
            { success: body.success }
          ));
          
        case 'hateoas':
          res.set('Content-Type', 'application/hal+json');
          // Já está no formato HATEOAS
          return originalJson.call(this, body);
          
        default:
          res.set('Content-Type', 'application/json');
          return originalJson.call(this, body);
      }
    };
    
    next();
  };
};
