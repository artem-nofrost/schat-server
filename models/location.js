// const ObjectID = require('mongodb').ObjectID;
const config = require('../config').user;
const API = require('../config/db');

const collections = ['countries', 'cities'];

const model = {};

// Получаем список стран
model.get_countries = async (lang) => {
    try {
        const sortName = 'country_name.' + lang;
        const countries = await API((db) =>
            db
                .collection(collections[0])
                .find()
                .sort({ [sortName]: 1 })
                .toArray(),
        );
        return [null, countries];
    } catch (err) {
        return [err];
    }
};

model.get_cities = async (where, lang) => {
    try {
        // const sortName = 'name.' + lang;
        // const sortName = 'name.en';
        const cities = await API((db) =>
            db
                .collection(collections[1])
                .find(where)
                .sort({ ['name.en']: 1 })
                .toArray(),
        );
        return [null, cities];
    } catch (err) {
        return [err];
    }
};

model.get_country_by_code = async (where) => {
    try {
        const country = await API((db) =>
            db.collection(collections[0]).find(where).toArray(),
        );
        const currenCountry = country[0].country_name['en'];

        return [null, currenCountry];
    } catch (err) {
        return [err];
    }
};

model.get_city_by_id = async (where) => {
    try {
        const city = await API((db) =>
            db.collection(collections[1]).find(where).toArray(),
        );

        const currenCity = city[0].name['en'];

        return [null, currenCity];
    } catch (err) {
        return [err];
    }
};

module.exports = model;
