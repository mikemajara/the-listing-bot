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
Object.defineProperty(exports, "__esModule", { value: true });
const grammy_1 = require("grammy");
const menu_1 = require("@grammyjs/menu");
const storage_supabase_1 = require("@grammyjs/storage-supabase");
const supabase_js_1 = require("@supabase/supabase-js");
const stateless_question_1 = require("@grammyjs/stateless-question");
const URL = "https://zpwcqzexvdiqicbjhdeh.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd2NxemV4dmRpcWljYmpoZGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxOTU3MzYsImV4cCI6MTk2NDc3MTczNn0.wW_ILnhJ68TK0_nr11nOA2giRKpwS_OcMNeVU-8e4_M";
// supabase instance
const supabase = (0, supabase_js_1.createClient)(URL, KEY);
// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new grammy_1.Bot("5288372022:AAHT_fV-9n8nY_SdevcvbWLcLh-g7WFZQkY"); // <-- put your authentication token between the ""
// create storage
const storage = (0, storage_supabase_1.supabaseAdapter)({
    supabase,
    table: "sessions", // the defined table name you want to use to store your session
});
// Create bot and register session middleware
bot.use((0, grammy_1.session)({
    initial: () => ({ list: [], title: "Untitled" }),
    storage,
    // getSessionKey: (ctx: Context): string | undefined =>
    //   `${ctx.chat?.id}${ctx.message?.message_id}`,
}));
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Create a simple menu.
const menu = new menu_1.Menu("list")
    .text("👍", (ctx) => {
    let name = getName(ctx);
    ctx.session.list = ctx.session.list.concat(name);
    ctx.editMessageText(formatNames(ctx));
})
    .text("👎", (ctx) => {
    let name = getName(ctx);
    ctx.session.list = ctx.session.list.filter((e) => e !== name && !new RegExp(`\(${name}\)`, "gm").test(e));
    ctx.editMessageText(formatNames(ctx));
})
    .text("🧑‍🤝‍🧑", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    yield inviteQuestion.replyWithMarkdown(ctx, "Como se llama tu invitado?" +
        inviteQuestion.messageSuffixMarkdown());
}))
    .text("🔄", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    ctx.deleteMessage();
    ctx.reply(formatNames(ctx), {
        reply_markup: menu,
    });
}));
// Make it interactive.
bot.use(menu);
const titleQuestion = new stateless_question_1.StatelessQuestion("title", (ctx) => {
    var _a, _b;
    ctx.session.title = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : ctx.session.title;
    ctx.reply(formatNames(ctx), {
        reply_markup: menu,
    });
});
const inviteQuestion = new stateless_question_1.StatelessQuestion("invite", (ctx) => {
    var _a;
    ctx.session.list = ctx.session.list.concat(`${(_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text} (${getName(ctx)})`);
    ctx.reply(formatNames(ctx), {
        reply_markup: menu,
    });
});
bot.use(titleQuestion.middleware());
bot.use(inviteQuestion.middleware());
bot.command("newlist", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Send the menu.
    yield titleQuestion.replyWithMarkdown(ctx, "Give your list a title" + titleQuestion.messageSuffixMarkdown());
    // await ctx.reply(`${ctx.session.title}\n\n`, {
    //   reply_markup: menu,
    // });
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
const formatNames = (ctx) => {
    const preparedNames = ctx.session.list.map((e, i) => `${i + 1}. ${e}`);
    return `${ctx.session.title}\n\n${preparedNames.join("\n")}\n`;
};
