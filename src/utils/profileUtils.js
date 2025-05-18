/**
 * Utility para gerar profiles compatíveis com RFC 6906
 * RFC 6906: https://tools.ietf.org/html/rfc6906
 * 
 * Os profiles ajudam no entendimento da semântica dos recursos na API RESTful
 */

/**
 * Gera um objeto de profiles para um tipo de recurso
 * @param {String} type - Tipo de recurso (payment, user, etc)
 * @param {Object} req - Express request object
 * @returns {Object} Objeto com profiles
 */
exports.generateResourceProfiles = (type, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const profiles = {
    documentation: `${baseUrl}/api-docs`,
    schema: `${baseUrl}/profiles/${type}/schema`
  };
  
  switch (type) {
    case 'payment':
      profiles.resource = `${baseUrl}/profiles/payment`;
      profiles.collection = `${baseUrl}/profiles/payments`;
      break;
    case 'user':
      profiles.resource = `${baseUrl}/profiles/user`;
      profiles.collection = `${baseUrl}/profiles/users`;
      break;
    default:
      profiles.resource = `${baseUrl}/profiles/${type}`;
      profiles.collection = `${baseUrl}/profiles/${type}s`;
  }
  
  return profiles;
};

/**
 * Gera link para o profile de um recurso
 * @param {String} type - Tipo de recurso (payment, user, etc)
 * @param {Object} req - Express request object 
 * @returns {String} URL do profile
 */
exports.getProfileLink = (type, req) => {
  const profiles = this.generateResourceProfiles(type, req);
  return profiles.resource;
};

/**
 * Adiciona links de profile a um objeto HATEOAS
 * @param {Object} hateoasObject - Objeto HATEOAS
 * @param {String} type - Tipo de recurso
 * @param {Object} req - Express request object
 * @returns {Object} Objeto HATEOAS com profiles
 */
exports.addProfilesToHateoas = (hateoasObject, type, req) => {
  if (!hateoasObject) return hateoasObject;
  
  const profiles = this.generateResourceProfiles(type, req);
  
  return {
    ...hateoasObject,
    _profiles: profiles
  };
};
