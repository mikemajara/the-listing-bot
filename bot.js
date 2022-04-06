"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const menu_1 = require("@grammyjs/menu");
const storage_supabase_1 = require("@grammyjs/storage-supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const stateless_question_1 = require("@grammyjs/stateless-question");
const lodash_1 = __importDefault(require("lodash"));
require("dotenv/config");
const initialState = {
    list: [],
    title: "Untitled",
    lastMessageId: undefined,
};
const URL = (_a = process.env.SUPABASE_URL) !== null && _a !== void 0 ? _a : "";
const KEY = (_b = process.env.SUPABASE_KEY) !== null && _b !== void 0 ? _b : "";
const BOT_TOKEN = (_c = process.env.BOT_TOKEN) !== null && _c !== void 0 ? _c : "";
if (!URL || !KEY) {
    console.log(`URL: ${process.env.SUPABASE_URL}`);
    console.log(`KEY: ${process.env.SUPABASE_KEY}`);
    throw Error("URL and KEY must have a value");
}
// supabase instance
const supabase = (0, supabase_js_1.createClient)(URL, KEY);
// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new grammy_1.Bot(BOT_TOKEN); // <-- put your authentication token between the ""
// create storage
const storage = (0, storage_supabase_1.supabaseAdapter)({
    supabase,
    table: "sessions", // the defined table name you want to use to store your session
});
// Create bot and register session middleware
bot.use((0, grammy_1.session)({
    initial: () => initialState,
    storage,
}));
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Create a simple menu.
const menu = new menu_1.Menu("list", {
    onMenuOutdated: (ctx) => {
        console.log(`message outdated:\n${getMessage(ctx)}`);
        ctx.menu.update();
        // ctx.deleteMessage();
    },
})
    .text("➕ voy", (ctx) => {
    let name = getName(ctx);
    let origLength = ctx.session.list.length;
    ctx.session.list = lodash_1.default.uniqBy(ctx.session.list.concat(name), (e) => e);
    if (origLength !== ctx.session.list.length)
        ctx.editMessageText(formatList(ctx));
})
    .text("➖ no voy", (ctx) => {
    let name = getName(ctx);
    let origLength = ctx.session.list.length;
    ctx.session.list = ctx.session.list.filter((e) => e !== name && !new RegExp(`\(${name}\)`, "gm").test(e));
    if (origLength !== ctx.session.list.length)
        ctx.editMessageText(formatList(ctx));
})
    .row()
    .text("🧑‍🤝‍🧑 Invito", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    yield inviteQuestion.replyWithMarkdown(ctx, `${(_d = ctx.from) === null || _d === void 0 ? void 0 : _d.first_name}, cómo se llama tu invitad@?` +
        inviteQuestion.messageSuffixMarkdown());
}))
    .text("🔄 Actualizar", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield ctx.editMessageText(formatList(ctx));
    }
    catch (err) {
        console.log(err);
    }
}))
    .row();
// Make it interactive.
bot.use(menu);
const titleQuestion = new stateless_question_1.StatelessQuestion("title", (ctx) => {
    var _a, _b;
    ctx.session.title = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : ctx.session.title;
    ctx.deleteMessage().catch((err) => console.log(err));
    showList(ctx);
});
const inviteQuestion = new stateless_question_1.StatelessQuestion("invite", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    ctx.session.list = ctx.session.list.concat(`${(_e = ctx.message) === null || _e === void 0 ? void 0 : _e.text} (${getName(ctx)})`);
    yield ctx.reply("Hecho, actualiza la lista para ver los cambios");
    // https://core.telegram.org/bots/api#updating-messages
    // Please note, that it is currently only possible to edit
    // messages without reply_markup or with inline keyboards.
    // showList(ctx);
}));
bot.use(titleQuestion.middleware());
bot.use(inviteQuestion.middleware());
bot.command("newlist", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Send the menu.
    yield titleQuestion.replyWithMarkdown(ctx, "Give your list a title" + titleQuestion.messageSuffixMarkdown());
}));
// Handle other messages.
// bot.on("message", (ctx) => ctx.reply("Got another message!"));
// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();
const getName = (ctx) => {
    var _a, _b, _c, _d, _e, _f;
    let first_name = (_b = (_a = ctx.from) === null || _a === void 0 ? void 0 : _a.first_name) !== null && _b !== void 0 ? _b : "";
    let last_name = (_d = (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.last_name) !== null && _d !== void 0 ? _d : "";
    if (first_name && last_name) {
        return first_name + " " + last_name;
    }
    return (_f = (_e = ctx.from) === null || _e === void 0 ? void 0 : _e.username) !== null && _f !== void 0 ? _f : "unkown";
};
const getMessage = (ctx) => {
    var _a, _b;
    return (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "";
};
const isNameInList = (ctx) => {
    let name = getName(ctx);
    return ctx.session.list.includes(name);
};
const formatList = (ctx) => {
    const preparedNames = ctx.session.list.map((e, i) => `${i + 1}. ${e}`);
    return `${ctx.session.title}\n\n${preparedNames.join("\n")}\n`;
};
const getTitleFromMessage = (ctx) => {
    var _a;
    // TODO
    return (_a = getMessage(ctx).match(/^.*?$/gm)) === null || _a === void 0 ? void 0 : _a[1];
};
const clearAll = (ctx) => {
    ctx.session = initialState;
};
const clear = (ctx) => {
    let listName = getTitleFromMessage(ctx);
    console.log(`deleting list\n${listName}`);
    // ctx.session.list.pop()
};
const showList = (ctx) => {
    ctx
        .reply(formatList(ctx), { reply_markup: menu })
        .then((msg) => (ctx.session.lastMessageId = msg.message_id));
};
bot.command("clearall", clearAll);
bot.command("showlist", showList);
bot.command("clear", (ctx) => {
    clear(ctx);
    ctx.deleteMessage().catch((err) => console.log(err));
});
bot.command("stop", (ctx) => bot.stop());
