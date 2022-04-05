import { Bot, Context, session, SessionFlavor } from "grammy";
import { Menu } from "@grammyjs/menu";

// Define the shape of our session.
interface SessionData {
  list: string[];
}

// Flavor the context type to include sessions.
type MyContext = Context & SessionFlavor<SessionData>;

const getName = (ctx: Context) => {
  let first_name = ctx.message?.text?.includes(
    ctx.from?.first_name ?? "",
  );
  let last_name = ctx.message?.text?.includes(
    ctx.from?.last_name ?? "",
  );
  if (!(first_name || last_name)) {
    return ctx.from?.username ?? "unkown";
  }
  return first_name + " " + last_name;
};

const getMessage = (ctx: Context) => {
  return ctx.message?.text ?? "";
};

const isNameInList = (ctx: MyContext) => {
  let name = getName(ctx);
  return ctx.session.list.includes(name);
};

// Create an instance of the `Bot` class and pass your authentication token to it.
const bot = new Bot<MyContext>(
  "5288372022:AAHT_fV-9n8nY_SdevcvbWLcLh-g7WFZQkY",
); // <-- put your authentication token between the ""

// Install session middleware, and define the initial session value.
function initial(): SessionData {
  return { list: [] };
}
bot.use(session({ initial }));

// You can now register listeners on your bot object `bot`.
// grammY will call the listeners when users send messages to your bot.

// Handle the /start command.
bot.command("start", (ctx) => ctx.reply("Welcome! Up and running."));

// Create a simple menu.
const menu = new Menu("my-menu-identifier").text(
  (ctx: any) => {
    return isNameInList(ctx) ? "Remove me" : "Add me";
  },
  (ctx: any) => {
    let message = getMessage(ctx);
    let name = getName(ctx);
    console.log(`message: ${message}`);
    console.log(`name: ${name}`);
    if (isNameInList(ctx)) {
      ctx.session.list = ctx.session.list.filter(
        (e: string) => e !== name,
      );
    } else {
      ctx.session.list.push(name);
    }
    const preparedNames = ctx.session.list.map(
      (e: any, i: any) => `${i + 1}. ${e}`,
    );
    ctx.editMessageText(`Lista\n\n${preparedNames.join("\n")}\n`);
  },
);

// Make it interactive.
bot.use(menu);

bot.command("list", async (ctx) => {
  // Send the menu.
  await ctx.reply("Lista\n\n", { reply_markup: menu });
});

// Handle other messages.
// bot.on("message", (ctx) => ctx.reply("Got another message!"));

// Now that you specified how to handle messages, you can start your bot.
// This will connect to the Telegram servers and wait for messages.

// Start the bot.
bot.start();
