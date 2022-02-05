const config = require('../../config');
const section = 'search';
const controller = require('../../controllers/http/' + section);
const request = require('../../lib/request');

module.exports = (app, section) => {
    const listeners_get = [
        {
            method: 'list', // Получение списка пользователей
            actions: [controller.list],
        },
    ];

    const listeners_post = [
        {
            method: 'load_more', // Прогружаем ещё пользователей, ибо пользователь пролистал вниз
            actions: [controller.load_more],
        },
        {
            method: 'get_current_user', // Получаем данные конкретного пользователя
            actions: [controller.get_current_user],
        },
    ];

    for (const { method, actions } of listeners_get) {
        app.get(
            config.server.prefix + '/' + section + '/' + method,
            request.receive(
                config.server.prefix + '/' + section + '/' + method,
            ),
            actions,
        );
    }

    for (const { method, actions } of listeners_post) {
        app.post(
            config.server.prefix + '/' + section + '/' + method,
            request.receive(
                config.server.prefix + '/' + section + '/' + method,
            ),
            actions,
        );
    }
};
