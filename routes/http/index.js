module.exports = (app) => {
    // список маршрутов(на одну из тем)
    const sections = ['user', 'search', 'location'];
    // сами маршруты
    for (const section of sections) require('./' + section)(app, section);
};
