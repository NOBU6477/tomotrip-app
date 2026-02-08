// Secure Admin Authentication System for TomoTrip
// Referenced from: blueprint:javascript_auth_all_persistance integration
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

class AdminAuthService {
  constructor() {
    // JWT Secret with fallback for development but warning for production
    this.jwtSecret = process.env.JWT_SECRET || 'tomotrip-admin-secret-2024';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ WARNING: JWT_SECRET not set. Using default secret (NOT for production!)');
      if (process.env.NODE_ENV === 'production') {
        console.error('❌ CRITICAL: JWT_SECRET environment variable is required for production');
        process.exit(1);
      }
    } else {
      console.log('✅ Using secure JWT_SECRET from environment');
    }
    this.saltRounds = 12;
    
    // Admin credentials with hashed passwords
    this.adminUsers = new Map();
    this.initializeAdminUsers();
    
    // Failed login attempts tracking
    this.failedAttempts = new Map();
    this.maxFailedAttempts = 5;
    this.lockoutDuration = 15 * 60 * 1000; // 15 minutes
  }

  initializeAdminUsers() {
    // Initialize admin users with pre-hashed passwords to avoid async startup issues
    const adminCredentials = [
      { 
        username: 'admin', 
        passwordHash: '$2b$12$/DQeBPyq8WkVsZzU3a6iU.nK0Ygjg9f0Q08I2XeiaFUi77VssiGCi', // tomotrip2024
        level: 'admin', 
        name: '管理者' 
      },
      { 
        username: 'operator', 
        passwordHash: '$2b$12$IZIvFPYyhOwRp12BYpYUsOEMN6m/.eumvZudgckR9U2oEaSouO1mS', // operator123
        level: 'operator', 
        name: '運営者' 
      },
      { 
        username: 'support', 
        passwordHash: '$2b$12$XTw0vH2OLRzmgfgWzjcJae9SkNdSuaLZsBfr/OE9Ya5sutKY.QLru', // support123
        level: 'support', 
        name: 'サポート' 
      }
    ];

    for (const admin of adminCredentials) {
      this.adminUsers.set(admin.username, {
        username: admin.username,
        passwordHash: admin.passwordHash,
        level: admin.level,
        name: admin.name,
        created: new Date().toISOString()
      });
    }
    
    console.log('✅ Admin authentication system initialized');
  }

  // Rate limiting middleware for login attempts
  createLoginRateLimit() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // limit each IP to 10 requests per windowMs
      message: {
        error: 'TOO_MANY_ATTEMPTS',
        message: 'ログイン試行回数が多すぎます。15分後に再試行してください。'
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
  }

  // Check if user is locked out due to failed attempts
  isLockedOut(username, ip) {
    const key = `${username}:${ip}`;
    const attempts = this.failedAttempts.get(key);
    
    if (!attempts) return false;
    
    const now = Date.now();
    if (now - attempts.lastAttempt > this.lockoutDuration) {
      // Lockout period has expired
      this.failedAttempts.delete(key);
      return false;
    }
    
    return attempts.count >= this.maxFailedAttempts;
  }

  // Record failed login attempt
  recordFailedAttempt(username, ip) {
    const key = `${username}:${ip}`;
    const now = Date.now();
    const attempts = this.failedAttempts.get(key) || { count: 0, lastAttempt: now };
    
    attempts.count += 1;
    attempts.lastAttempt = now;
    
    this.failedAttempts.set(key, attempts);
    
    console.log(`⚠️ Failed login attempt for ${username} from ${ip} (${attempts.count}/${this.maxFailedAttempts})`);
  }

  // Clear failed attempts on successful login
  clearFailedAttempts(username, ip) {
    const key = `${username}:${ip}`;
    this.failedAttempts.delete(key);
  }

  // Authenticate admin user
  async authenticateAdmin(username, password, accessLevel, clientIP) {
    try {
      // Check lockout
      if (this.isLockedOut(username, clientIP)) {
        return {
          success: false,
          error: 'ACCOUNT_LOCKED',
          message: 'アカウントがロックされています。15分後に再試行してください。'
        };
      }

      const admin = this.adminUsers.get(username);
      
      if (!admin) {
        this.recordFailedAttempt(username, clientIP);
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'ユーザー名またはパスワードが正しくありません。'
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, admin.passwordHash);
      
      if (!passwordValid) {
        this.recordFailedAttempt(username, clientIP);
        return {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'ユーザー名またはパスワードが正しくありません。'
        };
      }

      // Verify access level (hierarchy: admin > operator > support)
      const levelHierarchy = { 'support': 1, 'operator': 2, 'admin': 3 };
      const userLevel = levelHierarchy[admin.level] || 0;
      const reqLevel = levelHierarchy[accessLevel] || 0;
      if (userLevel < reqLevel) {
        this.recordFailedAttempt(username, clientIP);
        return {
          success: false,
          error: 'INVALID_ACCESS_LEVEL',
          message: '指定されたアクセスレベルが正しくありません。'
        };
      }

      // Clear failed attempts
      this.clearFailedAttempts(username, clientIP);

      // Generate JWT token
      const token = jwt.sign(
        {
          username: admin.username,
          level: admin.level,
          name: admin.name,
          loginTime: new Date().toISOString(),
          clientIP: clientIP
        },
        this.jwtSecret,
        { expiresIn: '8h' }
      );

      console.log(`✅ Admin login successful: ${username} (${admin.level}) from ${clientIP}`);

      return {
        success: true,
        token,
        user: {
          username: admin.username,
          level: admin.level,
          name: admin.name,
          loginTime: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Admin authentication error:', error);
      return {
        success: false,
        error: 'INTERNAL_ERROR',
        message: '認証システムエラーが発生しました。'
      };
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return {
        valid: true,
        user: decoded
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  // Middleware to protect admin routes
  requireAuth(requiredLevel = null) {
    return (req, res, next) => {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

      if (!token) {
        return res.status(401).json({
          error: 'MISSING_TOKEN',
          message: '認証トークンが必要です。'
        });
      }

      const verification = this.verifyToken(token);
      
      if (!verification.valid) {
        return res.status(401).json({
          error: 'INVALID_TOKEN',
          message: '認証トークンが無効です。'
        });
      }

      // Check access level if specified
      if (requiredLevel) {
        const levelHierarchy = { 'support': 1, 'operator': 2, 'admin': 3 };
        const userLevel = levelHierarchy[verification.user.level] || 0;
        const reqLevel = levelHierarchy[requiredLevel] || 0;
        
        if (userLevel < reqLevel) {
          return res.status(403).json({
            error: 'INSUFFICIENT_PRIVILEGES',
            message: 'このリソースにアクセスする権限がありません。'
          });
        }
      }

      req.adminUser = verification.user;
      next();
    };
  }

  // Get admin permissions
  getPermissions(level) {
    const permissions = {
      support: ['read', 'view_guides', 'view_stores'],
      operator: ['read', 'write', 'view_guides', 'view_stores', 'manage_guides', 'view_analytics'],
      admin: ['read', 'write', 'delete', 'view_guides', 'view_stores', 'manage_guides', 'manage_stores', 'view_analytics', 'system_config']
    };
    
    return permissions[level] || [];
  }
}

// Create singleton instance
const adminAuthService = new AdminAuthService();

module.exports = { AdminAuthService, adminAuthService };