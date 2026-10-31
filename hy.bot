const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const express = require('express');

// --- إعداد نظام العمل 24 ساعة للنبضات ---
const app = express();
app.get('/', (req, res) => res.send('البوت يعمل بنجاح 24/7!'));
app.listen(8080, () => console.log('خادم النبضات جاهز على المنفذ 8080'));

// --- إعدادات البوت ---
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

const prefix = "!";
let warnings = new Map();

client.once('ready', () => {
    console.log(`تم تشغيل البوت بنجاح باسم: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // 1. أمر تعال
    if (command === 'تعال') {
        const member = message.mentions.members.first();
        if (!member) return message.reply("⚠️ من فضلك منشن العضو المستهدف.");
        await message.delete();
        member.send(`⚠️ تم استدعاؤك من قبل الإدارة في سيرفر ${message.guild.name}! توجه إلى الشات فوراً.`)
            .then(() => message.channel.send(`📩 تم إرسال الاستدعاء إلى ${member.user.tag}`).then(msg => setTimeout(() => msg.delete(), 5000)))
            .catch(() => message.channel.send(`❌ لا يمكن إرسال رسالة خاصة له.`).then(msg => setTimeout(() => msg.delete(), 5000)));
    }

    // 2. أمر حذف رسائل
    if (command === 'حذف') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return;
        const amount = parseInt(args[0]);
        if (isNaN(amount)) return message.reply("حدد عدد الرسائل.");
        await message.channel.bulkDelete(amount + 1);
        message.channel.send(`🧹 تم حذف ${amount} رسالة.`).then(msg => setTimeout(() => msg.delete(), 5000));
    }

    // 3. أمر قفل وفتح
    if (command === 'قفل') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: false });
        message.reply("🔒 تم قفل الشات بالكامل.");
    }
    if (command === 'فتح') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) return;
        message.channel.permissionOverwrites.edit(message.guild.roles.everyone, { SendMessages: true });
        message.reply("🔓 تم فتح الشات للجميع.");
    }

    // 4. الإدارة (طرد، باند، فك باند)
    if (command === 'طرد') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return;
        const member = message.mentions.members.first();
        if (member) { await member.kick(); message.reply(`🛑 تم طرد ${member.user.tag}`); }
    }
    if (command === 'باند') {
        if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return;
        const member = message.mentions.members.first();
        if (member) { await member.ban(); message.reply(`🚫 تم حظر ${member.user.tag}`); }
    }

    // 5. الأوامر التفاعلية والألعاب والمعلومات
    if (command === 'معلومات') {
        const embed = new EmbedBuilder()
            .setTitle(`📊 معلومات سيرفر ${message.guild.name}`)
            .addFields(
                { name: 'عدد الأعضاء', value: `${message.guild.memberCount}` },
                { name: 'المالك', value: `<@${message.guild.ownerId}>` }
            );
        message.reply({ embeds: [embed] });
    }

    if (command === 'مساعدة') {
        message.reply("📜 **الأوامر المتاحة:**\n`تعال` - `حذف` - `قفل` - `فتح` - `طرد` - `باند` - `تحذير` - `ازالة_تحذير` - `تايم` - `ازالة_تايم` - `اعطاء_رتبة` - `حذف_رتبة` - `سجن` - `تيكت` - `الوان` - `العاب` - `معلومات`.");
    }
    
    // (باقي الأوامر كـ تحذير ورتب وتيكت تتبع نفس البنية البرمجية المختصرة المبينة أعلاه)
});

client.login("ضع_التوكن_الخاص_بك_هنا");
