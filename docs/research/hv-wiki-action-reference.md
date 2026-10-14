# Hentaiverse 有限战斗动作参考

核查日期：2026-10-13。用途：为候选动作生成器建立词汇、约束及核验清单；本文件不是已经验证的游戏规则实现。

资料主体来自用户已收集的 [skills.html](../../src/prompt-builder/rag-database/skills.html)、[spell.html](../../src/prompt-builder/rag-database/spell.html)、[item.html](../../src/prompt-builder/rag-database/item.html)、[battle.html](../../src/prompt-builder/rag-database/battle.html)。以下数值表是这些本地资料的结构化整理，另行列出当前 Wiki 的差异，避免把旧数值悄悄视为新版本事实。

[EHWiki 首页](https://ehwiki.org/wiki/HentaiVerse) 标明版本 0.91、2026-06-08 更新，同时明确提醒部分页面未更新。[官方更新帖](https://forums.e-hentai.org/index.php?showtopic=296631) 本次无法读取（403），因此没有声称获得补丁原文确认。Wiki 是社区维护资料；实时客户端展示和实际战斗日志应比存在冲突的 Wiki 文案有更高优先级。

## 候选应表达什么

建议最小动作原子为 `action + target/slot`，而不是自然语言技能名。攻击、扫描、单体法术都应绑定当前活着的怪物槽位；治疗、buff、物品绑定自己；全体技能是否可压缩成一个候选，要先验证客户端是否仍需主目标以及主目标是否影响结果。

多目标法术要区分“玩家选中的主目标”和“游戏实际命中的目标集合”。Wiki 的目标数量不足以证明具体邻接算法。本次不能确认其全部为居中 AOE；在实测之前使用 `enemy_primary_multi`，记录 `maxTargets`，不要根据表格自行推断受影响槽位。

按本地词汇与当前 Wiki 命名整理：38 个主动法术、13 个武器/特殊技能、31 种战斗物品，加上攻击、防御、集中、逃跑、扫描和精神姿态开/关。它们是**目录**，不表示当前角色全部可用，也不表示每回合候选数量。技能书、资源、冷却、装备流派和物品槽共同决定当时的集合。

建议候选记录：`catalogId`、`clientId`、`targetSlot`、`itemSlot`、`displayName`、`currentCost`、`cooldownRemaining`、`targetMode`、`maxTargets`、`availabilityEvidence`、`observationId`。其中显示名不承担唯一标识职责。

## 基础动作、精神姿态和时间

| 动作 | 目标 | 本地资料所示费用/前提 | 时间类别与注意事项 |
|---|---|---|---|
| Attack | 单敌 | 活目标；普通攻击 | 推进战斗时间；武器触发、连击、反击属于结果 |
| Defend | 自己 | 可用 OC 达25时消耗25；否则仍可防御 | 持续本次及下一次行动；无冷却；回血规则存在Wiki冲突 |
| Focus | 自己 | 可用 OC 达25时消耗25，恢复5%基础MP | 无冷却；集中会影响命中及自身防御；精确时机有冲突 |
| Scan | 单敌 | 无法从这些资料确认费用，读客户端 | 推进时间；获取怪物信息 |
| Flee | 战斗整体 | 退出当前系列 | 可能承受敌方行动；相关Hath perk可改变时机 |
| Spirit Stance: on | 自己 | OC至少50 | 快速动作；不能未经验证当作零时间动作 |
| Spirit Stance: off | 自己 | 当前已开启 | 快速动作；不要重复生成与当前状态相同的切换 |

基础按钮和槽位行为参考 [Battles](https://ehwiki.org/wiki/Battles)。该页仍将防御回血写成10%基础HP，而 [Skills](https://ehwiki.org/wiki/Skills) 写25%；两页对 Focus 惩罚开始时机也不一致。Skills 当前说集中当次行动不施加自身闪避/格挡/招架/抗性惩罚。这里保留冲突，不把任一段直接写入执行逻辑。

[Spirit Stance](https://ehwiki.org/wiki/Spirit_Stance) 的当前说明：物理伤害增加100%，法术费用降低25%；维护消耗1 SP与10 OC；开启当次不扣维护，主动关闭当次仍扣。OC过低或SP耗尽会退出，页面还区分行动开头与结尾阈值。应记录切换前后的资源，验证实际扣费顺序。

时间模型不能只有一个 `advancesTurn` 布尔值。[Action Speed](https://ehwiki.org/wiki/Action_Speed) 区分玩家行动、time units和tick：使用物品不增加time units、不降低法术/技能冷却，但会降低其他物品冷却；法术/技能冷却按行动而不是tick变化。持续效果和回复通常随tick变化。建议至少区分 `timeProgression`、`spellSkillCooldownProgression`、`itemCooldownProgression`，未知值保留 `unknown`。

## 13 个武器与特殊技能

下表费用为OC单位，CD为本地资料记录的行动数；`旧→新`来自当前 [Skills](https://ehwiki.org/wiki/Skills) 对照。目标列中“多敌”只确认数量，选中主目标后的扩散方式待浏览器验证。来源主体为[本地技能资料](../../src/prompt-builder/rag-database/skills.html)。

| 流派 | 动作 | OC | CD | 最低对应熟练度 | 目标 |
|---|---|---:|---:|---:|---|
| 单手 | Shield Bash | 25 | 10 | 0 | 单敌 |
| 单手 | Vital Strike | 50 | 10 | 50 | 单敌 |
| 单手 | Merciful Blow | 100 | 10 | 100 | 单敌 |
| 双持 | Iris Strike | 50 | 5 | 0 | 单敌 |
| 双持 | Backstab | 50 | 5 | 50 | 单敌 |
| 双持 | Frenzied Blows | 75 | 10 | 100 | 至多5敌 |
| 双手 | Great Cleave | 50 | 10→5 | 0 | 单敌，需实测客户端确认 |
| 双手 | Rending Blow | 50 | 10→5 | 50 | 至多5敌 |
| 双手 | Shatter Strike | 50 | 10→5 | 100 | 至多5敌 |
| 二天 | Skyward Sword | 100 | 10 | 0 | 至多5敌 |
| 法杖 | Concussive Strike | 50 | 10 | 0 | 单敌 |
| 特殊 | Orbital Friendship Cannon | 200 | 50 | — | 全敌 |
| 特殊 | FUS RO DAH | 100 | 10 | — | 全敌 |

本地资料已有的解锁/组合条件：流派决定武器技能；二天使用双持和双手熟练度的较小值；OFC要求库存中持有至少21种不同收藏品；FUS要求装备Dovahkiin或Ponyslayer称号。精神姿态中先扣其维护费，再扣武器技能费，不能只检查技能本身OC。

本地资料已有的策略条件与合法性要分开：Vital Strike 对眩晕目标更强；Merciful Blow 对流血且低于25%HP的目标触发处决；Backstab 对失明目标更强；Shatter Strike 的眩晕依赖破甲。这些通常是收益条件，不应未经实测就把无对应debuff的目标从合法候选删除。

当前 Skills 的其它差异：Vital Strike/Skyward Sword 流血堆叠不再是旧表的5层；Iris/Backstab效果时长、技能伤害倍率已有变化；旧“技能不会miss”的描述已删，当前只明确不能被招架/闪避。不要沿用旧伤害公式或把旧眩晕“turn”直接当作玩家行动数。具体新效果以客户端为准。[Skills](https://ehwiki.org/wiki/Skills)

## 38 个主动法术

以下完整数值表整理自[本地法术资料](../../src/prompt-builder/rag-database/spell.html)。这是待校准的静态参考。`?`保留原始资料的不确定性；`a/b`为基础/能力强化后的数值，不是随机区间。费用是玩家等级的百分比系数，不是固定MP；表中的最低熟练度是基础熟练度要求。

### 18 个直接伤害法术

目标均为“选择敌方主目标，可能命中多敌”。同tier目标数/CD采用表下公共值。

| 属性 | 法术 | Tier | 最低等级 | 最低熟练度 | 费用系数 |
|---|---|---:|---:|---:|---:|
| 火 | Fiery Blast | 1 | 15 | 0 | 6 |
| 火 | Inferno | 2 | 95 | 50? | 14 |
| 火 | Flames of Loki | 3 | 175 | 150 | 21 |
| 冰 | Freeze | 1 | 25 | 0 | 6 |
| 冰 | Blizzard | 2 | 105 | 50 | 14 |
| 冰 | Fimbulvetr | 3 | 185 | 150 | 21 |
| 雷 | Shockblast | 1 | 35 | 0 | 6 |
| 雷 | Chained Lightning | 2 | 115? | 50? | 14 |
| 雷 | Wrath of Thor | 3 | 195 | 150 | 21 |
| 风 | Gale | 1 | 45 | 0 | 6 |
| 风 | Downburst | 2 | 125? | 60 | 14 |
| 风 | Storms of Njord | 3 | 205 | 150 | 21 |
| 圣 | Smite | 1 | 65 | 0 | 14 |
| 圣 | Banishment | 2 | 100? | 100 | 21 |
| 圣 | Paradise Lost | 3 | 200? | 200 | 30 |
| 暗 | Corruption | 1 | 85 | 0 | 14 |
| 暗 | Disintegrate | 2 | 100? | 100 | 18.5? |
| 暗 | Ragnarok | 3 | 245 | 200 | 28? |

| Tier | 基础/强化目标数量 | 基础/强化CD |
|---|---|---|
| 1 | 3/5 | 0 |
| 2 | 5/7 | 4/2 |
| 3 | 7/10 | 7/4 |

### 9 个贬损法术

基础按单敌建模，强化后可能多目标；单体/多目标必须按当前角色能力配置决定。

| 法术 | 最低等级 | 最低熟练度 | 费用系数 | CD | 用途 |
|---|---:|---:|---:|---:|---|
| Drain | 30? | 0 | 11.5 | 20/15 | 持续吸取生命；能力可增加其他吸取效果 |
| Slow | 10? | 0 | 18/25 | 3 | 减慢敌方行动 |
| Weaken | 70 | 0 | 10/16 | 3/0 | 减伤、抑制暴击 |
| Sleep | 80 | 0 | 22/35 | 7 | 睡眠控制 |
| Confuse | 150 | 45 | 25/35 | 10 | 混乱 |
| Imperil | 130 | 30 | 10/15 | 3/0 | 降低防御与抗性 |
| Blind | 80? | 30 | 18/25 | 7/3 | 降低命中 |
| Silence | 120 | 40 | 18 | 10/5 | 禁止特殊攻击与法术 |
| Immobilize（旧名MagNet） | 250? | 100? | 22 | 15/10 | 限制闪避，强化后减速 |

当前 [Abilities](https://ehwiki.org/wiki/Abilities) 能核对的多目标能力包括 Weaken、Imperil、Blind、Sleep、Confuse、Silence、Immobilize，目标数可到3。Slow和Drain的当前目标数继续以tooltip为准；不要把所有贬损法术统一标成纯单体。Abilities 对强化Weaken费用写15，Spells表仍写16，属于另一个不能硬编码的冲突。

### 11 个自我支持法术

| 法术 | 最低等级 | 最低熟练度 | 费用系数 | CD | 用途 |
|---|---:|---:|---:|---:|---|
| Cure | 5 | 0 | 20 | 5/2 | 即时恢复HP |
| Regen | 50? | 0 | 22.5/75 | 0 | 持续恢复HP |
| Full-Cure | 220 | 0 | 50 | 10 | 恢复全部HP |
| Protection | 10? | 0 | 25 | 0 | 减伤 |
| Haste | 60? | 0 | 30 | 0 | 加快行动 |
| Shadow Veil | 90 | 0 | 30 | 0 | 提高回避能力 |
| Absorb | 50? | 0 | 30 | 20 | 吸收符合条件的魔法攻击 |
| Spark of Life | 100 | 0 | 44?/30 | 0 | 致命伤保护；触发还需SP |
| Arcane Focus | 175 | 0 | 100 | 0 | 提高魔法输出 |
| Heartseeker | 140 | 0 | 100 | 0 | 提高物理输出 |
| Spirit Shield | 200 | 0 | 25 | 0 | SP承担部分严重伤害 |

当前 [Spells](https://ehwiki.org/wiki/Spells) 对照发现：MagNet 已叫 Immobilize，且不应继续描述为完全禁止抵抗；多个贬损持续时间已经变化；Arcane Focus/Heartseeker增益描述改变。Cloak of the Fallen是Spark触发后的效果，没有独立施放候选。费用公式中的旧Suffused Aether因子已从当前表移除。Spell页面对Channeling的减费表与[Fighting Styles](https://ehwiki.org/wiki/Fighting_Styles) 的“下一法术1 MP”描述不能简单合并为0 MP，动态tooltip更可靠。

## 31 种战斗物品

本节目录与基础效果整理自[本地物品资料](../../src/prompt-builder/rag-database/item.html)和[现有枚举](../../src/battle-parser/types/item.ts)。全部以自己为目标；消耗1份物品/宝石。普通物品必须已装入战斗槽且有库存、当前不在冷却中；冷却具体值未从本地资料或当前Items页确认，应保留未知并读取当前槽位。宝石使用特殊P槽。

| 类别 | 完整候选名称 | 基础作用 |
|---|---|---|
| 宝石 | Mystic Gem | 下一次法术触发Channeling；效果有期限 |
| 宝石 | Health Gem | 恢复100%基础HP |
| 宝石 | Mana Gem | 恢复50%基础MP |
| 宝石 | Spirit Gem | 恢复25%基础SP |
| HP恢复 | Health Draught | 持续恢复基础HP，2%/tick，50ticks |
| HP恢复 | Health Potion | 即时恢复100%基础HP |
| HP恢复 | Health Elixir | 恢复HP并持续恢复，100ticks |
| MP恢复 | Mana Draught | 持续恢复基础MP，1%/tick，50ticks |
| MP恢复 | Mana Potion | 即时恢复50%基础MP |
| MP恢复 | Mana Elixir | 恢复MP并持续恢复，100ticks |
| SP恢复 | Spirit Draught | 持续恢复基础SP，1%/tick，50ticks |
| SP恢复 | Spirit Potion | 即时恢复50%基础SP |
| SP恢复 | Spirit Elixir | 恢复SP并持续恢复，100ticks |
| 其他恢复 | Last Elixir | 同时恢复三种资源并持续恢复 |
| 其他恢复 | Energy Drink | 恢复Stamina，并获得SP/OC持续回复 |
| 其他恢复 | Caffeinated Candy | 类似饮料但持续时间更短 |
| 灌注 | Infusion of Flames | 火属性增益 |
| 灌注 | Infusion of Frost | 冰属性增益 |
| 灌注 | Infusion of Lightning | 雷属性增益 |
| 灌注 | Infusion of Storms | 风属性增益 |
| 灌注 | Infusion of Divinity | 圣属性增益 |
| 灌注 | Infusion of Darkness | 暗属性增益 |
| 卷轴 | Scroll of Swiftness | Haste |
| 卷轴 | Scroll of Protection | Protection |
| 卷轴 | Scroll of the Avatar | Haste + Protection |
| 卷轴 | Scroll of Absorption | Absorb |
| 卷轴 | Scroll of Shadows | Shadow Veil |
| 卷轴 | Scroll of Life | Spark of Life |
| 卷轴 | Scroll of the Gods | Absorb + Shadow Veil + Spark of Life |
| 特殊 | Bubble Gum | 大幅提高短期输出 |
| 特殊 | Flower Vase | 提高短期战斗属性 |

当前 [Items](https://ehwiki.org/wiki/Items) 与本地资料的差异：Shadows回避增益由旧30%写为25%并补充独立miss机制；Bubble Gum暴击不再写必定，而为约95%；灌注描述改为对应属性魔法伤害提高25%，不能直接复用旧“EDB加算”算法。只有一个灌注效果可同时存在。卷轴会覆盖对应法术效果。当前页面仍没给出足够完整的物品冷却表。

不能把Inventory里的所有物品都列入动作：奖杯、材料、Token、收藏品等不因名字像武器就成为战斗投掷品，例如 Holy Hand Grenade of Antioch 在本地资料是奖杯。

## 对当前仓库的具体修正线索

1. [skill.ts](../../src/battle-parser/types/skill.ts) 漏了Skyward Sword/Niten，BackStab的值是`back stab`但官方名是Backstab，FrenziedBlow少了复数s，`GneatCleave`还有字段拼写错误。宜用显式别名迁移，不再模糊匹配动作名。
2. [spell.ts](../../src/battle-parser/types/spell.ts) 的MagNet需要保留历史别名并映射到Immobilize；`full cure`与Full-Cure也不能只靠大小写转换。
3. [item.ts](../../src/battle-parser/types/item.ts) 将卷轴/灌注值写成短名；`Protection`法术和`Scroll of Protection`会歧义，应按物品槽和客户端ID区分。
4. 候选合法性读取实时技能书可用状态和资源；静态level/proficiency仅用于解释/预检，不覆盖服务端已显示的真实可用性。
5. UI打开技能面板、选中技能、取消选择属于执行步骤；快捷栏和重复上次动作属于已有语义动作的别名，不应额外给模型多个等价候选。
6. 攻击后自动触发的Counter、Bleeding、Cloak、Spike Shield、Channeling等记录为状态/事件。它们不会因为出现在Wiki中就变成主动动作。

## 实机验证优先级

先验证不会依赖高等级解锁的基础操作：攻击、物品、Defend、Focus、Scan、姿态切换。每次记录前后HP/MP/SP/OC、技能CD、物品CD、效果剩余时间、战斗日志行差、怪物槽位和状态。

接着校准角色已解锁的技能/法术：tooltip动态费用；敌方/自我目标标记；CD显示；多目标命中集合；技能强化后的费用。对本角色无法施放的动作保留 `wiki_or_legacy_only`，避免把目录覆盖率包装成实测覆盖率。

最后才适合计算效果收益。当前最大缺口是：AOE目标选择算法、Scan费用、具体物品CD、Focus惩罚时机、Defend回血冲突、精神姿态切换时间/维护边界，以及0.91官方更新原文尚未读取。
