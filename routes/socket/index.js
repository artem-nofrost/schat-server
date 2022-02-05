module.exports = (socket, version) => {
    const sections = [
        'connection', // при подкючении(и дисконнекте)
        'chat',
    ];
    for (const section of sections) require('./' + section)(socket);
};
