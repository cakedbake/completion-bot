#!/usr/bin/node

import discord from "discord.js";
import dotenv from "dotenv";
import { Mistral } from "@mistralai/mistralai";

dotenv.config();

const mistral = new Mistral();

const client = new discord.Client({ "intents": [
	1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 1048576, 2097152, 16777216, 33554432 // fuck you and your stupid intents
] });

client.on("messageCreate", async (msg) => {
	if (!msg.content.includes("<@" + client.user.id + ">")) { return }

	let prompt = msg.content.split("<@" + client.user.id + ">");

	if (prompt.length !== 2) {
		try {
			return await msg.reply("Are you stupid?");
		} catch {}
	}

	await msg.channel.sendTyping();

	const interval = setInterval(async () => {
		await msg.channel.sendTyping();
	}, 5000);

	try {
		const response = await mistral.fim.complete({
			"model": "codestral-latest",
			"prompt": prompt[0],
			"suffix": prompt[1],
			"maxTokens": 32768 - 4000,
			// at 82 T/s this will take at most 5.8 minutes to generate a response
			"temperature": 0
		});

		clearInterval(interval);

		const output = prompt[0] + response.choices[0].message.content + prompt[1];

		try {
			return await msg.reply(output);
		} catch {
			return await msg.reply({ "files": [
				new discord.AttachmentBuilder(Buffer.from(output), { "name": "output.txt" })
			] })
		}
	} catch (error) {
		clearInterval(interval);
		try {
			return await msg.reply("Error: " + error.message);
		} catch {}
	}
});

client.login(process.env.DISCORD_TOKEN);

client.on("ready", () => {
	console.log("ready on " + client.user.tag);
});