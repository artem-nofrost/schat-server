const config = require('../config').logs;
const API = require('../config/db');

module.exports = (title, content = '') => {
    const collection = 'logs';
    const timestamp = +new Date();

    if (config.console) console.log(title, ': ', content);
    if (config.db)
        API((db) =>
            db.collection(collection).insertOne({ title, content, timestamp }),
        );
};
