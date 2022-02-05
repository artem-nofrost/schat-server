const { get_socket_id } = require('../../socket');

const model = require('../../models/user');

module.exports = (socket) => async () => {
    console.log('дисконнект');
    const socket_id = get_socket_id(socket);
    const update_online = async () => {
        await model.update_online(false, socket_id, false, 'pull');
    };
    update_online();
};
