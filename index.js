import TelegramBot from 'node-telegram-bot-api'
import Feed from 'feed-to-json';
import config from 'config'
import { lang } from './lang'
import { ATM } from './atm'

const TOKEN = config.get("token");
const bot = new TelegramBot(TOKEN, {
    webHook: {
        port: config.get("port"),
        autoOpen: false
    }
});
bot.openWebHook();
bot.setWebHook(`${config.get("url")}/bot${TOKEN}`);

let breadcrumbs = [];
let currentLang = 'ru';
let newsPosition = 0;

bot.onText(/\/credit (.+)/, (msg, [source, match]) => {
    let data = match.split(' '); //0 - общая сумма кредита, 1 - процентная ставка, 2 - период кредита, 3 - первоначальный взнос
    //первоначальный взнос
    let initialFree = 0;
    if(data[3]) {
        initialFree = data[0] * data[3] / 100;
    }
    //вычисляем сумму кредита
    let sum = data[0];
    if(data[3]) {
        sum = data[0] - initialFree;
    }
    //вычисляем процент
    let interestRate = data[1]/1200;
    //ежемесячный платеж
    let monthlyPayment = Math.round(sum * (interestRate + (interestRate / (Math.pow(1+interestRate, data[2]) - 1))));
    let overpayments = monthlyPayment * data[2] - sum;


    bot.sendMessage(msg.chat.id, `Сумма кредита ${sum}тг\n` +
                                 `Сумма первоначального взноса ${initialFree}тг\n` +
                                 `Ежемесячный платеж ${monthlyPayment}тг\n` +
                                 `Переплата ${overpayments}тг\n`)

});
bot.onText(/\/deposit (.+)/, (msg, [source, match]) => {
    let data = match.split(' '); //0 - Сумма на депозите, 1 - процентная ставка
    let monthlyCompensation = (data[0] * data[1] / 100) / 12;
    bot.sendMessage(msg.chat.id, `Ежемесячная вознограждение ${monthlyCompensation}`);
});
bot.onText(new RegExp(`(.+)`), (msg, [source, match]) => {
    switch (match) {
        case '/start':
            start(msg);
            break;
        case lang['en'].currency:
        case lang['kz'].currency:
        case lang['ru'].currency:
            selectCurrency(msg);
            break;
        case lang['en'].setting:
        case lang['kz'].setting:
        case lang['ru'].setting:
            settings(msg);
            break;
        case lang['en'].language:
        case lang['kz'].language:
        case lang['ru'].language:
            chooseLang(msg);
            break;
        case lang['en'].news:
        case lang['kz'].news:
        case lang['ru'].news:
            getNews(msg);
            break;
        case lang['en'].ATMs:
        case lang['kz'].ATMs:
        case lang['ru'].ATMs:
            selectATM(msg);
            break;

        case lang['en'].HalykBank:
        case lang['kz'].HalykBank:
        case lang['ru'].HalykBank:
            getLocation(msg, 'HalykBank');
            break;
        case lang['en'].ForteBank:
        case lang['kz'].ForteBank:
        case lang['ru'].ForteBank:
            getLocation(msg, 'ForteBank');
            break;
        case lang['en'].TsesnaBank:
        case lang['kz'].TsesnaBank:
        case lang['ru'].TsesnaBank:
            getLocation(msg, 'TsesnaBank');
            break;
        case lang['en'].Kaspi:
        case lang['kz'].Kaspi:
        case lang['ru'].Kaspi:
            getLocation(msg, 'Kaspi');
            break;
        case lang['en'].Kazkom:
        case lang['kz'].Kazkom:
        case lang['ru'].Kazkom:
            getLocation(msg, 'Kazkom');
            break;
        case lang['en'].Sberbank:
        case lang['kz'].Sberbank:
        case lang['ru'].Sberbank:
            getLocation(msg, 'Sberbank');
            break;
        case lang['en'].Eubank:
        case lang['kz'].Eubank:
        case lang['ru'].Eubank:
            getLocation(msg, 'Eubank');
            break;
        case lang['en'].creditCalculator:
        case lang['kz'].creditCalculator:
        case lang['ru'].creditCalculator:
            creditCalculate(msg);
            break;
        case lang['en'].depositCalculator:
        case lang['kz'].depositCalculator:
        case lang['ru'].depositCalculator:
            depositCalculate(msg);
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
        case 'usd':
        case 'USD':
            getCurrency(msg, 'USD');
            break;
        case 'rub':
        case 'RUB':
            getCurrency(msg, 'RUB');
            break;
        case 'eur':
        case 'EUR':
            getCurrency(msg, 'EUR');
            break;
        case lang['en'].back:
        case lang['kz'].back:
        case lang['ru'].back:   //Назад
            back(msg);
            break;
    }
    console.log(msg);
});

function start(msg) {
    breadcrumbs.push('start');
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    lang[currentLang].currency,
                    lang[currentLang].news
                ],
                [
                    lang[currentLang].ATMs,
                    lang[currentLang].branchBank
                ],
                [
                    lang[currentLang].creditCalculator,
                    lang[currentLang].depositCalculator
                ],
                [
                    lang[currentLang].setting
                ]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].startText, opts)
}
function selectCurrency(msg) {
    breadcrumbs.push('selectCurrency');
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ['USD','EUR','RUB'],
                [lang[currentLang].back]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].selectCurrency, opts);
}
function getCurrency(msg, currency) {
    breadcrumbs.push('getCurrency');
    const { chat: { id }} = msg;
    const optsBack = {
        reply_markup: JSON.stringify({
            keyboard: [
                [lang[currentLang].back]
            ]
        })
    };
    Feed.load('http://www.nationalbank.kz/rss/rates_all.xml', function(err, rss) {
        rss.items.map(item => {
            if (item.title === currency) {
                bot.sendMessage(id, `${currency}: ` + item.description, optsBack);
            }
        });
    });
}
function getNews(msg) {
    breadcrumbs.push('getNews');
    const { chat: { id }} = msg;
    Feed.load('http://st.zakon.kz/rss/rss_all.xml', function (err, rss) {
        bot.sendMessage(
            id,
            `${rss.items[newsPosition].title}\n\n${rss.items[newsPosition].description}\n\n${rss.items[newsPosition].pubDate}`,
            {
            reply_markup: {
                inline_keyboard: [
                    [
                        {
                            text: 'Ссылка',
                            url: `${rss.items[newsPosition].link}`
                        }
                    ],
                    [
                        {
                            text: '<-',
                            callback_data: 'prev'
                        },
                        {
                            text: '->',
                            callback_data: 'next'
                        }
                    ]
                ]
            }
        });
        bot.on('callback_query', query => {
            if(query.data === 'prev' && newsPosition !== 0) {
                newsPosition = newsPosition - 1;
            } else if(query.data === 'next' && newsPosition !== 42) {
                newsPosition = newsPosition + 1;
            }
            bot.editMessageText(
                `${rss.items[newsPosition].title}\n\n${rss.items[newsPosition].description}\n\n${rss.items[newsPosition].pubDate}`,
                {
                    chat_id: query.message.chat.id,
                    message_id: query.message.message_id,
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Ссылка',
                                    url: `${rss.items[newsPosition].link}`
                                }
                            ],
                            [
                                {
                                    text: '<-',
                                    callback_data: 'prev'
                                },
                                {
                                    text: '->',
                                    callback_data: 'next'
                                }
                            ]
                        ]
                    }
                }
            );
            bot.answerCallbackQuery(query.id, `Новости`)
        });
    })
}
function settings(msg) {
    breadcrumbs.push('settings');
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    lang[currentLang].language,
                    lang[currentLang].notification
                ],
                [lang[currentLang].back]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].settingText, opts);
}
function chooseLang(msg) {
    breadcrumbs.push('chooseLang');
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                ['Қазақша', 'Русский', 'English'],
                [lang[currentLang].back]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].changeLang, opts);
}
function setLang(msg, futurelang) {
    currentLang = futurelang;
    bot.sendMessage(msg.chat.id, lang[currentLang].langChanged, {
        reply_markup: JSON.stringify({
            keyboard: [
                [lang[currentLang].back]
            ]
        })
    });
}

function selectATM(msg) {
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                [lang[currentLang].HalykBank],
                [lang[currentLang].ForteBank],
                [lang[currentLang].TsesnaBank],
                [lang[currentLang].Kaspi],
                [lang[currentLang].Kazkom],
                [lang[currentLang].Sberbank],
                [lang[currentLang].Eubank],
                [lang[currentLang].back]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].selectBank, opts)
}
function getLocation(msg, bank) {
    const opts = {
        reply_markup: JSON.stringify({
            keyboard: [
                [
                    {
                        text: lang[currentLang].sendLocationMsg,
                        request_location: true
                    }
                ],
                [lang[currentLang].back]
            ]
        })
    };
    bot.sendMessage(msg.chat.id, lang[currentLang].sendLocationMsg, opts).then(() => {
        bot.on('location', userloc => {
            let nearLoc = 100;
            let nearAddress;
            let latitude;
            let longitude;
            let temp;
            ATM[bank].map(item => {
                let loc = item.location.split(', ');
                temp = Math.abs(userloc.location.latitude - Number.parseFloat(loc[0])) + Math.abs(userloc.location.longitude - Number.parseFloat(loc[1]));
                console.log('temp', temp);
                if(nearLoc > temp) {
                    nearLoc = temp;
                    nearAddress = item.address;
                    latitude = loc[0];
                    longitude = loc[1];
                }
                console.log(latitude, longitude, nearAddress);
            });
            console.log('user location ', userloc.location);
            bot.sendLocation(userloc.chat.id, latitude, longitude);
            bot.sendMessage(userloc.chat.id, nearAddress);
        });
    })
}

function creditCalculate(msg) {
    bot.sendMessage(
        msg.chat.id,
        'Калькулятор предоставляет возможность предварительно рассчитать размер ежемесячных платежей по кредиту\n' +
        'Для расчета кредита введите следующее\n' +
        '/credit СК ПС ПК ПВ\n' +
        'CK - Сумма кредита\nПС - Процентная ставка (%)\nПК - Период кредита (месяц)\nПВ - Первоначальный взнос (%)\n\n' +
        'Например \n' +
        '/credit 15000000 15.5 60 30')
}
function depositCalculate(msg) {
    bot.sendMessage(
        msg.chat.id,
        '/deposit СД НС\n' +
        'CД - Сумма на депозите\nНС - номинальная ставка (%)\n\n' +
        'Например \n' +
        '/deposit 100000 11.4')
}

function back(msg) {
    breadcrumbs.pop();
    switch (breadcrumbs[breadcrumbs.length - 1]) {
        case 'start':            start(msg);          break;
        case 'selectCurrency':   selectCurrency(msg); break;
        case 'settings':         settings(msg);       break;
        case 'chooseLang':       chooseLang(msg);     break;
        default:                 start(msg);          break;
    }
    breadcrumbs.pop();
}