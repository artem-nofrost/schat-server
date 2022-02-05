const model = require('../../models/location');
const log = require('../../lib/log');

// // Получение списка
const get_country_list = async (req, res) => {
    const { language } = req.body;
    const [err, countries] = await model.get_countries(language);
    if (err) {
        log('internal', err);
        res.status(500).send({ error: 'internal' });
        return;
    }
    res.send({ response: countries });
};
const get_cities_list = async (req, res) => {
    const { language, code } = req.body;
    const [err, cities] = await model.get_cities({ country: code }, language);
    if (err) {
        log('internal', err);
        res.status(500).send({ error: 'internal' });
        return;
    }
    res.send({ response: cities });
};

const get_country_by_code = async (code) => {
    const [err, currenCountry] = await model.get_country_by_code({
        country_code: code,
    });
    if (err) {
        log('internal', err);
        return ['internal'];
    }
    return [null, currenCountry];
};

const get_city_by_id = async (id) => {
    const [err, currenCity] = await model.get_city_by_id({ id: id });
    if (err) {
        log('internal', err);
        return ['internal'];
    }
    return [null, currenCity];
};

module.exports = {
    get_country_list,
    get_cities_list,
    get_country_by_code,
    get_city_by_id,
};
