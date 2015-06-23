/**
 * かしわらゴミチェッカー version 2.1 by 柏原市 [2015.6.10]
 * 
 */

// ハッシュとクエリの削除。
(function() {
    var hash = location.hash;
    if (location.search !== "") {
        location.href = $.mobile.path.parseLocation().hrefNoSearch;
        return;
    }
    if (hash !== "") {
        $.mobile.navigate("#");
    }
})();

// Pageのキャッシュを許可。
$.mobile.page.prototype.options.domCache = true;

// Page遷移のアニメーションを設定。
$.mobile.defaultPageTransition = "none";

// jQuery readyイベント。
$(function() {
    var i;
    var appData = new gomichecker.AppData();
    var wastePage = new gomichecker.WastePage();
    var calendarPage = new gomichecker.CalendarPage();
    var stationPage = new gomichecker.StationPage();
    var $body = $("body");

    // 収集日ページのcreateイベント。
    calendarPage.$obj.page.on("pagecreate", function(e) {
        calendarPage.initPage(appData);
    });

    // 収集拠点ページのcreateイベント。
    stationPage.$obj.page.on("pagecreate", function() {
        stationPage.initPage(appData);
    });

    // 収集拠点ページへの遷移イベント
    // ページ遷移後にGoogleMapのサイズが小さくなることがある、
    // 原因が不明のため、予防策としてページの遷移イベントのたびにサイズを設定するようにした。
    $body.on("pagecontainerchange", function(e, ui) {
    	var map;
    	if (ui.toPage.attr("id") === "station-page") {
    		map = stationPage.gMap;
	    	if (map) {
	    		google.maps.event.trigger(map, "resize");
	    	}
	    }
    });
        
    // ナビメニューのタップイベントでページ遷移を行う。
    $(".navmenu").on("tap", "a", function() {
        $body.pagecontainer("change", this.hash);
        return false;
    });

    // jsonデータの取得とゴミチェッカーページの初期化。
    (function() {
        var i;
        var reqs = [];
        var dfds = [];

        // ローダーを表示
        $.mobile.loading("show", { theme: "b", textVisible: true, textonly: true, text: "読み込み中..." });

        // ajaxリクエストを作成
        reqs.push({ url: "data/waste.json", dataType: "json" });
        reqs.push({ url: "data/sort.json", dataType: "json" });
        reqs.push({ url: "data/area.json", dataType: "json" });
        reqs.push({ url: "data/calendar.json", dataType: "json" });
        reqs.push({ url: "data/station.json", dataType: "json" });

        // defferedオブジェクトを作成
        for (i = 0; i < reqs.length; i++) {
            dfds.push($.ajax(reqs[i]));
        }

        // ajaxでjsonデータを取得
        $.when.apply($, dfds).done(function() {

            // 取得したデータをAppDataオブジェクトの変数に保存
            appData.addJson("waste", dfds[0].responseJSON);
            appData.addJson("sort", dfds[1].responseJSON);
            appData.addJson("area", dfds[2].responseJSON);
            appData.addJson("calendar", dfds[3].responseJSON);
            appData.addJson("station", dfds[4].responseJSON);

            // ローカルストレージから'AppData'オブジェクトのプロパティを読み込む
            appData.loadProperty();

            // 各ページを初期化
            wastePage.initPage(appData);

            // ローダーを隠す
            $.mobile.loading("hide");

        });
    })();

});

