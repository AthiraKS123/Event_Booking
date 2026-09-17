const jwt = require('jsonwebtoken');
const { authenticate, authorize } = require('../src/middleware/auth');
const errorHandler = require('../src/middleware/errorHandler');

describe('Middleware Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      headers: {},
      user: null,
    };
    res = {
      statusCode: 200,
      status: jest.fn(function (code) {
        this.statusCode = code;
        return this;
      }),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('authenticate Middleware', () => {
    it('should authenticate valid Bearer token and populate req.user', () => {
      const payload = { id: 'user_123', role: 'user', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('user_123');
      expect(req.user.role).toBe('user');
      expect(next).toHaveBeenCalledWith();
    });

    it('should reject when Authorization header is missing', () => {
      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/No authentication token provided/i);
    });

    it('should reject when Authorization header does not start with Bearer', () => {
      req.headers.authorization = 'Basic dXNlcjpwYXNz';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject invalid or expired JWT token', () => {
      req.headers.authorization = 'Bearer invalid_garbage_token';

      authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Invalid or expired authentication token/i);
    });
  });

  describe('authorize Middleware', () => {
    it('should permit access when user has the allowed role', () => {
      req.user = { id: 'admin_1', role: 'admin' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    it('should forbid access (403) when user role is not permitted', () => {
      req.user = { id: 'user_1', role: 'user' };
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Access forbidden/i);
    });

    it('should require authentication (401) when req.user is absent', () => {
      req.user = null;
      const middleware = authorize('admin');

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('errorHandler Middleware', () => {
    it('should format general errors with 500 status code', () => {
      const err = new Error('Unexpected database failure');
      res.statusCode = 200; // default Express status

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Unexpected database failure',
        })
      );
    });

    it('should handle Mongoose duplicate key error (11000)', () => {
      const err = new Error('E11000 duplicate key');
      err.code = 11000;
      err.keyValue = { email: 'duplicate@example.com' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Email already exists',
        })
      );
    });

    it('should handle Mongoose ValidationError', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.errors = {
        title: { message: 'Title is required' },
        venue: { message: 'Venue is required' },
      };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Title is required, Venue is required',
        })
      );
    });

    it('should handle Mongoose CastError for invalid ObjectId', () => {
      const err = new Error('Cast to ObjectId failed');
      err.name = 'CastError';
      err.value = 'invalid_id_xyz';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Resource not found with id: invalid_id_xyz',
        })
      );
    });

    it('should handle JsonWebTokenError and TokenExpiredError with 401', () => {
      const jwtErr = new Error('jwt malformed');
      jwtErr.name = 'JsonWebTokenError';

      errorHandler(jwtErr, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Invalid authentication token',
        })
      );

      const expiredErr = new Error('jwt expired');
      expiredErr.name = 'TokenExpiredError';

      errorHandler(expiredErr, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Authentication token expired',
        })
      );
    });
  });
});
