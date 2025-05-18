/**
 * Middleware para controle de versionamento da API
 */

/**
 * Adiciona cabeçalhos relacionados ao versionamento da API
 * @param {String} version - Versão atual da API
 * @returns {Function} Middleware do Express
 */
exports.addVersionHeaders = (version = '1.0.0') => {
  return (req, res, next) => {
    // Adiciona header com a versão da API
    res.set('X-API-Version', version);
    
    // Adiciona Link header para descoberta de versões
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const linkHeader = [
      `<${baseUrl}/api>; rel="current-version"`,
      `<${baseUrl}/api/docs>; rel="documentation"`
    ];
    
    res.set('Link', linkHeader.join(', '));
    next();
  };
};

/**
 * Middleware para lidar com múltiplas versões da API
 * @param {Object} handlers - Objeto com handlers para diferentes versões
 * @returns {Function} Middleware do Express
 */
exports.versionedEndpoint = (handlers) => {
  return (req, res, next) => {
    // Verifica a versão da API na requisição (pode ser pelo header Accept ou query param)
    let version = '1.0.0'; // Versão padrão
    
    const acceptHeader = req.get('Accept');
    if (acceptHeader && acceptHeader.includes('version=')) {
      const match = acceptHeader.match(/version=([\d.]+)/);
      if (match) {
        version = match[1];
      }
    } else if (req.query.version) {
      version = req.query.version;
    }
    
    // Seleciona o handler adequado à versão
    const handler = handlers[version] || handlers['default'] || handlers['1.0.0'];
    
    if (!handler) {
      return res.status(406).json({
        success: false,
        message: 'Versão da API não suportada',
        supportedVersions: Object.keys(handlers).filter(v => v !== 'default')
      });
    }
    
    // Armazena a versão no objeto req
    req.apiVersion = version;
    
    // Executa o handler para a versão selecionada
    return handler(req, res, next);
  };
};
