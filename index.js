import os, asyncio, random, time, uvicorn, discord
from fastapi import FastAPI
from discord import app_commands
from discord.ext import commands
from aiohttp_retry import RetryClient

app = FastAPI()

@app.get("/")
def read_root(): return {"status": "البوت يعمل بنجاح!"}

intents = discord.Intents.default()
intents.message_content = True
intents.members = True

class MyBot(commands.Bot):
    def __init__(self): super().__init__(command_prefix="!", intents=intents)
    async def setup_hook(self):
        await self.tree.sync()
        print("تمت مزامنة الأوامر!")

bot = MyBot()
user_points, user_golds, user_rep, user_bio, daily_cooldown = {}, {}, {}, {}, {}

# --- مجموعات الأوامر المؤقتة ---
class TempChannelGroup(app_commands.Group, name="tempchannel", description="الرومات المؤقتة"): pass
tempchannel_group = TempChannelGroup()
bot.tree.add_command(tempchannel_group)

@tempchannel_group.command(name="setup")
async def temp_setup(i: discord.Interaction): await i.response.send_message("⚙️ تم الإعداد!")
@tempchannel_group.command(name="ban")
async def temp_ban(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"🚫 منع {member.mention}")
@tempchannel_group.command(name="unban")
async def temp_unban(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"✅ إلغاء منع {member.mention}")
@tempchannel_group.command(name="kick")
async def temp_kick(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"👞 طرد {member.mention}")
@tempchannel_group.command(name="hide")
async def temp_hide(i: discord.Interaction): await i.response.send_message("🙈 تم الإخفاء")
@tempchannel_group.command(name="reveal")
async def temp_reveal(i: discord.Interaction): await i.response.send_message("👀 تم الإظهار")
@tempchannel_group.command(name="rename")
async def temp_rename(i: discord.Interaction, name: str): await i.response.send_message(f"📝 تغيير الاسم إلى: {name}")
@tempchannel_group.command(name="limit")
async def temp_limit(i: discord.Interaction, count: int): await i.response.send_message(f"🔢 تحديد العدد بـ {count}")
@tempchannel_group.command(name="lock")
async def temp_lock(i: discord.Interaction): await i.response.send_message("🔒 تم القفل")
@tempchannel_group.command(name="unlock")
async def temp_unlock(i: discord.Interaction): await i.response.send_message("🔓 تم الفتح")
@tempchannel_group.command(name="transfer")
async def temp_transfer(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"👑 نقل الملكية لـ {member.mention}")
@tempchannel_group.command(name="claim")
async def temp_claim(i: discord.Interaction): await i.response.send_message("👑 استلمت الملكية")
@tempchannel_group.command(name="trust")
async def temp_trust(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"⭐ ثقة لـ {member.mention}")
@tempchannel_group.command(name="untrust")
async def temp_untrust(i: discord.Interaction, member: discord.Member): await i.response.send_message(f"❌ إلغاء ثقة {member.mention}")
@tempchannel_group.command(name="delete")
async def temp_delete(i: discord.Interaction): await i.response.send_message("🗑️ سيتم الحذف")

# --- أوامر السيرفر ---
@bot.tree.command(name="server")
async def server_info(i: discord.Interaction):
    g = i.guild
    embed = discord.Embed(title=f"📊 {g.name}", color=0x00ff00)
    embed.add_field(name="الأعضاء:", value=str(g.member_count))
    await i.response.send_message(embed=embed)

# --- مجموعات الصور والغلاف ---
class AvatarGroup(app_commands.Group, name="avatar", description="الصور"): pass
avatar_group = AvatarGroup()
bot.tree.add_command(avatar_group)

@avatar_group.command(name="member")
async def avatar_user(i: discord.Interaction, member: discord.Member = None):
    m = member or i.user
    await i.response.send_message(m.display_avatar.url)
@avatar_group.command(name="server")
async def avatar_server(i: discord.Interaction):
    if i.guild.icon: await i.response.send_message(i.guild.icon.url)
    else: await i.response.send_message("لا توجد أيقونة")

class BannerGroup(app_commands.Group, name="banner", description="الغلاف"): pass
banner_group = BannerGroup()
bot.tree.add_command(banner_group)

@banner_group.command(name="member")
async def banner_member(i: discord.Interaction, member: discord.Member = None):
    m = member or i.user
    u = await bot.fetch_user(m.id)
    if u.banner: await i.response.send_message(u.banner.url)
    else: await i.response.send_message("لا يوجد غلاف")
@banner_group.command(name="server")
async def banner_server(i: discord.Interaction):
    if i.guild.banner: await i.response.send_message(i.guild.banner.url)
    else: await i.response.send_message("لا يوجد غلاف")

# --- الألوان ---
@bot.tree.command(name="colors")
async def show_colors(i: discord.Interaction): await i.response.send_message("🎨 أحمر، أزرق، أخضر")
@bot.tree.command(name="color")
async def choose_color(i: discord.Interaction, color_name: str): await i.response.send_message(f"🎨 تم اختيار {color_name}")

# --- الملف الشخصي والاقتصاد ---
@bot.tree.command(name="profile")
async def view_profile(i: discord.Interaction, member: discord.Member = None):
    m = member or i.user
    p, g = user_points.get(m.id, 0), user_golds.get(m.id, 100)
    await i.response.send_message(f"👤 {m.name} | 🪙 الذهب: {g} | 🎮 النقاط: {p}")

@bot.tree.command(name="golds")
async def manage_golds(i: discord.Interaction, member: discord.Member = None, amount: int = None):
    if member and amount:
        user_golds[i.user.id] = user_golds.get(i.user.id, 100) - amount
        user_golds[member.id] = user_golds.get(member.id, 100) + amount
        await i.response.send_message("💸 تم التحويل")
    else: await i.response.send_message(f"🪙 رصيدك: {user_golds.get(i.user.id, 100)}")

@bot.tree.command(name="daily")
async def get_daily(i: discord.Interaction):
    uid, now = i.user.id, time.time()
    if uid in daily_cooldown and now - daily_cooldown[uid] < 86400: return await i.response.send_message("⏳ استلمتها سابقاً")
    daily_cooldown[uid] = now
    user_golds[uid] = user_golds.get(uid, 100) + 200
    await i.response.send_message("🎁 تم استلام 200 ذهبة")

@bot.tree.command(name="ping")
async def get_ping(i: discord.Interaction): await i.response.send_message(f"🏓 {round(bot.latency * 1000)}ms")

# --- الألعاب والأوامر الفرعية للنقاط ---
class GameGroup(app_commands.Group, name="game", description="الألعاب"): pass
game_group = GameGroup()
bot.tree.add_command(game_group)

@game_group.command(name="mafia")
async def game_mafia(i: discord.Interaction): await i.response.send_message("🕵️‍♂️ بدأت المافيا!")

class MinigameGroup(app_commands.Group, name="minigame", description="ألعاب مصغرة"): pass
minigame_group = MinigameGroup()
bot.tree.add_command(minigame_group)

@minigame_group.command(name="fast-type")
async def fast_type(i: discord.Interaction):
    t = random.choice(["ديسكورد", "سيرفر", "بوت"])
    await i.response.send_message(f"⏱️ اكتب الكلمة: {t}")

class PointsGroup(app_commands.Group, name="points", description="النقاط"): pass
points_subgroup = PointsGroup()
game_group.add_command(points_subgroup)

@points_subgroup.command(name="set")
async def points_set(i: discord.Interaction, member: discord.Member, pts: int):
    user_points[member.id] = pts
    await i.response.send_message("🎯 تم التحديث")

# تم تغيير الاسم هنا من points إلى my_points لحل مشكلة التعارض والتكرار
@bot.tree.command(name="my_points", description="عرض نقاطك الحالية")
async def view_my_points(i: discord.Interaction): 
    await i.response.send_message(f"🎮 نقاطك: {user_points.get(i.user.id, 0)}")

# --- تشغيل السيرفر والبوت ---
async def main():
    token = os.environ.get("DISCORD_TOKEN")
    port = int(os.environ.get("PORT", 10000))
    cfg = uvicorn.Config(app, host="0.0.0.0", port=port, log_level="info")
    srv = uvicorn.Server(cfg)
    async with RetryClient() as retry_client:
        bot.http.connector = retry_client._client.connector
        await asyncio.gather(srv.serve(), bot.start(token))

if __name__ == "__main__":
    asyncio.run(main())
