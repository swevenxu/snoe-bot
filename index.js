const { Client, GatewayIntentBits, EmbedBuilder, REST, Routes, SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');
// Use environment variables if available, otherwise fall back to config.json
let config;
try {
  config = require('./config.json');
} catch (e) {
  config = {
    token: process.env.TOKEN,
    clientId: process.env.CLIENT_ID,
    guildId: process.env.GUILD_ID
  };
}
const fs = require('fs');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ============== AUTO MOD CONFIG ==============
const automod = {
  // Bad words filter (reduced to explicit slurs and profanity only)
  badWords: ['nigger','nigga','nigg3r','n1gger','n1gga','faggot','fag','f4ggot','f4g','retard','retarded','r3tard','kike','k1ke','chink','ch1nk','spic','sp1c','wetback','w3tback','gook','g00k','coon','c00n','darkie','darky','beaner','b3aner','tranny','tr4nny','shemale','sh3male','niglet','porchmonkey','porch monkey','sandnigger','towelhead','raghead','zipperhead','kys','kkk','nazi'],
  
  // Bypass role IDs - these roles bypass AutoMod
  bypassRoleIds: ['1446532643545026711', '1458797062417289380'],
  
  // Block ALL links
  blockAllLinks: true,
  
  // Caps filter - % of caps allowed
  capsThreshold: 70,
  capsMinLength: 10,
  
  // Mention spam limit
  maxMentions: 5,
  
  // Spam detection
  spamInterval: 5000, // 5 seconds
  spamMaxMessages: 5  // max messages in interval
};

// Track messages for spam detection
const messageTracker = new Map();

// Warnings storage
const warningsFile = './warnings.json';
let warnings = {};
if (fs.existsSync(warningsFile)) {
  warnings = JSON.parse(fs.readFileSync(warningsFile, 'utf8'));
}

// Marriages storage
const marriagesFile = './marriages.json';
let marriages = {};
if (fs.existsSync(marriagesFile)) {
  marriages = JSON.parse(fs.readFileSync(marriagesFile, 'utf8'));
}

// Giveaways storage
const giveawaysFile = './giveaways.json';
let giveaways = {};
if (fs.existsSync(giveawaysFile)) {
  giveaways = JSON.parse(fs.readFileSync(giveawaysFile, 'utf8'));
}

function saveGiveaways() {
  fs.writeFileSync(giveawaysFile, JSON.stringify(giveaways, null, 2));
}

// Active giveaway timers (for auto-draw)
const giveawayTimers = new Map();

// End giveaway and pick winners
async function endGiveaway(messageId, client) {
  const giveaway = giveaways[messageId];
  if (!giveaway || giveaway.ended) return;
  
  giveaway.ended = true;
  saveGiveaways();
  giveawayTimers.delete(messageId);
  
  try {
    const channel = await client.channels.fetch(giveaway.channelId);
    const message = await channel.messages.fetch(messageId);
    
    let winnerMentions = 'No one entered!';
    let winners = [];
    
    if (giveaway.entries.length > 0) {
      // Pick random winners
      const shuffled = [...giveaway.entries].sort(() => Math.random() - 0.5);
      winners = shuffled.slice(0, Math.min(giveaway.winnerCount, shuffled.length));
      winnerMentions = winners.map(id => `<@${id}>`).join(', ');
    }
    
    // Update the embed to show ended
    const endedEmbed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Giveaway Ended')
      .setDescription(winners.length > 0 ? `**Winner(s):** ${winnerMentions}` : 'No one entered the giveaway.')
      .addFields(
        { name: 'Prize', value: giveaway.prize, inline: true },
        { name: 'Entries', value: `${giveaway.entries.length}`, inline: true },
        { name: 'Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
      )
      .setThumbnail('attachment://snoe-logo.png')
      .setTimestamp();
    
    // Disable the button
    const disabledButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_ended_${messageId}`)
        .setLabel('Ended')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );
    
    await message.edit({ embeds: [endedEmbed], components: [disabledButton] });
    
    // Announce winner
    if (winners.length > 0) {
      await channel.send(`Congratulations ${winnerMentions}! You won **${giveaway.prize}**.`);
    } else {
      await channel.send(`The giveaway for **${giveaway.prize}** ended with no entries.`);
    }
  } catch (err) {
    console.log('❌ Failed to end giveaway:', err.message);
  }
}

function saveMarriages() {
  fs.writeFileSync(marriagesFile, JSON.stringify(marriages, null, 2));
}

// Ticket inactivity timers
const ticketTimers = new Map();

function getPartner(guildId, userId) {
  return marriages[guildId]?.[userId] || null;
}

function setMarriage(guildId, user1, user2) {
  if (!marriages[guildId]) marriages[guildId] = {};
  marriages[guildId][user1] = { odatnerId: user2, date: Date.now() };
  marriages[guildId][user2] = { odatnerId: user1, date: Date.now() };
  saveMarriages();
}

function removeMarriage(guildId, userId) {
  if (!marriages[guildId]) return false;
  const partner = marriages[guildId][userId]?.odatnerId;
  if (partner) {
    delete marriages[guildId][userId];
    delete marriages[guildId][partner];
    saveMarriages();
    return true;
  }
  return false;
}

function saveWarnings() {
  fs.writeFileSync(warningsFile, JSON.stringify(warnings, null, 2));
}

function addWarning(guildId, userId, reason, moderator) {
  if (!warnings[guildId]) warnings[guildId] = {};
  if (!warnings[guildId][userId]) warnings[guildId][userId] = [];
  
  warnings[guildId][userId].push({
    reason,
    moderator,
    timestamp: Date.now()
  });
  saveWarnings();
  return warnings[guildId][userId].length;
}

function getWarnings(guildId, userId) {
  return warnings[guildId]?.[userId] || [];
}

function clearWarnings(guildId, userId) {
  if (warnings[guildId]?.[userId]) {
    delete warnings[guildId][userId];
    saveWarnings();
    return true;
  }
  return false;
}


// Slash commands
const commands = [
  new SlashCommandBuilder()
    .setName('devlog')
    .setDescription('Display development changelog')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('createchannel')
    .setDescription('Create a new channel')
    .addStringOption(opt => opt.setName('name').setDescription('Channel name').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('Channel type')
      .addChoices(
        { name: 'Text', value: 'text' },
        { name: 'Voice', value: 'voice' },
        { name: 'Category', value: 'category' }
      ))
    .addChannelOption(opt => opt.setName('category').setDescription('Category to create channel in').addChannelTypes(4))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('createtemplate')
    .setDescription('Create channels from a template')
    .addStringOption(opt => opt.setName('template').setDescription('Template to use').setRequired(true)
      .addChoices(
        { name: 'Support', value: 'support' },
        { name: 'Ticket', value: 'ticket' },
        { name: 'Announcement', value: 'announcement' },
        { name: 'Gaming', value: 'gaming' },
        { name: 'Community', value: 'community' }
      ))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('bulkcreate')
    .setDescription('Create multiple channels at once')
    .addStringOption(opt => opt.setName('names').setDescription('Channel names separated by commas').setRequired(true))
    .addStringOption(opt => opt.setName('type').setDescription('Channel type')
      .addChoices(
        { name: 'Text', value: 'text' },
        { name: 'Voice', value: 'voice' }
      ))
    .addChannelOption(opt => opt.setName('category').setDescription('Category to create channels in').addChannelTypes(4))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Warn a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('View warnings for a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to check').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Clear all warnings for a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to clear warnings for').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Create a ticket panel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to send the panel to').setRequired(true).addChannelTypes(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('close')
    .setDescription('Close the current ticket')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('add')
    .setDescription('Add a user to the ticket')
    .addUserOption(opt => opt.setName('user').setDescription('User to add').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('remove')
    .setDescription('Remove a user from the ticket')
    .addUserOption(opt => opt.setName('user').setDescription('User to remove').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Timeout a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to mute').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration (e.g. 10m, 1h, 1d)').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Remove timeout from a user')
    .addUserOption(opt => opt.setName('user').setDescription('User to unmute').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('marry')
    .setDescription('Propose to someone')
    .addUserOption(opt => opt.setName('user').setDescription('User to propose to').setRequired(true))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('divorce')
    .setDescription('Divorce your partner')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('partner')
    .setDescription('Check who someone is married to')
    .addUserOption(opt => opt.setName('user').setDescription('User to check (leave empty for yourself)'))
    .toJSON(),
  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('Start a new giveaway')
    .addStringOption(opt => opt.setName('prize').setDescription('What are you giving away?').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('How long? (e.g. 10m, 1h, 1d)').setRequired(true))
    .addIntegerOption(opt => opt.setName('winners').setDescription('Number of winners (default: 1)').setMinValue(1).setMaxValue(20))
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to post giveaway in').addChannelTypes(0))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('greroll')
    .setDescription('Reroll winner(s) for a giveaway')
    .addStringOption(opt => opt.setName('message_id').setDescription('The giveaway message ID').setRequired(true))
    .addIntegerOption(opt => opt.setName('winners').setDescription('Number of new winners to pick (default: 1)').setMinValue(1).setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('members')
    .setDescription('Show the server member count (excluding bots)')
    .toJSON(),
  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages from a channel')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(true).setMinValue(1).setMaxValue(100))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .toJSON(),
  new SlashCommandBuilder()
    .setName('purgeall')
    .setDescription('Delete all messages in a channel by cloning it')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .toJSON()
];

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  
  const rest = new REST({ version: '10' }).setToken(config.token);
  try {
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
  
  // Restore active giveaway timers
  for (const [messageId, giveaway] of Object.entries(giveaways)) {
    if (giveaway.ended) continue;
    
    const timeLeft = giveaway.endTime - Date.now();
    
    if (timeLeft <= 0) {
      // Giveaway should have ended while bot was offline
      endGiveaway(messageId, client);
    } else {
      // Set timer for remaining time
      const timer = setTimeout(() => endGiveaway(messageId, client), timeLeft);
      giveawayTimers.set(messageId, timer);
      console.log(`✅ Restored giveaway timer: ${messageId} (${Math.round(timeLeft / 1000)}s remaining)`);
    }
  }
});

// Welcome message when someone joins
const welcomeChannelId = '1462734422406070375';
const goodbyeChannelId = '1462742913841758372';
const autoRoleId = '1446533291808264423';
const ticketStaffRoleId = '1446532643545026711';


client.on('guildMemberAdd', async member => {
  console.log('👋 New member joined:', member.user.tag);
  
  try {
    const role = member.guild.roles.cache.get(autoRoleId);
    if (role) {
      await member.roles.add(role);
      console.log('✅ Gave role to:', member.user.tag);
    }
  } catch (err) {
    console.log('❌ Failed to give role:', err.message);
  }
  
  const channel = member.guild.channels.cache.get(welcomeChannelId);
  if (!channel) {
    console.log('❌ Welcome channel not found! ID:', welcomeChannelId);
    return;
  }
  
  const memberCount = member.guild.memberCount;
  const accountCreated = member.user.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: '2-digit' });
  const joinDate = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' });
  const joinTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const embed = new EmbedBuilder()
    .setColor(0x2F3136)
    .setTitle('Frozen Welcome')
    .setDescription(`Hi, <@${member.id}>.\n\nThank you for choosing **Snoe**`)
    .setThumbnail('attachment://snoe-logo.png');
  
  try {
    await channel.send({ embeds: [embed], files: ['./snoe-logo.png'] });
  } catch (err) {
    console.log('❌ Failed to send welcome message:', err.message);
  }
});

// Goodbye message when someone leaves
client.on('guildMemberRemove', async member => {
  const channel = member.guild.channels.cache.get(goodbyeChannelId);
  if (!channel) return;

  const embed = new EmbedBuilder()
    .setColor(0x2F3136)
    .setTitle('Poor Thing Melted')
    .setDescription(`Goodbye, **${member.user.tag}**.\n\nWe hope to see you again.`)
    .setThumbnail('attachment://snoe-logo.png');

  try {
    await channel.send({ embeds: [embed], files: ['./snoe-logo.png'] });
  } catch (err) {
    console.log('❌ Failed to send goodbye message:', err.message);
  }
});


client.on('interactionCreate', async interaction => {
  // Handle ticket button
  if (interaction.isButton() && interaction.customId === 'create_ticket') {
    const guild = interaction.guild;
    const user = interaction.user;
    
    // Check if user already has a ticket
    const existingTicket = guild.channels.cache.find(c => c.name === `ticket-${user.username.toLowerCase()}`);
    if (existingTicket) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existingTicket}`, ephemeral: true });
    }
    
    try {
      // Create ticket channel
      const ticketChannel = await guild.channels.create({
        name: `ticket-${user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: ['ViewChannel'] },
          { id: user.id, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'] },
          { id: ticketStaffRoleId, allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory', 'ManageMessages'] }
        ]
      });
      
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Ticket Created')
        .setDescription(`Welcome ${user}!\n\nA staff member will be with you shortly.\nUse \`/close\` to close this ticket.`)
        .setThumbnail('attachment://snoe-logo.png');
      
      const closeButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setStyle(ButtonStyle.Secondary)
      );
      
      await ticketChannel.send({ embeds: [embed], files: ['./snoe-logo.png'], components: [closeButton] });
      await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
      
      // Start inactivity timer (1 minute)
      const timer = setTimeout(async () => {
        try {
          const inactiveEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription('⏰ Ticket auto-closed due to inactivity.');
          await ticketChannel.send({ embeds: [inactiveEmbed] });
          setTimeout(() => ticketChannel.delete().catch(() => {}), 5000);
        } catch (err) {}
        ticketTimers.delete(ticketChannel.id);
      }, 1200000);
      
      ticketTimers.set(ticketChannel.id, { odatnerId: user.id, timer });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to create ticket: ${err.message}`, ephemeral: true });
    }
    return;
  }
  
  // Handle marriage proposal buttons
  if (interaction.isButton() && interaction.customId.startsWith('marry_')) {
    const parts = interaction.customId.split('_');
    const action = parts[1]; // accept or deny
    const odatnerId = parts[2];
    const targetId = parts[3];
    
    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: '❌ This proposal is not for you!', ephemeral: true });
    }
    
    if (action === 'accept') {
      // Check if either person got married while waiting
      if (getPartner(interaction.guild.id, odatnerId) || getPartner(interaction.guild.id, targetId)) {
        return interaction.update({ content: '❌ One of you is already married!', embeds: [], components: [] });
      }
      
      setMarriage(interaction.guild.id, odatnerId, targetId);
      
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('💍 Just Married!')
        .setDescription(`<@${odatnerId}> and <@${targetId}> are now married!\n\nCongratulations! 🎉`)
        .setTimestamp();
      
      await interaction.update({ embeds: [embed], components: [] });
    } else if (action === 'deny') {
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('💔 Proposal Rejected')
        .setDescription(`<@${targetId}> rejected <@${odatnerId}>'s proposal.`);
      
      await interaction.update({ embeds: [embed], components: [] });
    }
    return;
  }

  // Handle giveaway entry button
  if (interaction.isButton() && interaction.customId.startsWith('giveaway_enter_')) {
    const messageId = interaction.customId.replace('giveaway_enter_', '');
    const giveaway = giveaways[messageId];
    
    if (!giveaway) {
      return interaction.reply({ content: '❌ This giveaway no longer exists!', ephemeral: true });
    }
    
    if (giveaway.ended) {
      return interaction.reply({ content: '❌ This giveaway has already ended!', ephemeral: true });
    }
    
    // Check if user already entered
    if (giveaway.entries.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ You have already entered this giveaway!', ephemeral: true });
    }
    
    // Add entry
    giveaway.entries.push(interaction.user.id);
    saveGiveaways();
    
    // Update the embed with new entry count
    try {
      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields(
          { name: 'Prize', value: giveaway.prize, inline: true },
          { name: 'Winners', value: `${giveaway.winnerCount}`, inline: true },
          { name: 'Entries', value: `${giveaway.entries.length}`, inline: true },
          { name: 'Ends', value: `<t:${Math.floor(giveaway.endTime / 1000)}:R>`, inline: true },
          { name: 'Hosted by', value: `<@${giveaway.hostId}>`, inline: true }
        );
      
      await interaction.message.edit({ embeds: [embed] });
    } catch (err) {}
    
    await interaction.reply({ content: 'You have entered the giveaway.', ephemeral: true });
    return;
  }

  // Handle close ticket button
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    // Clear inactivity timer
    const ticketData = ticketTimers.get(interaction.channel.id);
    if (ticketData) {
      clearTimeout(ticketData.timer);
      ticketTimers.delete(interaction.channel.id);
    }
    
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'devlog') {
    const snowRoleId = '1446533291808264423';
    const embed = new EmbedBuilder()
      .setColor(0xFFFFFF)
      .setTitle('Deadly Delivery')
      .setDescription('```ansi\n\u001b[1;32m[+]\u001b[0m Golden Bar added to Auto Collect\n```')
      .setTimestamp();
    await interaction.reply({ content: `<@&${snowRoleId}>`, embeds: [embed] });
  }

  // Create single channel
  if (interaction.commandName === 'createchannel') {
    const name = interaction.options.getString('name');
    const type = interaction.options.getString('type') || 'text';
    const category = interaction.options.getChannel('category');

    const { ChannelType } = require('discord.js');
    const channelTypes = {
      'text': ChannelType.GuildText,
      'voice': ChannelType.GuildVoice,
      'category': ChannelType.GuildCategory
    };

    try {
      const newChannel = await interaction.guild.channels.create({
        name: name,
        type: channelTypes[type],
        parent: type !== 'category' ? category?.id : null
      });

      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Channel Created')
        .setDescription(`Successfully created ${type} channel: ${newChannel}`)
        .setThumbnail('attachment://snoe-logo.png');

      await interaction.reply({ embeds: [embed], files: ['./snoe-logo.png'], ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to create channel: ${err.message}`, ephemeral: true });
    }
  }

  // Create from template
  if (interaction.commandName === 'createtemplate') {
    const template = interaction.options.getString('template');
    const { ChannelType } = require('discord.js');

    const templates = {
      'support': {
        category: '📞 Support',
        channels: [
          { name: 'support-chat', type: ChannelType.GuildText },
          { name: 'faq', type: ChannelType.GuildText },
          { name: 'Support Voice', type: ChannelType.GuildVoice }
        ]
      },
      'ticket': {
        category: '🎫 Tickets',
        channels: [
          { name: 'create-ticket', type: ChannelType.GuildText },
          { name: 'ticket-logs', type: ChannelType.GuildText }
        ]
      },
      'announcement': {
        category: '📢 Announcements',
        channels: [
          { name: 'announcements', type: ChannelType.GuildText },
          { name: 'updates', type: ChannelType.GuildText },
          { name: 'changelogs', type: ChannelType.GuildText }
        ]
      },
      'gaming': {
        category: '🎮 Gaming',
        channels: [
          { name: 'gaming-chat', type: ChannelType.GuildText },
          { name: 'looking-for-group', type: ChannelType.GuildText },
          { name: 'Gaming Lounge', type: ChannelType.GuildVoice },
          { name: 'Gaming 2', type: ChannelType.GuildVoice }
        ]
      },
      'community': {
        category: '💬 Community',
        channels: [
          { name: 'general', type: ChannelType.GuildText },
          { name: 'off-topic', type: ChannelType.GuildText },
          { name: 'media', type: ChannelType.GuildText },
          { name: 'Hangout', type: ChannelType.GuildVoice }
        ]
      }
    };

    const selectedTemplate = templates[template];
    if (!selectedTemplate) {
      await interaction.reply({ content: '❌ Template not found!', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply({ ephemeral: true });

      // Create category first
      const categoryChannel = await interaction.guild.channels.create({
        name: selectedTemplate.category,
        type: ChannelType.GuildCategory
      });

      // Create channels under category
      const createdChannels = [];
      for (const ch of selectedTemplate.channels) {
        const newCh = await interaction.guild.channels.create({
          name: ch.name,
          type: ch.type,
          parent: categoryChannel.id
        });
        createdChannels.push(newCh);
      }

      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Template Created')
        .setDescription(`Successfully created **${template}** template!\n\n**Category:** ${categoryChannel}\n**Channels:** ${createdChannels.length} created`)
        .setThumbnail('attachment://snoe-logo.png');

      await interaction.editReply({ embeds: [embed], files: ['./snoe-logo.png'] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to create template: ${err.message}` });
    }
  }

  // Bulk create channels
  if (interaction.commandName === 'bulkcreate') {
    const names = interaction.options.getString('names').split(',').map(n => n.trim());
    const type = interaction.options.getString('type') || 'text';
    const category = interaction.options.getChannel('category');

    const { ChannelType } = require('discord.js');
    const channelTypes = {
      'text': ChannelType.GuildText,
      'voice': ChannelType.GuildVoice
    };

    try {
      await interaction.deferReply({ ephemeral: true });

      const createdChannels = [];
      for (const name of names) {
        if (name) {
          const newCh = await interaction.guild.channels.create({
            name: name,
            type: channelTypes[type],
            parent: category?.id
          });
          createdChannels.push(newCh);
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('Bulk Channels Created')
        .setDescription(`Successfully created **${createdChannels.length}** ${type} channels!\n\n${createdChannels.map(c => `• ${c}`).join('\n')}`)
        .setThumbnail('attachment://snoe-logo.png');

      await interaction.editReply({ embeds: [embed], files: ['./snoe-logo.png'] });
    } catch (err) {
      await interaction.editReply({ content: `❌ Failed to create channels: ${err.message}` });
    }
  }

  // Warn command
  if (interaction.commandName === 'warn') {
    const user = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    
    const count = addWarning(interaction.guild.id, user.id, reason, interaction.user.tag);
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('⚠️ User Warned')
      .setDescription(`**${user.tag}** has been warned.\n\n**Reason:** ${reason}\n**Total Warnings:** ${count}`)
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    
    // Try to DM the user
    try {
      await user.send(`⚠️ You have been warned in **${interaction.guild.name}**\n**Reason:** ${reason}\n**Total Warnings:** ${count}`);
    } catch (err) {}
  }

  // Warnings command
  if (interaction.commandName === 'warnings') {
    const user = interaction.options.getUser('user');
    const userWarnings = getWarnings(interaction.guild.id, user.id);
    
    if (userWarnings.length === 0) {
      await interaction.reply({ content: `✅ **${user.tag}** has no warnings.`, ephemeral: true });
      return;
    }
    
    const warningList = userWarnings.map((w, i) => 
      `**${i + 1}.** ${w.reason}\n   By: ${w.moderator} • <t:${Math.floor(w.timestamp / 1000)}:R>`
    ).join('\n\n');
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle(`⚠️ Warnings for ${user.tag}`)
      .setDescription(warningList)
      .setThumbnail(user.displayAvatarURL())
      .setFooter({ text: `Total: ${userWarnings.length} warning(s)` });
    
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  // Clear warnings command
  if (interaction.commandName === 'clearwarns') {
    const user = interaction.options.getUser('user');
    
    if (clearWarnings(interaction.guild.id, user.id)) {
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('✅ Warnings Cleared')
        .setDescription(`All warnings for **${user.tag}** have been cleared.`)
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } else {
      await interaction.reply({ content: `**${user.tag}** has no warnings to clear.`, ephemeral: true });
    }
  }

  // Ticket setup command
  if (interaction.commandName === 'ticket-setup') {
    const channel = interaction.options.getChannel('channel');
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Support Tickets')
      .setDescription('Need help? Click the button below to create a ticket.\n\nA staff member will assist you shortly.')
      .setThumbnail('attachment://snoe-logo.png');
    
    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('create_ticket')
        .setLabel('Create Ticket')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('🎫')
    );
    
    await channel.send({ embeds: [embed], files: ['./snoe-logo.png'], components: [button] });
    await interaction.reply({ content: `✅ Ticket panel created in ${channel}`, ephemeral: true });
  }

  // Close ticket command
  if (interaction.commandName === 'close') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    // Clear inactivity timer
    const ticketData = ticketTimers.get(interaction.channel.id);
    if (ticketData) {
      clearTimeout(ticketData.timer);
      ticketTimers.delete(interaction.channel.id);
    }
    
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }

  // Add user to ticket
  if (interaction.commandName === 'add') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });
    
    await interaction.reply({ content: `✅ Added ${user} to the ticket.` });
  }

  // Remove user from ticket
  if (interaction.commandName === 'remove') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
    }
    
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.delete(user.id);
    
    await interaction.reply({ content: `✅ Removed ${user} from the ticket.` });
  }

  // Mute command
  if (interaction.commandName === 'mute') {
    const user = interaction.options.getUser('user');
    const duration = interaction.options.getString('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ User not found!', ephemeral: true });
    }

    // Parse duration
    const match = duration.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      return interaction.reply({ content: '❌ Invalid duration! Use format: 10m, 1h, 1d', ephemeral: true });
    }

    const amount = parseInt(match[1]);
    const unit = match[2];
    let ms;
    if (unit === 'm') ms = amount * 60 * 1000;
    else if (unit === 'h') ms = amount * 60 * 60 * 1000;
    else if (unit === 'd') ms = amount * 24 * 60 * 60 * 1000;

    // Max timeout is 28 days
    if (ms > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({ content: '❌ Max timeout is 28 days!', ephemeral: true });
    }

    try {
      await member.timeout(ms, reason);
      
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('🔇 User Muted')
        .setDescription(`**${user.tag}** has been muted.\n\n**Duration:** ${duration}\n**Reason:** ${reason}`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to mute: ${err.message}`, ephemeral: true });
    }
  }

  // Unmute command
  if (interaction.commandName === 'unmute') {
    const user = interaction.options.getUser('user');
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) {
      return interaction.reply({ content: '❌ User not found!', ephemeral: true });
    }

    try {
      await member.timeout(null);
      
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setTitle('🔊 User Unmuted')
        .setDescription(`**${user.tag}** has been unmuted.`)
        .setThumbnail(user.displayAvatarURL())
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to unmute: ${err.message}`, ephemeral: true });
    }
  }

  // Marry command
  if (interaction.commandName === 'marry') {
    const target = interaction.options.getUser('user');
    
    if (target.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You can\'t marry yourself!', ephemeral: true });
    }
    
    if (target.bot) {
      return interaction.reply({ content: '❌ You can\'t marry a bot!', ephemeral: true });
    }
    
    if (getPartner(interaction.guild.id, interaction.user.id)) {
      return interaction.reply({ content: '❌ You\'re already married! Use `/divorce` first.', ephemeral: true });
    }
    
    if (getPartner(interaction.guild.id, target.id)) {
      return interaction.reply({ content: `❌ ${target.tag} is already married!`, ephemeral: true });
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('<a:1407745857079611442:1462756351032954891> Marriage Proposal')
      .setDescription(`${interaction.user} has proposed to ${target}!\n\n${target}, do you accept?`);
    
    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`marry_accept_${interaction.user.id}_${target.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💍'),
      new ButtonBuilder()
        .setCustomId(`marry_deny_${interaction.user.id}_${target.id}`)
        .setLabel('Deny')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('💔')
    );
    
    await interaction.reply({ embeds: [embed], components: [buttons] });
  }

  // Divorce command
  if (interaction.commandName === 'divorce') {
    const partner = getPartner(interaction.guild.id, interaction.user.id);
    
    if (!partner) {
      return interaction.reply({ content: '❌ You\'re not married!', ephemeral: true });
    }
    
    removeMarriage(interaction.guild.id, interaction.user.id);
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('💔 Divorced')
      .setDescription(`${interaction.user} has divorced <@${partner.odatnerId}>.`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }

  // Partner command
  if (interaction.commandName === 'partner') {
    const target = interaction.options.getUser('user') || interaction.user;
    const partner = getPartner(interaction.guild.id, target.id);
    
    if (!partner) {
      const msg = target.id === interaction.user.id 
        ? '❌ You\'re not married!' 
        : `❌ ${target.tag} is not married!`;
      return interaction.reply({ content: msg, ephemeral: true });
    }
    
    const marriedSince = `<t:${Math.floor(partner.date / 1000)}:R>`;
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('<:1402282380940677235:1462756372017053791> Partner')
      .setDescription(`**${target.tag}** is married to <@${partner.odatnerId}>\n\nMarried ${marriedSince}`)
      .setThumbnail(target.displayAvatarURL());
    
    await interaction.reply({ embeds: [embed] });
  }

  // Giveaway command
  if (interaction.commandName === 'giveaway') {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getString('duration');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    const channel = interaction.options.getChannel('channel') || interaction.channel;
    
    // Parse duration
    const match = duration.match(/^(\d+)(m|h|d)$/);
    if (!match) {
      return interaction.reply({ content: '❌ Invalid duration! Use format: 10m, 1h, 1d', ephemeral: true });
    }
    
    const amount = parseInt(match[1]);
    const unit = match[2];
    let ms;
    if (unit === 'm') ms = amount * 60 * 1000;
    else if (unit === 'h') ms = amount * 60 * 60 * 1000;
    else if (unit === 'd') ms = amount * 24 * 60 * 60 * 1000;
    
    const endTime = Date.now() + ms;
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Giveaway')
      .setDescription('Click the button below to enter.')
      .addFields(
        { name: 'Prize', value: prize, inline: true },
        { name: 'Winners', value: `${winnerCount}`, inline: true },
        { name: 'Entries', value: '0', inline: true },
        { name: 'Ends', value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
        { name: 'Hosted by', value: `${interaction.user}`, inline: true }
      )
      .setThumbnail('attachment://snoe-logo.png')
      .setTimestamp(endTime);
    
    // We'll update the button customId after we get the message ID
    const tempButton = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_enter_temp')
        .setLabel('Enter')
        .setStyle(ButtonStyle.Secondary)
    );
    
    try {
      const giveawayMessage = await channel.send({ 
        embeds: [embed], 
        files: ['./snoe-logo.png'], 
        components: [tempButton] 
      });
      
      // Now update the button with the actual message ID
      const realButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`giveaway_enter_${giveawayMessage.id}`)
          .setLabel('Enter')
          .setStyle(ButtonStyle.Secondary)
      );
      
      await giveawayMessage.edit({ components: [realButton] });
      
      // Store giveaway data
      giveaways[giveawayMessage.id] = {
        channelId: channel.id,
        guildId: interaction.guild.id,
        prize,
        winnerCount,
        entries: [],
        endTime,
        hostId: interaction.user.id,
        ended: false
      };
      saveGiveaways();
      
      // Set up auto-draw timer
      const timer = setTimeout(() => endGiveaway(giveawayMessage.id, client), ms);
      giveawayTimers.set(giveawayMessage.id, timer);
      
      await interaction.reply({ content: `✅ Giveaway started in ${channel}!`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to start giveaway: ${err.message}`, ephemeral: true });
    }
  }

  // Greroll command
  if (interaction.commandName === 'greroll') {
    const messageId = interaction.options.getString('message_id');
    const winnerCount = interaction.options.getInteger('winners') || 1;
    
    const giveaway = giveaways[messageId];
    
    if (!giveaway) {
      return interaction.reply({ content: '❌ Giveaway not found! Make sure you have the correct message ID.', ephemeral: true });
    }
    
    if (!giveaway.ended) {
      return interaction.reply({ content: '❌ This giveaway hasn\'t ended yet!', ephemeral: true });
    }
    
    if (giveaway.entries.length === 0) {
      return interaction.reply({ content: '❌ No one entered this giveaway!', ephemeral: true });
    }
    
    // Pick new random winners
    const shuffled = [...giveaway.entries].sort(() => Math.random() - 0.5);
    const winners = shuffled.slice(0, Math.min(winnerCount, shuffled.length));
    const winnerMentions = winners.map(id => `<@${id}>`).join(', ');
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Giveaway Rerolled')
      .setDescription(`**Prize:** ${giveaway.prize}\n\n**New Winner(s):** ${winnerMentions}`)
      .setTimestamp();
    
    await interaction.reply({ content: `Congratulations ${winnerMentions}! You won **${giveaway.prize}**.`, embeds: [embed] });
  }

  // Members command
  if (interaction.commandName === 'members') {
    const members = await interaction.guild.members.fetch();
    const humans = members.filter(m => !m.user.bot).size;
    const bots = members.filter(m => m.user.bot).size;
    
    const embed = new EmbedBuilder()
      .setColor(0x2F3136)
      .setTitle('Member Count')
      .setDescription(`**Members:** ${humans}\n**Bots:** ${bots}\n**Total:** ${members.size}`)
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }

  // Purge command
  if (interaction.commandName === 'purge') {
    const amount = interaction.options.getInteger('amount');
    
    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `Deleted ${deleted.size} messages.`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `Failed to delete messages: ${err.message}`, ephemeral: true });
    }
  }

  // Purge all command
  if (interaction.commandName === 'purgeall') {
    try {
      const channel = interaction.channel;
      const newChannel = await channel.clone();
      await newChannel.setPosition(channel.position);
      await channel.delete();
      await newChannel.send({ content: 'Channel cleared.' });
    } catch (err) {
      await interaction.reply({ content: `Failed to clear channel: ${err.message}`, ephemeral: true });
    }
  }

});

// ============== AUTO MOD ==============
client.on('messageCreate', async message => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;
  
  // Reset ticket inactivity timer if ticket creator replies
  if (message.channel.name.startsWith('ticket-')) {
    const ticketData = ticketTimers.get(message.channel.id);
    if (ticketData && message.author.id === ticketData.odatnerId) {
      clearTimeout(ticketData.timer);
      
      // Restart timer
      const newTimer = setTimeout(async () => {
        try {
          const inactiveEmbed = new EmbedBuilder()
            .setColor(0x2F3136)
            .setDescription('⏰ Ticket auto-closed due to inactivity.');
          await message.channel.send({ embeds: [inactiveEmbed] });
          setTimeout(() => message.channel.delete().catch(() => {}), 5000);
        } catch (err) {}
        ticketTimers.delete(message.channel.id);
      }, 1200000);
      
      ticketTimers.set(message.channel.id, { odatnerId: ticketData.odatnerId, timer: newTimer });
    }
  }
  
  // Bypass role check
  if (automod.bypassRoleIds?.some(roleId => message.member?.roles.cache.has(roleId))) return;
  
  const content = message.content.toLowerCase();
  let deleted = false;
  let reason = '';

  // 1. Bad word filter
  if (!deleted) {
    for (const word of automod.badWords) {
      if (content.includes(word.toLowerCase())) {
        deleted = true;
        reason = 'Bad word detected';
        break;
      }
    }
  }

  // 2. Link filter - block all links
  if (!deleted && automod.blockAllLinks) {
    const urlRegex = /(https?:\/\/[^\s]+)/gi;
    if (urlRegex.test(message.content)) {
      deleted = true;
      reason = 'Links not allowed';
    }
  }

  // 3. Caps filter
  if (!deleted && message.content.length >= automod.capsMinLength) {
    const letters = message.content.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 0) {
      const caps = letters.replace(/[^A-Z]/g, '').length;
      const capsPercent = (caps / letters.length) * 100;
      if (capsPercent >= automod.capsThreshold) {
        deleted = true;
        reason = 'Excessive caps';
      }
    }
  }

  // 4. Mention spam
  if (!deleted) {
    const mentions = message.mentions.users.size + message.mentions.roles.size;
    if (mentions > automod.maxMentions) {
      deleted = true;
      reason = 'Too many mentions';
    }
  }

  // 5. Spam detection
  if (!deleted) {
    const key = `${message.guild.id}-${message.author.id}`;
    const now = Date.now();
    
    if (!messageTracker.has(key)) {
      messageTracker.set(key, []);
    }
    
    const timestamps = messageTracker.get(key).filter(t => now - t < automod.spamInterval);
    timestamps.push(now);
    messageTracker.set(key, timestamps);
    
    if (timestamps.length >= automod.spamMaxMessages) {
      deleted = true;
      reason = 'Spam detected';
      messageTracker.set(key, []);
    }
  }

  // Delete and warn if violation found
  if (deleted) {
    try {
      await message.delete();
      
      const warnCount = addWarning(message.guild.id, message.author.id, `[AutoMod] ${reason}`, 'Snoe AutoMod');
      
      const embed = new EmbedBuilder()
        .setColor(0x2F3136)
        .setDescription(`⚠️ <@${message.author.id}>, your message was removed.\n**Reason:** ${reason}\n**Warnings:** ${warnCount}`)
        .setFooter({ text: 'Snoe AutoMod' });
      
      const warning = await message.channel.send({ embeds: [embed] });
      setTimeout(() => warning.delete().catch(() => {}), 5000);
    } catch (err) {
      console.log('❌ AutoMod error:', err.message);
    }
  }
});

// Error handlers
client.on('error', err => console.log('❌ Client error:', err.message));
process.on('unhandledRejection', err => console.log('❌ Unhandled rejection:', err.message));
process.on('uncaughtException', err => console.log('❌ Uncaught exception:', err.message));

client.login(config.token);
