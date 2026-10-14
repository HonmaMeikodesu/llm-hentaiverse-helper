# Hentaiverse 当前浏览器观察

采集日期：2026-10-13。直接访问用户提供的 https://hentaiverse.org/ 后成功读取已登录页面。原始结构化证据见 [hv-live-observations.json](hv-live-observations.json)，每个页面保存独立URL和时间戳。本轮只进行了导航和DOM读取。

## 当前页面事实

- 模式 Persistent；Stamina 99；难度 Nintendo。角色页引用的资源路径含 `091c`，这是客户端资源版本线索。
- 装备页 Main Hand、Helmet、Body、Hands、Legs、Feet 均显示 `(empty)`，Off Hand 显示 `(unavailable with current mainhand)`。
- 普通战斗物品槽共5个：1 Health Draught、2 Mana Draught、3 Mana Elixir、4 Scroll of Protection、5 Scroll of Absorption。S1、N1显示为空。
- 相应库存分别为107、102、7、6、5。库存中另有其他药水、灌注、卷轴等；库存存在不代表已经装备进战斗槽，也不证明当场可用。
- 竞技场页列出14个挑战入口，从 Road Less Traveled 到 To Kill a God。保存了名称、回合数、最低等级、奖励和页面入口handler；未触发 `init_battle`。
- 能力页已装备 Better Cure、Better Regen、Better Protection、Better Heartseeker 及药水强化等。保存了展示tooltip的handler字符串，没有执行这些handler或重置能力。

页面之间显示的角色等级从172、173、174、175到176变化。本轮没有主动执行战斗或升级操作，原因未验证。不得把这些页面拼成同一个原子状态，或自行将变化解释为一次动作的收益。

## 对候选生成的影响

1. 旧HTML的物品槽数及槽位内容不能写死。当前第3槽是 Mana Elixir，且普通槽只有5个；应读取每次观测中的槽位绑定。
2. 角色熟练度不等于已装备武器流派。即便一手熟练度较高，当前装备页仍显示主手为空；武器技能候选必须结合实时装备和技能书。
3. Wiki基础数值不等于角色实际数值。例如已装备 Better Cure 的tooltip给出2回合冷却；Better Protection给出30点物理及魔法减伤、30持续时间。最终仍需用战斗tooltip和结果核实。
4. 非战斗导航、角色配置及竞技场入口属于不同的决策场景，不能混进88个战斗动作模板。竞技场入口存在也不证明当前立即允许开战。

## 验证边界

已验证浏览器页面可访问、当前可见配置可采集。尚未采集当前战斗技能书、敌人、剩余冷却、动作提交结果或动作前后状态，因此目录动作的 `live_verified` 保持 false。未更改角色配置或使用物品。
