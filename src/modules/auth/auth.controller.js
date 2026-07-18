const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../config/db');

const generateTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return res.status(403).json({ success: false, message: 'Account pending HR approval' });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'Account inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const tokens = generateTokens(user.id);
    
    // In a real system, you'd store refresh token in Redis or DB for revocation
    // await redisClient.set(`refresh:${user.id}`, tokens.refreshToken, 'EX', 7 * 24 * 60 * 60);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, role: user.role, email: user.email },
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};

const refreshToken = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }

    const tokens = generateTokens(user.id);
    res.json({ success: true, data: { tokens } });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

const logout = async (req, res, next) => {
  try {
    // Implement token revocation (e.g. deleting from redis)
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  try {
    const { employeeId, name, email, password, departmentId, role } = req.body;
    
    if (!email || !password || !name || !employeeId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Validate role if provided, otherwise default to EMPLOYEE
    const requestedRole = role || 'EMPLOYEE';
    if (!['EMPLOYEE', 'HR_ADMIN'].includes(requestedRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Can only signup as EMPLOYEE or HR_ADMIN' });
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { employeeId }] }
    });

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email or Employee ID already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        employeeId,
        name,
        email,
        password: hashedPassword,
        departmentId,
        role: requestedRole,
        status: 'PENDING_APPROVAL'
      }
    });

    res.status(201).json({
      success: true,
      message: `Signup successful as ${requestedRole}. Your account is pending approval.`,
      data: { id: user.id, email: user.email, role: user.role, status: user.status }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, refreshToken, logout, signup };
