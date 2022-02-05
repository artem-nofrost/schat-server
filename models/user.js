const config = require('../config').user;
const API = require('../config/db');
const jwt = require('jsonwebtoken');

const collection = 'users';

const model = {};

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, config.refresh_secret_key, {
        expiresIn: '30d',
    });
};

// Создание нового пользователя
model.create = (user) => ({
    ...user,
    created_at: +new Date(),
    refresh_token: generateRefreshToken({ email: user.email }),
    expires: +new Date(),
    is_online: true,
    avatar: '',
});

// Добавление пользователя
model.add = async (user) => {
    try {
        await API((db) =>
            db
                .collection(collection)
                .insertOne(user)
                .then((r) => r.insertedId),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

// Поиск пользователя
model.find = async (where) => {
    try {
        const user = await API((db) =>
            db.collection(collection).findOne(where),
        );
        return [null, user];
    } catch (err) {
        return [err];
    }
};

// // Загрузка списка пользователей
model.load = async ({
    where = {},
    firstName = '',
    order = {},
    limit = 0,
    skip = 0,
} = {}) => {
    try {
        const cursor = await API((db) =>
            db
                .collection(collection)
                .aggregate([
                    { $match: where },
                    {
                        $facet: {
                            count: [{ $count: 'count' }],
                            users: [
                                {
                                    $project: {
                                        _id: 1,
                                        lname: 1,
                                        fname: 1,
                                        is_online: 1,
                                        city_name: 1,
                                        country_name: 1,
                                        order: {
                                            $cond: {
                                                if: {
                                                    $regexMatch: {
                                                        input: '$fname',
                                                        regex: new RegExp(
                                                            '^' +
                                                                firstName +
                                                                '*',
                                                            'i',
                                                        ),
                                                    },
                                                },
                                                then: 1,
                                                else: 2,
                                            },
                                        },
                                    },
                                },
                                { $sort: { order: 1 } },
                                {
                                    $project: {
                                        _id: 1,
                                        lname: 1,
                                        fname: 1,
                                        is_online: 1,
                                        city_name: 1,
                                        country_name: 1,
                                    },
                                },
                                { $skip: skip },
                                { $limit: limit },
                            ],
                        },
                    },
                ])
                .toArray(),
        );
        let dataLength =
            cursor[0].count[0] !== undefined ? cursor[0].count[0].count : 0;
        let limitedData = cursor[0].users;
        return [null, dataLength, limitedData];
    } catch (err) {
        return [err];
    }
};

// загрузка пользователей при прикрутке
model.load_more = async ({
    where = {},
    firstName = '',
    order = {},
    limit = 0,
    skip = 0,
} = {}) => {
    try {
        const limitedData = await API((db) =>
            db
                .collection(collection)
                .aggregate([
                    { $match: where },
                    {
                        $project: {
                            _id: 1,
                            lname: 1,
                            fname: 1,
                            is_online: 1,
                            city_name: 1,
                            country_name: 1,
                            order: {
                                $cond: {
                                    if: {
                                        $regexMatch: {
                                            input: '$fname',
                                            regex: new RegExp(
                                                '^' + firstName + '*',
                                                'i',
                                            ),
                                        },
                                    },
                                    then: 1,
                                    else: 2,
                                },
                            },
                        },
                    },
                    { $sort: { order: 1 } },
                    {
                        $project: {
                            _id: 1,
                            lname: 1,
                            fname: 1,
                            is_online: 1,
                            city_name: 1,
                            country_name: 1,
                        },
                    },
                    { $skip: skip },
                    { $limit: limit },
                ])
                .toArray(),
        );
        return [null, limitedData];
    } catch (err) {
        return [err];
    }
};

// обновляем рефреш токен юзера
model.update_refresh = async (email, payload) => {
    try {
        let newRefreshToken = generateRefreshToken(payload);
        await API((db) =>
            db.collection(collection).updateOne(
                { email: email },
                {
                    $set: {
                        refresh_token: newRefreshToken,
                        expires: +new Date(),
                    },
                },
            ),
        );
        return [null, newRefreshToken];
    } catch (err) {
        return [err];
    }
};

model.delete_refresh = async (email) => {
    try {
        await API((db) =>
            db
                .collection(collection)
                .updateOne(
                    { email: email },
                    { $unset: { refresh_token: 1, expires: 1 } },
                ),
        );
        return [null];
    } catch (err) {
        return [err];
    }
};

// обновляем онлайн юзера
model.update_online = async (email, socket_id, is_online, operator) => {
    try {
        if (operator === 'push') {
            await API((db) =>
                db.collection(collection).updateOne(
                    { email: email },
                    {
                        $push: { socket_ids: socket_id },
                        $set: { is_online: is_online },
                    },
                ),
            );
        } else if (operator === 'pull') {
            let data = await API((db) =>
                db.collection(collection).findOneAndUpdate(
                    { socket_ids: socket_id },

                    { $pull: { socket_ids: socket_id } },
                    { returnOriginal: false },
                ),
            );
            await API((db) =>
                db.collection(collection).findOneAndUpdate(
                    { email: data.value.email },

                    [
                        {
                            $set: {
                                is_online: {
                                    $cond: {
                                        if: { $size: '$socket_ids' },
                                        then: true,
                                        else: false,
                                    },
                                },
                            },
                        },
                    ],
                ),
            );
        } else if (operator === 'pullall') {
            await API((db) =>
                db
                    .collection(collection)
                    .updateMany(
                        {},
                        { $set: { is_online: false, socket_ids: [] } },
                    ),
            );
        }
        return [null];
    } catch (err) {
        return [err];
    }
};

// // Удаление пользователя
// model.delete = async (id) => {
// 	try {
// 		const res = await API(db => db.collection('users').deleteOne({_id:new ObjectID(id)}));
// 		return [null];
// 	} catch (err) {
// 		return [err];
// 	}
// }

module.exports = model;
