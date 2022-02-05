const ObjectID = require('mongodb').ObjectID;
const model = require('../../models/user');
const log = require('../../lib/log');

// // Получение списка
const list = async (req, res) => {
    const data = req.query.search; // получаем строку
    if (data === undefined) {
        res.send({ response: [[], 0] });
        return;
    }
    let dataArray;
    // создаём из строки массив
    if (data !== undefined) {
        dataArray = data.split(' ');
    } else {
        dataArray = [''];
    }

    let limitedData = []; // объект с данными найденных пользователей
    let dataLength = 0; // количество найденных пользователей
    let limit = 8;
    // Если введено одно слово
    if (dataArray[1] === undefined) {
        [err, dataLength, limitedData] = await model.load({
            where: {
                $or: [
                    {
                        fname: {
                            $regex: '.*' + dataArray[0] + '.*',
                            $options: 'i',
                        },
                    },
                    {
                        lname: {
                            $regex: '.*' + dataArray[0] + '.*',
                            $options: 'i',
                        },
                    },
                ],
            },
            firstName: dataArray[0] === '' ? '.' : dataArray[0],
            limit: limit,
            skip: 0,
        });
        if (err) {
            log('internal', err);
            res.status(500).send({ error: 'internal' });
            return;
        }
    } else {
        // если введено 2+ слова
        let re = new RegExp('^' + dataArray[0] + '$', 'i');
        let re2 = new RegExp('.*' + dataArray[1] + '.*', 'i');
        [err, dataLength, limitedData] = await model.load({
            where: {
                $or: [
                    {
                        fname: re,
                        lname: re2,
                    },
                    {
                        fname: re2,
                        lname: re,
                    },
                ],
            },
            firstName: dataArray[0] === '' ? '.' : dataArray[0],
            limit: limit,
            skip: 0,
        });
        if (err) {
            log('internal', err);
            res.status(500).send({ error: 'internal' });
            return;
        }
    }
    res.send({ response: [limitedData, dataLength] });
};

const load_more = async (req, res) => {
    const { searchParam, skip } = req.body; // получаем строку
    let dataArray;
    // создаём из строки массив
    if (searchParam !== null) {
        dataArray = searchParam.split(' ');
    } else {
        dataArray = [''];
    }

    let limitedData = []; // объект с данными найденных пользователей
    let limit = 8;

    if (dataArray[1] === undefined) {
        [err, limitedData] = await model.load_more({
            where: {
                $or: [
                    {
                        fname: {
                            $regex: '.*' + dataArray[0] + '.*',
                            $options: 'i',
                        },
                    },
                    {
                        lname: {
                            $regex: '.*' + dataArray[0] + '.*',
                            $options: 'i',
                        },
                    },
                ],
            },
            firstName: dataArray[0] === '' ? '.' : dataArray[0],
            limit: limit,
            skip: skip,
        });
        if (err) {
            log('internal', err);
            res.status(500).send({ error: 'internal' });
            return;
        }
    } else {
        // если введено 2+ слова
        let re = new RegExp('^' + dataArray[0] + '$', 'i');
        let re2 = new RegExp('.*' + dataArray[1] + '.*', 'i');
        [err, limitedData] = await model.load_more({
            where: {
                $or: [
                    {
                        fname: re,
                        lname: re2,
                    },
                    {
                        fname: re2,
                        lname: re,
                    },
                ],
            },
            firstName: dataArray[0] === '' ? '.' : dataArray[0],
            limit: limit,
            skip: skip,
        });
        if (err) {
            log('internal', err);
            res.status(500).send({ error: 'internal' });
            return;
        }
    }

    res.send({ response: limitedData });
};

const get_current_user = async (req, res) => {
    const id = req.body.id;
    if (ObjectID.isValid(req.body.id)) {
        let [err, user] = await model.find({ _id: new ObjectID(id) });
        if (err) {
            log('internal', err);
            res.status(500).send({ error: 'internal' });
            return;
        }
        res.send({ response: user });
    } else {
        res.status(404).send({ error: 'user_not_found' });
    }
};

module.exports = {
    list,
    load_more,
    get_current_user,
};
