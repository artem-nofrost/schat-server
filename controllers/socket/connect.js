const model = require('../../models/user');
const { get_socket_id } = require('../../socket');

module.exports = (socket) => {
    let socket_id = get_socket_id(socket);
    socket.on('online', (email, callback) => {
        let data;
        const update_online = async () => {
            data = await model.update_online(email, socket_id, true, 'push');
        };
        update_online();
        callback({
            status: 'ok',
        });
    });
};
