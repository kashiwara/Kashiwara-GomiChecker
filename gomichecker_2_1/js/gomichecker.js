/**
 * jQueryを拡張。
 * @external "jQuery.fn"
 */
(function($) {

    /**
     * listviewで任意の項目が表示されるようにスクロールするメソッド。
     * @function external:"jQuery.fn".scrollTo
     * @param {jQuery} $target 表示するオブジェクト。
     * @param {integer} margin 選択項目を表示する際の上端の余白。
     * @param {boolean} [scroll_allways = false] この値が"true"の場合は、ターゲットのオブジェクトが表示範囲内にある場合でもスクロールする。
     */
    $.fn.scrollTo = function($target, margin, scroll_allways) {
        var $scroll = this;
        var lt = $scroll.offset().top; // リストの上端の位置
        var lb = lt + $scroll.height(); // リストの下端の位置
        var it = $target.offset().top; // 項目の上端の位置
        var ib = it + $target.outerHeight(); // 項目の下端の位置
        if (typeof margin !== "number") {
            margin = 0;
        }
        if (scroll_allways) {
            $scroll.scrollTop($scroll.scrollTop() + it - lt - margin);
        } else {
            if (it < lt || ib > lb) {
                $scroll.scrollTop($scroll.scrollTop() + it - lt - margin);
            }
        }
    };

})(jQuery);

/**
 * ゴミチェッカー用クラスのパッケージ。
 * @namespace
 */
var gomichecker = {};
(function(gomichecker) {

    /**
     * @constructor
     * @classdesc アプリのデータを保持するクラス。
     */
    gomichecker.AppData = function() {
        this.localStrageKey = {areaCode : "gc_areaCode"};
        this.areaCode = null;
        this.calendarType = null;
        this._json = {};
    };

    /**
     * 地区コードのプロパティをセットするメソッド。
     * 'areaCode'と'calendarType'プロパティを設定する。
     * 引数が'NaN'や'undefined'など、false判定になる場合は'null'になる。
     * @param {integer} areaCode 地区の識別コード
     */
    gomichecker.AppData.prototype.setProperty = function(areaCode) {
        var i, area;
        var areaData = this.getJson("area");
        if (!areaCode) {
            this.areaCode = null;
            this.calendarType = null;
            localStorage.removeItem(this.localStrageKey.areaCode);
            return;
        }
        this.areaCode = areaCode;
        for (i in areaData) {
            area = areaData[i];
            if (area.code == areaCode) {
                this.calendarType = area.calendarType;
                break;
            }
        }
        localStorage.setItem(this.localStrageKey.areaCode, this.areaCode); // 地区コードをローカルストレージに保存
    };

    /**
     * ローカルストレージからプロパティを読み込むメソッド。
     */
    gomichecker.AppData.prototype.loadProperty = function() {
        var areaCode;
        try {
            areaCode = parseInt(localStorage.getItem(this.localStrageKey.areaCode)); // 値が無い場合はNaNになる
        } catch (e) {
            console.log(e);
        }
        this.setProperty(areaCode);
    };

    /**
     * 地区コードを取得するメソッド。
     * @return {integer} 'areaCode'プロパティの値。
     */
    gomichecker.AppData.prototype.getAreaCode = function() {
        return this.areaCode;
    };

    /**
     * カレンダータイプを取得するメソッド。
     * @return {string} 'calendarType'プロパティの値。
     */
    gomichecker.AppData.prototype.getCalendarType = function() {
        return this.calendarType;
    };


    /**
     * jsonデータをプロパティに保存するメソッド。
     * @param {string} key jsonデータのインデックス。
     * @param {object} data jsonデータ。
     */
    gomichecker.AppData.prototype.addJson = function(key, data) {
        this._json[key] = data;
    };

    /**
     * jsonデータを取り出すメソッド。
     * @param key {string} key jsonデータのインデックス。
     * @return {object} jsonデータ
     */
    gomichecker.AppData.prototype.getJson = function(key) {
        return this._json[key];
    };

    /**
     * 数値の範囲を保持するオブジェクト。
     * @typedef {Object} Range 数値の範囲を保持するオブジェクト。
     * @property {integer} min 最小値、範囲がない場合は'NaN'。
     * @property {integer} max 最大値、範囲がない場合は'NaN'。
     */

    /**
     * 日付の範囲を保持するオブジェクト。
     * @typedef {Object} DateMatcherPattern
     * @property {Range} yearRange 年の範囲。
     * @property {Range} monthRange 月の範囲。
     * @property {Range} dateRange 日付の範囲。
     * @property {integer} dayIndex 曜日のインデックス、'0'が日曜日。
     */

    /**
     * 引数を指定した場合は'setPattern()'メソッドを呼び出す。
     * {@link DateMatcher#setPattern}
     * @constructor
     * @class 日付が任意の範囲内に含まれるかを判定するクラス。
     * @param {string} [ptn] パターンの文字列。
     */
    gomichecker.DateMatcher = function(ptn) {
        this._matches = [];
        this._exceptions = [];
        this._dayString = ["sum", "mon", "tue", "wed", "thu", "fri", "sat"];
        if (ptn) {
            this.setPattern(ptn);
        }
    };

    /**
     * 文字列を数値の範囲配列に変換するメソッド。
     * @param {string} rangeText 範囲を示すテキスト。'1-10'のようにハイフンで連結された数値。
     * @return {Range} 範囲の指定がない場合は共に値は'NaN'。
     */
    gomichecker.DateMatcher.prototype._getRange = function(rangeText) {
        var strs = rangeText.split("-");
        var rng = {};
        // parseIntは数値以外の場合は'NaN'を返す
        rng.min = parseInt(strs[0]);
        rng.max = parseInt(strs[1]) || rng.min;
        return rng;
    };

    /**
     * 任意の日付範囲のうち、指定した週の取りうる範囲を取得するメソッド。
     * @param {Range} range 日付の範囲。
     * @param {integer} week 何週目かを示す整数。
     * @return {Range} 取りうる日付の範囲。引数'week'がない場合は引数'range'をそのまま返す。
     */
    gomichecker.DateMatcher.prototype._getDateRangeInWeek = function(range, week) {
        var defRng, weekRng, fixRng = {};
        if (!week) {
            return range;
        }
        defRng = {min: range.min || 1, max: range.max || 31}; // 範囲の指定がない場合は日付の最大値を'31'とする
        weekRng = {min: week * 7 - 6, max: week * 7};
        fixRng.min = (defRng.min > weekRng.min)? defRng.min: weekRng.min;
        fixRng.max = (defRng.max < weekRng.max)? defRng.max: weekRng.max;
        return fixRng;
    };

    /**
     * 曜日の文字列からインデックスを取得するメソッド。
     * @param {string} dayStr 曜日のアルファベット文字列、大文字小文字は区別しない。
     * @return {integer} 0-6。'0'が日曜日。曜日の文字列と一致しない場合はNaNを返す。
     */
    gomichecker.DateMatcher.prototype._getDayIndex = function(dayStr) {
        var dayStrs = ["sum", "mon", "tue", "wed", "thu", "fri", "sat"];
        var dayIndex = dayStrs.indexOf(dayStr.toLowerCase());
        return (dayIndex === -1)? NaN: dayIndex;
    };

    /**
     * 比較パターンをセットするメソッド。
     * @param {string} patternText 比較パターンの文字列。
     */
    gomichecker.DateMatcher.prototype.setPattern = function(patternText) {
        var patternStrings, p, ptnStr, isExc, partStrs;
        var dayParts, d, dayPart, week;
        var yearRng, monthRng, dateRng, ptn;

        // パターン文字列を分解してパターンオブジェクトを作成する。
        patternStrs = patternText.split(/\s*,\s*/);
        for (p in patternStrs) {
            ptnStr = patternStrs[p];
            isExc = Boolean(ptnStr.match(/^not/i)); // 一致条件か例外条件かを判定
            ptnStr = ptnStr.replace(/^not\s*|\)$/g, ""); // いらない文字を削除
            partStrs = ptnStr.split(/[\/\(]/); // 年、月、日、曜日に分解

            // 文字列から範囲を取得する。
            yearRng = this._getRange(partStrs[0]);
            monthRng = this._getRange(partStrs[1]);
            dateRng = this._getRange(partStrs[2]);
            dayParts = (partStrs[3])? partStrs[3].split("|"): ["all"]; // 曜日が指定されていない場合は文字列"all"を代入

            // パターンオブジェクトを作成してプロパティに追加する。
            for (d = 0; d < dayParts.length; d++) {
                dayPart = dayParts[d];
                week = dayPart.match(/^\d/); // 何週目かを表す数値を取得（1文字目が数値でない場合は'null'が返る）
                ptn = {
                    yearRange: yearRng,
                    monthRange: monthRng,
                    dateRange: this._getDateRangeInWeek(dateRng, week), // 何週目か指定されている場合は日付の範囲を修正
                    dayIndex: this._getDayIndex(dayPart.match(/[a-z]{3}$/i)[0]) // 曜日が指定されていない場合はNaN
                };
                if (!isExc) {
                    this._matches.push(ptn); // 一致条件を追加
                } else {
                    this._exceptions.push(ptn); // 例外条件を追加
                }
            }
        }
    };

    /**
     * Dateオブジェクトがパターンと一致するか判定するメソッド。
     * @param {Date} date 比較するDateオブジェクト。
     * @return {boolean} 'matches'プロパティと一致し、'exception'プロパティと一致しない場合は'true'。
     */
    gomichecker.DateMatcher.prototype.isMatch = function(compDate) {
        var year = compDate.getFullYear();
        var month = compDate.getMonth() + 1;
        var date = compDate.getDate();
        var day = compDate.getDay();
        var i, d, ptn;
        var isMatch = false;

        // 一致条件との比較
        for (i in this._matches) {
            ptn = this._matches[i];
            if (ptn.yearRange.min && (year < ptn.yearRange.min || year > ptn.yearRange.max)) {
                continue;
            }
            if (ptn.monthRange.min && (month < ptn.monthRange.min || month > ptn.monthRange.max)) {
                continue;
            }
            if (ptn.dateRange.min && (date < ptn.dateRange.min || date > ptn.dateRange.max)) {
                continue;
            }
            if (ptn.dayIndex && day !== ptn.dayIndex) {
                continue;
            }
            isMatch = true;
            break;
        }
        if (!isMatch) {
            return false; // 一致条件と合致しない場合は終了
        }

        // 例外条件との比較
        for (i in this._exceptions) {
            ptn = this._exceptions[i];
            if (ptn.yearRange.min && (year < ptn.yearRange.min || year > ptn.yearRange.max)) {
                continue;
            }
            if (ptn.monthRange.min && (month < ptn.monthRange.min || month > ptn.monthRange.max)) {
                continue;
            }
            if (ptn.dateRange.min && (date < ptn.dateRange.min || date > ptn.dateRange.max)) {
                continue;
            }
            if (ptn.dayIndex && day !== ptn.dayIndex) {
                continue;
            }
            return false; // ここまで来たら例外条件と合致するため終了
        }
        return true;
    };

    /**
     * 引数を指定すると、'setPanel()'メソッドを呼び出しカレンダーの枠を生成する。
     * 日付は'update()'メソッドを実行することで入力される。
     * {@link　Mycalendar#update}
     * @constructor
     * @class カレンダーを表示するクラス。
     * @param {$} container カレンダーを描写する要素。
     */
    gomichecker.MyCalendar = function(container) {
        var i;
        var d = new Date();

        this.container;
        this.month = d.getMonth() + 1;
        this.year = d.getFullYear();
        this.conditions = [];
        if (container) {
            this.createFrame(container);
        }
    };

    /**
     * カレンダーの要素を取得するメソッド。
     * @return {jQuery} カレンダーのjQueryオブジェクト。
     */
    gomichecker.MyCalendar.prototype.getContainer = function() {
        return this.container;
    }

    /**
     * 曜日のインデックスから文字列を取得するメソッド。
     * @param {integer} dayIndex 曜日のインデックス、日曜が'0'。
     * @return {string} 曜日の文字列。
     */
    gomichecker.MyCalendar.prototype._getDayString = function(dayIndex) {
        var dayStrs = ['日', '月', '火', '水', '木', '金', '土'];
        return dayStrs[dayIndex];
    };

    /**
     * カレンダーの枠を生成するメソッド。
     * @param {$} container カレンダーを描写する要素。
     */
    gomichecker.MyCalendar.prototype.createFrame = function(container) {
        var i, week, day;
        var html = "<div class='mycalendar'>";

        // 週ヘッダー
        for (i = 0; i < 7; i++) {
            html += "<div class='mycalendar-header-container'>"
                + "<div data-cal-day='" + i + "' class='mycalendar-header'>"
                + this._getDayString(i)
                + "</div></div>";
        }

        // 日付ボックス
        for (i = 0; i < 42; i++) {
            week = Math.ceil((i + 1) / 7); // 週番号
            day = (i + 7) % 7; // 曜日のインデックス(0が日曜)
            html += "<div class='mycalendar-box-container'>"
                + "<div data-cal-number='" + i + "' data-cal-day='" + day + "' data-cal-week='" + week + "' "
                + "class='mycalendar-box'></div></div>";
        }

        html += "</div>";
        container.html(html);
        this.container = container; // プロパティを更新
    };

    /**
     * 日付の一致条件を追加するメソッド。
     * @param {DateMatcher} matcher 日付を判定するDateMatcherオブジェクトの配列。
     * @param {string} selector 条件と一致した日付のボックスに追加するcssクラス名
     */
    gomichecker.MyCalendar.prototype.addCondition = function(matcher, selector) {
        this.conditions.push({matcher: matcher, selector: selector});
    };

    /**
     * 日付の一致条件を全て削除するメソッド。
     */
    gomichecker.MyCalendar.prototype.clearConditions = function() {
        this.conditions = [];
    };

    /**
     * カレンダーの表示を更新するメソッド。引数を指定しない場合は、表示中の年と月で再描写する。
     * @param {integer} [year] 年の値。
     * @param {integer} [month] 月の値。
     */
    gomichecker.MyCalendar.prototype.update = function(year, month) {
        var i, d, $box, c, condition;
        var $boxes = this.container.find(".mycalendar-box");
        var $sixthWeek = this.container.find("[data-cal-week='6']");
        var workDate = new Date();
        var todayStr = workDate.toDateString();

        // 引数がある場合はプロパティを変更
        this.year = year || this.year;
        this.month = month || this.month;

        // カレンダーへの日付入力用のDateオブジェクトを設定
        workDate.setFullYear(this.year);
        workDate.setMonth(this.month - 1);
        workDate.setDate(1);

        // カレンダーの日付ボックスに日付テキストを入力する
        for (i = 0; i < $boxes.length; i++) {
            $box = $boxes.eq(i);

            // 日付ボックスのcssクラスを初期化
            $box.attr("class", "mycalendar-box");

            // 日付ボックスの曜日と入力用Dateオブジェクトの曜日が一致し、かつ、月の値も一致した場合は日付を入れる
            if ($box.attr("data-cal-day") == workDate.getDay() && (workDate.getMonth() + 1) === this.month) {

                // 日付テキストを入力
                $box.text(workDate.getDate());

                // conditionsプロパティと一致するか判定
                for (c in this.conditions) {
                    condition = this.conditions[c];
                    if (condition.matcher.isMatch(workDate)) {
                        $box.addClass('sort-desc-open'); // 分別方法ポップアップを開くためのセレクタを追加 
                        $box.addClass(condition.selector); // 一致する場合はcssクラスを追加
                    }
                }

                // 今日の日付と一致する場合はcssクラスを追加
                if (workDate.toDateString() === todayStr) {
                    $box.addClass('mycalendar-today');
                }

                // 入力用Dateオブジェクトの日付を進める
                workDate.setDate(workDate.getDate() + 1);

            // 日付の入らない日boxの処理
            } else {

                // テキストを削除
                $box.html("&nbsp;");
            }
        }

        // 6週目の表示/非表示切り替え
        if (parseInt($boxes.eq(35).text())) {
            $sixthWeek.show();
        } else {
            $sixthWeek.hide();
        }
    };

    /**
     * カレンダーの月を変更するメソッド。年は最大で1年しか変化しない。
     * @param {integer} amount 月の変化量。
     */
    gomichecker.MyCalendar.prototype.addMonth = function(amount) {
        var m;
        m = this.month + amount;
        if (m > 12) {
            this.month = (m - 12);
            this.year += 1;
        } else if (m < 1) {
            this.month = (12 - m);
            this.year -= 1;
        } else {
            this.month = m;
        }
        this.update();
    };

    /**
     * 新しいごみ種類ページを作成し、プロパティの初期化とページ内でのイベントをセットする。
     * @constructor
     * @classdesc ごみ種類ページを生成するクラス。
     * @param {string} selector ゴミチェッカーページのセレクタ。
     */
    gomichecker.WastePage = function() {
        var $page = $("#waste-page");
        var $list = $("#waste-list");
        var $popup = $page.find("#waste-popup");
        var me = this;

        // プロパティの初期化
        this.$obj = {
            page: $page,
            list: $list,
            popup: $popup
        };
        this.appData = null;

        // ゴミリストの項目クリックイベント。
        // 詳細ポップアップを開く。
        $list.on("tap", "a", function () {
            var itemIndex = parseInt($(this).attr("data-index"));
            var wasteItem = me.appData.getJson("waste")[itemIndex];
            me.showPopup_(wasteItem);
            return false;
        });

        // 詳細ポップアップのbeforepositionイベント。
        // ポップアップウインドウのサイズを調整する。
        $popup.on("popupbeforeposition", function() {
            var hh = $popup.find(".ui-header").outerHeight();
            var fh = $popup.find(".ui-footer").outerHeight();
            var h = $(window).height();
            var w = $(window).width();
            h = (h > 500)? 450: h * .8;
            w = (w > 500)? 450: w * .9;
            $popup.width(w).height(h);
            $popup.find("#waste-popup-detail").height(h - hh - fh);
        });

        // ポップアップのcloseボタンクリックイベント。
        // closeボタンはヘッダーのafter疑似要素で描写している。
        $popup.find("#waste-popup-close").on("tap", function() {
            $popup.popup("close");
            return false;
        });

    };

    /**
     * ごみリストを作成するメソッド。
     * @param {gomichecker.AppData} appData オブジェクトが保持するjsonデータを利用する。
     */
    gomichecker.WastePage.prototype.initPage = function (appData) {
        var w, waste, s, sort, opt, str, ptn;
        var wasteData = appData.getJson("waste");
        var sortData = appData.getJson("sort");
        var $list = this.$obj.list;
        var html = ""; // リスト全体のHTMLを保持する変数
        var iconHtml = ""; // 各項目のアイコン用のHTMLを作成するための変数
        var sortObjects = [];
        var sortFilterStr = "";

        this.appData = appData;

        // 分別区分を判定するための正規表現オブジェクトを作成する。
        // sortDataの'id'または'name'の文字列と完全一致するものをさがす正規表現。
        for (s = 0; s < sortData.length; s++) {
            sort = sortData[s];
            str = "(" + sort.shortText + "|" + sort.text + ")";
            ptn = "^" + str + "$";
            ptn += "|^" + str + "[,\\s]+";
            ptn += "|[,\\s]+" + str + "[,\\s]+";
            ptn += "|[,\\s]+" + str + "$";
            sortObjects.push({regExp: new RegExp(ptn, "ig"), shortText: sort.shortText, id: sort.id});
        }

        // リストの項目を追加する。
        // li要素のHTML文を作成しulを更新する。
        for (w = 0; w < wasteData.length; w++) {
            waste = wasteData[w];

            // ループで使用する変数を初期化
            if (waste.recycle) {
                // recycleキーがnullでない場合は「リサイクル」のアイコンを追加する。
                iconHtml = "<span class='waste-sort waste-recycle'>リサイクル</span>";
                sortFilterStr = ",リサイクル" 
            } else {
                iconHtml = "";
                sortFilterStr = "";
            }

            // 分別アイコンのHTMLを作成する。
            for (s = 0; s < sortObjects.length; s++) {
                sortObj = sortObjects[s];
                sortObj.regExp.lastIndex = 0;
                if (sortObj.regExp.test(waste.sort)) {
                    iconHtml += "<span class='waste-sort sort-" + sortObj.id + "'>" + sortObj.shortText + "</span>";
                    sortFilterStr += "," + sortObj.shortText; // 分別区分でフィルタリングするための文字列を作成
                }
            }

            html += "<li data-filtertext='" + waste.name + "," + waste.keyword + sortFilterStr + "' data-icon='false'>";
            html += "<a data-index='" + w + "'>"; // wasteData配列のインデックス
            html += "<h2>" + waste.name + "</h2>"; // 品目名
            html += "<p class='waste-text'>"; // 分別アイコンとコメントを格納する要素
            html += iconHtml;

            // コメント文を追加する。
            // 改行は削除、リサイクル方法のテキストがある場合はそれも結合する。
            html += "<span class='waste-comment'>";
            if (waste.comment) {
                html += waste.comment.replace(/<br>/g, "");
            }
            if (waste.recycle) {
                html += waste.recycle.replace(/<br>/g, "");
            }

            html += "</span></p>"; // 分別アイコンとコメントを格納する要素の終了

            // 外部リンクアイコンを追加する。
            if (waste.link) {
                html += "<div class='waste-link'><img src='images/external_link.png'></div>";
            }

            html += "</a></li>";
        }
        $list.html(html).listview("refresh"); // listviewの更新
        //$list.adjustBottom(1);
    };

    /**
     * 詳細ポップアップを表示するメソッド。
     * @param {object} wasteItem ごみリストの配列型jsonデータの項目。
     */
    gomichecker.WastePage.prototype.showPopup_ = function(wasteItem) {
        var html;
        var $popup = this.$obj.popup;
        var separator = "、"; // 複数の分別区分を区切る文字
        var subtext = wasteItem.sort + "です。"; // 注意事項のテキストがない場合の代替テキスト

        // 品目名
        $("#waste-popup-name").text(wasteItem.name);
        //html = "<div class='waste-name'>" + wasteItem.name + "</div>";

        // 分別区分
        html = "<div class='my-head'>" + wasteItem.sort.replace(/[,\s]+/gi, separator) + "</div>";

        // 注意事項
        if (wasteItem.comment) {
            html += "<div class='waste-comment'>" + wasteItem.comment + "</div>";
        } else {
            html += "<div class='waste-comment'>" + subtext + "</div>";
        }

        // リサイクル方法
        if (wasteItem.recycle) {
            html += "<div class='my-head'>リサイクルの方法</div>";
            html += "<div class='waste-recycle'>" + wasteItem.recycle + "</div>";
        }

        // 関連ページリンク
        if (wasteItem.link) {
            html += "<div class='my-head'>関連ページ</div>";
            html += "<div class='waste-link'>" + wasteItem.link.replace(/<a/g, "<a data-ajax='false' target='_blank'") + "</div>";
        }

        $popup.find("#waste-popup-detail").html(html);
        $popup.popup("open");
    };

    /**
     * プロパティの初期化とイベントのセットを行う。
     * @constructor
     * @classdesc カレンダーページのクラス。
     */
    gomichecker.CalendarPage = function() {
        var me = this;

        this.$obj = {
            page : $("#calendar-page"),
            areaButton : $("#calendar-area-btn"),
            dateText : $("#calendar-date"),
            prevButton : $("#calendar-prev-btn"),
            nextButton : $("#calendar-next-btn"),
            legend : $("#calendar-legend"),
            areaPopup : $("#area-popup"),
            areaList : $("#area-list")
        };
        this.calendar = new gomichecker.MyCalendar($("#calendar-canvas"));
        this.appData;

        // 前の月ボタンのクリックイベント。
        this.$obj.prevButton.on("tap", function() {
            me.calendar.addMonth(-1);
            me._updateHeader();
            return false;
        });

        // 次の月ボタンのクリックイベント。
        this.$obj.nextButton.on("tap", function() {
            me.calendar.addMonth(1);
            me._updateHeader();
            return false;
        });

        // カレンダーのスワイプイベント
        this.calendar.getContainer().on("swipeleft", function(e) {
            me.$obj.nextButton.trigger('tap');
        });
        this.calendar.getContainer().on("swiperight", function(e) {
            me.$obj.prevButton.trigger('tap');
        });

        // 地区選択ボタンのクリックイベント。
        // 地区選択パネルを開く。
        this.$obj.areaButton.on("tap", function() {
            me.$obj.areaPopup.popup("open");
            return false;
        });

        // 地区選択ポップアップのbeforepositionイベント。
        // ポップアップの高さ調整し、リストの選択項目を表示する。
        this.$obj.areaPopup.on("popupbeforeposition", function() {
            var $list = me.$obj.areaList;
            var $activeItem = $list.find(".ui-btn-active");
            var $popup = $(this);
            $popup.height($(window).height() * 0.8); // Popupの高さを調整。
            if ($activeItem.length > 0) {
                $list.scrollTo($activeItem, 0); // 選択状態の項目までスクロール。
            }
        });

        // 地区リストの項目クリックイベント。
        // AppDataオブジェクトのパラメータを変更し、カレンダーを再描写する。
        this.$obj.areaList.on("tap", "a", function() {
            var areaCode = parseInt(this.getAttribute("data-area-code"));
            var $list = me.$obj.areaList;
            var $areaBtn = me.$obj.areaButton;
            var $areaPopup = me.$obj.areaPopup;
            me.appData.setProperty(areaCode); // パラメータを変更
            me._initCalendar(); // カレンダーを初期化
            $list.find("a.ui-btn-active").removeClass("ui-btn-active"); // 項目の選択を解除
            $(this).addClass("ui-btn-active"); // 新しい項目を選択
            $areaBtn.text($(this).text()); // 地区の書き換え
            $areaPopup.popup("close"); // ポップアップを閉じる
            return false;
        });

    };

    /**
     * カレンダーの見出しを更新するメソッド。
     */
    gomichecker.CalendarPage.prototype._updateHeader = function() {
        var y = this.calendar.year;
        var m = this.calendar.month;
        this.$obj.dateText.text(y + "年" + m + "月");
    };

    /**
     * 凡例を作成するメソッド。
     * 凡例は、収集区分の中で収集日があるものについて作成し、jsonオブジェクト'sort'の'id'要素が'data-sort'属性として付与される。
     */
    gomichecker.CalendarPage.prototype._setLegend = function() {
        var key, i, sort, text;
        var calendarData = this.appData.getJson("calendar");
        var sortData = this.appData.getJson("sort");
        var cal = calendarData[0];
        var $legend = this.$obj.legend;
        var html = "";
        for (key in cal) {
            if (key !== "type") {
                for (i = 0; i < sortData.length; i++) {
                    sort = sortData[i];
                    if (sort.id === key) {
                        text = sort.text;
                        break;
                    }
                }
                html += "<div class='sort-desc-open sort-" + key + "'><span class='sort-color'></span>" +
                    "<span class='sort-text'>" + text + "</span></div>";
            }
        }
        $legend.html(html);
    };

    /**
     * 'appData'プロパティの値を参照してカレンダーを初期化するメソッド。
     */
    gomichecker.CalendarPage.prototype._initCalendar = function() {
        var calendarData = this.appData.getJson("calendar");
        var calendarType = this.appData.getCalendarType();
        var html = "";
        var c, cal, key;
        var matcher, selector;

        // カレンダーの一致条件をクリア
        this.calendar.clearConditions();

        // カレンダーの一致条件をセット
        for (c = 0; c < calendarData.length; c++) {
            cal = calendarData[c];
            if (cal.type === calendarType) {
                for (key in cal) {
                    if (key !== "type") {
                        matcher = new gomichecker.DateMatcher(cal[key]);
                        selector = "sort-" + key;
                        this.calendar.addCondition(matcher, selector);
                    }
                }
                break;
            }
        }

        // カレンダーの表示を更新
        this.calendar.update();
    };

    /**
     * 地区リストの作成メソッド。
     * @param {object} areaData 地区のjsonオブジェクト。
     */
    gomichecker.CalendarPage.prototype._setAreaList = function() {
        var i, area;
        var html = "";
        var $list = this.$obj.areaList;
        var areaData = this.appData.getJson("area");
        for (i = 0; i < areaData.length; i++) {
            area = areaData[i];
            html += "<li data-filtertext='" + area.name + "," + area.keyword + "' data-icon='false'>";
            html += "<a data-area-code='" + area.code + "'>" + area.name + "</a></li>";
        }
        $list.html(html).listview("refresh");
    };

    /**
     * 収集日ページの初期化メソッド。
     */
    gomichecker.CalendarPage.prototype.initPage = function(appData) {
        var d = new Date;
        var $list = this.$obj.areaList;
        var areaCode = appData.getAreaCode();
        var $sortPopup = $("#sort-desc-popup");
        this.appData = appData;
        this._setLegend(); // 凡例を作成
        this._setAreaList(); // 地区選択リストを作成
        if (areaCode) {
            // areaCodeがある場合は地区リストの項目タップイベントを呼び出す
            $list.find("a[data-area-code='" + areaCode+ "']").trigger("tap");
        } else {
            // areaCodeがない場合はカレンダーだけ表示する
            this.calendar.update();
        }
        this._updateHeader(); // ヘッダーを更新

        // カレンダー凡例と収集日のタップイベント(この場所でないと動かない)
        // 分別方法ポップアップの表示
        $(".sort-desc-open").on("tap", function() {
            var $this = $(this);
            var $content = $sortPopup.find(".ui-content");
            $sortPopup.popup("open");
            switch (true) {
            case $this.hasClass('sort-burn'):
                $content.scrollTo($("#sort-desc-burn"), 20, $(window).width() < 400);
                break;
            case $this.hasClass('sort-nonburn'):
                $content.scrollTo($("#sort-desc-nonburn"), 20, $(window).width() < 400);
                break;
            case $this.hasClass('sort-recycle'):
                $content.scrollTo($("#sort-desc-recycle"), 20, $(window).width() < 400);
                break;
            }

        });

        // 分別方法ポップアップのイベント
        $sortPopup.on("popupbeforeposition", function() {
            var $wd = $(window);
            $sortPopup.height($wd.height() * .8);
            $sortPopup.width($wd.width() * .9);
        });

        // 分別方法ポップアップの分別フィルター適応ボタンのクリックイベント
        $(".apply-sort-filter").on("tap", function() {
            $sortPopup.popup("close");
            $("body").pagecontainer("change", "#waste-page");
            $("#waste-filter").val(this.getAttribute("data-filter-text"));
            $("#waste-list").filterable("refresh");
            return false;
        });

    };

    /**
     *
     * @classdesc 収集拠点ページのクラス。
     * @constructor
     */
    gomichecker.StationPage = function() {
        var me = this;
        this.appData;
        this.myMarkers = [];
        this.gMap;
        this.gInfoWindw = new google.maps.InfoWindow({disableAutoPan: true, maxWidth: 270});
        this.$obj = {
            page: $("#station-page"),
            categoryFilter: $("#station-category-filter"),
            stationPanel: $("#station-marker-panel"),
            stationPanelButton: $("#station-marker-panel .station-marker-panel-btn"),
            stationButton: $(".my-category .station-marker-panel-btn"),
            stationList: $("#station-marker-list")
        };

        // カテゴリーフィルターの適応時イベント。
        // 表示するマーカーを切り替える。
        // このイベントはページ初期化時になぜか3回呼ばれる、この時点ではリストがまだ空でgoogleMapも読み込まれていない。
        this.$obj.stationList.on("filterablefilter", function() {
            var i, $item, marker;
            var $items = $(this).children();
            var map = me.gMap;
            var bounds = new google.maps.LatLngBounds();
            if (map) {
                for (i = 0; i < $items.length; i++) {
                    $item = $items.eq(i);
                    marker = me.myMarkers[i];
                    if ($item.hasClass("ui-screen-hidden")) { // ui-screen-hidden は listview の非表示項目に付けられるクラス
                        marker.setMap(null);
                    } else {
                        marker.setMap(map);
                        bounds.extend(marker.getPosition());
                    }
                }
                map.fitBounds(bounds);
            }
        });

        // マーカーリストを開くボタンのタップイベント。
        // マーカーリストパネルを開く。
        $("#station-marker-panel-btn").on("tap", function() {
            $("#station-marker-panel").panel("toggle");
            return false;
        });

        // マーカーリストの項目タップイベント。
        this.$obj.stationList.on("tap", "a", function() {
            var myMerker = me.myMarkers[$(this).attr("data-marker-index")];
            me._showInfoWindow(myMerker);
            me.$obj.stationPanel.panel("close");
            return false;
        });

        // InfoWindowのイベント。
        // InfoWindowが表示範囲内に来るように調整する。自動にするとカテゴリーフィルターとかぶる場合があるため手動で行う。
        google.maps.event.addListener(this.gInfoWindw, "domready", function() {
            var $iw = $(".gm-style-iw").parent();
        	var $win = $(window);
            var $map = $(me.gMap.getDiv());
            var dst = {x: 0, y: 0};
            var viewArea = {
            	top: $map.offset().top + 70,
            	right: $win.width() - $map.offset().left - $map.width() + (($map.width() > 400)? 100: 10),
            	bottom: $win.height() - $map.offset().top - $map.height() + 120,
            	left: $map.offset().left + (($map.width() > 400)? 100: 10)

            };
            var iwPos = {
	            top: $iw.offset().top,
	            right: $win.width() - $iw.offset().left - $iw.width(),
	            bottom: $win.height() - $iw.offset().top - $iw.height(),
	            left: $iw.offset().left
            };

            // 縦方向の調整
            if (iwPos.top < viewArea.top ) {
                dst.y = iwPos.top - viewArea.top;
            } else if (iwPos.bottom < viewArea.bottom) {
                dst.y = viewArea.bottom - iwPos.bottom;
            }
            // 横方向の調整
            if (iwPos.left < viewArea.left) {
                dst.x = iwPos.left - viewArea.left;
            } else if (iwPos.right < viewArea.right) {
                dst.x = viewArea.right - iwPos.right;
            }
            me.gMap.panBy(dst.x, dst.y);
        });
    };

    /**
     * マーカーを作成するメソッド
     */
    gomichecker.StationPage.prototype._createMarker = function() {
        var i, marker, station;
        var me = this;
        var stationData = this.appData.getJson("station");
        var re = new RegExp();
        var categoryListHtml = "";
        var categoryItemHtml = "";
        var stationListHtml = "";
        var $categoryFilter = this.$obj.categoryFilter;
        var $stationList = this.$obj.stationList;
        //var bounds = new google.maps.LatLngBounds();

        for (i = 0; i < stationData.length; i++) {
            station = stationData[i];

            // マーカーを作成
            marker = new google.maps.Marker({
                title: station.name,
                position: new google.maps.LatLng(station.lat, station.lng),
                map: this.gMap
            });
            marker.station = station;
            this.myMarkers.push(marker); // プロパティに保存

            // マーカーのクリックイベントをセット
            google.maps.event.addListener(marker, "click", function() {
                me._showInfoWindow(this);
            });

            // カテゴリー選択リストのHTMLを作成
            categoryItemHtml = "<option value='" + station.category + "'>" + station.category + "</option>";
            re.compile(categoryItemHtml);
            if (!re.test(categoryListHtml)) {
                categoryListHtml += categoryItemHtml;
            }

            // 拠点リストのHTMLを作成
            stationListHtml += "<li data-filtertext='" + station.category + "' data-icon='location'>"
                + "<a data-marker-index='" + i + "'>" + station.name + "</a></li>";
        }

        $categoryFilter.html(categoryListHtml).selectmenu("refresh"); // カテゴリー選択リストを更新
        $stationList.html(stationListHtml).listview("refresh"); // 拠点リストを更新
        //this.gMap.fitBounds(bounds); // 地図の表示範囲を設定
    };

    /**
     * InfoWindowを表示するメソッド。
     * @param {object} myMarker google.maps.Markerオブジェクトに、収集拠点のJSONデータ要素を追加したオブジェクト。
     *     JSONデータ要素には"station"キーでアクセスする。
     */
    gomichecker.StationPage.prototype._showInfoWindow = function(myMarker) {
        var iw = this.gInfoWindw;
        var station = myMarker.station;
        var contentHtml = "<div class='info-window-name'>" + station.name + "</div>"
            + "<div class='info-window-address'>" + station.address + "</div>";
        if (station.tel) {
            contentHtml += "<div class='info-window-tel'><a href='tel:" + station.tel + "'>" + station.tel + "</a></div>";
        }
        if (station.comment) {
            contentHtml += (station.comment)? "<div class='info-window-comment'>" + station.comment + "</div>": "";
        }
        iw.setContent(contentHtml);
        iw.open(this.gMap, myMarker);
    };

    /**
     * 収集拠点ページの初期化メソッド。
     * @param {gomichecker.AppData} appData JSONデータを保持したオブジェクト。
     */
    gomichecker.StationPage.prototype.initPage = function(appData) {
        this.gMap = new google.maps.Map(document.getElementById("map-canvas"), {
            center: new google.maps.LatLng(34.578901, 135.636209),
            zoom: 15,
            mapType: google.maps.MapTypeId.ROADMAP,
            mapTypeControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM}
            //streetViewControlOptions: {position: google.maps.ControlPosition.RIGHT_BOTTOM},
        });
        this.appData = appData;
        this._createMarker();
    };
    
})(gomichecker);
