const jwt = require('jsonwebtoken');
const User = require('../src/models/userModel');
const authController = require('../src/controllers/authController');

// Mock User model
jest.mock('../src/models/userModel');

describe('Auth Feature Unit Tests', () => {
  let req, res, next;

  beforeEach(() => {
    jest.clearAllMocks();
    req = {
      body: {},
      headers: {},
      user: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('Register', () => {
    it('should register a new user successfully with tokens', async () => {
      req.body = {
        name: 'Alice Developer',
        email: 'alice@example.com',
        password: 'Password123!',
        role: 'user',
      };

      User.findOne.mockResolvedValue(null);

      const mockSavedUser = {
        _id: 'user_12345',
        name: req.body.name,
        email: req.body.email,
        role: 'user',
        refreshToken: null,
        save: jest.fn().mockResolvedValue(true),
      };

      User.mockImplementation(() => mockSavedUser);

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: 'alice@example.com' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: expect.objectContaining({
            id: 'user_12345',
            name: 'Alice Developer',
            email: 'alice@example.com',
            role: 'user',
          }),
        })
      );
    });

    it('should reject registration if required fields are missing', async () => {
      req.body = { email: 'incomplete@example.com' };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Please provide name, email, and password/i);
    });

    it('should reject registration if email already exists', async () => {
      req.body = {
        name: 'Existing User',
        email: 'exists@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({ _id: 'existing_id', email: 'exists@example.com' });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/User with this email already exists/i);
    });

    it('should assign admin role when explicitly specified as admin', async () => {
      req.body = {
        name: 'Admin Arya',
        email: 'admin@eventbook.com',
        password: 'AdminPassword123',
        role: 'admin',
      };

      User.findOne.mockResolvedValue(null);

      let createdUserData = null;
      User.mockImplementation((data) => {
        createdUserData = data;
        return {
          _id: 'admin_id_999',
          ...data,
          save: jest.fn().mockResolvedValue(true),
        };
      });

      await authController.register(req, res, next);

      expect(createdUserData.role).toBe('admin');
      expect(res.status).toHaveBeenCalledWith(201);
    });
  });

  describe('Login', () => {
    it('should authenticate user with valid credentials and return tokens', async () => {
      req.body = {
        email: 'alice@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        _id: 'user_12345',
        name: 'Alice Developer',
        email: 'alice@example.com',
        role: 'user',
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(req, res, next);

      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
          user: expect.objectContaining({
            id: 'user_12345',
            email: 'alice@example.com',
          }),
        })
      );
    });

    it('should reject login when password is incorrect', async () => {
      req.body = {
        email: 'alice@example.com',
        password: 'WrongPassword!',
      };

      const mockUser = {
        _id: 'user_12345',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Invalid email or password/i);
    });

    it('should reject login when user is not found', async () => {
      req.body = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Invalid email or password/i);
    });

    it('should reject login when email or password is missing', async () => {
      req.body = { email: 'alice@example.com' };

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Please provide email and password/i);
    });
  });

  describe('Refresh Token', () => {
    it('should issue a new access token when a valid refresh token is supplied', async () => {
      const validRefreshToken = jwt.sign(
        { id: 'user_12345' },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: '7d' }
      );

      req.body = { token: validRefreshToken };

      User.findById.mockResolvedValue({
        _id: 'user_12345',
        role: 'user',
        email: 'alice@example.com',
        refreshToken: validRefreshToken,
      });

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          accessToken: expect.any(String),
        })
      );
    });

    it('should reject refresh when refresh token is missing', async () => {
      req.body = {};

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Refresh token is required/i);
    });

    it('should reject refresh when token signature is invalid', async () => {
      req.body = { token: 'invalid_token_xyz' };

      await authController.refreshToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(next.mock.calls[0][0].message).toMatch(/Invalid or expired refresh token/i);
    });
  });
});
