/**
 * Middleware para adicionar cabeçalhos HTTP relacionados a cache
 * úteis para APIs RESTful
 */

/**
 * Adiciona cabeçalhos para controle de cache
 * @param {Number} maxAge - Tempo máximo de cache em segundos
 * @returns {Function} Middleware do Express
 */
exports.setCacheHeaders = (maxAge = 60) => {
  return (req, res, next) => {
    // Define headers para GET e HEAD
    if (req.method === 'GET' || req.method === 'HEAD') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
      res.set('Expires', new Date(Date.now() + maxAge * 1000).toUTCString());
    } else {
      // Define headers para não cachear métodos de modificação
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
    
    next();
  };
};

/**
 * Adiciona cabeçalhos ETag para validação condicional
 * @returns {Function} Middleware do Express
 */
exports.setEtagHeader = () => {
  return (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Gera um ETag simples baseado no conteúdo da resposta
      if (body) {
        const etag = require('crypto')
          .createHash('md5')
          .update(typeof body === 'string' ? body : JSON.stringify(body))
          .digest('hex');
        
        res.set('ETag', `"${etag}"`);
        
        // Implementa a validação condicional
        const clientEtag = req.headers['if-none-match'];
        if (clientEtag === `"${etag}"`) {
          res.status(304).send();
          return res;
        }
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Adiciona header Last-Modified e implementa validação condicional
 * @param {Date} lastModifiedDate - Data da última modificação
 * @returns {Function} Middleware do Express
 */
exports.setLastModifiedHeader = (getLastModifiedDate) => {
  return async (req, res, next) => {
    try {
      const lastModifiedDate = await getLastModifiedDate(req);
      
      if (lastModifiedDate) {
        const lastModifiedStr = lastModifiedDate.toUTCString();
        res.set('Last-Modified', lastModifiedStr);
        
        // Implementa a validação condicional If-Modified-Since
        const ifModifiedSince = req.headers['if-modified-since'];
        if (ifModifiedSince && new Date(ifModifiedSince) >= lastModifiedDate) {
          res.status(304).end();
          return;
        }
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};
