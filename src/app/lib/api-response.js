/**
 * Standardized API response utility
 * Ensures consistent response format across all endpoints
 */

export class ApiResponse {
  static success(data = null, message = 'Success', meta = {}) {
    return Response.json(
      {
        success: true,
        data,
        message,
        meta,
      },
      { status: 200 }
    );
  }

  static created(data, message = 'Resource created successfully') {
    return Response.json(
      {
        success: true,
        data,
        message,
      },
      { status: 201 }
    );
  }

  static noContent() {
    return new Response(null, { status: 204 });
  }

  static error(message = 'An error occurred', status = 500, errors = null) {
    return Response.json(
      {
        success: false,
        message,
        errors,
        timestamp: new Date().toISOString(),
      },
      { status }
    );
  }

  static badRequest(message = 'Bad request', errors = null) {
    return this.error(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized access') {
    return this.error(message, 401);
  }

  static forbidden(message = 'Access forbidden') {
    return this.error(message, 403);
  }

  static notFound(resource = 'Resource') {
    return this.error(`${resource} not found`, 404);
  }

  static conflict(message = 'Resource conflict') {
    return this.error(message, 409);
  }

  static validationError(errors) {
    return this.error('Validation failed', 422, errors);
  }

  static tooManyRequests(message = 'Too many requests') {
    return this.error(message, 429);
  }
}
