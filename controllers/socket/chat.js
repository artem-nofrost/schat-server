const modelUser = require('../../models/user');
const model = require('../../models/chat');
const ObjectID = require('mongodb').ObjectID;
const { get_socket_id } = require('../../socket');
const log = require('../../lib/log');

module.exports = (socket) => {
    // получаем список диалогов пользователя
    socket.on('chatlist', () => {
        const get_chat_list = async () => {
            let mySocket = await get_socket_id(socket);
            let [err, user] = await modelUser.find({
                socket_ids: mySocket,
            });
            if (err) {
                log('internal', err);
                socket.emit('chatlist', { error: 'internal' });
                return;
            }

            let user_id = user._id.toString();

            let [errUsers, users] = await model.get_chatlist(user_id);
            if (errUsers) {
                log('internal', errUsers);
                socket.emit('chatlist', { error: 'internal' });
                return;
            }
            socket.emit('chatlist', users);
        };
        get_chat_list();
    });

    //***************** */
    // количество непрочитанных сообщений
    socket.on('countunread', () => {
        const get_chat_list = async () => {
            let mySocket = await get_socket_id(socket);
            let [err, user] = await modelUser.find({
                socket_ids: mySocket,
            });
            if (err) {
                log('internal', err);
                socket.emit('countunread', { error: 'internal' });
                return;
            }
            let user_id = user._id.toString();
            let count_unread = await model.count_unread(user_id);
            socket.emit('countunread', count_unread);
        };
        get_chat_list();
    });
    ////************** */

    // получаем список сообщений с конкретным пользователем, если он есть
    socket.on('current_chat', (id) => {
        const get_current_messages = async () => {
            if (ObjectID.isValid(id)) {
                let [err, comp_user] = await modelUser.find({
                    _id: new ObjectID(id),
                });
                if (err) {
                    log('internal', err);
                    socket.emit('current_chat', { error: 'internal' });
                    return;
                }
                if (comp_user) {
                    let mySocket = await get_socket_id(socket);
                    let [err, user] = await modelUser.find({
                        socket_ids: mySocket,
                    });
                    if (err) {
                        log('internal', err);
                        socket.emit('current_chat', { error: 'internal' });
                        return;
                    }
                    let user_id = user._id.toString();

                    // socket.join(user_id + id);
                    let skip = 0;
                    let limit = 10;
                    let [errMessages, messageList] =
                        await model.current_message_list(
                            user_id,
                            id,
                            skip,
                            limit,
                        );
                    if (errMessages) {
                        log('internal', errMessages);
                        socket.emit('current_chat', { error: 'internal' });
                        return;
                    }

                    socket.emit('current_chat', {
                        comp_fname: comp_user.fname,
                        comp_lname: comp_user.lname,
                        online: comp_user.is_online,
                        companion_id: id,
                        messages: messageList,
                    });
                } else {
                    socket.emit('current_chat', {
                        errorMessage: 'user_not_found',
                    });
                }
            } else {
                socket.emit('current_chat', {
                    errorMessage: 'user_not_found',
                });
            }
        };
        get_current_messages();
    });

    // получаем список сообщений с конкретным пользователем, если он есть
    socket.on('load_more_chat', (id, skip) => {
        const get_current_messages = async () => {
            if (ObjectID.isValid(id)) {
                let [err, comp_user] = await modelUser.find({
                    _id: new ObjectID(id),
                });
                if (err) {
                    log('internal', err);
                    socket.emit('load_more_chat', { error: 'internal' });
                    return;
                }
                if (comp_user) {
                    let mySocket = await get_socket_id(socket);
                    let [err, user] = await modelUser.find({
                        socket_ids: mySocket,
                    });
                    if (err) {
                        log('internal', err);
                        socket.emit('load_more_chat', { error: 'internal' });
                        return;
                    }
                    let user_id = user._id.toString();

                    // socket.join(user_id + id);
                    // let skip = 0;
                    let limit = 10;
                    let [errMessages, messageList] =
                        await model.current_message_list(
                            user_id,
                            id,
                            skip,
                            limit,
                        );
                    if (errMessages) {
                        log('internal', errMessages);
                        socket.emit('load_more_chat', { error: 'internal' });
                        return;
                    }

                    socket.emit('load_more_chat', {
                        companion_id: id,
                        messages: messageList,
                    });
                } else {
                    socket.emit('load_more_chat', {
                        errorMessage: 'user_not_found',
                    });
                }
            } else {
                socket.emit('load_more_chat', {
                    errorMessage: 'user_not_found',
                });
            }
        };
        get_current_messages();
    });

    socket.on('new_message', (data) => {
        const add_new_message = async () => {
            // Мои данные
            let mySocket = await get_socket_id(socket);
            let [err, user] = await modelUser.find({
                socket_ids: mySocket,
            });
            if (err) {
                log('internal', err);
                socket
                    .to(mySocket)
                    .emit('message', { error: 'message_not_send' });
                return;
            }
            let user_id = user._id.toString();

            let { message_id, message, time, id } = data;

            // Проверяем, собеседник сейчас на странице с диалогои или нет?
            // let newDialog;
            // let unread_messages = socket.adapter.rooms[id + user_id]
            //     ? false
            //     : true;
            let unread_messages = true;
            // проверка на существование диалога
            if (data.isMessages) {
                // обновляем ласт сообщение
                let [err] = await model.update_last_message(
                    message,
                    time,
                    user_id,
                    id,
                    message_id,
                    unread_messages,
                );
                if (err) {
                    log('internal', err);
                    socket
                        .to(mySocket)
                        .emit('message', { error: 'message_not_send' });
                    return;
                }
                newDialog = false;
            } else {
                // проверяем, есть ли такой диалог
                let [err, check_id] = await model.check_for_dialog(user_id, id);
                if (err) {
                    log('internal', err);
                    socket
                        .to(mySocket)
                        .emit('message', { error: 'message_not_send' });
                    return;
                }
                if (check_id) {
                    newDialog = true;
                    // добавляем новый диалог
                    let [err] = await model.add_new_chat(
                        message,
                        time,
                        user_id,
                        id,
                        message_id,
                        unread_messages,
                    );
                    if (err) {
                        log('internal', err);
                        socket
                            .to(mySocket)
                            .emit('message', { error: 'message_not_send' });
                        return;
                    }
                } else {
                    newDialog = false;
                    let [err] = await model.update_last_message(
                        message,
                        time,
                        user_id,
                        id,
                        message_id,
                        unread_messages,
                    );
                    if (err) {
                        log('internal', err);
                        socket
                            .to(mySocket)
                            .emit('message', { error: 'message_not_send' });
                        return;
                    }
                }
            }

            // добавляем новое сообщение в базу данных
            let [errNewMsg] = await model.add_new_message(
                message_id,
                message,
                time,
                user_id,
                id,
            );
            if (errNewMsg) {
                log('internal', err);
                socket
                    .to(mySocket)
                    .emit('message', { error: 'message_not_send' });
                return;
            }

            let current_user_sockets = await model.sockets_user(id);
            let count_unread = await model.count_unread(id);
            for (let i = 0; i < current_user_sockets.length; i++) {
                socket
                    .to(current_user_sockets[i].socket_ids)
                    .emit('countunread', count_unread);
            }

            // обновляем список сообщений
            let users_sockets_dialogs = await model.array_sockets_dialogs(
                user_id,
                id,
            );
            for (let i = 0; i < users_sockets_dialogs.length; i++) {
                if (users_sockets_dialogs[i].socket_ids !== mySocket) {
                    socket
                        .to(users_sockets_dialogs[i].socket_ids)
                        .emit('message', [
                            {
                                message_id: message_id,
                                companion_id:
                                    user_id ===
                                    users_sockets_dialogs[i]._id.toString()
                                        ? id
                                        : user_id,
                                message,
                                time,
                                its_me:
                                    user_id ===
                                    users_sockets_dialogs[i]._id.toString()
                                        ? true
                                        : false,
                                unread_messages: unread_messages,
                            },
                        ]);
                }
            }
            // обновляем список диалогов
            if (newDialog) {
                // получаем данные собеседника
                let [err, companion_data] = await modelUser.find({
                    _id: new ObjectID(id),
                });

                for (let i = 0; i < users_sockets_dialogs.length; i++) {
                    if (users_sockets_dialogs[i].socket_ids !== mySocket) {
                        socket
                            .to(users_sockets_dialogs[i].socket_ids)
                            .emit('add_new_to_chat_list', [
                                {
                                    companion_id:
                                        user_id ===
                                        users_sockets_dialogs[i]._id.toString()
                                            ? id
                                            : user_id,
                                    message: message,
                                    last_message_id: user_id,
                                    time: time,
                                    unread_messages: unread_messages,
                                    fname: companion_data.fname,
                                    lname: companion_data.lname,
                                    is_online: companion_data.is_online,
                                    its_me:
                                        user_id ===
                                        users_sockets_dialogs[i]._id.toString()
                                            ? true
                                            : false,
                                },
                            ]);
                    }
                }
            } else {
                for (let i = 0; i < users_sockets_dialogs.length; i++) {
                    if (users_sockets_dialogs[i].socket_ids !== mySocket) {
                        socket
                            .to(users_sockets_dialogs[i].socket_ids)
                            .emit('update_chat_list', [
                                {
                                    companion_id:
                                        user_id ===
                                        users_sockets_dialogs[i]._id.toString()
                                            ? id
                                            : user_id,
                                    message: message,
                                    last_message_id: user_id,
                                    time: time,
                                    unread_messages: unread_messages,
                                    its_me:
                                        user_id ===
                                        users_sockets_dialogs[i]._id.toString()
                                            ? true
                                            : false,
                                },
                            ]);
                    }
                }
            }
        };

        add_new_message();
    });

    // обновляем прочитанность конкретного сообщения
    socket.on('read_message', (id, comp_id) => {
        const change_state_message = async () => {
            let [err, message] = await model.find_current_message({
                message_id: id,
            });
            if (err) {
                log('internal', err);
                socket.emit('chatlist', { error: 'internal' });
                return;
            }
            if (message) {
                let [err] = await model.change_read_message(id);
                if (err) {
                    log('internal', err);
                    socket.emit('chatlist', { error: 'internal' });
                    return;
                }

                let mySocket = await get_socket_id(socket);
                let [errUser, user] = await modelUser.find({
                    socket_ids: mySocket,
                });
                if (errUser) {
                    log('internal', errUser);
                    socket.emit('chatlist', { error: 'internal' });
                    return;
                }

                let user_id = user._id.toString();

                // проверка, совпадает ли id последнего сообщения с id сообщения, которое прочитали
                let [errLast, updateLast] = await model.update_read_message(id);
                if (errLast) {
                    log('internal', errUser);
                    socket.emit('chatlist', { error: 'internal' });
                    return;
                }
                if (updateLast) {
                    let current_user_sockets = await model.sockets_user(
                        user_id,
                    );
                    let count_unread = await model.count_unread(user_id);
                    socket.emit('countunread', count_unread, true);
                    for (let i = 0; i < current_user_sockets.length; i++) {
                        socket
                            .to(current_user_sockets[i].socket_ids)
                            .emit('countunread', count_unread, true);
                    }
                }

                // обновляем список сообщений
                let users_sockets_dialogs = await model.array_sockets_dialogs(
                    user_id,
                    comp_id,
                );
                for (let i = 0; i < users_sockets_dialogs.length; i++) {
                    if (users_sockets_dialogs[i].socket_ids !== mySocket) {
                        socket
                            .to(users_sockets_dialogs[i].socket_ids)
                            .emit('update_read_message', [
                                {
                                    message_id: id,
                                    // read: true,
                                },
                            ]);
                    }
                }
            } else {
                let mySocket = await get_socket_id(socket);
                socket.to(mySocket).emit('current_chat', {
                    errorMessage: 'message_not_found',
                });
            }

            // ищем id этого сообщения(проверка на существование)
            //

            // if (ObjectID.isValid(id)) {
            // let [err, comp_user] = await modelUser.find({
            //     _id: new ObjectID(id),
            // });
            // if (err) {
            //     log('internal', err);
            //     socket.emit('load_more_chat', { error: 'internal' });
            //     return;
            // }
            // if (comp_user) {
            //     let mySocket = await get_socket_id(socket);
            //     let [err, user] = await modelUser.find({
            //         socket_ids: mySocket,
            //     });
            //     if (err) {
            //         log('internal', err);
            //         socket.emit('load_more_chat', { error: 'internal' });
            //         return;
            //     }
            //     let user_id = user._id.toString();
            //     // socket.join(user_id + id);
            //     // let skip = 0;
            //     let limit = 10;
            //     let [errMessages, messageList] = await model.current_message_list(
            //         user_id,
            //         id,
            //         skip,
            //         limit,
            //     );
            //     if (errMessages) {
            //         log('internal', errMessages);
            //         socket.emit('load_more_chat', { error: 'internal' });
            //         return;
            //     }
            //     socket.emit('load_more_chat', {
            //         companion_id: id,
            //         messages: messageList,
            //     });
            // } else {
            //     socket.emit('load_more_chat', {
            //         errorMessage: 'user_not_found',
            //     });
            // }
            // }
        };
        change_state_message();
    });
};
