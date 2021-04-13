const express = require("express");
const app = express();
const Discord = require("discord.js");

const util = require("minecraft-server-util");

const { pathfinder, Movements, goals } = require("mineflayer-pathfinder");
const GoalFollow = goals.GoalFollow;
const GoalBlock = goals.GoalBlock;

const client = new Discord.Client();
let channel = process.env.channelID;

app.get("/", (request, response) => {
  response.sendStatus(200);
  const ping = new Date();
  ping.setHours(ping.getHours() - 3);
  console.log(
    `Ping recebido às ${ping.getUTCHours()}:${ping.getUTCMinutes()}:${ping.getUTCSeconds()}`
  );
});
app.listen(process.env.PORT);

const config = {
  botNick: "Mine-bot",
  ip: "luarzito.aternos.me",
  port: 17046
};

// Load mineflayer
const mineflayer = require("mineflayer");
const connect = {
  host: config.ip,
  port: config.port,
  username: config.botNick
};

const bot = mineflayer.createBot(connect);

const mineflayerViewer = require("prismarine-viewer").mineflayer;

bot.loadPlugin(pathfinder);

function followPlayer() {
  const players = ["luarrekcah", "Angel_505", "Caduh678"];

  const playerCI = bot.players[players];

  if (!playerCI || !playerCI.entity) {
    const randomPlayer =
      players[Math.floor(Math.random() * players.length) + 1];
    const wordsNotFound = [
      `Oh, não encontrei ${randomPlayer}, saudades, acho que vou atrás de outro jogador...`,
      `Onde está ${randomPlayer}?`,
      `Acho que o jogo ficaria mais legal com ${randomPlayer} junto :/``Eu estava procurando por ${randomPlayer}, mas não encontrei`
    ];
    const fullNotFound =
      wordsNotFound[Math.floor(Math.random() * wordsNotFound.length) + 1];
    bot.chat(fullNotFound);
    return;
  }

  const mcData = require("minecraft-data")(bot.version);
  const movements = new Movements(bot, mcData);
  movements.scafoldingBlocks = [];

  bot.pathfinder.setMovements(movements);
  console.log(playerCI.entity);
  const goal = new GoalFollow(playerCI.entity, 1); // default: 1
  bot.pathfinder.setGoal(goal, true);
}

setInterval(async () => {
  followPlayer();
}, 20000);

function lookAtNearestPlayer() {
  const playerFilter = entity => entity.type === "player";
  const playerEntity = bot.nearestEntity(playerFilter);

  if (!playerEntity) return;

  const pos = playerEntity.position.offset(0, playerEntity.height, 0);
  bot.lookAt(pos);
}

bot.on("physicTick", lookAtNearestPlayer);

setInterval(async () => {
  // controlar o intervalo
  util
    .status(config.ip, {
      port: config.port,
      enableSRV: true,
      timeout: 5000,
      protocolVersion: 47
    }) // These are the default options
    .then(async response => {
      //console.log(response);

      const atividades = [
        [`${channel.name}`, "WATCHING"],
        [
          `${response.onlinePlayers} pessoas online de ${response.maxPlayers}`,
          "WATCHING"
        ]
      ];
      let i = Math.floor(Math.random() * atividades.length + 1) - 1;
      await client.user.setActivity(atividades[i][0], {
        type: atividades[i][1]
      });
    })
    .catch(error => {
      throw error;
    });
}, 10000); // intervalo

client.on("ready", () => {
  console.log(`Discord logado, Nome: ${client.user.username}!`);
  channel = client.channels.cache.get(channel);
  if (!channel) {
    console.log(`Não encontrei (${process.env.channel})!`);
    process.exit(1);
  }
});

// Redirect Discord messages to in-game chat
client.on("message", message => {
  // Only handle messages in specified channel
  if (message.channel.id !== channel.id) return;
  // Ignore messages from the bot itself
  if (message.author.id === client.user.id) return;

  bot.chat(`${message.author.username}: ${message.content}`);

  if (message.content == "m!server") {
    util
      .status(config.ip, {
        port: config.port,
        enableSRV: true,
        timeout: 5000,
        protocolVersion: 47
      }) // These are the default options
      .then(async response => {
        console.log(response);
        let users = [];
        let i,
          x = "";
        let playersList = response.samplePlayers;
        for (i = 0; i < playersList.length; i++) {
          //x += users.push(playersList[i].user);
          x += users.push(playersList[1]);
        }
        const embed = new Discord.MessageEmbed()
          .setTitle("Server info")
          .setDescription(`Minecraft: ${response.version}`)
          .addField(
            "IP dinâmico",
            `${response.srvRecord.host}:${response.srvRecord.port}`
          )
          .addField("Players conectados: " + response.onlinePlayers, users);

        message.channel.send(message.author, embed);
      });
  }

  if (message.content == "m!restart") {
    process.exit(1);
  }

  if (message.content == "m!print") {
    console.log(mineflayerViewer(bot, { port: 55316, firstPerson: true }));
    channel.send("teste");
  }
});

// Redirect in-game messages to Discord channel
bot.on("chat", (username, message) => {
  // Ignore messages from the bot itself
  if (username === bot.username) return;

  channel.send(`${username}: ${message}`);
});
/*
bot.on("kicked", (reason, loggedIn) => console.log(reason, loggedIn).then(() => {
process.exit(1);
}));*/
bot.on("kicked", () => {
  console.log("Sai do servidor, vou me reiniciar para entrar novamente");
  process.exit(1);
});
bot.on("error", err => console.log(err));
//console.log(bot);
// Login Discord bot
client.login(process.env.discordToken);
