/**
 * Utility functions to format responses according to JSON:API specification
 * https://jsonapi.org/
 */

/**
 * Format a resource according to JSON:API spec
 * @param {Object} resource - The resource to format
 * @param {String} type - The resource type
 * @returns {Object} JSON:API formatted resource
 */
exports.formatResource = (resource, type) => {
  if (!resource) return null;
  
  const id = resource._id || resource.id;
  const attributes = { ...resource };
  
  // Remove id and _id from attributes
  delete attributes._id;
  delete attributes.id;
  delete attributes.__v;
  
  // Handle links and relationships separately
  const links = attributes._links || {};
  delete attributes._links;
  
  return {
    type,
    id: id.toString(),
    attributes,
    links: {
      self: links.self ? links.self.href : null
    }
  };
};

/**
 * Format a collection of resources according to JSON:API spec
 * @param {Array} resources - Array of resources
 * @param {String} type - The resource type
 * @param {Object} meta - Optional metadata
 * @param {Object} links - Optional collection links
 * @returns {Object} JSON:API formatted collection
 */
exports.formatCollection = (resources, type, meta = {}, links = {}) => {
  return {
    jsonapi: { version: '1.0' },
    meta,
    links,
    data: resources.map(resource => this.formatResource(resource, type))
  };
};

/**
 * Format a single resource according to JSON:API spec
 * @param {Object} resource - The resource to format
 * @param {String} type - The resource type
 * @param {Object} meta - Optional metadata
 * @returns {Object} JSON:API formatted resource
 */
exports.formatSingleResource = (resource, type, meta = {}) => {
  return {
    jsonapi: { version: '1.0' },
    meta,
    data: this.formatResource(resource, type)
  };
};

/**
 * Format an error according to JSON:API spec
 * @param {String} title - The error title
 * @param {String} detail - The error detail
 * @param {Number} status - The HTTP status code
 * @param {String} code - Optional error code
 * @returns {Object} JSON:API formatted error
 */
exports.formatError = (title, detail, status, code = null) => {
  const error = {
    title,
    detail,
    status: status.toString()
  };
  
  if (code) {
    error.code = code;
  }
  
  return {
    jsonapi: { version: '1.0' },
    errors: [error]
  };
};
