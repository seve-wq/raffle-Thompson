const bcrypt = require('bcrypt');

// Brute force protection storage (Note: This won't persist across serverless invocations)
const loginAttempts = new Map();
const lockedIPs = new Map();
const lockedAccounts = new Map();

const BRUTE_FORCE_CONFIG = {
    maxAttemptsPerIP: 5,
    maxAttemptsPerAccount: 3,
    lockoutDuration: 15 * 60 * 1000,
    accountLockoutDuration: 30 * 60 * 1000,
    windowMs: 5 * 60 * 1000
};

function handleFailedLogin(clientIP, username, adminUsername) {
    const now = Date.now();
    
    const ipAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    ipAttempts.count++;
    ipAttempts.lastAttempt = now;
    loginAttempts.set(clientIP, ipAttempts);
    
    if (username === adminUsername) {
        const accountAttempts = loginAttempts.get(`account:${username}`) || { count: 0, lastAttempt: 0 };
        accountAttempts.count++;
        accountAttempts.lastAttempt = now;
        loginAttempts.set(`account:${username}`, accountAttempts);
    }
}

function checkAndHandleLockouts(clientIP, username, res) {
    const now = Date.now();
    const ipAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    
    if (ipAttempts.count >= BRUTE_FORCE_CONFIG.maxAttemptsPerIP) {
        lockedIPs.set(clientIP, now);
        return res.status(429).json({
            success: false,
            error: `Too many failed attempts from this IP. Locked for ${BRUTE_FORCE_CONFIG.lockoutDuration / 1000 / 60} minutes.`,
            locked: true,
            remainingTime: BRUTE_FORCE_CONFIG.lockoutDuration / 1000 / 60
        });
    }
    
    const accountAttempts = loginAttempts.get(`account:${username}`) || { count: 0, lastAttempt: 0 };
    if (accountAttempts.count >= BRUTE_FORCE_CONFIG.maxAttemptsPerAccount) {
        lockedAccounts.set(username, now);
        return res.status(429).json({
            success: false,
            error: `Too many failed attempts for this account. Account locked for ${BRUTE_FORCE_CONFIG.accountLockoutDuration / 1000 / 60} minutes.`,
            locked: true,
            remainingTime: BRUTE_FORCE_CONFIG.accountLockoutDuration / 1000 / 60
        });
    }
    
    const remainingAttempts = BRUTE_FORCE_CONFIG.maxAttemptsPerIP - ipAttempts.count;
    res.status(401).json({
        success: false,
        error: `Invalid username or password. ${remainingAttempts} attempts remaining before IP lockout.`
    });
}

module.exports = async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    if (lockedIPs.has(clientIP)) {
        const lockTime = lockedIPs.get(clientIP);
        const remainingTime = Math.ceil((lockTime + BRUTE_FORCE_CONFIG.lockoutDuration - now) / 1000 / 60);
        
        return res.status(429).json({
            success: false,
            error: `Too many failed attempts. IP address locked for ${remainingTime} more minutes.`,
            locked: true,
            remainingTime: remainingTime
        });
    }
    
    if (lockedAccounts.has(username)) {
        const lockTime = lockedAccounts.get(username);
        const remainingTime = Math.ceil((lockTime + BRUTE_FORCE_CONFIG.accountLockoutDuration - now) / 1000 / 60);
        
        return res.status(429).json({
            success: false,
            error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
            locked: true,
            remainingTime: remainingTime
        });
    }
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === adminUsername && password === adminPassword) {
        loginAttempts.delete(clientIP);
        lockedIPs.delete(clientIP);
        lockedAccounts.delete(username);
        
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        
        res.json({
            success: true,
            token: token,
            user: { username: username, role: 'admin' }
        });
    } else {
        handleFailedLogin(clientIP, username, adminUsername);
        checkAndHandleLockouts(clientIP, username, res);
    }
}; 