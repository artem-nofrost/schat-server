module.exports = {
    io: null,
    init(server) {
        this.io = require('socket.io')(server, {
            // Явное включение CORS
            cors: {
                origins: ['http://localhost:3000'],
                methods: ['POST', 'GET', 'OPTIONS'],
                allowedHeaders: [
                    'Origin',
                    'Content-Type',
                    'X-Auth-Token',
                    'Authorization',
                ],
                credentials: true,
            },
            // используется для редактирования Access-Control-Allow-xxx заголовков
            handlePreflightRequest: (req, res) => {
                res.writeHead(200, {
                    'Access-Control-Allow-Origin': 'http://localhost:3000',
                    'Access-Control-Allow-Credentials': true,
                    'Access-Control-Max-Age': 86400,
                    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                    'Access-Control-Allow-Headers':
                        'Origin,Content-Type,X-Auth-Token,Authorization',
                });
                res.end();
            },
        });
        this.io.on('connection', (socket) => {
            require(`./routes/socket`)(socket);
        });
    },
    get_socket_id: (socket) => socket.client.conn.id,
};
