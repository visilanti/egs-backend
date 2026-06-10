const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (!apiKey || apiKey !== process.env.API_SECRET) {
        return res.status(401).json({ status: 'Unauthorized', message: 'Invalid or missing API key' });
    }

    next();
};

module.exports = verifyApiKey;