---
name: api-conventions
description: REST API design conventions for consistent, well-documented APIs
paths:
  - "src/api/**/*"
  - "src/routes/**/*"
  - "app/Http/**/*"
globs: "**/*.{ts,js,php,py,rb,go}"
---

# REST API Design Conventions

## URL Structure

- Use **kebab-case** for URL paths: `/user-profiles` not `/userProfiles`
- Use **plural nouns** for collections: `/users` not `/user`
- Nest resources logically: `/users/{id}/posts`
- Keep URLs shallow (max 3 levels of nesting)

## HTTP Methods

- `GET` - Retrieve resources (idempotent, cacheable)
- `POST` - Create new resources
- `PUT` - Replace entire resource
- `PATCH` - Partial update
- `DELETE` - Remove resource

## Request/Response Format

- Use **camelCase** for JSON property names
- Include `Content-Type: application/json` header
- Return appropriate HTTP status codes:
  - `200` - Success
  - `201` - Created
  - `204` - No Content (successful DELETE)
  - `400` - Bad Request (validation errors)
  - `401` - Unauthorized
  - `403` - Forbidden
  - `404` - Not Found
  - `422` - Unprocessable Entity
  - `500` - Internal Server Error

## Error Responses

Always return consistent error format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request data is invalid",
    "details": [
      {
        "field": "email",
        "message": "Must be a valid email address"
      }
    ],
    "requestId": "req_abc123"
  }
}
```

## Pagination

Use cursor-based pagination for large datasets:

```json
{
  "data": [...],
  "pagination": {
    "cursor": "eyJpZCI6MTAwfQ==",
    "hasMore": true,
    "limit": 20
  }
}
```

## Versioning

- Include version in URL path: `/api/v1/users`
- Or use `Accept` header: `Accept: application/vnd.api+json; version=1`

## Documentation

- Include OpenAPI/Swagger specs
- Document all endpoints with examples
- Include authentication requirements
- List all possible error codes
