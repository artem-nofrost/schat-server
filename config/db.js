const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;

const config = require('./index').db;

const client = new MongoClient(config.url + '?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const connection = {
    ready: false,
    error: null,
    db: null,
    async connect() {
        try {
            await client.connect();
            this.ready = true;
            this.error = null;
            this.db = client.db(config.name);
        } catch (err) {
            this.ready = false;
            this.error = err;
        }
    },
    close() {
        client.close();
        this.ready = false;
        this.error = null;
        this.db = null;
    },
};
connection.connect();

const API = async (f) => {
    if (!connection.ready) await connection.connect();
    return f(connection.db);
};

module.exports = API;
