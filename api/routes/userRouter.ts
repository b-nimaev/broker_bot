import bot from "../../src"
import { faker } from '@faker-js/faker';


require("dotenv").config()
const MongoClient = require("mongodb").MongoClient
const ObjectId = require("mongodb").ObjectId

const path = require("path")
const express = require('express')
const userRouter = express.Router();

const dbname = process.env.dbname;

// создаем объект MongoClient и передаем ему строку подключения
const mongoClient = new MongoClient(process.env.DB_CONN_STRING);

let admins: Array<number>;
admins = [1272270574];

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min; //Максимум и минимум включаются
}

(async () => {

    try {
        return mongoClient.connect(async function (err, client) {
            if (err) {
                return err
            }

            admins.forEach(async (element) => {
                await bot.telegram.sendMessage(element, 'База фейковых e-mail обновлена')
                    .then(success => console.log(success))
                    .catch(err => {
                        console.log(err)
                    })
            })

            await client.db(dbname)
                .collection("bots")
                .drop((err, success) => {
                    if (err) throw err;
                    if (success) {
                        console.log('collection deleted')
                    }
                })

            for (let i = 0; i < 100; i++) {
                const randomEmail = faker.internet.email();
                await client.db(dbname)
                    .collection("bots")
                    .insertOne({ email: randomEmail, balance: 25460 - (getRandomIntInclusive(0, 10) * 455) })
                    .then(data => {
                        console.log('db updated!')
                        console.log(data)
                    })
            }

        });
    } catch (err) {
        console.log(err)
        return false
    }

});
userRouter.use("/getdb", async function (req, res) {
    try {
        return mongoClient.connect(async function (err, client) {
            if (err) {
                return res.send(err);
            }

            let data = await client.db(dbname)
                .collection("steps")
                .find().toArray()

            return res.send(data)
        });
    } catch (err) {
        console.log(err)
        return false
    }
});

async function checkfunction(email: string) {
    try {
        return mongoClient.connect(async function (err, client) {
            let users = []

            return await client.db(dbname)
                .collection("users")
                .find()
                .sort({ balance: -1 })
                .toArray()
                .then(async (document) => {
                    return document
                    for (let index = 0; index < document.length; index++) {
                        const element = document[index];

                        if (element.email) {
                            if (element.email.length > 0) {
                                // @ts-ignore
                                users.push(element)
                            }
                        }

                    }

                    return users
                })
                .catch(err => {
                    return err
                })

            if (users.length < 100) {

                let need = 100 - users.length
                let newarr = [];

                await client.db(dbname)
                    .collection("bots")
                    .find().sort({ balance: -1 })
                    .limit(need)
                    .toArray()
                    .then(async (list) => {
                        let result = users.concat(list)
                        result.forEach(async (element) => {
                            // @ts-ignore
                            // element.email = await protect_email(element.email)

                            // @ts-ignore
                            newarr.push(element)
                        })

                        return newarr

                    })
                    .catch(err => console.log(err))

                newarr.sort(function (a, b) {
                    // @ts-ignore
                    if (a.balance > b.balance) {
                        return -1
                    }

                    // @ts-ignore
                    if (a.balance < b.balance) {
                        return 1
                    }

                    return 0
                })

                newarr

                console.log('newarr')

                let id = 0
                for (let index = 0; index < newarr.length; index++) {
                    const element = newarr[index];
                    // @ts-ignore
                    if (element.email == email) {
                        console.log('найден')
                        id = index
                        return id
                    }

                }
            }

        });
    } catch (err) {
        return err
    }
};

userRouter.use("/getUser", async function (req, res) {
    try {
        mongoClient.connect(async function (err, client) {
            if (err) {
                return res.send(err);
            }


            let data = await client.db(dbname)
                .collection("users")
                .findOne({ email: req.query.email })
                .then(async (doc) => {
                    if (doc) {
                        let balance = doc.balance
                        console.log(doc.email)
                        // @ts-ignore

                        await client.db(dbname)
                            .collection("users")
                            .find()
                            .toArray()
                            .then(async users => {

                                await client.db(dbname)
                                    .collection("bots")
                                    .find()
                                    .toArray()
                                    .then(bots => {
                                        let temp = users.concat(bots)

                                        temp = temp.sort(function (a, b) {
                                            if (a.balance > b.balance) {
                                                return -1
                                            }

                                            if (a.balance < b.balance) {
                                                return 1
                                            }

                                            return 0
                                        })

                                        temp.forEach((element, index) => {
                                            if (element.email == req.query.email) {
                                                let user = {
                                                    index: index,
                                                    balance: balance
                                                }
                                                return res.send(user)
                                            }
                                        });
                                    })

                            })

                    } else {
                        return null
                    }
                })

            return res.send(data)
        });
    } catch (err) {
        console.log(err)
        return false
    }
});


userRouter.use("/register", async function (req, res) {
    try {
        mongoClient.connect(function (err, client) {
            if (err) {
                return res.send(err);
            }

            console.log(req.body)
            client
                .db("broker")
                .collection("admins")
                .insertOne({
                    username: req.body.username,
                    password: req.body.password
                })
                .then(document => res.send(document))
                .catch(err => res.send(err))
        });
    } catch (err) {
        console.log(err)
    }
});

userRouter.use("/auth", async function (req, res) {
    try {

        mongoClient.connect(function (err, client) {

            if (err) {
                return console.log(err);
            }

            console.log(req.body)

            client.db(dbname).collection("admins").findOne({
                username: req.body.username,
                password: req.body.password
            }).then(async (document) => {
                await res.send(document)
                client.close();
            })

        });

    } catch (err) {

        console.log(err)

    }
});

const protect_email = async function (user_email) {
    var avg, splitted, part1, part2;
    splitted = user_email.split("@");
    part1 = splitted[0];
    avg = part1.length / 2;
    part1 = part1.substring(0, (part1.length - avg));
    part1 = part1.slice(1)
    part1 = "*" + part1
    part2 = splitted[1];
    return part1 + "***@" + part2;
};

async function getUsers(req, res) {
    // res.send("Hello!")

    try {

        mongoClient.connect(async function (err, client) {

            if (err) {
                return console.log(err);
            }

            let users = []

            await client.db(dbname).collection("users").find().sort({ balance: -1 }).limit(50).toArray().then(async (document) => {
                console.log(document)
                for (let index = 0; index < document.length; index++) {
                    const element = document[index];

                    if (element.email) {
                        if (element.email.length > 0) {
                            // @ts-ignore
                            users.push(element)

                        }
                    }

                }
            })

            if (users.length < 100) {

                let need = 100 - users.length
                let newarr = [];
                console.log(need)
                await client.db(dbname)
                    .collection("bots")
                    .find().sort({ balance: -1 })
                    .limit(need)
                    .toArray()
                    .then(async (list) => {
                        let result = users.concat(list)
                        result.forEach(async (element) => {
                            // @ts-ignore
                            element.email = await protect_email(element.email)

                            // @ts-ignore
                            newarr.push(element)
                        })

                    })
                    .catch(err => console.log(err))
                await res.send(newarr)
            }

        });

    } catch (err) {

        console.log(err)

    }
}

userRouter.use("/getUsers", async (req, res) => await getUsers(req, res));

userRouter.use("/removeProposal", async function (req, res) {
    try {

        mongoClient.connect(async function (err, client) {

            if (err) {
                return console.log(err);
            }
            console.log(req.body.id)
            // await client.db("broker").collection("deposits").findOne({ id: req.body.id }).then((data) => { }
            await client.db(dbname).collection("deposits").deleteOne({ username: req.body.username }).then((data) => {
                console.log(data)
            })
            // const extra = {
            //     parse_mode: 'HTML',
            //     reply_markup: {
            //         keyboard: [['Играть дальше']],
            //         one_time_keyboard: true,
            //         resize_keyboard: true
            //     }
            // }
            const message = "Я все проверила! Ты делаешь первые шаги в реальном трейдинге. Лови еще 10000 IQ Coins"
            // @ts-ignore
            await bot.telegram.sendMessage(req.body.id, message).then((res) => {
                console.log(res)
            })
        });

    } catch (err) {

        console.log(err)

    }
});

userRouter.use("/declineProposal", async function (req, res) {
    try {

        mongoClient.connect(async function (err, client) {

            if (err) {
                return console.log(err);
            }
            console.log(req.body.id)
            // await client.db("broker").collection("deposits").findOne({ id: req.body.id }).then((data) => { }
            await client.db(dbname).collection("deposits").deleteOne({ username: req.body.username }).then((data) => {
                console.log(data)
            })
            // const extra = {
            //     parse_mode: 'HTML',
            //     reply_markup: {
            //         keyboard: [['Играть дальше']],
            //         one_time_keyboard: true,
            //         resize_keyboard: true
            //     }
            // }
            const message = "Я все проверила! Твой e-mail не найден в списке депозитов"
            // @ts-ignore
            bot.telegram.sendMessage(req.body.id, message)
        });

    } catch (err) {

        console.log(err)

    }
});

userRouter.use("/state", async function (req, res) {
    try {

        mongoClient.connect(async function (err, client) {

            if (err) {
                return console.log(err);
            }
            let data: { id: number } = req.body
            // await client.db("broker").collection("deposits").findOne({ id: req.body.id }).then((data) => { }
            // await client.db(dbname).collection("steps").drop()
            return await client.db(dbname)
                .collection("steps")
                .updateOne({ id: data.id }, { $set: data }, { upsert: true })
                .then((succes) => {
                    console.log('Стейт добавлен')
                    console.log(succes)
                    res.send(succes)
                })
                .catch(err => {
                    console.log("Стейт не добавлен")
                    console.log(err)
                })
        });

    } catch (err) {

        console.log(err)

    }
});


module.exports = userRouter;