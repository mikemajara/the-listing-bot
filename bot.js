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
const getName = (ctx) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    let first_name = (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) === null || _b === void 0 ? void 0 : _b.includes((_d = (_c = ctx.from) === null || _c === void 0 ? void 0 : _c.first_name) !== null && _d !== void 0 ? _d : "");
    let last_name = (_f = (_e = ctx.message) === null || _e === void 0 ? void 0 : _e.text) === null || _f === void 0 ? void 0 : _f.includes((_h = (_g = ctx.from) === null || _g === void 0 ? void 0 : _g.last_name) !== null && _h !== void 0 ? _h : "");
    if (!(first_name || last_name)) {
        return (_k = (_j = ctx.from) === null || _j === void 0 ? void 0 : _j.username) !== null && _k !== void 0 ? _k : "unknown";
    }
    return first_name + " " + last_name;
};
const getMessage = (ctx) => {
    var _a, _b;
    return (_b = (_a = ctx.message) === null || _a === void 0 ? void 0 : _a.text) !== null && _b !== void 0 ? _b : "";
};
const isNameInList = (ctx) => {
    let name = getName(ctx);
    return ctx.session.list.includes(name);
};
// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new grammy_1.Bot("5288372022:AAHT_fV-9n8nY_SdevcvbWLcLh-g7WFZQkY"); // <-- put your authentication token between the ""
// Install session middleware, and define the initial session value.
function initial() {
    return { list: [] };
}
bot.use((0, grammy_1.session)({ initial }));
// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.
// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));
// Create a simple menu.
const menu = new menu_1.Menu("my-menu-identifier").text((ctx) => {
    return isNameInList(ctx) ? "Remove me" : "Add me";
}, (ctx) => {
    let message = getMessage(ctx);
    let name = getName(ctx);
    console.log(`message: ${message}`);
    console.log(`name: ${name}`);
    if (isNameInList(ctx)) {
        ctx.session.list = ctx.session.list.filter((e) => e !== name);
    }
    else {
        ctx.session.list.push(name);
    }
    const preparedNames = ctx.session.list.map((e, i) => `${i + 1}. ${e}`);
    ctx.editMessageText(`Lista\n\n${preparedNames.join("\n")}\n`);
});
// Make it interactive.
bot.use(menu);
bot.command("list", (ctx) => __awaiter(void 0, void 0, void 0, function* () {
    // Send the menu.
    yield ctx.reply("Lista\n\n", { reply_markup: menu });
}));
// Handle other messages.
// bot.on("message", (ctx) => ctx.reply("Got another message!"));
// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.
// Start the bot.
bot.start();
