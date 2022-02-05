exports.receive = (route) => (req, res, next) => {
    res.set('Access-Control-Allow-Origin', 'http://localhost:3000');
    res.set('Content-Type', 'application/json');
    next();
};
