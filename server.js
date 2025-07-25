const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');

// Load environment variables from .env file
require('dotenv').config();

// Initialize Supabase client
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const app = express();
const PORT = process.env.PORT || 3000;

// Brute force protection storage
const loginAttempts = new Map(); // Store failed attempts by IP
const lockedIPs = new Map(); // Store locked IPs
const lockedAccounts = new Map(); // Store locked accounts

// Brute force protection configuration
const BRUTE_FORCE_CONFIG = {
    maxAttemptsPerIP: 5, // Max failed attempts per IP
    maxAttemptsPerAccount: 3, // Max failed attempts per account
    lockoutDuration: 15 * 60 * 1000, // 15 minutes in milliseconds
    accountLockoutDuration: 30 * 60 * 1000, // 30 minutes for account lockout
    windowMs: 5 * 60 * 1000 // 5 minutes window for rate limiting
};

// Clean up old entries periodically
setInterval(() => {
    const now = Date.now();
    
    // Clean up IP attempts
    for (const [ip, data] of loginAttempts.entries()) {
        if (now - data.lastAttempt > BRUTE_FORCE_CONFIG.windowMs) {
            loginAttempts.delete(ip);
        }
    }
    
    // Clean up locked IPs
    for (const [ip, lockTime] of lockedIPs.entries()) {
        if (now - lockTime > BRUTE_FORCE_CONFIG.lockoutDuration) {
            lockedIPs.delete(ip);
        }
    }
    
    // Clean up locked accounts
    for (const [account, lockTime] of lockedAccounts.entries()) {
        if (now - lockTime > BRUTE_FORCE_CONFIG.accountLockoutDuration) {
            lockedAccounts.delete(account);
        }
    }
}, 60000); // Run cleanup every minute

// Helper function to handle failed login attempts
function handleFailedLogin(clientIP, username, adminUsername) {
    const now = Date.now();
    
    // Track IP attempts
    const ipAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    ipAttempts.count++;
    ipAttempts.lastAttempt = now;
    loginAttempts.set(clientIP, ipAttempts);
    
    // Track account attempts (only if username matches admin username)
    if (username === adminUsername) {
        const accountAttempts = loginAttempts.get(`account:${username}`) || { count: 0, lastAttempt: 0 };
        accountAttempts.count++;
        accountAttempts.lastAttempt = now;
        loginAttempts.set(`account:${username}`, accountAttempts);
    }
}

// Helper function to check and handle lockouts
function checkAndHandleLockouts(clientIP, username, res) {
    const now = Date.now();
    const ipAttempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    
    // Check if IP should be locked
    if (ipAttempts.count >= BRUTE_FORCE_CONFIG.maxAttemptsPerIP) {
        lockedIPs.set(clientIP, now);
        return res.status(429).json({
            success: false,
            error: `Too many failed attempts from this IP. Locked for ${BRUTE_FORCE_CONFIG.lockoutDuration / 1000 / 60} minutes.`,
            locked: true,
            remainingTime: BRUTE_FORCE_CONFIG.lockoutDuration / 1000 / 60
        });
    }
    
    // Check if account should be locked
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

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve success page
app.get('/success.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'success.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API endpoint to serve configuration to frontend
app.get('/api/config', (req, res) => {
    res.json({
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        EMAILJS_PUBLIC_KEY: process.env.EMAILJS_PUBLIC_KEY,
        EMAILJS_SERVICE_ID: process.env.EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID: process.env.EMAILJS_TEMPLATE_ID,
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID
    });
});

// Admin authentication endpoints
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    // Check if IP is locked
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
    
    // Check if account is locked
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
    
    // Check credentials against environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
    
    if (username === adminUsername && password === adminPassword) {
        // Successful login - clear any failed attempts for this IP and account
        loginAttempts.delete(clientIP);
        lockedIPs.delete(clientIP);
        lockedAccounts.delete(username);
        
        // Create a simple token (in production, use JWT)
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        
        res.json({
            success: true,
            token: token,
            user: { username: username, role: 'admin' }
        });
    } else {
        // Failed login - track attempts
        handleFailedLogin(clientIP, username, adminUsername);
        checkAndHandleLockouts(clientIP, username, res);
    }
});

// User authentication endpoints
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();
    
    // Check if IP is locked
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
    
    // Check if account is locked
    if (lockedAccounts.has(email)) {
        const lockTime = lockedAccounts.get(email);
        const remainingTime = Math.ceil((lockTime + BRUTE_FORCE_CONFIG.accountLockoutDuration - now) / 1000 / 60);
        
        return res.status(429).json({
            success: false,
            error: `Account locked due to too many failed attempts. Try again in ${remainingTime} minutes.`,
            locked: true,
            remainingTime: remainingTime
        });
    }
    
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, password_hash, first_name, last_name, role, is_active')
            .eq('email', email.toLowerCase())
            .eq('is_active', true)
            .single();

        if (error || !user) {
            // Invalid email or user not found
            handleFailedLogin(clientIP, email, email);
            checkAndHandleLockouts(clientIP, email, res);
            return;
        }

        // Check if password is plain text (not hashed)
        let isValidPassword = false;
        
        if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
            // Password is already hashed, compare normally
            isValidPassword = await bcrypt.compare(password, user.password_hash);
        } else {
            // Password is plain text, hash it and update the database
            if (password === user.password_hash) {
                // Password matches, hash it and save
                const saltRounds = 10;
                const passwordHash = await bcrypt.hash(password, saltRounds);
                
                // Update the database with hashed password
                await supabase
                    .from('users')
                    .update({ 
                        password_hash: passwordHash,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', user.id);
                
                isValidPassword = true;
                console.log(`✅ Password for user ${email} has been automatically hashed`);
            }
        }
        
        if (isValidPassword) {
            // Successful login - clear any failed attempts for this IP and account
            loginAttempts.delete(clientIP);
            lockedIPs.delete(clientIP);
            lockedAccounts.delete(email);
            
            // Update last login
            await supabase
                .from('users')
                .update({ last_login: new Date().toISOString() })
                .eq('id', user.id);
            
            // Create a simple token (in production, use JWT)
            const token = Buffer.from(`${user.id}:${user.email}:${Date.now()}`).toString('base64');
            
            res.json({
                success: true,
                token: token,
                user: { 
                    id: user.id,
                    email: user.email,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    role: user.role
                }
            });
        } else {
            // Invalid password
            handleFailedLogin(clientIP, email, user.email);
            checkAndHandleLockouts(clientIP, email, res);
        }
    } catch (error) {
        console.error('Database error during login:', error);
        res.status(500).json({
            success: false,
            error: 'Database error. Please try again later.'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email.toLowerCase())
            .single();
            
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }
        
        // Hash the password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Create new user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([{
                email: email.toLowerCase(),
                password_hash: passwordHash,
                first_name: firstName,
                last_name: lastName,
                role: 'user',
                is_active: true
            }])
            .select('id, email, first_name, last_name, role')
            .single();
            
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'User registered successfully',
            user: newUser
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: 'Registration failed. Please try again.'
        });
    }
});

app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    
    try {
        // Simple token verification (in production, use JWT)
        const decoded = Buffer.from(token, 'base64').toString();
        const [userId, email, timestamp] = decoded.split(':');
        
        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > maxAge) {
            return res.status(401).json({ valid: false });
        }
        
        res.json({ valid: true, user: { id: userId, email } });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

app.get('/api/admin/verify', (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    
    try {
        // Simple token verification (in production, use JWT)
        const decoded = Buffer.from(token, 'base64').toString();
        const [username, timestamp] = decoded.split(':');
        
        // Check if token is not too old (24 hours)
        const tokenAge = Date.now() - parseInt(timestamp);
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (tokenAge > maxAge) {
            return res.status(401).json({ valid: false });
        }
        
        res.json({ valid: true, user: { username, role: 'admin' } });
    } catch (error) {
        res.status(401).json({ valid: false });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Local development server running on http://localhost:${PORT}`);
    console.log(`🌐 Main page: http://localhost:${PORT}`);
}); 