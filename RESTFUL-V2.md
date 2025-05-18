# Payment Service RESTful API (v2)

This document describes the enhanced RESTful features implemented in the Payment Service API according to standard RESTful principles and HATEOAS (Hypermedia as the Engine of Application State).

## Core REST Principles Implemented

### Resource-Based Architecture
All API endpoints represent resources with unique URIs. Resources are organized in collections and individual items.

- `/api/payments` - Collection of payment resources
- `/api/payments/{id}` - Individual payment resource
- `/api/simulations` - Collection of simulation resources
- `/api/simulations/{id}` - Individual simulation resource

### HTTP Method Semantics
The API implements proper HTTP method semantics:

- **GET**: Retrieve resources (read-only)
- **POST**: Create new resources
- **PUT**: Update resources (complete replacement)
- **PATCH**: Partial update of resources
- **DELETE**: Remove resources

### Proper Status Codes
The API returns appropriate HTTP status codes:

- **200 OK**: Successful request
- **201 Created**: Resource successfully created
- **204 No Content**: Successful request with no content
- **304 Not Modified**: Resource has not changed since last request
- **400 Bad Request**: Invalid input
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported for the resource
- **406 Not Acceptable**: Content type not supported
- **415 Unsupported Media Type**: Request content type not supported
- **422 Unprocessable Entity**: Validation error
- **500 Server Error**: Unexpected server error

### Content Negotiation
The API supports different response formats through content negotiation:

- `application/json`: Standard JSON
- `application/hal+json`: HAL (Hypertext Application Language)
- `application/vnd.api+json`: JSON:API format

Request example:
```
GET /api/payments/123
Accept: application/hal+json
```

### HTTP Caching
The API implements HTTP caching mechanisms:

- **ETag**: Entity tags for cache validation
- **Last-Modified**: Timestamp for cache validation
- **Cache-Control**: Cache directives
- **Expires**: Expiration time for cached responses

## HATEOAS Implementation

### Link Relations
Every resource includes links to related resources and actions using standard relation types:

- `self`: Link to the resource itself
- `collection`: Link to the collection the resource belongs to
- `next`: Link to the next resource in a sequence
- `prev`: Link to the previous resource in a sequence
- `create`: Link to create a new resource
- `update`: Link to update the resource
- `delete`: Link to delete the resource
- `cancel`: Link to cancel a payment
- `refund`: Link to refund a payment

### HAL Format Example

```json
{
  "id": "123",
  "amount": 100.00,
  "currency": "USD",
  "status": "completed",
  "created": "2023-05-18T12:00:00Z",
  "_links": {
    "self": { "href": "/api/payments/123" },
    "collection": { "href": "/api/payments" },
    "refund": { "href": "/api/payments/123/refund", "method": "POST" }
  }
}
```

### JSON:API Format Example

```json
{
  "data": {
    "type": "payments",
    "id": "123",
    "attributes": {
      "amount": 100.00,
      "currency": "USD",
      "status": "completed",
      "created": "2023-05-18T12:00:00Z"
    },
    "links": {
      "self": "/api/payments/123"
    },
    "relationships": {
      "transactions": {
        "links": {
          "related": "/api/payments/123/transactions"
        }
      }
    }
  }
}
```

## API Versioning

The API supports versioning through:

1. **HTTP Headers**:
   ```
   Accept: application/json; version=2
   ```

2. **Query Parameters**:
   ```
   GET /api/payments?version=2
   ```

## Resource Profiles

The API implements RFC 6906 for resource profiles, providing semantic information about resources:

- `/profiles/payment`: Profile documentation for payment resources
- `/profiles/payment/schema.json`: JSON Schema for payment resources

Example usage with profile link:

```json
{
  "id": "123",
  "amount": 100.00,
  "_links": {
    "self": { "href": "/api/payments/123" },
    "profile": { "href": "/profiles/payment" }
  }
}
```

## Pagination

Collection resources implement pagination using:

1. **Link Headers**:
   ```
   Link: </api/payments?page=2>; rel="next", </api/payments?page=1>; rel="prev"
   ```

2. **Link Relations in Response Body**:
   ```json
   {
     "data": [...],
     "_links": {
       "self": { "href": "/api/payments?page=1" },
       "next": { "href": "/api/payments?page=2" },
       "last": { "href": "/api/payments?page=5" }
     },
     "_meta": {
       "totalItems": 100,
       "itemsPerPage": 20,
       "currentPage": 1,
       "totalPages": 5
     }
   }
   ```

## Root API Endpoint

The API provides a root endpoint that lists available resources:

```
GET /api
```

Response:
```json
{
  "_links": {
    "self": { "href": "/api" },
    "payments": { "href": "/api/payments" },
    "simulations": { "href": "/api/simulations" },
    "profiles": { "href": "/profiles" }
  }
}
```

## Testing the API

1. **API Root Discovery**:
   ```
   curl -X GET http://localhost:3000/api -H "Accept: application/hal+json"
   ```

2. **Get Payments with HAL Format**:
   ```
   curl -X GET http://localhost:3000/api/payments -H "Accept: application/hal+json"
   ```

3. **Get Payments with JSON:API Format**:
   ```
   curl -X GET http://localhost:3000/api/payments -H "Accept: application/vnd.api+json"
   ```

4. **Create Payment**:
   ```
   curl -X POST http://localhost:3000/api/payments \
     -H "Content-Type: application/json" \
     -d '{"amount": 100.00, "currency": "USD", "description": "Test payment"}'
   ```

5. **Check Caching**:
   ```
   # First request - get ETag
   curl -i -X GET http://localhost:3000/api/payments/123
   
   # Second request - use If-None-Match
   curl -i -X GET http://localhost:3000/api/payments/123 -H "If-None-Match: \"previously-returned-etag\""
   ```

6. **API Versioning**:
   ```
   curl -X GET http://localhost:3000/api/payments -H "Accept: application/json; version=2"
   ```
