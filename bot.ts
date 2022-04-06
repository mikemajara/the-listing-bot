import { Bot, Context, session, SessionFlavor } from "grammy";
import { Menu } from "@grammyjs/menu";
import { supabaseAdapter } from "@grammyjs/storage-supabase";
import { createClient } from "@supabase/supabase-js";
import { StatelessQuestion } from "@grammyjs/stateless-question";
import _ from "lodash";

import "dotenv/config";

// Define the shape of our session.
interface SessionData {
  title: string;
  list: string[];
  lastMessageId: number | undefined;
}

const initialState = {
  list: [],
  title: "Untitled",
  lastMessageId: undefined,
};

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const URL = process.env.SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_KEY ?? "";
const BOT_TOKEN = process.env.BOT_TOKEN ?? "";

if (!URL || !KEY) {
  console.log(`URL: ${process.env.SUPABASE_URL}`);
  console.log(`KEY: ${process.env.SUPABASE_KEY}`);
  throw Error("URL and KEY must have a value");
}

// supabase instance
const supabase = createClient(URL, KEY);

// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new Bot<MyContext>(BOT_TOKEN); // <-- put your authentication token between the ""

// create storage
const storage = supabaseAdapter({
  supabase,
  table: "sessions", // the defined table name you want to use to store your session
});

// Create bot and register session middleware
bot.use(
  session({
    initial: () => initialState,
    storage,
  }),
);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

// Create a simple menu.
const menu = new Menu<MyContext>("list", {
  onMenuOutdated: (ctx) => {
    console.log(`message outdated:\n${getMessage(ctx)}`);
    ctx.menu.update();
    // ctx.deleteMessage();
  },
})
  .text("➕ voy", (ctx: MyContext) => {
    let name = getName(ctx);
    let origLength = ctx.session.list.length;
    ctx.session.list = _.uniqBy(
      ctx.session.list.concat(name),
      (e: string) => e,
    );
    if (origLength !== ctx.session.list.length)
      ctx.editMessageText(formatList(ctx));
  })
  .text("➖ no voy", (ctx: MyContext) => {
    let name = getName(ctx);
    let origLength = ctx.session.list.length;
    ctx.session.list = ctx.session.list.filter(
      (e: string) =>
        e !== name && !new RegExp(`\(${name}\)`, "gm").test(e),
    );
    if (origLength !== ctx.session.list.length)
      ctx.editMessageText(formatList(ctx));
  })
  .row()
  .text("🧑‍🤝‍🧑 Invito", async (ctx: MyContext) => {
    await inviteQuestion.replyWithMarkdown(
      ctx,
      `${ctx.from?.first_name}, cómo se llama tu invitad@?` +
        inviteQuestion.messageSuffixMarkdown(),
    );
  })
  .text("🔄 Actualizar", async (ctx: MyContext) => {
    try {
      await ctx.editMessageText(formatList(ctx));
    } catch (err) {
      console.log(err);
    }
  })
  .row();
// Make it interactive.
bot.use(menu);

const titleQuestion = new StatelessQuestion(
  "title",
  (ctx: MyContext) => {
    ctx.session.title = ctx.message?.text ?? ctx.session.title;
    ctx.deleteMessage().catch((err) => console.log(err));
    showList(ctx);
  },
);

const inviteQuestion = new StatelessQuestion(
  "invite",
  async (ctx: MyContext) => {
    ctx.session.list = ctx.session.list.concat(
      `${ctx.message?.text} (${getName(ctx)})`,
    );
    await ctx.reply("Hecho, actualiza la lista para ver los cambios");
    // https://core.telegram.org/bots/api#updating-messages
    // Please note, that it is currently only possible to edit
    // messages without reply_markup or with inline keyboards.
    // showList(ctx);
  },
);

bot.use(titleQuestion.middleware());
bot.use(inviteQuestion.middleware());

bot.command("newlist", async (ctx: MyContext) => {
  // Send the menu.
  await titleQuestion.replyWithMarkdown(
    ctx,
    "Give your list a title" + titleQuestion.messageSuffixMarkdown(),
  );
});

// Handle other messages.
// bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();

const getName = (ctx: Context) => {
  let first_name = ctx.from?.first_name ?? "";
  let last_name = ctx.from?.last_name ?? "";
  if (first_name && last_name) {
    return first_name + " " + last_name;
  }
  return ctx.from?.username ?? "unkown";
};

const getMessage = (ctx: Context) => {
  return ctx.message?.text ?? "";
};

const isNameInList = (ctx: MyContext) => {
  let name = getName(ctx);
  return ctx.session.list.includes(name);
};

const formatList = (ctx: MyContext) => {
  const preparedNames = ctx.session.list.map(
    (e: any, i: any) => `${i + 1}. ${e}`,
  );
  return `${ctx.session.title}\n\n${preparedNames.join("\n")}\n`;
};

const getTitleFromMessage = (ctx: MyContext) => {
  // TODO
  return getMessage(ctx).match(/^.*?$/gm)?.[1];
};

const clearAll = (ctx: MyContext) => {
  ctx.session = initialState;
};

const clear = (ctx: MyContext) => {
  let listName = getTitleFromMessage(ctx);
  console.log(`deleting list\n${listName}`);
  // ctx.session.list.pop()
};

const showList = (ctx: MyContext) => {
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
