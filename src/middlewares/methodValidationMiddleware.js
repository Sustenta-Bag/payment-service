/**
 * Middleware para validação de métodos HTTP conforme princípios RESTful
 */

/**
 * Cria um middleware que valida os métodos HTTP permitidos para um endpoint
 * @param {Array} allowedMethods - Array com métodos HTTP permitidos
 * @returns {Function} Middleware Express
 */
exports.methodValidator = (allowedMethods = ['GET']) => {
  return (req, res, next) => {
    if (allowedMethods.includes(req.method)) {
      return next();
    }
    
    // Se o método não é permitido, adiciona um header Allow
    res.set('Allow', allowedMethods.join(', '));
    
    return res.status(405).json({
      success: false,
      message: 'Método não permitido',
      allowedMethods
    });
  };
};

/**
 * Middleware para recursos READ-ONLY
 * @returns {Function} Middleware Express
 */
exports.readOnly = () => {
  return exports.methodValidator(['GET', 'HEAD', 'OPTIONS']);
};

/**
 * Middleware para recursos que permitem todas as operações CRUD
 * @returns {Function} Middleware Express
 */
exports.fullResource = () => {
  return exports.methodValidator(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);
};

/**
 * Função auxiliar para adicionar headers CORS para requisições OPTIONS
 * Fundamental para APIs RESTful que são consumidas por navegadores
 * @returns {Function} Middleware Express
 */
exports.handlePreflight = () => {
  return (req, res, next) => {
    if (req.method === 'OPTIONS') {
      // Devolve headers CORS
      res.set('Access-Control-Allow-Origin', '*');
      res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
      res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.set('Access-Control-Max-Age', '86400'); // 24 horas
      return res.status(204).end();
    }
    
    next();
  };
};
