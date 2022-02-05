const config = require('../../config');
const section = 'user';
const controller = require('../../controllers/http/' + section);
const request = require('../../lib/request');

module.exports = (app, section) => {
    const listeners = [
        {
            method: 'add', // добавление пользователя
            actions: [controller.valid_reg, controller.add],
        },
        {
            method: 'auth', // логинизация пользователя
            actions: [controller.valid_login, controller.get],
        },
        {
            method: 'confirm', // Проверка на авторизированность пользователя(каждый релоад)
            actions: [controller.confirm],
        },
        {
            method: 'out', // выход пользователя
            actions: [controller.out],
        },
    ];

    for (const { method, actions } of listeners) {
        app.post(
            config.server.prefix + '/' + section + '/' + method,
            request.receive(
                config.server.prefix + '/' + section + '/' + method,
            ),
            actions,
        );
    }
};
