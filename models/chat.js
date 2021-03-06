const API = require('../config/db');
const ObjectID = require('mongodb').ObjectID;

const collection = 'users_dialogs';
const collection2 = 'messages';

const model = {};

// получаем список диалогов
model.get_chatlist = async (user_id) => {
    try {
        const users = await API((db) =>
            db
                .collection(collection)
                .aggregate([
                    {
                        // получаем список чатов, с массиве users которых найден id пользователя
                        $match: {
                            $or: [
                                {
                                    user_id1: user_id,
                                },
                                {
                                    user_id2: user_id,
                                },
                            ],
                        },
                    },
                    {
                        // фильтруем чаты, оставляем только id собеседника и доп данные(последнее сообщение, дата последнего сообщения и количество непрочитанных сообщений)
                        $project: {
                            last_msg: 1,
                            last_msg_id: 1,
                            last_msg_time: 1,
                            unread_messages: 1,
                            count_unread: 1,
                            companion_id: {
                                $filter: {
                                    input: ['$user_id1', '$user_id2'],
                                    as: 'user',
                                    cond: { $ne: ['$$user', user_id] },
                                },
                            },
                        },
                    },
                    { $unwind: '$companion_id' },
                    {
                        $project: {
                            last_msg: 1,
                            last_msg_id: 1,
                            last_msg_time: 1,
                            unread_messages: 1,
                            count_unread: 1,

                            companion_id: { $toObjectId: '$companion_id' },
                        },
                    },
                    {
                        // получаем данные каждого пользователей, диалоги с которыми мы нашли
                        $lookup: {
                            from: 'users',
                            localField: 'companion_id',
                            foreignField: '_id',
                            as: 'user_data',
                        },
                    },
                    { $unwind: '$user_data' },
                    {
                        $project: {
                            last_msg: 1,
                            last_msg_id: 1,
                            last_msg_time: 1,
                            unread_messages: 1,
                            count_unread: 1,

                            companion_id: 1,
                            fname: '$user_data.fname',
                            lname: '$user_data.lname',
                            is_online: '$user_data.is_online',
                            its_me: {
                                $cond: {
                                    if: {
                                        $eq: ['$last_msg_id', user_id],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                    // // сортируем полученных пользователей по дате последнего сообщения
                    { $sort: { last_msg_time: -1 } },
                ])
                .toArray(),
        );
        return [null, users];
    } catch (err) {
        return [err];
    }
};

// добавляем в список новый диалог
model.add_new_chat = async (
    message,
    time,
    user_id,
    id,
    message_id,
    unread_messages,
) => {
    try {
        await API((db) =>
            db.collection(collection).insertOne({
                user_id1: user_id,
                user_id2: id,
                last_msg_time: time,
                last_msg_id: user_id,
                last_msg: message,
                message_id: message_id,
                unread_messages: unread_messages,
                // count_unread: { $toInt: '$count_unread' } + 1,
                count_unread: 1,
            }),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

// обновляем последнее сообщение в конкретном диалоге
model.update_last_message = async (
    message,
    time,
    user_id,
    id,
    message_id,
    unread_messages,
) => {
    try {
        await API((db) =>
            db.collection(collection).updateOne(
                {
                    $or: [
                        {
                            user_id1: user_id,
                            user_id2: id,
                        },
                        {
                            user_id1: id,
                            user_id2: user_id,
                        },
                    ],
                },
                {
                    $set: {
                        last_msg_time: time,
                        last_msg_id: user_id,
                        last_msg: message,
                        message_id: message_id,
                        unread_messages: unread_messages,
                    },
                    $inc: { count_unread: 1 },
                },
            ),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

// получаем количество непрочитанных сообщений
model.get_count_unread = async (id) => {
    try {
        let dialog = await API((db) =>
            db
                .collection(collection)
                .find({
                    message_id: id,
                })
                .toArray(),
        );
        return [null, dialog];
    } catch (err) {
        return [err];
    }
};

// обновление прочитанности сообщения в диалоге
model.update_read_message = async (id) => {
    try {
        let data = await API((db) =>
            db.collection(collection).findOneAndUpdate(
                {
                    message_id: id,
                },
                [
                    {
                        $set: {
                            unread_messages: false,
                            count_unread: 0,
                        },
                    },
                ],
                { returnDocument: 'after' },
            ),
        );
        return [null, data];
    } catch (err) {
        return [err];
    }
};

// обновление количество непрочитанных сообщений в диалоге
model.count_unread_messages = async (id) => {
    // try {
    //     let data = await API((db) =>
    //         db.collection(collection).findOneAndUpdate(
    //             {
    //                 message_id: id,
    //             },
    //             [
    //                 {
    //                     $set: {
    //                         unread_messages: false,
    //                     },
    //                 },
    //             ],
    //             { returnDocument: 'after' },
    //         ),
    //     );
    //     return [null, data];
    // } catch (err) {
    //     return [err];
    // }
};

// Получаем количество диалогов, где есть непрочитанные сообщения
model.count_unread = async (id) => {
    try {
        const count = await API((db) =>
            db
                .collection(collection)

                .find({
                    $or: [
                        {
                            user_id1: id,
                            last_msg_id: { $ne: id },
                            unread_messages: true,
                        },
                        {
                            user_id2: id,
                            last_msg_id: { $ne: id },
                            unread_messages: true,
                        },
                    ],
                })
                .count(),
        );
        return count;
    } catch (err) {
        return [err];
    }
};

// получаем список сообщений с собеседником
model.current_message_list = async (user_id, id, skip, limit) => {
    try {
        const messageList = await API((db) =>
            db
                .collection(collection2)
                .aggregate([
                    {
                        $match: {
                            $or: [
                                {
                                    sender: user_id,
                                    receiver: id,
                                },
                                {
                                    sender: id,
                                    receiver: user_id,
                                },
                            ],
                        },
                    },
                    { $sort: { time: 1 } },
                    { $sort: { _id: -1 } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            message_id: 1,
                            message: 1,
                            time: 1,
                            read: 1,
                            its_me: {
                                $cond: {
                                    if: {
                                        $eq: ['$sender', user_id],
                                    },
                                    then: true,
                                    else: false,
                                },
                            },
                        },
                    },
                ])
                .toArray(),
        );
        return [null, messageList];
    } catch (err) {
        return [err];
    }
};

// провера на существование диалога
model.check_for_dialog = async (user_id, id) => {
    try {
        let check_id = await API((db) =>
            db
                .collection(collection)
                .aggregate([
                    {
                        $match: {
                            $or: [
                                {
                                    user_id1: user_id,
                                    user_id2: id,
                                },
                                {
                                    user_id1: id,
                                    user_id2: user_id,
                                },
                            ],
                        },
                    },
                ])
                .toArray(),
        );
        return [null, check_id];
    } catch (err) {
        return [err];
    }
};

// массив сокетов пользователей диалога
model.array_sockets_dialogs = async (user_id, id) => {
    try {
        const sockets = await API((db) =>
            db
                .collection('users')
                .aggregate([
                    {
                        $match: {
                            _id: {
                                $in: [new ObjectID(user_id), new ObjectID(id)],
                            },
                        },
                    },
                    {
                        $project: {
                            socket_ids: 1,
                        },
                    },
                    {
                        $unwind: {
                            path: '$socket_ids',
                        },
                    },
                ])
                .toArray(),
        );
        return sockets;
    } catch (err) {
        return [err];
    }
};

// список сокетов только пользователя
model.sockets_user = async (user_id) => {
    try {
        const sockets = await API((db) =>
            db
                .collection('users')
                .aggregate([
                    {
                        $match: {
                            _id: {
                                $in: [new ObjectID(user_id)],
                            },
                        },
                    },
                    {
                        $project: {
                            socket_ids: 1,
                        },
                    },
                    {
                        $unwind: {
                            path: '$socket_ids',
                        },
                    },
                ])
                .toArray(),
        );
        return sockets;
    } catch (err) {
        return [err];
    }
};

// добавляем новое сообщение
model.add_new_message = async (message_id, message, time, user_id, id) => {
    try {
        const new_msg = await API((db) =>
            db.collection(collection2).insertOne({
                message_id: message_id,
                message: message,
                time: time,
                read: false,
                sender: user_id,
                receiver: id,
            }),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

// Поиск конкретного сообщения
model.find_current_message = async (where) => {
    try {
        const message = await API((db) =>
            db.collection(collection2).findOne(where),
        );
        return [null, message];
    } catch (err) {
        return [err];
    }
};

// изменение прочитанности сообщений
model.change_read_message = async (id) => {
    try {
        const message = await API((db) =>
            db.collection(collection2).updateOne(
                {
                    message_id: id,
                },
                {
                    $set: {
                        read: true,
                    },
                },
            ),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

module.exports = model;
