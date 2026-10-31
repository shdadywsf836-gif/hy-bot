import os
import discord
from discord.ext import commands
from flask import Flask
from threading import Thread
import datetime

# --- إعداد خادم الويب لإبقاء البوت مستيقظاً (Keep Alive) ---
app = Flask('')

@app.route('/')
def home():
    return "Bot is online and alive!"

def run():
    app.run(host='0.0.0.0', port=8080)

def keep_alive():
    t = Thread(target=run)
    t.start()

# --- إعدادات البوت ---
intents = discord.Intents.all()
bot = commands.Bot(command_prefix='!', intents=intents)

# --- الأوامر المطلوبة ---

@bot.command() # مساعدة
async def help_me(ctx):
    commands_list = (
        "!sjn, !ticket, !warn, !time, !colors, !kick, !ban, !unban, "
        "!تعال, !clear, !lock, !unlock, !unwarn, !games, !role+, !role-, !server, !untime"
    )
    await ctx.send(f"**الأوامر المتاحة:**\n`{commands_list}`")

@bot.command() # سجن
@commands.has_permissions(manage_roles=True)
async def sjn(ctx, member: discord.Member):
    role = discord.utils.get(ctx.guild.roles, name="Muted")
    await member.add_roles(role)
    await ctx.send(f"🔒 تم سجن {member.mention}")

@bot.command() # تيكت
async def ticket(ctx):
    await ctx.send("🎟️ اضغط لفتح تذكرة مساعدة (يمكنك تطويرها بأزرار لاحقاً)")

@bot.command() # تحذير
@commands.has_permissions(manage_messages=True)
async def warn(ctx, member: discord.Member, *, reason="بدون سبب"):
    await ctx.send(f"⚠️ تم تحذير {member.mention} | السبب: {reason}")

@bot.command() # تايم (إسكات مؤقت)
@commands.has_permissions(moderate_members=True)
async def time(ctx, member: discord.Member, minutes: int):
    duration = datetime.timedelta(minutes=minutes)
    await member.timeout(duration)
    await ctx.send(f"⏳ تم إسكات {member.mention} لمدة {minutes} دقائق.")

@bot.command() # ازالة تايم
@commands.has_permissions(moderate_members=True)
async def untime(ctx, member: discord.Member):
    await member.timeout(None)
    await ctx.send(f"🔊 تم إزالة الإسكات عن {member.mention}")

@bot.command() # الوان
async def colors(ctx):
    await ctx.send("🎨 قائمة الألوان غير متوفرة حالياً، يمكنك ربطها برتب الألوان لاحقاً.")

@bot.command() # طرد
@commands.has_permissions(kick_members=True)
async def kick(ctx, member: discord.Member, *, reason=None):
    await member.kick(reason=reason)
    await ctx.send(f"👢 تم طرد {member.mention}")

@bot.command() # باند
@commands.has_permissions(ban_members=True)
async def ban(ctx, member: discord.Member, *, reason=None):
    await member.ban(reason=reason)
    await ctx.send(f"🔨 تم حظر {member.mention}")

@bot.command() # فك باند
@commands.has_permissions(ban_members=True)
async def unban(ctx, *, member_name):
    async for entry in ctx.guild.bans():
        user = entry.user
        if user.name == member_name:
            await ctx.guild.unban(user)
            await ctx.send(f"🔓 تم فك الحظر عن {user.name}")
            return

@bot.command(name="تعال") # اختصار طلب الحضور
@commands.has_permissions(manage_messages=True)
async def come(ctx, member: discord.Member):
    await member.send(f"⚠️ {ctx.author.mention} يطلب حضورك فوراً في سيرفر **{ctx.guild.name}**!")
    await ctx.send(f"📩 تم إرسال طلب الحضور إلى {member.mention} في الخاص.")

@bot.command() # حذف رسائل
@commands.has_permissions(manage_messages=True)
async def clear(ctx, amount: int = 10):
    await ctx.channel.purge(limit=amount + 1)
    await ctx.send(f"🗑️ تم حذف {amount} رسائل.", delete_after=5)

@bot.command() # قفل
@commands.has_permissions(manage_channels=True)
async def lock(ctx):
    await ctx.channel.set_permissions(ctx.guild.default_role, send_messages=False)
    await ctx.send("🔒 تم قفل الروم بنجاح.")

@bot.command() # فتح
@commands.has_permissions(manage_channels=True)
async def unlock(ctx):
    await ctx.channel.set_permissions(ctx.guild.default_role, send_messages=True)
    await ctx.send("🔓 تم فتح الروم بنجاح.")

@bot.command() # ازالة تحذير
@commands.has_permissions(manage_messages=True)
async def unwarn(ctx, member: discord.Member):
    await ctx.send(f"✅ تم إلغاء التحذيرات عن {member.mention}")

@bot.command() # العاب
async def games(ctx):
    await ctx.send("🎮 الألعاب المتاحة حالياً: فعاليات الأسئلة والأجوبة (قريباً)")

@bot.command(name="role+") # اعطاء رتبة
@commands.has_permissions(manage_roles=True)
async def add_role(ctx, member: discord.Member, role: discord.Role):
    await member.add_roles(role)
    await ctx.send(f"➕ تم إعطاء رتبة {role.name} لـ {member.mention}")

@bot.command(name="role-") # حذف رتبة
@commands.has_permissions(manage_roles=True)
async def remove_role(ctx, member: discord.Member, role: discord.Role):
    await member.remove_roles(role)
    await ctx.send(f"➖ تم سحب رتبة {role.name} من {member.mention}")

@bot.command() # معلومات السيرفر
async def server(ctx):
    guild = ctx.guild
    await ctx.send(f"📊 **معلومات السيرفر:**\nالاسم: {guild.name}\nالأعضاء: {guild.member_count}\nالآيدي: {guild.id}")

# تشغيل خادم الويب ثم البوت
keep_alive()
bot.run(os.getenv("DISCORD_TOKEN"))
