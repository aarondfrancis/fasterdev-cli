---
name: api-conventions
description: REST API design conventions for consistent, well-documented APIs. Use when creating or reviewing API endpoints, routes, or controllers.
---

# REST API Design Conventions

This skill provides guidance for designing and implementing RESTful APIs that are consistent, well-documented, and follow industry best practices.

## When to Use This Skill

Activate this skill when:
- Creating new API endpoints
- Reviewing API code
- Designing API schemas
- Implementing error handling
- Setting up API documentation

## URL Structure Guidelines

When creating URLs:

1. **Use kebab-case** for multi-word paths
   - ✅ `/user-profiles`
   - ❌ `/userProfiles`

2. **Use plural nouns** for collections
   - ✅ `/users`
   - ❌ `/user`

3. **Nest resources logically** (max 3 levels)
   - ✅ `/users/{id}/posts`
   - ❌ `/users/{id}/posts/{postId}/comments/{commentId}/reactions`

## HTTP Method Selection

Choose the appropriate HTTP method:

| Action | Method | Idempotent | Example |
|--------|--------|------------|---------|
| List/Get | GET | Yes | `GET /users` |
| Create | POST | No | `POST /users` |
| Replace | PUT | Yes | `PUT /users/123` |
| Update | PATCH | Yes | `PATCH /users/123` |
| Delete | DELETE | Yes | `DELETE /users/123` |

## Response Format Template

For successful responses:

```json
{
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

For error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": [...],
    "requestId": "req_abc123"
  }
}
```

## Status Code Reference

Always use semantically correct status codes:

**Success (2xx)**
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST that creates a resource
- `204 No Content` - Successful DELETE

**Client Errors (4xx)**
- `400 Bad Request` - Malformed request syntax
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Authenticated but not authorized
- `404 Not Found` - Resource doesn't exist
- `409 Conflict` - Request conflicts with current state
- `422 Unprocessable Entity` - Validation errors

**Server Errors (5xx)**
- `500 Internal Server Error` - Unexpected server error
- `503 Service Unavailable` - Temporary unavailability

## Pagination Implementation

For list endpoints, implement cursor-based pagination:

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasMore: boolean;
    limit: number;
    total?: number;
  };
}
```

Query parameters:
- `?limit=20` - Items per page (default: 20, max: 100)
- `?cursor=abc123` - Cursor for next page

## Validation Best Practices

1. Validate all input at the API boundary
2. Return all validation errors at once, not one at a time
3. Use consistent error codes across the API
4. Include field-level error details

Example validation error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "email", "code": "INVALID_FORMAT", "message": "Must be a valid email" },
      { "field": "age", "code": "OUT_OF_RANGE", "message": "Must be between 18 and 120" }
    ]
  }
}
```

## Documentation Requirements

Every API endpoint should have:

1. **OpenAPI/Swagger specification**
2. **Request example** with all parameters
3. **Response examples** for success and error cases
4. **Authentication requirements**
5. **Rate limiting information**
