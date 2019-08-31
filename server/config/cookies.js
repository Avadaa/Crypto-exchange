module.exports = {
    secret: process.env.JWT_SECRET || 'benislol',
    maxAge: 60 * 60 * 6
}