/**
 * Utility to generate HATEOAS links for API responses
 */
const profileUtils = require('./profileUtils');

/**
 * Generate links for a payment resource
 * @param {string} paymentId - The payment ID
 * @param {string} req - Express request object
 * @returns {Array} Array of links
 */
exports.generatePaymentLinks = (paymentId, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  return [
    {
      rel: 'self',
      href: `${baseUrl}/api/payments/${paymentId}`,
      method: 'GET'
    },
    {
      rel: 'cancel',
      href: `${baseUrl}/api/payments/${paymentId}/cancel`,
      method: 'POST'
    },
    {
      rel: 'refund',
      href: `${baseUrl}/api/payments/${paymentId}/refund`,
      method: 'POST'
    },
    {
      rel: 'payments',
      href: `${baseUrl}/api/payments`,
      method: 'GET',
      title: 'All Payments'
    },
    {
      rel: 'webhook',
      href: `${baseUrl}/api/payments/webhook`,
      method: 'POST',
      title: 'Payment Webhook'
    }
  ];
};

/**
 * Generate links for collections
 * @param {string} route - The base route
 * @param {Object} req - Express request object
 * @param {Object} pagination - Pagination information
 * @returns {Array} Array of links
 */
exports.generateCollectionLinks = (route, req, pagination) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  
  const links = [
    {
      rel: 'self',
      href: `${baseUrl}${route}`,
      method: 'GET'
    },
    {
      rel: 'create',
      href: `${baseUrl}${route}`,
      method: 'POST',
      title: 'Create new resource'
    }
  ];

  // Add pagination links if provided
  if (pagination) {
    const { page, limit, totalPages } = pagination;
    
    // First page
    links.push({
      rel: 'first',
      href: `${baseUrl}${route}?page=1&limit=${limit}`,
      method: 'GET'
    });
    
    // Previous page
    if (page > 1) {
      links.push({
        rel: 'prev',
        href: `${baseUrl}${route}?page=${page - 1}&limit=${limit}`,
        method: 'GET'
      });
    }
    
    // Next page
    if (page < totalPages) {
      links.push({
        rel: 'next',
        href: `${baseUrl}${route}?page=${page + 1}&limit=${limit}`,
        method: 'GET'
      });
    }
    
    // Last page
    links.push({
      rel: 'last',
      href: `${baseUrl}${route}?page=${totalPages}&limit=${limit}`,
      method: 'GET'
    });
  }
  
  return links;
};

/**
 * Generate relationship links for a resource
 * @param {Object} resource - The resource object
 * @param {Object} req - Express request object
 * @returns {Object} Object containing relationship links
 */
exports.generateRelationshipLinks = (resource, req) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const relationships = {};
  
  // For payments, add relationships
  if (resource.userId) {
    relationships.user = {
      links: {
        self: `${baseUrl}/api/users/${resource.userId}`,
        related: `${baseUrl}/api/users/${resource.userId}/payments`
      }
    };
  }
  
  if (resource.items && resource.items.length > 0) {
    relationships.items = {
      links: {
        self: `${baseUrl}/api/payments/${resource._id}/items`
      }
    };
  }
  
  return relationships;
};

/**
 * Create a HATEOAS response object
 * @param {boolean} success - Whether the request was successful
 * @param {Object} data - The data to include in the response
 * @param {Array} links - HATEOAS links
 * @param {String} message - Optional message
 * @param {Object} req - Express request object (optional)
 * @param {Object} meta - Optional metadata (pagination, stats, etc.)
 * @returns {Object} HATEOAS formatted response
 */
exports.createHateoasResponse = (success, data, links, message = null, req = null, meta = null) => {
  const response = {
    success,
    _links: links
  };
  
  if (data) {
    response.data = data;
    
    // If data is a single resource with _id, add relationships
    if (req && data._id && !Array.isArray(data)) {
      response._relationships = this.generateRelationshipLinks(data, req);
      
      // Add profile links if it's a payment resource
      if (req && data.orderId) {
        response._profiles = profileUtils.generateResourceProfiles('payment', req);
      }
    }
  }
  
  if (message) {
    response.message = message;
  }
  
  // Add metadata if provided
  if (meta) {
    response._meta = meta;
  }
  
  return response;
};
