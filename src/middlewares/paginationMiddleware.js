/**
 * Middleware for handling pagination in collection resources
 */
const { getLinkHeader } = require('../utils/paginationUtils');

/**
 * Middleware to add pagination parameters to the request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const paginationMiddleware = (req, res, next) => {
  // Extract pagination parameters from query
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  
  // Validate pagination parameters
  if (page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      error: 'Invalid pagination parameters. Page must be >= 1, limit must be between 1 and 100.'
    });
  }
  
  // Add pagination parameters to request object
  req.pagination = {
    page,
    limit,
    offset: (page - 1) * limit
  };
  
  // Function to set pagination headers
  res.setPaginationHeaders = (paginationInfo) => {
    if (paginationInfo) {
      // Set Link header
      const linkHeader = getLinkHeader(paginationInfo);
      if (linkHeader) {
        res.set('Link', linkHeader);
      }
      
      // Set X-Pagination headers for clients that may not support Link headers
      res.set('X-Pagination-Page', paginationInfo._meta.currentPage);
      res.set('X-Pagination-Limit', paginationInfo._meta.itemsPerPage);
      res.set('X-Pagination-Total', paginationInfo._meta.totalItems);
      res.set('X-Pagination-Pages', paginationInfo._meta.totalPages);
    }
  };
  
  next();
};

module.exports = paginationMiddleware;
