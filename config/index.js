const v4 = require('uuid').v4;

module.exports = {
    server: {
        port: 7500,
        prefix: '/api',
        adresss: 'http://localhost',
    },
    db: {
        url: 'mongodb+srv://artem:5CANJGYV7DAG8a@cluster0.oc0db.mongodb.net/super_chat',
        name: 'super_chat',
    },
    logs: {
        console: true,
        db: true,
    },
    user: {
        session: {
            formate_id: v4,
            duration: 1000 * 60 * 30,
        },
        access_secret_key: 'super_chat_access564343',
        refresh_secret_key: 'super_chat_refresh564343',
    },
};
