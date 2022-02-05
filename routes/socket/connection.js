module.exports = (socket) => {
    require('../../controllers/socket/connect')(socket);
    socket.on(
        'disconnect',
        require('../../controllers/socket/disconnect')(socket),
    );
};
