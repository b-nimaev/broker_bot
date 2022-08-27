/* eslint-disable @typescript-eslint/no-floating-promises */
import { Scenes, session, Telegraf } from 'telegraf'
import { MyContext } from './Model/Model'

// Scenes
import home from './View/Home/HomeScene';
import dashboard from './View/Dashboard/DashboardScene';
import _handler from './View/handlerScene';
import admin from './View/Admin/AdminScene';
import registration from './View/Registration/RegistrationScene';
import game from './View/Game/GameScene';
import { getUser } from './Controller/UserController';

import { addDeposit, getEmail } from './Controller/UserController'

// SSL
const fs = require('fs');
const key = fs.readFileSync('./ssl/localhost.decrypted.key');
const cert = fs.readFileSync('./ssl/localhost.crt');
const https = require('https');

const morgan = require("morgan")
const cors = require("cors")
const BodyParser = require("body-parser")
import user = require("../api/routes/userRouter");
import steps = require("../api/routes/stepsRouter");
import interface__ = require("../api/routes/interfaceRouter");

// Server
require("dotenv").config()
const express = require("express")

// Bot token check
const token = process.env.BOT_TOKEN

if (token === undefined) {
    throw new Error('BOT_TOKEN must be provided!')
}

// Init scenes & set secretPath for requires from bot

const scenes = [home, dashboard, admin, registration, game, _handler]
const bot = new Telegraf<MyContext>(token)
export default bot
const app = express()
const port = process.env.port
const secretPath = `/telegraf/${bot.secretPathComponent()}`
const stage = new Scenes.Stage<MyContext>(scenes, {
    default: 'home',
})

// Set webhook
if (process.env.mode === "development") {

    const fetch = require('node-fetch')
    fetch('http://localhost:4040/api/tunnels')
        .then(res => res.json())
        .then(json => json.tunnels.find(tunnel => tunnel.proto === 'https'))
        .then(secureTunnel => bot.telegram.setWebhook(`${secureTunnel.public_url}${secretPath}`))
        .then((status) => console.log('Webhook setted: ' + status))
        .catch(err => {
            if (err.code === 'ECONNREFUSED') {
                return console.error("Looks like you're not running ngrok.")
            }
            console.error(err)
        })
} else {
    bot.telegram.setWebhook(`https://say-an.ru${secretPath}`)
        .then((status) => console.log('Webhook setted: ' + status))
    console.log(secretPath)
}

bot.command("/profile", async (ctx) => {

    let user = await getUser(ctx.from)
    let message = ``

    if (user) {
        if (user.balance) {
            message += `Ваш баланс: ${user.balance} IQCoins\n`
        }

        if (user.email) {
            message += `Ваш e-mail: ${user.email}\n`
        } else {
            message += `Ваш E-mail: не указан`
        }
    }

    ctx.reply(message)
})

bot.command("/check", async (ctx) => {
    const message = 'Уже сособираюсь на встречу в платформой, чтобы проверить твой депозит. Мне потребуется время. Знаешь, платформа такая занятая, я постоянно жду не дождусь, чтобы пообщаться. Но трейдеры для нее на первом месте. Иногда я ревную...Но как только мы встретимся, я вернусь с твоими IQ Coins'
    await ctx.replyWithSticker("CAACAgIAAxkBAAINkGLw4KY1njQpI5sm8nt94oewD_3-AAJlBAACP5XMClzVsXn7vWCCKQQ")

    // запись заявки депозита
    let update = ctx.from
    // @ts-ignore
    update.email = await getEmail(ctx.from)

    await addDeposit(ctx.from)
    ctx.reply(message)
})

bot.hears("/additional", async (ctx) => {
    ctx.reply(`Риск менеджмнет \nКак выбрать время экспирации \nТипы трейдеров (психология торговли)`)
})

bot.hears("/getapp", async (ctx) => {
    const extra = {
        parse_mode: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Скачать',
                        url: 'https://app.appsflyer.com/com.iqoption.x-install?af_r=https%3A%2F%2Fstatic.cdnpub.info%2Ffiles%2Fstorage%2Fpublic%2F5a%2Fe3%2F5de74a883.apk'
                    }
                ]
            ]
        }
    }

    // @ts-ignore
    ctx.reply(`Для андроид`, extra)
})

bot.command("/deposit", async (ctx) => {
    const extra = {
        parse_mdoe: 'HTML',
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Пополнить депозит',
                        url: 'https://iqoption.com/es/counting/'
                    }
                ]
            ]
        }
    }

    const message = "Переходи на платформу, и пополняй свой счёт. \nСделай первый шаг на пути к реальной торговле."

    // @ts-ignore
    await ctx.reply(message, extra)
})

bot.use(session())
bot.use((ctx, next) => {
    const now = new Date()
    ctx.myContextProp = now.toString()
    // console.log(ctx)

    return next()
})
bot.use(stage.middleware())
app.use(cors());
app.use(BodyParser.json());
app.use(
    BodyParser.urlencoded({
        extended: true,
    })
);
// bot.command("/start", async (ctx) => console.log('start'))
app.use(morgan("dev"));
app.use("/user", user);
app.use("/steps", steps);
app.use("/interface", interface__);
// app.get("/", (req: Request, res: Response) => res.send("Hello!"))
app.use(bot.webhookCallback(secretPath))
const server = https.createServer({ key, cert }, app);
server.listen(port, () => console.log("telegram bot launched!"))

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))