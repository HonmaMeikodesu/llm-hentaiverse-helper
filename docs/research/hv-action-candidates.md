# Hentaiverse 候选动作数据集

整理日期：2026-10-13。已完成 Wiki、用户历史资料及当前登录浏览器页面的收集、对照和结构化。通过直接访问用户提供的网址恢复访问，已采集角色、装备、道具、能力和竞技场5类页面；未进行实战操作。`live_browser_collected` 为 true，动作级 `live_verified` 仍为 false。

## 数据入口

| 文件 | 内容 |
| --- | --- |
| [hv-action-catalog.json](hv-action-catalog.json) | 88 个语义动作模板；名称、别名、目标方式、可用条件、历史按钮ID和来源 |
| [hv-wiki-action-reference.md](hv-wiki-action-reference.md) | 完整名称与数值表，当前 Wiki 差异，费用、冷却、解锁条件及待核实项 |
| [hv-historical-observations.json](hv-historical-observations.json) | 从3份既有战斗HTML提取的控件、tooltip、物品槽、怪物槽、生命/魔力/精神读数 |
| [hv-live-observations.json](hv-live-observations.json) | 当前登录浏览器5类页面的时间戳、文本、道具槽、能力tooltip及竞技场入口 |
| [hv-live-observations.md](hv-live-observations.md) | 实时观察结论、与旧数据差异及证据边界 |

目录的数值资料主要来自你保存的 Wiki HTML。当前 Wiki 的变更和冲突单独列明，未把旧资料升级为0.91已验证规则。官方 Wiki [首页](https://ehwiki.org/wiki/HentaiVerse) 也提醒部分内容仍待更新。

## 88 个模板的组成

| 类型 | 数量 | 组成 |
| --- | ---: | --- |
| 基础动作 | 4 | Attack、Defend、Focus、Spirit Stance |
| 技能 | 15 | Flee、Scan，11个武器技能，2个特殊技能 |
| 法术 | 38 | 18个伤害、9个贬损、11个自我治疗/支持 |
| 战斗物品 | 31 | 4宝石、9常规恢复、3其他恢复、6灌注、7卷轴、2特殊物品 |

Spirit Stance 在目录中是一个带 `enabled` 参数的模板；实际候选只保留与当前状态相反、且满足条件的切换。若把开启/关闭作为两项，目录会变成89条；此处统一采用88模板口径。

这个数目不是单回合候选数。Attack 对每个活着的怪物生成一个候选，敌方定向法术通常也要按主目标展开；同一种物品则绑定实际槽位。之后按当前解锁、资源、冷却、页面状态过滤。物理上可执行与策略上值得执行需要分开，例如对没有流血的敌人使用 Merciful Blow 可能仍合法，只是不满足斩杀收益条件。

完整模板数也不是永久不变的游戏规范；当前版本尚未实测的新动作应作为未知条目收集，不能静默丢弃。

## 已从你的页面样本提取的数据

| 历史文件 | 动作/菜单控件记录 | 怪物槽 | 物品槽（含空槽） |
| --- | ---: | ---: | ---: |
| [startBattle.html](startBattle.html) | 42 | 4 | 8 |
| [nextTurnBattle.html](nextTurnBattle.html) | 40 | 3 | 8 |
| [battle1.html](battle1.html) | 41 | 2 | 8 |

共123条控件记录，对应目录中42个不同动作有历史DOM证据；另有技能书/物品菜单控件，不计入语义动作。文件含 `090c` 静态资源路径，只作为版本线索，无法代替准确捕获时间。文件名不证明它们是连续回合，因此不能直接把血量差归因于某个动作。

具体观察：

- `startBattle.html` 中三个单手技能保留tooltip，但无onclick且有 `opacity:0.5`；另一份样本中同ID控件有onclick。因此“出现在技能书”与“当时可以施放”需要分别记录。
- `nextTurnBattle.html` 的 Health Draught、Mana Draught 仍显示名称，却没有 `ikey_*` 控件和点击处理。只查询 `[id^=ikey_]` 会丢失这些不可用物品。数据同时保留完整物品槽；其不可用原因及剩余CD没有足够证据，填null。
- 同一法术的动态费用可从tooltip参数取得。例如首份样本 Cure 显示47 MP、2 turns CD；这仅属于该历史快照。Tooltip 的CD是展示的冷却时长，不自动等于当前剩余CD。
- [hvc.js](hvc.js) 的 `set_infopane_spell` 表明第4个参数是Magic Points，第5个是Charge计数，第6个是CD。Charge不是Spirit Points，也不能直接当作百分比OC；换算要用当前客户端确认。
- 所有实际执行ID都保留出处。31种物品的历史类型ID来自 [itemc.js](itemc.js)；类型ID与 `ikey_1` 的槽位1是不同概念。没有观察到的技能ID保留空数组，未用规律猜数字。

抽取仅保存上述相关数据，不复制页面中的会话令牌、cookie或完整内联脚本。

## 交给决策模型的候选形态

建议把模板实例化成以下结构。示例绑定首份历史HTML中的控件，不表示当前浏览器可执行，`observationId` 必须由运行时产生：

```json
{
  "observationId": "historical-startBattle-example",
  "candidates": [
    { "id": "a1", "catalogId": "basic.attack", "targetSlot": 1 },
    { "id": "a2", "catalogId": "basic.attack", "targetSlot": 2 },
    { "id": "a3", "catalogId": "spell.cure", "target": "self", "observedManaCost": 47 },
    { "id": "a4", "catalogId": "item.health_draught", "itemSlot": "1" }
  ]
}
```

这只展示绑定格式，没有穷举该快照全部动作。代码保存候选ID到客户端操作的映射；Jev读取状态、动作含义和已知后果，只返回候选ID。执行前重新检查观察版本、资源、目标存活和控件状态。

范围法术必须分开表达“选中的主目标”和“实际受影响的集合”。即便法术命中全体，也需先验证客户端是否要求主目标、主目标是否改变命中或收益，再决定是否去重。不能仅凭Wiki写着AOE就把目标参数删除。

## 需要带进后续实现的差异

1. 当前 Wiki 名称 Immobilize 对应旧 MagNet；Backstab、Frenzied Blows、Full-Cure、Bubble Gum 等需要显式别名。目录中的 Bubble-Gum 与空格写法按别名对应，显示时优先当前客户端。
2. 旧技能枚举漏 Skyward Sword / Niten Ichiryu。具体效果随版本变化，应读取当前资料并实测。
3. Focus 用于集中施法及资源恢复，有防御代价；旧提示词中“集中攻击一只怪物”的描述不应保留。
4. 技能书、物品菜单、快捷栏和Recast是操作入口或已有动作的别名；被动反击、连击、Cloak of the Fallen、Channeling等是效果或事件。它们不额外计入可选动作。
5. 物品、普通行动、姿态切换的时间语义不同；依据 [Action Speed](https://ehwiki.org/wiki/Action_Speed)，物品不推进time units，但会推进其他物品的CD。应分别建模时间推进、技能法术CD、物品CD，实测未知项继续保留未知。
6. Defend回血、Focus惩罚时机、Weaken强化费用和Channeling费用存在资料冲突，详见Wiki参考。未经实测不写死。

## 实机采集进度与下一步

早先连接失败已通过直接导航至 https://hentaiverse.org/ 解决。当前页面显示 Persistent、Stamina 99、Nintendo 难度，静态资源路径为 `091c`。装备页各可装备位置显示为空；未开战、未消耗物品、未变更角色配置。

当前普通战斗物品槽为 Health Draught、Mana Draught、Mana Elixir、Scroll of Protection、Scroll of Absorption；另有空的S1和N1。库存数量不等于战斗候选数量，必须以当场装备槽和战斗控件为准。能力tooltip也会改变法术费用、持续时间和恢复量，已单独保存。

后续仍需从战斗页采集技能书与可用控件，再对基础动作采集前后状态。每次只执行一个动作并等待结果：记录HP/MP/SP/OC、效果期限、技能/物品CD、目标槽、日志增量以及动作确认。当前采集只是非战斗页面证据，不能证明某一动作在战斗中可执行或已验证其效果。
