const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { generateToken } = require('../utils/jwt.utils');
const { successResponse, errorResponse } = require('../utils/response.utils');

const prisma = new PrismaClient();

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', 401);
    }

    const token = generateToken({ id: user.id, role: user.role });

    return successResponse(res, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse(res, 'Login failed', 500);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    return successResponse(res, req.user, 'User fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch user', 500);
  }
};

// POST /api/auth/change-password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return errorResponse(res, 'Current password is incorrect', 400);
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    return successResponse(res, null, 'Password changed successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to change password', 500);
  }
};

// GET /api/auth/users — Admin only
const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return successResponse(res, users, 'Users fetched');
  } catch (error) {
    return errorResponse(res, 'Failed to fetch users', 500);
  }
};

// POST /api/auth/users — Admin only
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return errorResponse(res, 'Email already exists', 409);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return successResponse(res, user, 'User created', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create user', 500);
  }
};

// PUT /api/auth/users/:id — Admin only
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: { name, role, isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    return successResponse(res, user, 'User updated');
  } catch (error) {
    return errorResponse(res, 'Failed to update user', 500);
  }
};

module.exports = { login, getMe, changePassword, getUsers, createUser, updateUser };
