module.exports = {
    secret: process.env.JWT_SECRET || 'supersecret',
    maxAge: 60 * 60 * 6
}
