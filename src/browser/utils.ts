declare let battle;
declare let M;
declare let Q;
declare let e;
declare let L;
declare let u;
declare let O;
declare let IMG_URL;
declare let do_healthflash;
declare let r;
declare let a;
declare let l;
declare let v;
declare let f;
declare let g;

export function processAction(d: any) {
    if (0 != d) {
        if (void 0 != d.error) battle.battle_continue();
        else if (void 0 != d.reload) battle.battle_continue();
        else {
            for (var n = 0; n < M.length; n++) {
                var y = M[n];
                void 0 != d[y] && (Q[y].innerHTML = d[y]);
            }
            if (void 0 != d.textlog) {
                y = e("textlog");
                y.insertRow(0).insertCell(0).className = "tls";
                var z = d.textlog.length;
                for (n = 0; n < z; n++) {
                    var C = y.insertRow(0).insertCell(0);
                    C.className =
                        "tl" + (void 0 != d.textlog[n].c ? d.textlog[n].c : "");
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
                : O && ((O = !1), (e("expbar").src = IMG_URL + "bar_blue.png"));
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
