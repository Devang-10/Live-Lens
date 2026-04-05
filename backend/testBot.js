require('dotenv').config();
const { generateFactBotReply } = require('./communityBot');

async function run() {
  console.log("Testing bot...");
  const reply = await generateFactBotReply("Water is actually made of oxygen and helium.");
  console.log("REPLY:", reply);
}
run();
