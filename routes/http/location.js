const config = require('../../config');
const section = 'location';
const controller = require('../../controllers/http/' + section);
const request = require('../../lib/request');

module.exports = (app, section) => {
    const listener = [
        {
            method: 'get_country_list', // Список стран
            actions: [controller.get_country_list],
        },
        {
            method: 'get_cities_list', // Список городов по стране
            actions: [controller.get_cities_list],
        },
    ];

    for (const { method, actions } of listener) {
        app.post(
            config.server.prefix + '/' + section + '/' + method,
            request.receive(
                config.server.prefix + '/' + section + '/' + method,
            ),
            actions,
        );
    }
};
