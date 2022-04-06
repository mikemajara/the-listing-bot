import { Bot, Context, session, SessionFlavor } from "grammy";
import { Menu } from "@grammyjs/menu";
import { supabaseAdapter } from "@grammyjs/storage-supabase";
import { createClient } from "@supabase/supabase-js";
import { StatelessQuestion } from "@grammyjs/stateless-question";

// Define the shape of our session.
interface SessionData {
  title: string;
  list: string[];
}

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const URL = "https://zpwcqzexvdiqicbjhdeh.supabase.co";
const KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpwd2NxemV4dmRpcWljYmpoZGVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDkxOTU3MzYsImV4cCI6MTk2NDc3MTczNn0.wW_ILnhJ68TK0_nr11nOA2giRKpwS_OcMNeVU-8e4_M";

// supabase instance
const supabase = createClient(URL, KEY);

// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new Bot<MyContext>(
  "5288372022:AAHT_fV-9n8nY_SdevcvbWLcLh-g7WFZQkY",
); // <-- put your authentication token between the ""

// create storage
const storage = supabaseAdapter({
  supabase,
  table: "sessions", // the defined table name you want to use to store your session
});

// Create bot and register session middleware
bot.use(
  session({
    initial: () => ({ list: [], title: "Untitled" }),
    storage,
    // getSessionKey: (ctx: Context): string | undefined =>
    //   `${ctx.chat?.id}${ctx.message?.message_id}`,
  }),
);

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

// Create a simple menu.
const menu = new Menu<MyContext>("list")
  .text("👍", (ctx: MyContext) => {
    let name = getName(ctx);
    ctx.session.list = ctx.session.list.concat(name);
    ctx.editMessageText(formatNames(ctx));
  })
  .text("👎", (ctx: MyContext) => {
    let name = getName(ctx);
    ctx.session.list = ctx.session.list.filter(
      (e: string) =>
        e !== name && !new RegExp(`\(${name}\)`, "gm").test(e),
    );
    ctx.editMessageText(formatNames(ctx));
  })
  .text("Invitado", async (ctx: MyContext) => {
    await inviteQuestion.replyWithMarkdown(
      ctx,
      "Como se llama tu invitado?" +
        inviteQuestion.messageSuffixMarkdown(),
    );
  });

// Make it interactive.
bot.use(menu);

const titleQuestion = new StatelessQuestion("title", (ctx: any) => {
  ctx.session.title = ctx.message?.text ?? ctx.session.title;
  ctx.reply(formatNames(ctx), {
    reply_markup: menu,
  });
});

const inviteQuestion = new StatelessQuestion("invite", (ctx: any) => {
  ctx.session.list = ctx.session.list.concat(
    `${ctx.message?.text} (${getName(ctx)})`,
  );
  ctx.reply(formatNames(ctx), {
    reply_markup: menu,
  });
});

bot.use(titleQuestion.middleware());
bot.use(inviteQuestion.middleware());

bot.command("newlist", async (ctx: MyContext) => {
  // Send the menu.
  await titleQuestion.replyWithMarkdown(
    ctx,
    "Give your list a title" + titleQuestion.messageSuffixMarkdown(),
  );
  // await ctx.reply(`${ctx.session.title}\n\n`, {
  //   reply_markup: menu,
  // });
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

const formatNames = (ctx: MyContext) => {
  const preparedNames = ctx.session.list.map(
    (e: any, i: any) => `${i + 1}. ${e}`,
  );
  return `${ctx.session.title}\n\n${preparedNames.join("\n")}\n`;
};
