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
  // Bad words filter
  badWords: ['abbo','abo','abortion','abuse','addict','addicts','adult','africa','african','alla','allah','alligatorbait','amateur','american','anal','analannie','analsex','angie','angry','anus','arab','arabs','areola','argie','aroused','arse','arsehole','asian','ass','assbagger','assblaster','assclown','asscowboy','asses','assfuck','assfucker','asshat','asshole','assholes','asshore','assjockey','asskiss','asskisser','assklown','asslick','asslicker','asslover','assman','assmonkey','assmunch','assmuncher','asspacker','asspirate','asspuppies','assranger','asswhore','asswipe','athletesfoot','attack','australian','babe','babies','backseat','badfuck','balllicker','balls','ballsack','banging','baptist','barelylegal','barf','barface','barfface','bast','bastard','bazongas','bazooms','beatoff','beat-off','beatyourmeat','beaver','bible','bicurios','biatch','bicurious','bigger','bigass','bigbastard','bigbutt','bisexual','bi-sexual','bitch','bitcher','bitches','bitchez','bitchin','bitching','bitchslap','bitchy','biteme','black','blackman','blackout','blacks','blind','blow','blowjob','boang','bogan','bohunk','bollick','bollock','bomb','bombers','bombing','bombs','bomd','bondage','bong','boob','boobies','boobs','booby','boody','boom','boonie','booty','bootycall','bra','brea5t','breast','breastjob','breastlover','breastman','brothel','bugger','buggered','buggery','bullcrap','bulldike','bulldyke','bullshit','bumblefuck','bumfuck','bunga','bunghole','buried','burn','butchbabes','butchdike','butchdyke','butt','buttbang','butt-bang','butthead','buttman','buttmunch','buttmuncher','buttpirate','buttplug','buttstain','byatch','cacker','cameltoe','canadian','cancer','carpetmuncher','carruth','catholic','catholics','cemetery','chav','cherrypopper','chickslick','children\'s','chin','chinaman','chinamen','chinese','chink','chinky','choad','chode','christ','christian','church','cigarette','cigs','clamdiver','clamlicker','clit','clitoris','cocaine','cock','cockblock','cockblocker','cockcowboy','cockfight','cockhead','cockknob','cocklicker','cocklover','cocknob','cockqueen','cockrider','cocksman','cocksmith','cocksmoker','cocksucer','cocksuck','cocksucked','cocksucker','cocksucking','cocktease','cocky','cohee','coitus','color','colored','coloured','commie','communist','condom','conservative','conspiracy','coolie','cooly','coon','coondog','copulate','cornhole','corruption','cra5h','crabs','crack','crackpipe','crackwhore','crack-whore','crap','crapola','crapper','crappy','crash','creamy','crime','crimes','criminal','criminals','crotch','crotchjockey','crotchmonkey','crotchrot','cum','cumbubble','cumfest','cumjockey','cumm','cummer','cumming','cumquat','cumqueen','cumshot','cunilingus','cunillingus','cunn','cunnilingus','cunntt','cunt','cunteyed','cuntfuck','cuntfucker','cuntlick','cuntlicker','cuntlicking','cuntsucker','cybersex','cyberslimer','dago','dahmer','dammit','damn','damnation','damnit','darkie','darky','datnigga','dead','deapthroat','death','deepthroat','defecate','dego','demon','deposit','desire','destroy','deth','devil','devilworshipper','dick','dickbrain','dickforbrains','dickhead','dickless','dicklick','dicklicker','dickman','dickwad','dickweed','diddle','die','died','dies','dike','dildo','dingleberry','dink','dipshit','dipstick','dirty','disease','diseases','disturbed','dive','dix','dixiedike','dixiedyke','doggiestyle','doggystyle','dong','doodoo','doo-doo','doom','dope','dragqueen','dragqween','dripdick','drug','drunk','drunken','dumb','dumbass','dumbfuck','dyefly','dyke','easyslut','eatballs','eatme','eatpussy','ecstacy','ejaculate','ejaculated','ejaculating','ejaculation','enema','enemy','erect','erection','ero','escort','ethiopian','ethnic','european','evl','excrement','execute','executed','execution','executioner','explosion','facefucker','faeces','fag','fagging','faggot','fagot','failed','failure','fairies','fairy','faith','fannyfucker','fart','farted','farting','farty','fastfuck','fat','fatah','fatass','fatfuck','fatfucker','fatso','fckcum','fear','feces','felatio','felch','felcher','felching','fellatio','feltch','feltcher','feltching','fetish','fight','fingerfuck','fingerfucked','fingerfucker','fingerfuckers','fingerfucking','fire','firing','fister','fistfuck','fistfucked','fistfucker','fistfucking','fisting','flange','flasher','flatulence','floo','flydie','flydye','fok','fondle','footaction','footfuck','footfucker','footlicker','footstar','fore','foreskin','forni','fornicate','foursome','fourtwenty','fraud','freakfuck','freakyfucker','freefuck','fu','fubar','fuc','fucck','fuck','fucka','fuckable','fuckbag','fuckbuddy','fucked','fuckedup','fucker','fuckers','fuckface','fuckfest','fuckfreak','fuckfriend','fuckhead','fuckher','fuckin','fuckina','fucking','fuckingbitch','fuckinnuts','fuckinright','fuckit','fuckknob','fuckme','fuckmehard','fuckmonkey','fuckoff','fuckpig','fucks','fucktard','fuckwhore','fuckyou','fudgepacker','fugly','fuk','fuks','funeral','funfuck','fungus','fuuck','gangbang','gangbanged','gangbanger','gangsta','gatorbait','gay','gaymuthafuckinwhore','gaysex','geez','geezer','geni','genital','genitals','geocode','german','getiton','gin','girls','givehead','glazeddonut','gob','god','godammit','goddamit','goddammit','goddamn','goddamned','goddamnes','goddamnit','goddamnmuthafucker','goldenshower','gonorrehea','gonzagas','gook','gotohell','gringo','groe','gross','grostulation','gubba','gummer','gun','gyp','gypo','gypp','gyppie','gyppo','gyppy','hamas','handjob','hapa','harder','hardon','harem','headfuck','headlights','hebe','heeb','hell','henhouse','heroin','herpes','heterosexual','hijack','hijacker','hijacking','hillbillies','hindoo','hiscock','hitler','hitlerism','hitlerist','hiv','ho','hobo','hodgie','hoes','hole','holestuffer','homicide','homo','homobangers','homosexual','honer','honger','honk','honkers','honkey','honky','hook','hooker','hookers','hooters','hore','hork','horn','horney','horniest','horny','horseshit','hosejob','hoser','hostage','hotdamn','hotpussy','hottotrot','hummer','husky','hussy','hustler','hymen','hymie','iblowu','idiot','ikey','illegal','incest','insest','intercourse','interracial','intheass','inthebuff','israel','israeli','israel\'s','italiano','itch','jackass','jackoff','jackshit','jacktheripper','jade','jap','japcrap','japanese','jebus','jeez','jerkoff','jesus','jesuschrist','jew','jewish','jiga','jigaboo','jigg','jigga','jiggabo','jigger','jiggy','jihad','jijjiboo','jimfish','jism','jiz','jizim','jizjuice','jizm','jizz','jizzim','jizzum','joint','juggalo','jugs','junglebunny','kaffer','kaffir','kaffre','kafir','kanake','kid','kigger','kill','killed','killer','killing','kills','kink','kinky','kissass','kkk','knife','knockers','kock','kondum','koon','kotex','krap','krappy','kraut','kum','kumbubble','kumbullbe','kummer','kumming','kumquat','kums','kunilingus','kunnilingus','kunt','ky','kyke','lactate','laid','lapdance','latin','lesbain','lesbayn','lesbian','lesbin','lesbo','lez','lezbe','lezbefriends','lezbo','lezz','lezzo','liberal','libido','licker','lickme','lies','limey','limpdick','limy','lingerie','liquor','livesex','loadedgun','lolita','looser','loser','lotion','lovebone','lovegoo','lovegun','lovejuice','lovemuscle','lovepistol','loverocket','lowlife','lsd','lubejob','lucifer','luckycammeltoe','lugan','lynch','macaca','mad','mafia','magicwand','mams','manhater','manpaste','marijuana','mastabate','mastabater','masterbate','masterblaster','mastrabator','masturbate','masturbating','mattressprincess','meatbeatter','meatrack','meth','mexican','mgger','mggor','mickeyfinn','mideast','milf','minority','mockey','mockie','mocky','mofo','moky','moles','molest','molestation','molester','molestor','moneyshot','mooncricket','mormon','moron','moslem','mosshead','mothafuck','mothafucka','mothafuckaz','mothafucked','mothafucker','mothafuckin','mothafucking','mothafuckings','motherfuck','motherfucked','motherfucker','motherfuckin','motherfucking','motherfuckings','motherlovebone','muff','muffdive','muffdiver','muffindiver','mufflikcer','mulatto','muncher','munt','murder','murderer','naked','narcotic','nasty','nastybitch','nastyho','nastyslut','nastywhore','nazi','necro','negro','negroes','negroid','negro\'s','nig','niger','nigerian','nigerians','nigg','nigga','niggah','niggaracci','niggard','niggarded','niggarding','niggardliness','niggardliness\'s','niggardly','niggards','niggard\'s','niggaz','nigger','niggerhead','niggerhole','niggers','nigger\'s','niggle','niggled','niggles','niggling','nigglings','niggor','niggur','niglet','nignog','nigr','nigra','nigre','nip','nipple','nipplering','nittit','nlgger','nlggor','nofuckingway','nook','nookey','nookie','noonan','nooner','nude','nudger','nuke','nutfucker','nymph','ontherag','oral','orga','orgasim','orgasm','orgies','orgy','osama','paki','palesimian','palestinian','pansies','pansy','panti','panties','payo','pearlnecklace','peck','pecker','peckerwood','pee','peehole','pee-pee','peepshow','peepshpw','pendy','penetration','peni5','penile','penis','penises','penthouse','period','perv','phonesex','phuk','phuked','phuking','phukked','phukking','phungky','phuq','pi55','picaninny','piccaninny','pickaninny','piker','pikey','piky','pimp','pimped','pimper','pimpjuic','pimpjuice','pimpsimp','pindick','piss','pissed','pisser','pisses','pisshead','pissin','pissing','pissoff','pistol','pixie','pixy','playboy','playgirl','pocha','pocho','pocketpool','pohm','polack','pom','pommie','pommy','poo','poon','poontang','poop','pooper','pooperscooper','pooping','poorwhitetrash','popimp','porchmonkey','porn','pornflick','pornking','porno','pornography','pornprincess','pot','poverty','premature','pric','prick','prickhead','primetime','propaganda','pros','prostitute','protestant','pube','pubes','pubic','pubiclice','pud','pudboy','pudd','puddboy','puke','puntang','purinaprincess','puss','pussie','pussies','pussy','pussycat','pussyeater','pussyfucker','pussylicker','pussylips','pussylover','pussypounder','pusy','quashie','queef','queer','quickie','quim','ra8teleasing','rabbi','racial','racist','radical','radicals','rape','raped','raper','rapist','rearend','rearentry','rectum','redlight','redneck','reefer','reestie','refugee','reject','remains','rentafuck','republican','retard','retarded','ribbed','rigger','rimjob','rimming','roach','robber','roundeye','rump','russki','russkie','sadist','sadom','sambo','sandm','sandnigger','satan','scag','scallywag','scam','scammer','scandal','schlong','screw','screwyou','scrotum','scum','semen','sex','sexed','sexfarm','sexhound','sexhouse','sexing','sexkitten','sexpot','sexslave','sextogo','sextoy','sextoys','sexual','sexually','sexwhore','sexy','sexymoma','sexyslim','shag','shaggin','shagging','shat','shav','shawtypimp','sheeney','shhit','shinola','shit','shitcan','shitdick','shite','shiteater','shited','shitface','shitfaced','shitfit','shitforbrains','shitfuck','shitfucker','shitfull','shithapens','shithappens','shithead','shithouse','shiting','shitlist','shitola','shitoutofluck','shits','shitstain','shitted','shitter','shitting','shitty','shiz','shootup','shortfuck','showtime','sick','sissy','sixsixsix','sixtynine','sixtyniner','skank','skankbitch','skankfuck','skankwhore','skanky','skankybitch','skankywhore','skinflute','slant','slanteye','slapper','slaughter','slav','slave','slavedriver','sleezebag','sleezeball','slideitin','slime','slimeball','slimebucket','slit','slut','sluts','slutt','slutting','slutty','slutwear','slutwhore','smack','smackthemonkey','smut','snatch','snatchpatch','snigger','sniggered','sniggering','sniggers','sniper','snot','snowback','snownigger','sob','sodom','sodomise','sodomite','sodomize','sodomy','sonofabitch','sonofbitch','sooty','spank','spankthemonkey','sperm','spermacide','spermbag','spermhearder','spermherder','spic','spick','spig','spigot','spik','spitter','splittail','spooge','spreadeagle','spunk','spunky','squaw','staession','steamy','stfu','stiffy','strapon','stringer','stripclub','stroke','stroking','stupid','stupidfuck','stupidfucker','suck','suckdick','sucker','suckme','suckmyass','suckmydick','suckmytit','suckoff','suicide','suicidebomber','suicide-Loss','sultry','swallow','swampguinea','swastika','sweetness','syphilis','taboo','tacohead','tail','taliban','tampon','tang','tard','tarbaby','testicle','testicles','tgirl','thicklips','thirdeye','thirdleg','threesome','threeway','timbernigger','tit','titbitnipply','titfuck','titfucker','titfuckin','titi','tities','titjob','titlicker','titlover','tits','tittie','titties','titty','tittyfuck','tittyfucker','tittylover','tittysuck','tittysucjer','tittywank','tnt','tongethruster','tongue','tonguethrust','tonguetramp','topless','tortur','torture','tosser','towelhead','trailertrash','tramp','trannie','tranny','transexual','transsexual','transvestite','triplex','trisexual','trojan','trots','tuckahoe','tunneloflove','turd','turnon','twat','twink','twinkie','twobitwhore','uck','unfuckable','upskirt','uptheass','upthebutt','urinate','urine','usama','uterus','vagina','vaginal','vatican','vibr','vibrater','vibrator','vietcong','violence','virgin','virginbreaker','vomit','vulva','wab','wank','wanker','wanking','waysted','weapon','weenie','weewee','welcher','welfare','wetb','wetback','wetspot','whitenigger','whitepower','whitetrash','whitey','whiz','whop','whore','whorefucker','whorehouse','wigger','wiggerfle','willie','williewanker','willy','wn','wog','women\'slibber','wop','wtf','xnxx','xxx','yank','yellowman','zigabo','zipperhead','kys','advance fee','bait and switch','bitcoin scam','boiler room','catfish','con artist','crypto scam','dear sir','fake check','fake invoice','fake lottery','free gift','free nitro','gift card','grandparent scam','inheritance scam','investment scam','ip grabber','irs scam','job scam','nigerian prince','paypal scam','phish','phishing','pig butchering','ponzi','pump and dump','pyramid scheme','recovery scam','rip off','romance scam','scam','scammer','smishing','steam gift','tech support scam','vishing','wire transfer','would you kindly'],
  
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
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to create ticket: ${err.message}`, ephemeral: true });
    }
    return;
  }
  
  // Handle close ticket button
  if (interaction.isButton() && interaction.customId === 'close_ticket') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      return interaction.reply({ content: '❌ This is not a ticket channel!', ephemeral: true });
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

});

// ============== AUTO MOD ==============
client.on('messageCreate', async message => {
  // Ignore bots and DMs
  if (message.author.bot || !message.guild) return;
  
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
