'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _nodeTelegramBotApi = require('node-telegram-bot-api');

var _nodeTelegramBotApi2 = _interopRequireDefault(_nodeTelegramBotApi);

var _feedToJson = require('feed-to-json');

var _feedToJson2 = _interopRequireDefault(_feedToJson);

var _config = require('config');

var _config2 = _interopRequireDefault(_config);

var _lang = require('./lang');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TOKEN = _config2.default.get("token");
var bot = new _nodeTelegramBotApi2.default(TOKEN, {
    webHook: {
        port: _config2.default.get("port"),
        autoOpen: false
    }
});
bot.openWebHook();
bot.setWebHook(_config2.default.get("url") + '/bot' + TOKEN);

var breadcrumbs = [];
var currentLang = 'ru';
var newsPosition = 0;
var optsBack = {
    reply_markup: JSON.stringify({
        keyboard: [[_lang.lang[currentLang].back]]
    })
};

bot.onText(new RegExp('(.+)'), function (msg, _ref) {
    var _ref2 = _slicedToArray(_ref, 2),
        source = _ref2[0],
        match = _ref2[1];

    switch (match) {
        case '/start':
            start(msg);
            break;
        case _lang.lang[currentLang].currency:
            //Валюта
            selectCurrency(msg);
            break;
        case _lang.lang[currentLang].setting:
            //Настройка
            settings(msg);
            break;
        case _lang.lang[currentLang].language:
            //Языки
            chooseLang(msg);
            break;
        case _lang.lang[currentLang].news:
            //Новости
            getNews(msg);
            break;

        case 'Қазақша':
            setLang(msg, 'kz');
            break;
        case 'Русский':
            setLang(msg, 'ru');
            break;
        case 'English':
            setLang(msg, 'en');
            break;
        case 'usd':case 'USD':
            getCurrency(msg, 'USD');
            break;
        case 'rub':case 'RUB':
            getCurrency(msg, 'RUB');
            break;
        case 'eur':case 'EUR':
            getCurrency(msg, 'EUR');
            break;
        case _lang.lang[currentLang].back:
            //Назад
            back(msg);
            break;
        default:
            bot.sendMessage(msg.chat.id, 'Такой команды нет');
    }
});

function start(msg) {
    breadcrumbs.push('start');
    var opts = {
        reply_markup: JSON.stringify({
            keyboard: [[_lang.lang[currentLang].currency, _lang.lang[currentLang].news], [_lang.lang[currentLang].ATMs, _lang.lang[currentLang].branchBank], [_lang.lang[currentLang].setting]]
        })
    };
    bot.sendMessage(msg.chat.id, _lang.lang[currentLang].startText, opts);
}
function selectCurrency(msg) {
    breadcrumbs.push('selectCurrency');
    var opts = {
        reply_markup: JSON.stringify({
            keyboard: [['USD', 'EUR', 'RUB'], [_lang.lang[currentLang].back]]
        })
    };
    bot.sendMessage(msg.chat.id, _lang.lang[currentLang].changeLang, opts);
}
function getCurrency(msg, currency) {
    breadcrumbs.push('getCurrency');
    var id = msg.chat.id;

    _feedToJson2.default.load('http://www.nationalbank.kz/rss/rates_all.xml', function (err, rss) {
        console.log(rss.items.length);
        rss.items.map(function (item) {
            if (item.title === currency) {
                bot.sendMessage(id, currency + ': ' + item.description, optsBack);
            }
        });
    });
}
function getNews(msg) {
    breadcrumbs.push('getNews');
    var id = msg.chat.id;

    _feedToJson2.default.load('http://st.zakon.kz/rss/rss_all.xml', function (err, rss) {
        console.log(rss.items.length);
        bot.sendMessage(id, rss.items[newsPosition].title + '\n\n' + rss.items[newsPosition].description + '\n\n' + rss.items[newsPosition].pubDate, {
            reply_markup: {
                inline_keyboard: [[{
                    text: 'Ссылка',
                    url: '' + rss.items[newsPosition].link
                }], [{
                    text: '<-',
                    callback_data: 'prev'
                }, {
                    text: '->',
                    callback_data: 'next'
                }]]
            }
        });
        bot.on('callback_query', function (query) {
            console.log(query);
            if (query.data === 'prev' && newsPosition !== 0) {
                newsPosition = newsPosition - 1;
            } else if (query.data === 'next' && newsPosition !== 42) {
                newsPosition = newsPosition + 1;
            }
            bot.editMessageText(rss.items[newsPosition].title + '\n\n' + rss.items[newsPosition].description + '\n\n' + rss.items[newsPosition].pubDate, {
                chat_id: query.message.chat.id,
                message_id: query.message.message_id,
                reply_markup: {
                    inline_keyboard: [[{
                        text: 'Ссылка',
                        url: '' + rss.items[newsPosition].link
                    }], [{
                        text: '<-',
                        callback_data: 'prev'
                    }, {
                        text: '->',
                        callback_data: 'next'
                    }]]
                }
            });
            bot.answerCallbackQuery(query.id, '\u041D\u043E\u0432\u043E\u0441\u0442\u0438');
        });
    });
}
function settings(msg) {
    breadcrumbs.push('settings');
    var opts = {
        reply_markup: JSON.stringify({
            keyboard: [[_lang.lang[currentLang].language, _lang.lang[currentLang].notification], [_lang.lang[currentLang].back]]
        })
    };
    bot.sendMessage(msg.chat.id, _lang.lang[currentLang].settingText, opts);
}
function chooseLang(msg) {
    breadcrumbs.push('chooseLang');
    var opts = {
        reply_markup: JSON.stringify({
            keyboard: [['Қазақша', 'Русский', 'English'], [_lang.lang[currentLang].back]]
        })
    };
    bot.sendMessage(msg.chat.id, _lang.lang[currentLang].changeLang, opts);
}
function setLang(msg, futurelang) {
    currentLang = futurelang;
    bot.sendMessage(msg.chat.id, _lang.lang[currentLang].langChanged, {
        reply_markup: JSON.stringify({
            keyboard: [[_lang.lang[currentLang].back]]
        })
    });
}

function back(msg) {
    breadcrumbs.pop();
    switch (breadcrumbs[breadcrumbs.length - 1]) {
        case 'start':
            start(msg);break;
        case 'selectCurrency':
            selectCurrency(msg);break;
        case 'settings':
            settings(msg);break;
        case 'chooseLang':
            chooseLang(msg);break;
        default:
            start(msg);break;
    }
    breadcrumbs.pop();
}
//# sourceMappingURL=index.js.map