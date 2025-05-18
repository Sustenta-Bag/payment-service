/**
 * Pagination utilities for RESTful API collection resources
 */

/**
 * Generate pagination metadata and links for collection resources
 * @param {Object} options - Pagination options
 * @param {number} options.totalItems - Total number of items
 * @param {number} options.page - Current page number (1-based)
 * @param {number} options.limit - Number of items per page
 * @param {string} options.baseUrl - Base URL for the collection
 * @returns {Object} Pagination metadata and links
 */
const getPaginationInfo = (options) => {
  const { totalItems, page = 1, limit = 10, baseUrl } = options;
  
  // Calculate pagination metadata
  const currentPage = parseInt(page, 10);
  const itemsPerPage = parseInt(limit, 10);
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  
  // Generate pagination links
  const links = {
    self: { href: `${baseUrl}?page=${currentPage}&limit=${itemsPerPage}` }
  };
  
  // Add first, prev, next, last links as appropriate
  links.first = { href: `${baseUrl}?page=1&limit=${itemsPerPage}` };
  links.last = { href: `${baseUrl}?page=${totalPages}&limit=${itemsPerPage}` };
  
  if (currentPage > 1) {
    links.prev = { href: `${baseUrl}?page=${currentPage - 1}&limit=${itemsPerPage}` };
  }
  
  if (currentPage < totalPages) {
    links.next = { href: `${baseUrl}?page=${currentPage + 1}&limit=${itemsPerPage}` };
  }
  
  return {
    _links: links,
    _meta: {
      totalItems,
      itemsPerPage,
      currentPage,
      totalPages
    }
  };
};

/**
 * Generate pagination Link headers according to RFC 5988
 * @param {Object} paginationInfo - Pagination info from getPaginationInfo
 * @returns {string} Link header value
 */
const getLinkHeader = (paginationInfo) => {
  const { _links } = paginationInfo;
  const linkHeader = [];
  
  Object.entries(_links).forEach(([rel, link]) => {
    if (rel !== 'self') {
      linkHeader.push(`<${link.href}>; rel="${rel}"`);
    }
  });
  
  return linkHeader.join(', ');
};

/**
 * Apply pagination to a collection
 * @param {Array} collection - Complete collection of items
 * @param {number} page - Current page number (1-based)
 * @param {number} limit - Number of items per page
 * @returns {Array} Paginated collection
 */
const paginateCollection = (collection, page = 1, limit = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  return collection.slice(startIndex, endIndex);
};

module.exports = {
  getPaginationInfo,
  getLinkHeader,
  paginateCollection
};
