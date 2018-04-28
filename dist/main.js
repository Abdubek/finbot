'use strict';

var bot = require('./index');

bot.on('message', function (msg) {
    console.log('work');
    bot.sendMessage(msg.chat.id, 'Hello World');
});
//# sourceMappingURL=main.js.map