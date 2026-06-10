const verifyApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    console.log("Header x-api-key received:", apiKey);
    console.log("Server API_SECRET is defined:", !!process.env.API_SECRET);
    if (process.env.API_SECRET) {
        console.log("Server API_SECRET length:", process.env.API_SECRET.length);
    }

    if (!apiKey || apiKey !== process.env.API_SECRET) {
        console.log("Auth failed. Returning 401.");
        return res.status(401).json({ message: 'Unauthorized' });
    }

    next();
};

module.exports = verifyApiKey;