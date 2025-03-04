function api_call(h, f, b) {
    h.open("POST", MAIN_URL + "json");
    h.setRequestHeader("Content-Type", "application/json");
    h.withCredentials = !0;
    h.onreadystatechange = b;
    h.send(JSON.stringify(f));
}
function api_response(h) {
    if (4 == h.readyState)
        if (200 == h.status)
            if (((h = JSON.parse(h.responseText)), void 0 != h.login))
                top.location.href = login_url;
            else return h;
        else
            alert(
                "Server communication failed: " +
                    h.status +
                    " (" +
                    h.responseText +
                    ")"
            ),
                (document.location += "");
    return !1;
}
var e = function (h) {
    return document.getElementById(h);
};
function Common() {
    function h(a, g, l) {
        a = a.getElementsByTagName("DIV");
        g = ["f2l" + g, "f2r" + g, "f4l" + g, "f4r" + g];
        var v = ["f2l" + l, "f2r" + l, "f4l" + l, "f4r" + l];
        l = "a" == l ? "#0030CB" : "#5C0D11";
        for (var u = 0; u < a.length; u++)
            for (var w = 0; w < g.length; w++)
                (a[u].className = a[u].className.replace(g[w], v[w])),
                    (a[u].style.color = l);
    }
    this.goto_arena = function () {
        document.location = MAIN_URL + "?s=Battle&ss=ar";
    };
    this.goto_ring = function () {
        document.location = MAIN_URL + "?s=Battle&ss=rb";
    };
    this.goto_grindfest = function () {
        document.location = MAIN_URL + "?s=Battle&ss=gr";
    };
    this.goto_tower = function () {
        document.location = MAIN_URL + "?s=Battle&ss=tw";
    };
    this.goto_itemworld = function () {
        document.location = MAIN_URL + "?s=Battle&ss=iw";
    };
    this.findPos = function (a) {
        var g = 0,
            l = 0;
        if (a.offsetParent) {
            do (g += a.offsetLeft), (l += a.offsetTop);
            while ((a = a.offsetParent));
        }
        return [g, l];
    };
    this.findPosWithScroll = function (a) {
        var g = 0,
            l = 0;
        if (a.offsetParent) {
            do
                (g += a.offsetLeft + (a.scrollLeft ? a.scrollLeft : 0)),
                    (l += a.offsetTop + (a.scrollTop ? a.scrollTop : 0));
            while ((a = a.offsetParent));
        }
        return [g, l];
    };
    this.findScrollOffset = function (a) {
        var g = 0,
            l = 0;
        if (a.offsetParent) {
            do
                (g += a.scrollLeft ? a.scrollLeft : 0),
                    (l += a.scrollTop ? a.scrollTop : 0);
            while ((a = a.offsetParent));
        }
        return [g, l];
    };
    this.getCursorPosition = function (a) {
        a = a || window.event;
        var g = { x: 0, y: 0 };
        if (a.pageX || a.pageY) (g.x = a.pageX), (g.y = a.pageY);
        else {
            var l = document.documentElement,
                v = document.body;
            g.x =
                a.clientX +
                (l.scrollLeft || v.scrollLeft) -
                (l.clientLeft || 0);
            g.y = a.clientY + (l.scrollTop || v.scrollTop) - (l.clientTop || 0);
        }
        return g;
    };
    this.decimalround = function (a, g) {
        return Math.round(a * Math.pow(10, g)) / Math.pow(10, g);
    };
    this.suppress_popups = !1;
    this.show_popup_box = function (a, g, l, v, u, w, B, D, H, F) {
        if (!this.suppress_popups) {
            var G = e("popup_box"),
                J = [0, 0],
                I = [0, 0],
                L = 0;
            void 0 != w &&
                ((L = w.offsetWidth),
                (J = common.findPosWithScroll(w)),
                "" != u &&
                    ((u = e(u)), (I[0] = u.scrollLeft), (I[1] = u.scrollTop)));
            G.style.left =
                ("right" == B ? J[0] - I[0] + L + a : J[0] - I[0] - a - l) +
                "px";
            G.style.top = J[1] - I[1] + g + "px";
            G.style.width = l + "px";
            G.style.height = v + "px";
            G.innerHTML =
                "<div>" + D + "</div><div>" + H + "</div><div>" + F + "</div>";
            G.style.visibility = "visible";
        }
    };
    this.hide_popup_box = function () {
        e("popup_box").removeAttribute("style");
    };
    this.show_itemc_box = function (a, g, l, v, u, w) {
        this.show_popup_box(
            a,
            g,
            398,
            75,
            l,
            v,
            u,
            dynjs_itemc[w].n,
            dynjs_itemc[w].q,
            "Consumable"
        );
    };
    this.show_itemr_box = function (a, g, l, v, u, w, B, D) {
        this.show_popup_box(a, g, 398, 75, l, v, u, w, B, D);
    };
    var f = void 0,
        b = 0,
        k = 0,
        m = 0,
        t = function () {
            var a = f.scrollTop;
            f.scrollTop =
                0 < b
                    ? Math.min(f.scrollTop + m, k)
                    : Math.max(f.scrollTop - m, k);
            a != f.scrollTop ? setTimeout(t, 1) : ((f = void 0), (k = b = 0));
        };
    this.scrollpane_up = function (a, g, l) {
        void 0 == f &&
            ((f = e(a)),
            (b = -1),
            (k = Math.max(0, f.scrollTop - g)),
            (m = void 0 != l ? 1e3 : 25),
            t());
    };
    this.scrollpane_down = function (a, g, l) {
        void 0 == f &&
            ((f = e(a)),
            (b = 1),
            (k = f.scrollTop + g),
            (m = void 0 != l ? 1e3 : 25),
            t());
    };
    this.hookEvent = function (a, g, l) {
        "string" == typeof a && (a = e(a));
        null != a &&
            (a.addEventListener
                ? ("mousewheel" == g &&
                      a.addEventListener("DOMMouseScroll", l, !1),
                  a.addEventListener(g, l, !1))
                : a.attachEvent && a.attachEvent("on" + g, l));
    };
    this.unhookEvent = function (a, g, l) {
        "string" == typeof a && (a = e(a));
        null != a &&
            (a.removeEventListener
                ? ("mousewheel" == g &&
                      a.removeEventListener("DOMMouseScroll", l, !1),
                  a.removeEventListener(g, l, !1))
                : a.detachEvent && a.detachEvent("on" + g, l));
    };
    this.cancelEvent = function (a) {
        a = a ? a : window.event;
        a.stopPropagation && a.stopPropagation();
        a.preventDefault && a.preventDefault();
        a.cancelBubble = !0;
        a.cancel = !0;
        return (a.returnValue = !1);
    };
    this.number_format = function (a) {
        x = (a + "").split(".");
        x1 = x[0];
        x2 = 1 < x.length ? "." + x[1] : "";
        for (a = /(\d+)(\d{3})/; a.test(x1); ) x1 = x1.replace(a, "$1,$2");
        return x1 + x2;
    };
    var r = [
        9, 5, 10, 10, 10, 10, 10, 10, 9, 9, 4, 4, 5, 10, 11, 8, 8, 8, 11, 11, 4,
        4, 4,
    ];
    this.get_dynamic_digit_string = function (a) {
        a = this.number_format(a);
        for (var g = "", l = 0, v = a.length - 1; 0 <= v; v--) {
            var u =
                "," == a.charAt(v)
                    ? 11
                    : "." == a.charAt(v)
                      ? 10
                      : "+" == a.charAt(v)
                        ? 15
                        : ":" == a.charAt(v)
                          ? 22
                          : "-" == a.charAt(v)
                            ? 16
                            : parseInt(a.charAt(v));
            g =
                g +
                '<div style="float:right; height:12px; width:' +
                (r[u] + 1) +
                "px; background:transparent url(" +
                IMG_URL +
                "font/12b.png) 0px -" +
                12 * u +
                'px"></div>';
            l += r[u];
        }
        return (
            '<div style="position:relative; display:inline; height:12px; width:' +
            l +
            'px">' +
            g +
            "</div>"
        );
    };
    this.apply_select = function (a) {
        h(a, "b", "a");
        a.style.color = "#0030CB";
    };
    this.apply_unselect = function (a) {
        h(a, "a", "b");
        a.removeAttribute("style");
    };
    var q = void 0;
    this.text_select = function (a) {
        var g = q != a;
        this.text_unselect();
        g && (this.apply_select(a), (q = a));
    };
    this.text_unselect = function () {
        void 0 != q && (this.apply_unselect(q), (q = void 0));
    };
}
var common = new Common();
function EquipShop() {
    var h = void 0,
        f = 0,
        b = 0,
        k = e("sum_field"),
        m = e("accept_button"),
        t = new MultiSelector(!1, !0);
    this.set_equip = function (r, q, a) {
        q = t.select(r, q, a);
        h = q.group;
        q.reset && (f = 0);
        r = eqvalue[r.id.replace(/^e/, "")];
        1 == q.selected ? (f += r) : -1 == q.selected && (f -= r);
        b = q.count;
        k.innerHTML = common.get_dynamic_digit_string(f);
        0 < q.count && ("shop_pane" != h || f <= current_credits)
            ? ((m.style.cursor = "pointer"),
              (m.onclick = this.commit_transaction),
              (m.src = IMG_URL + "shops/accept.png"))
            : m.onclick &&
              (m.removeAttribute("style"),
              m.removeAttribute("onclick"),
              (m.src = IMG_URL + "shops/accept_d.png"));
    };
    this.select_all = function (r) {
        var q = { shiftKey: !0, ctrlKey: !0 };
        for (i in rangeselect[r]) {
            var a = rangeselect[r][i];
            this.set_equip(e("e" + a), q, r, eqvalue[a]);
        }
    };
    this.commit_transaction = function () {
        confirm(
            "Are you sure you wish to " +
                ("shop_pane" == h ? "purchase" : "sell") +
                " " +
                b +
                " equipment piece" +
                (1 < b ? "s" : "") +
                " for " +
                common.number_format(f) +
                " credits?"
        ) &&
            (t.populate_list("select_eids"),
            (e("select_group").value = h),
            e("shopform").submit());
    };
}
function ItemShop() {
    function h() {
        q = !0;
        1 > b || 1 > k
            ? (q = !1)
            : "shop_pane" == f && k * t > current_credits && (q = !1);
        e("accept_button").src =
            IMG_URL + "shops/accept" + (q ? "" : "_d") + ".png";
        e("cost_field").value = t;
        e("sum_field").value = (k * t).toLocaleString("en");
    }
    var f = void 0,
        b = 0,
        k = 0,
        m = void 0,
        t = 0,
        r = 0,
        q = !1;
    this.set_item = function (a, g, l, v, u) {
        g == b && a == f && ((a = void 0), (v = l = g = 0), (u = void 0));
        f = a;
        b = g;
        t = v;
        m = g && !u ? dynjs_itemc[g].n : u;
        r = l;
        this.set_count(0 < g ? 1 : 0);
        h();
    };
    this.set_count = function (a) {
        k = Math.max(0, Math.min(a, r));
        e("count_field").value = k;
        h();
    };
    this.increase_count = function (a) {
        this.set_count(1 == k && 1 < a ? a : k + a);
    };
    this.read_count = function () {
        k = Math.max(0, parseInt(e("count_field").value));
        0 < b && k > r && this.set_count(r);
        h();
    };
    this.commit_transaction = function () {
        q &&
            confirm(
                "Are you sure you wish to " +
                    ("shop_pane" == f ? "purchase" : "sell") +
                    " " +
                    k +
                    ' "' +
                    m.replace("&#039;", "'") +
                    '" for ' +
                    common.number_format(k * t) +
                    " credits ?"
            ) &&
            ((e("select_mode").value = f),
            (e("select_item").value = b),
            (e("select_count").value = k),
            e("shopform").submit());
    };
}
function Forge(h) {
    var f = 0,
        b = !1;
    this.set_forge_equip = function (m, t) {
        if (h || "1" != m.getAttribute("data-locked")) {
            common.text_select(m);
            t == f && (t = 0);
            f = t;
            b = !0;
            b = 1 > f ? !1 : !0;
            m = e("upgrade_button");
            t = e("enchant_button");
            var r = e("salvage_button"),
                q = e("reforge_button"),
                a = e("repair_button"),
                g = e("soulfuse_button");
            void 0 != m &&
                (m.src =
                    IMG_URL + "shops/showupgrades" + (b ? "" : "_d") + ".png");
            void 0 != t &&
                (t.src =
                    IMG_URL + "shops/showenchants" + (b ? "" : "_d") + ".png");
            void 0 != r &&
                (r.src = IMG_URL + "shops/salvage" + (b ? "" : "_d") + ".png");
            void 0 != q &&
                (q.src = IMG_URL + "shops/reforge" + (b ? "" : "_d") + ".png");
            void 0 != a &&
                (a.src = IMG_URL + "shops/repair" + (b ? "" : "_d") + ".png");
            void 0 != g &&
                (g.src = IMG_URL + "shops/soulfuse" + (b ? "" : "_d") + ".png");
        }
    };
    var k = 0;
    this.set_forge_cost = function (m, t) {
        var r = e("forge_cost_div");
        m == k
            ? ((r.innerHTML =
                  "undefined" !== typeof default_forge_cost_text
                      ? default_forge_cost_text
                      : ""),
              (k = 0))
            : ((r.innerHTML = t), (k = m));
    };
    this.commit_transaction = function () {
        b
            ? ((e("select_item").value = f), e("shopform").submit())
            : alert("No item selected");
    };
}
function Snowflake() {
    var h = e("shrine_info"),
        f = e("shrine_artifact"),
        b = e("shrine_trophy"),
        k = e("shrine_collectible"),
        m = e("shrine_offertext"),
        t = 0,
        r = 0,
        q = 0,
        a = "",
        g = "",
        l = void 0,
        v = !1;
    this.set_shrine_item = function (u, w, B, D) {
        u == t && ((B = w = u = 0), (D = void 0));
        t = u;
        r = w;
        q = B;
        l = D;
        v = !0;
        u = 0;
        1 > t
            ? ((e("accept_equip").style.display = "none"), (v = !1), (u = 1))
            : 2e4 <= t && 3e4 > t
              ? ((v = !0), (u = 2))
              : 3e4 <= t && 4e4 > t
                ? ((v = q <= r), (u = 3))
                : 7e4 <= t && 8e4 > t && ((v = !0), (u = 4));
        if (3 == u)
            for (
                e("accept_equip").style.display = "",
                    e("accept_reward").style.display = "none",
                    w = e("accept_equip").querySelectorAll(".accept_equip"),
                    B = 0;
                B < w.length;
                B++
            )
                w[B].disabled = v ? "" : "disabled";
        else
            (e("accept_equip").style.display = "none"),
                (e("accept_reward").style.display = 1 < u ? "" : "none"),
                (e("accept_reward").disabled = v ? "" : "disabled");
        h.style.display = 1 == u ? "" : "none";
        f.style.display = 2 == u ? "" : "none";
        b.style.display = 3 == u ? "" : "none";
        k.style.display = 4 == u ? "" : "none";
        m.innerHTML =
            0 == t
                ? ""
                : q > r
                  ? "You have " +
                    r +
                    " / " +
                    q +
                    " items required for this offering."
                  : "Offer " + q + "x " + l + " for :";
    };
    this.submit_shrine_reward = function (u, w) {
        a = u;
        g = w;
        this.commit_transaction();
    };
    this.commit_transaction = function () {
        v &&
            confirm(
                "Are you sure you wish to offer Snowflake " +
                    (1 < q ? q + "x" : "a") +
                    " " +
                    l.replace("&#039;", "'") +
                    " ?"
            ) &&
            ((e("select_item").value = t),
            (e("select_reward_type").value = a),
            (e("select_reward_slot").value = g),
            e("shopform").submit());
    };
}
function MoogleMail() {
    var h = 0,
        f = void 0;
    this.set_mooglemail_item = function (b, k) {
        if (void 0 == k || "1" != k.getAttribute("data-locked"))
            b == h && (b = 0),
                0 == b
                    ? (common.text_unselect(), (h = 0))
                    : (void 0 != k && common.text_select(k),
                      (h = b),
                      "equip" == f && this.apply_attachment());
    };
    this.set_mooglemail_pane = function (b) {
        this.set_mooglemail_item(0);
        f = f == b ? void 0 : b;
        e("mmail_attachinfo").style.display = void 0 == f ? "" : "none";
        e("mmail_attachitem").style.display = "item" == f ? "" : "none";
        e("mmail_attachequip").style.display = "equip" == f ? "" : "none";
        e("mmail_attachcredits").style.display = "credits" == f ? "" : "none";
        e("mmail_attachhath").style.display = "hath" == f ? "" : "none";
    };
    this.apply_attachment = function () {
        if (void 0 != f) {
            var b =
                "equip" == f ? 1 : Math.max(1, parseInt(e("count_" + f).value));
            0 < b &&
                ((e("action").value = "attach_add"),
                (e("select_item").value = h),
                (e("select_count").value = b),
                (e("select_pane").value = f),
                e("mailform").submit());
        }
    };
    this.check_apply_attachment = function (b) {
        13 == b.keyCode && this.apply_attachment();
    };
    this.mmail_send = function () {
        var b = "";
        0 < attach_count &&
            (b =
                "You have attached " +
                attach_count +
                (1 == attach_count ? " item" : " items") +
                (0 < attach_cod
                    ? ", and the CoD is set to " +
                      attach_cod +
                      " credits, kupo!"
                    : ", but you have not set a CoD, kupo! The attachments will be a gift, kupo!"));
        0 < send_cost &&
            (b += " Sending it will cost you " + send_cost + " credits, kupo!");
        confirm(b + " Are you sure you wish to send this message, kupo?") &&
            ((e("action").value = "send"), e("mailform").submit());
    };
    this.mmail_save = function () {
        e("action").value = "save";
        e("mailform").submit();
    };
    this.mmail_discard = function () {
        confirm("Are you sure you wish to discard this message, kupo?") &&
            ((e("action").value = "discard"), e("mailform").submit());
    };
    this.remove_attachment = function (b) {
        (0 < mail_state &&
            0 < attach_cod &&
            !confirm(
                "Removing the attachments will deduct " +
                    attach_cod +
                    " Credits from your account, kupo! Are you sure?"
            )) ||
            ((e("action").value = "attach_remove"),
            (e("action_value").value = b),
            e("mailform").submit());
    };
    this.return_mail = function () {
        confirm(
            "This will return the message to the sender, kupo! Are you sure?"
        ) && ((e("action").value = "return_message"), e("mailform").submit());
    };
    this.check_set_cod = function (b) {
        13 == b.keyCode && this.set_cod();
    };
    this.set_cod = function () {
        e("action").value = "attach_cod";
        e("action_value").value = Math.max(0, parseInt(e("newcod").value));
        e("mailform").submit();
    };
}
function Equips() {
    var h = 0,
        f = void 0;
    this.set = function (b, k, m, t) {
        var r =
            "undefined" == typeof dynjs_eqstore ||
            "undefined" == typeof dynjs_eqstore[b]
                ? dynjs_equip
                : dynjs_eqstore;
        h = b;
        f = r[b].k;
        common.show_popup_box(
            m,
            t,
            360,
            320,
            k,
            void 0,
            "right",
            r[b].t,
            r[b].d,
            ""
        );
    };
    this.unset = function () {
        h = 0;
        f = void 0;
        common.hide_popup_box();
    };
    this.pop_equipwindow = function () {
        return 0 < h
            ? (window.open(
                  MAIN_URL + "equip/" + h + "/" + f,
                  "_pu" + (Math.random() + "").replace(/0\./, ""),
                  "toolbar=0,scrollbars=0,location=0,statusbar=0,menubar=0,resizable=0,width=450,height=520,left=" +
                      (screen.width - 450) / 2 +
                      ",top=" +
                      (screen.height - 520) / 2
              ),
              !0)
            : !1;
    };
    this.lock = function (b, k) {
        var m = new XMLHttpRequest();
        api_call(
            m,
            {
                type: "simple",
                method: "lockequip",
                uid,
                token: simple_token,
                eid: b,
                lock: "il" == k.className ? 0 : 1,
            },
            function () {
                var t = api_response(m);
                if (0 != t && void 0 != t.eid) {
                    k.className = t.locked ? "il" : "iu";
                    var r = e("e" + b),
                        q = r.getAttribute("data-locked");
                    if (q) {
                        if ("0" === q && r.getAttribute("style") && r.onclick)
                            r.onclick();
                        r.setAttribute("data-locked", t.locked);
                    }
                }
            }
        );
    };
    document.onkeypress = function (b) {
        b.shiftKey ||
            b.altKey ||
            ("c" == String.fromCharCode(window.event ? b.keyCode : b.which) &&
                equips.pop_equipwindow() &&
                common.cancelEvent(b));
    };
}
function MultiSelector(h, f) {
    var b = void 0,
        k = {},
        m = 0,
        t = !1,
        r = void 0;
    this.select = function (q, a, g) {
        var l = q.id.replace(/^e/, ""),
            v = 0,
            u = !1;
        if (h || "1" != q.getAttribute("data-locked")) {
            v = 1;
            t || (a && a.shiftKey) || (this.unselect(l) && (v = -1));
            if (1 == v) {
                void 0 != g &&
                    (g != b
                        ? (u = !0)
                        : !f || !a || t || a.shiftKey || a.ctrlKey || (u = !0));
                u && this.unselect_all();
                b = g;
                if (
                    !t &&
                    a &&
                    a.shiftKey &&
                    void 0 != r &&
                    void 0 != g &&
                    r != l &&
                    "undefined" != typeof rangeselect
                ) {
                    a = !1;
                    t = !0;
                    for (i in rangeselect[g]) {
                        var w = rangeselect[g][i];
                        if (w == l || w == r) a = !a;
                        else if (a && (w = e("e" + w)) && w.onclick)
                            w.onclick();
                    }
                    t = !1;
                }
                "undefined" == typeof k[l]
                    ? ((k[l] = q), common.apply_select(q), ++m)
                    : (v = 0);
            }
            t || (r = l);
        }
        return { key: l, selected: v, group: b, count: m, reset: u };
    };
    this.unselect = function (q) {
        return "undefined" != typeof k[q]
            ? (--m, common.apply_unselect(k[q]), delete k[q], !0)
            : !1;
    };
    this.unselect_all = function () {
        var q = Object.keys(k),
            a;
        for (a in q) this.unselect(q[a]);
        r = b = void 0;
        m = 0;
    };
    this.populate_list = function (q, a) {
        void 0 == a && (a = ",");
        e(q).value = Object.keys(k).join(a);
    };
    this.populate_group = function (q) {
        e(q).value = b;
    };
}
function Training() {
    this.start_training = function (k) {
        e("start_train").value = k;
        e("trainform").submit();
    };
    this.cancel_training = function () {
        e("cancel_train").value = 1;
        e("trainform").submit();
    };
    var h = e("train_progbar"),
        f = e("train_progcnt");
    if ("undefined" != typeof reload_to)
        var b = setInterval(function () {
            var k = Date.now() / 1e3 + time_skew,
                m =
                    k < end_time
                        ? (m = 100 - (100 * (end_time - k)) / total_time)
                        : 100,
                t = Math.floor(m),
                r = Math.floor(100 * (m - t));
            f.innerHTML = t + "." + (10 > r ? "0" : "") + r;
            h.style.width = 4 * m + "px";
            k >= end_time &&
                ((document.location = reload_to), clearInterval(b));
        }, ticktime);
}
function ItemSelector() {
    var h = 0,
        f = !1;
    this.set_item = function (m) {
        h == m ? this.commit_slot(0) : (h = m);
    };
    var b = void 0,
        k = void 0;
    this.hover_slot = function (m) {
        0 != h &&
            (void 0 != b && this.unhover_slot(),
            (common.suppress_popups = !0),
            (b = m),
            (k = m.innerHTML),
            (m.innerHTML = dynjs_itemc[h].n),
            (m.className = "ss"));
    };
    this.unhover_slot = function () {
        void 0 != b &&
            ((b.innerHTML = k),
            b.removeAttribute("class"),
            (b = void 0),
            (common.suppress_popups = !1));
    };
    this.commit_slot = function (m) {
        f ||
            ((f = !0),
            (e("slot").value = m),
            (e("item").value = h),
            e("selectionform").submit());
    };
}
function MonsterLab() {
    this.create_monster = function (h) {
        e("selected_patk").value = h;
        e("create_form").submit();
    };
}
function Battle() {
    var h = e("infopane"),
        f = [void 0, void 0],
        b = [void 0, void 0],
        k = "log",
        m = void 0,
        t = void 0,
        r = void 0,
        q = 1,
        a = 0,
        g = void 0,
        l = e("ta_monster_1"),
        v = e("ta_monster_2"),
        u = !1,
        w = function (d) {
            void 0 != h && (h.innerHTML = d);
        };
    this.set_infopane = function (d) {
        switch (d) {
            case "Attack":
                var n =
                    "Damages a single enemy. Depending on your equipped weapon, this can place certain status effects on the affected monster. To attack, click here, then click your target. Simply clicking an enemy will also perform a normal attack.";
                break;
            case "Skillbook":
                n =
                    "Use special skills and magic. To use offensive spells and skills, first click it, then click your target. To use it on yourself, click it twice.";
                break;
            case "Items":
                n =
                    "Use various consumable items that can replenish your vitals or augment your power in various ways.";
                break;
            case "Spirit":
                n = "Toggle Spirit Channeling.";
                break;
            case "Defend":
                n = "Increases your defensive capabilities for the next turn.";
                break;
            case "Focus":
                n =
                    "Reduces the chance that your next spell will be resisted. Your defenses and evade chances are lowered for the next turn.";
                break;
            default:
                n =
                    "Choose from the Battle Actions highlighted above, and use them to defeat your enemies listed to the right. When all enemies are reduced to zero Health, you win. If your Health reaches zero, you are defeated.";
        }
        w('<div class="btii">' + d + "</div><div>" + n + "</div>");
    };
    this.set_infopane_spell = function (d, n, y, z, C, A) {
        var E = "";
        if (0 < z || 0 < C)
            (E = "Requires "),
                0 < z && (E += z + " Magic Points"),
                0 < z && 0 < C && (E += z + " and "),
                0 < C && (E += C + " Charge" + (1 == C ? "" : "s")),
                (E += " to use.");
        0 < A && (E += " Cooldown: " + A + " turns.");
        w(
            '<div class="btii">' +
                d +
                '</div><div style="position:relative"><div style="float:left; width:601px"><div style="padding-bottom:3px; padding-right:3px">' +
                n +
                '</div><div><span style="font-weight:bold">' +
                E +
                '</span></div></div><div style="float:left; width:32px; height:32px; position:relative"><img src="' +
                IMG_URL +
                "a/" +
                y +
                '.png" style="border:0px; margin:0px; padding:0px; position:absolute; left:3px; top:4px; z-index:3" /><img src="' +
                IMG_URL +
                'ab/b.png" style="border:0px; margin:0px; padding:0px; position:absolute; left:-5px; top:-4px; z-index:3" /></div></div>'
        );
    };
    this.set_infopane_effect = function (d, n, y) {
        w(
            '<div class="btii">' +
                d +
                '</div><div style="padding-bottom:3px">' +
                n +
                '</div><div><span style="font-weight:bold">' +
                ("autocast" == y
                    ? "Expires if magic is depleted to below 10%"
                    : "permanent" == y
                      ? "Permanent until triggered"
                      : "Expires in " + y + " turn" + (1 == y ? "" : "s")) +
                ".</span></div>"
        );
    };
    this.set_infopane_item = function (d) {
        w(
            '<div class="btii">' +
                dynjs_itemc[d].n +
                '</div><div style="padding-bottom:3px">' +
                dynjs_itemc[d].q +
                "</div>"
        );
    };
    this.lock_action = function (d, n, y, z) {
        if (!u)
            if (
                (b[n] == d && "skill" != y
                    ? ((f[n] = void 0), (b[n] = void 0))
                    : ((f[n] = h.innerHTML), (b[n] = d)),
                0 == n && ((f[1] = void 0), (b[1] = void 0)),
                1 == n)
            )
                m != y &&
                    (this.clear_actions(),
                    (m = y),
                    (d.src = IMG_URL + "battle/" + m + "_s.png"),
                    this.set_mode(y)),
                    this.set_selected_subaction(d, z);
            else
                switch (
                    (m == y
                        ? "skill" == y
                            ? this.set_selected_subaction(void 0)
                            : (m = void 0)
                        : (this.clear_actions(), (m = y)),
                    (d.src =
                        IMG_URL +
                        "battle/" +
                        y +
                        "_" +
                        (void 0 == m ? "n" : "s") +
                        ".png"),
                    this.set_mode(y),
                    y)
                ) {
                    case "attack":
                        this.toggle_default_pane();
                        break;
                    case "skill":
                        this.toggle_magic_pane();
                        break;
                    case "items":
                        this.toggle_item_pane();
                        break;
                    default:
                        this.touch_and_go();
                }
    };
    this.clear_actions = function () {
        if (void 0 != m) {
            if ("spirit" != m) {
                var d = "magic" == m ? "skill" : m;
                e("ckey_" + d).src = IMG_URL + "battle/" + d + "_n.png";
            }
            m = void 0;
        }
    };
    this.clear_infopane = function () {
        void 0 != f[1]
            ? w(f[1])
            : void 0 != f[0]
              ? w(f[0])
              : this.set_infopane("Battle Time");
    };
    var B = function (d) {
        e("pane_" + d).style.display = "none";
        k = void 0;
    };
    this.toggle_pane = function (d) {
        d == k
            ? this.toggle_default_pane()
            : (B(k), (e("pane_" + d).style.display = ""), (k = d));
    };
    this.toggle_default_pane = function () {
        "log" != k &&
            (B(k), (e("pane_log").style.display = ""), (k = k = "log"));
    };
    this.toggle_magic_pane = function () {
        "skill" == k
            ? this.toggle_pane("magic")
            : "magic" == k
              ? this.toggle_pane("skill")
              : this.toggle_pane(default_magic_pane);
    };
    this.toggle_skill_pane = function () {
        this.toggle_pane("skill");
    };
    this.toggle_item_pane = function () {
        this.toggle_pane("item");
    };
    var D = "attack",
        H = 0,
        F = 0;
    this.set_mode = function (d) {
        D = D == d && "magic" != d ? "attack" : d;
    };
    this.reset_skill = function () {
        F = H = 0;
        this.set_selected_subaction(void 0);
    };
    this.set_hostile_skill = function (d) {
        F = F == d ? 0 : d;
    };
    this.set_friendly_skill = function (d) {
        F == d ? ((H = 0), this.touch_and_go()) : (F = d);
    };
    this.hover_target = function (d) {
        if (void 0 == r) {
            var n = common.findPosWithScroll(d),
                y = common.findPosWithScroll(e("battle_right"));
            n[0] -= y[0];
            n[1] -= y[1];
            l.style.left = n[0] - 7 + "px";
            l.style.top = n[1] + d.offsetHeight / 2 - 3 + "px";
            v.style.left = n[0] + d.offsetWidth + 2 + "px";
            v.style.top = n[1] + d.offsetHeight / 2 - 3 + "px";
            l.style.visibility = "visible";
            v.style.visibility = "visible";
        }
    };
    this.unhover_target = function () {
        void 0 == r && (l.removeAttribute("style"), v.removeAttribute("style"));
    };
    this.commit_target = function (d) {
        u || void 0 != r || ((H = r = d), this.touch_and_go());
    };
    var G = void 0,
        J = void 0,
        I = void 0;
    this.touch_and_go = function () {
        u ||
            void 0 != g ||
            ((G = D),
            (J = H),
            (I = F),
            (g = new XMLHttpRequest()),
            api_call(
                g,
                {
                    type: "battle",
                    method: "action",
                    token: battle_token,
                    mode: D,
                    target: H,
                    skill: F,
                },
                this.process_action
            ));
    };
    this.recast = function () {
        u || void 0 == G || ((D = G), (H = J), (F = I), this.touch_and_go());
    };
    for (
        var L = 0,
            O = !1,
            M =
                "pane_completion pane_effects pane_action pane_vitals pane_quickbar table_skills table_magic pane_item pane_monster".split(
                    " "
                ),
            Q = [],
            P = 0;
        P < M.length;
        P++
    ) {
        var R = M[P];
        Q[R] = e(R);
    }
    this.process_action = function () {
        var d = api_response(g);
        if (0 != d) {
            if (void 0 != d.error) this.battle_continue();
            else if (void 0 != d.reload) this.battle_continue();
            else {
                for (var n = 0; n < M.length; n++) {
                    var y = M[n];
                    void 0 != d[y] && (Q[y].innerHTML = d[y]);
                }
                has_debug && (e("debugpane").innerHTML = d.debugpane);
                if (void 0 != d.textlog) {
                    y = e("textlog");
                    y.insertRow(0).insertCell(0).className = "tls";
                    var z = d.textlog.length;
                    for (n = 0; n < z; n++) {
                        var C = y.insertRow(0).insertCell(0);
                        C.className =
                            "tl" +
                            (void 0 != d.textlog[n].c ? d.textlog[n].c : "");
                        C.innerHTML = d.textlog[n].t;
                    }
                    for (L += z; 100 < L; ) y.deleteRow(-1), --L;
                }
                void 0 == d.pane_completion
                    ? ((e("pane_completion").innerHTML = ""), (u = !1))
                    : (u = !0);
                e("expbar").style.width = d.exp + "px";
                1234 == d.exp
                    ? ((O = !0), (e("expbar").src = IMG_URL + "bar_yellow.png"))
                    : O &&
                      ((O = !1), (e("expbar").src = IMG_URL + "bar_blue.png"));
                do_healthflash = d.healthflash;
                r = void 0;
                battle.unhover_target();
                battle.reset_skill();
                battle.set_mode("attack");
                a = 1;
                l.style.opacity = a;
                v.style.opacity = a;
                battle.toggle_default_pane();
                f[0] = void 0;
                f[1] = void 0;
                battle.clear_infopane();
                battle.clear_actions();
            }
            g = void 0;
        }
    };
    var S = !1;
    this.battle_continue = function () {
        S || ((S = !0), (document.location += ""));
    };
    this.set_selected_subaction = function (d, n) {
        void 0 == d
            ? ((t = void 0), common.text_unselect())
            : t == n
              ? this.set_selected_subaction(void 0)
              : common.text_select(d);
    };
    var N = 0;
    this.start_flash_loop = function () {
        setInterval(function () {
            a = common.decimalround(Math.min(1, Math.max(0, a + 0.07 * q)), 2);
            if (0 == a || 1 == a) q *= -1;
            void 0 != r && ((l.style.opacity = a), (v.style.opacity = a));
            do_healthflash
                ? ((N = Math.floor(80 + 150 * a)),
                  (e(vital_prefix + "vbh").style.backgroundColor =
                      "rgb(" + N + ",50,50)"))
                : 0 != N &&
                  ((e(vital_prefix + "vbh").style.backgroundColor = ""),
                  (N = 0));
            for (var d = 0, n; (n = e("effect_expire_" + ++d)); )
                n.style.opacity = 0.8 - a / 2;
        }, 20);
    };
    document.onkeydown = function (d) {
        d = d || window.event;
        if (d.target) var n = d.target;
        else d.srcElement && (n = d.srcElement);
        3 == n.nodeType && (n = n.parentNode);
        if ("INPUT" != n.tagName && "TEXTAREA" != n.tagName) {
            n = d.keyCode ? d.keyCode : d.which;
            var y = String.fromCharCode(n),
                z = void 0,
                C = void 0,
                A = -1;
            switch (n) {
                case 48:
                case 96:
                    A = 0;
                    break;
                case 49:
                case 97:
                    A = 1;
                    break;
                case 50:
                case 98:
                    A = 2;
                    break;
                case 51:
                case 99:
                    A = 3;
                    break;
                case 52:
                case 100:
                    A = 4;
                    break;
                case 53:
                case 101:
                    A = 5;
                    break;
                case 54:
                case 102:
                    A = 6;
                    break;
                case 55:
                case 103:
                    A = 7;
                    break;
                case 56:
                case 104:
                    A = 8;
                    break;
                case 57:
                case 105:
                    A = 9;
            }
            var E = !1;
            if (d.altKey) {
                if (0 <= A && 10 > A) {
                    0 == A && (A = 10);
                    E = !0;
                    var K = e("qb" + A);
                    K && (K.onmouseover(), K.onclick());
                }
            } else {
                if (13 == n || 32 == n) z = "btcp";
                else if (-1 < A) z = "mkey_" + A;
                else if ((112 <= n && 123 >= n) || "G" == y || "P" == y)
                    "item" != k && (z = "ckey_items"),
                        (C =
                            "G" == y || "P" == y
                                ? "ikey_p"
                                : d.ctrlKey
                                  ? "ikey_n" + (n - 111)
                                  : d.shiftKey
                                    ? "ikey_s" + (n - 111)
                                    : "ikey_" + (n - 111));
                else if (!d.ctrlKey && !d.shiftKey)
                    switch (y) {
                        case "Q":
                            z = "ckey_attack";
                            break;
                        case "W":
                            z = "ckey_skill";
                            break;
                        case "E":
                            z = "ckey_items";
                            break;
                        case "S":
                            z = "ckey_spirit";
                            break;
                        case "D":
                            z = "ckey_defend";
                            break;
                        case "F":
                            z = "ckey_focus";
                            break;
                        case "R":
                            z = "recast";
                    }
                if (z || C) E = !0;
                if (z)
                    if ("recast" == z) battle.recast();
                    else if ((K = e(z))) K.onclick();
                if (C && (K = e(C))) K.onclick();
            }
            if (E)
                return (
                    (d.cancelBubble = !0),
                    (d.returnValue = !1),
                    d.stopPropagation &&
                        (d.stopPropagation(), d.preventDefault()),
                    !1
                );
        }
    };
    this.clear_infopane();
    this.start_flash_loop();
    this.set_infopane("Battle Time");
}
function at_show_aux(h, f) {
    h = e(h);
    f = e(f);
    for (
        var b = "x" == f.at_position ? h.offsetWidth + 0 : 0;
        h;
        h = h.offsetParent
    )
        b += h.offsetLeft;
    f.style.position = "absolute";
    f.style.top = "27px";
    f.style.left = b + "px";
    f.style.visibility = "visible";
}
function at_show() {
    p = e(this.at_parent);
    c = e(this.at_child);
    at_show_aux(p.id, c.id);
}
function at_hide() {
    c = e(this.at_child);
    e(c.id).style.visibility = "hidden";
}
function at_click() {
    p = e(this.at_parent);
    c = e(this.at_child);
    "visible" != c.style.visibility
        ? at_show_aux(p.id, c.id)
        : (c.style.visibility = "hidden");
    return !1;
}
function at_attach(h, f, b, k, m) {
    p = e(h);
    c = e(f);
    p.at_parent = p.id;
    c.at_parent = p.id;
    p.at_child = c.id;
    c.at_child = c.id;
    p.at_position = k;
    c.at_position = k;
    c.style.position = "absolute";
    c.style.visibility = "hidden";
    switch (b) {
        case "click":
            p.onclick = at_click;
            p.onmouseout = at_hide;
            c.onmouseover = at_show;
            c.onmouseout = at_hide;
            break;
        case "hover":
            (p.onmouseover = at_show),
                (p.onmouseout = at_hide),
                (c.onmouseover = at_show),
                (c.onmouseout = at_hide);
    }
}
