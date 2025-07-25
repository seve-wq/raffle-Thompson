module.exports = (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
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
}; 