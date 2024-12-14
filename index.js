#!/usr/bin/node

const discord = await import('discord.js')
const dotenv = await import('dotenv')
const { Mistral } = await import('@mistralai/mistralai')

dotenv.config()

const mistral = new Mistral()

const client = new discord.Client({
  intents: [
    1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 1048576, 2097152, 16777216, 33554432 // fuck you and your stupid intents
  ]
})

client.on('messageCreate', async (msg) => {
  if (!msg.content.includes('<@' + client.user.id + '>')) { return }

  const prompt = msg.content.split('<@' + client.user.id + '>')

  if (prompt.length !== 2) {
    try {
      return await msg.reply('Are you stupid?')
    } catch {}
  }

  await msg.channel.sendTyping()

  const interval = setInterval(async () => {
    await msg.channel.sendTyping()
  }, 5000)

  try {
    const response = await mistral.fim.complete({
      model: 'codestral-latest',
      prompt: prompt[0],
      suffix: prompt[1],
      maxTokens: 32768 - (prompt[0].length + prompt[1].length),
      temperature: 0
    })

    clearInterval(interval)

    let output = prompt[0] + response.choices[0].message.content + prompt[1]

    let inputs = []
    if (output.length > 8192) {
      while (output.length > 8192) {
        inputs.push(output.slice(0, 8192))
        output = output.slice(8192)
      }
      inputs.push(output)
    } else {
      inputs = [output]
    }

    const moderation = await mistral.classifiers.moderate({ model: 'mistral-moderation-latest', inputs })

    for (const result of moderation.results) {
      if (result.categories.sexual) {
        throw new TypeError('no')
      }
    }

    try {
      return await msg.reply(output)
    } catch {
      return await msg.reply({
        files: [
          new discord.AttachmentBuilder(Buffer.from(output), { name: 'output.txt' })
        ]
      })
    }
  } catch (error) {
    clearInterval(interval)
    try {
      return await msg.reply('```\n' + error.stack + '\n```')
    } catch {}
  }
})

client.login(process.env.DISCORD_TOKEN)

client.on('ready', () => {
  console.log('ready on ' + client.user.tag)
})
