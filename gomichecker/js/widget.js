// クラスの定義について
// 
// Object.create(Class.prototype)メソッドを利用してクラスを定義する。
// 継承は、Object.setPrototypeOf()メソッドを使用する。
// 
//　ただし、、プロトタイプは参照するだけで上書きすることができないため、可変の
//　プロパティをプロトタイプに定義して継承すると、プロトタイププロパティを変更しようと
//　"object.prop = value"のように書いても、インスタンスに新たなプロパティが
//　追加され、元のプロパティ自身は変更されないという状態になってしまう。
//　
//　これでは元の値を参照渡しで変数に保存した場合などに、変更が反映されない
//　という不具合が発生する可能性がある。
//　
//　これを防ぐため、継承の際には、Object.assign()メソッドを使用して親と子の
//　インスタンスのを統合する。
//　


// Namespace
var widget = {},
	utility = {};

// Object.assignメソッドを定義（IE用）
// IEではObject.assignメソッドがないため、同じ結果を返すjQuery.extendを呼び出す
if (typeof Object.assign != 'function') {
	Object.assign = $.extend;
}

/**
 * @classdesc 日付がパターンに含まれるか判定するクラス。
 * @type {Object}
 */
utility.DateMatcher = {
	new: function() {
		var instance = Object.create(utility.DateMatcher.prototype);
		instance.conditions = [];
		instance.dayTexts = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
		return instance;
	},
	prototype: {

		/**
		 * クエリ文字列からコンディションオブジェクトを読み込むメソッド。
		 * @param  {[type]} query [description]
		 * @return {[type]}       [description]
		 */
		loadQuery: function(query) {
			var i, texts, text, e, parts;
			
			// クエリ文字列を分解してループ
			texts = query.replace(/\s+/g, '').toLowerCase().split('|').filter(function(v) {return v});
			for (i = 0; i < texts.length; i++) {

				// 変数をリセット
				text = texts[i];
				
				// タイプの判定
				if (text.indexOf('not') === 0) {
					e = true;
					text = text.substring(3);
				}

				// 年月日曜日に分解してコンディションオブジェクトを作成
				parts = text.split(/[\/\(\)]/).filter(function(v) {return v});
				if (parts.length < 3 || parts.length > 4) {
					continue; // 正しく分解できない場合はスキップ
				}

				// コンディションオブジェクトをインスタンス変数に保存
				this.addCondition({
					exception: e,
					year: parts[0],
					month: parts[1],
					date: parts[2],
					day: parts[3] || ''
				});
			}
		},

		/**
		 * コンディションを追加するメソッド。
		 * 
		 * @param {[type]} condition [description]
		 */
		addCondition: function(condition) {

			// コンディションの値を校正
			condition = this._proofread(condition)
			if (!condition) {
				return false;
			}
			// コンディションの追加
			this.conditions.push(condition);
			return true;
		},

		/**
		 * 日付が登録されているコンディションと一致するか判定するメソッド。
		 * @param  {[type]}  date [description]
		 * @return {Boolean}      [description]
		 */
		hasDate: function(date) {
			var i, c, m = false;
			for (i = 0; i < this.conditions.length; i++) {
				c = this.conditions[i];

				// 一致条件
				if (!c.exception && !m) {
					m = this._dateInCondition(date, c);

				// 例外条件
				} else if (c.exception && m) {
					if (this._dateInCondition(date, c)) {
						return false;
					}
				}
			}
			return m;
		},

		/**
		 * 日付がコンディションに含まれるか判定するメソッド。
		 * 
		 * @param  {[type]} date      [description]
		 * @param  {[type]} condition [description]
		 * @return {[type]}           [description]
		 */
		_dateInCondition: function(date, condition) {
			var compared = {
					year: date.getFullYear(),
					month: date.getMonth() + 1,
					date: date.getDate(),
					day: this._getWeekCount(date) + this._getDayText(date),
				},
				numReg = new RegExp('\\d+\\-\\d+|\\d+', 'g'),
				isMatch;

			// 年、月、日付を比較
			isMatch = !['year', 'month', 'date'].some(function(prop) {
				if (condition[prop].indexOf('*') === -1) {
					return !condition[prop].match(numReg).some(function(ptn) {
						var i = ptn.indexOf('-');
						if (i > -1) {
							return (compared[prop] >= parseInt(ptn) && compared[prop] <= parseInt(ptn.substring(i + 1)));
						} else {
							return compared[prop] === parseInt(ptn);
						}
					});
				}
			});


			// 曜日を比較
			if (isMatch && condition.day) {
				isMatch = condition.day.match(/\d?[a-z]{3}/g).some(function(ptn) {
					return compared.day.indexOf(ptn) > -1;
				});
			}

			return isMatch;
		},

		/**
		 * 曜日の文字列を取得するメソッド。
		 * @param  {[type]} date [description]
		 * @return {[type]}      [description]
		 */
		_getDayText: function(date) {
			return this.dayTexts[date.getDay()];
		},

		/**
		 * 日付の曜日の週目カウントを取得するメソッド。
		 * 
		 * @param  {[type]} date [description]
		 * @return {[type]}      [description]
		 */
		_getWeekCount: function(date) {
			return Math.floor((date.getDate() - 1) / 7) + 1;
		},

		/**
		 * コンディションオブジェクトを校正するメソッド。
		 * 
		 * @param  {Object} condition コンディションオブジェクト。
		 * @return {Object}           校正したコンディションオブジェクト。
		 */
		_proofread: function(condition) {
			var error, ary;

			// タイプ
			condition.exception = Boolean(condition.exception);

			// 年、月、日
			error = ['year', 'month', 'date'].some(function(prop) {
				var ptns;
				switch (typeof condition[prop]) {
					case 'number':
						break;
					case 'string':
						// 文字列の場合はパターンをチェック
						ptns = condition[prop].match(/\d+\-\d+|\d+|\*+/g);
						if (ptns === null) {
							return true; // Error
						} else {
							condition[prop] = ptns.join(); // 値を上書き
						}
						break;
					default:
						return true; // Error
				}
			});

			// 曜日をチェック
			if (error) {
				return null;
			} else if (typeof condition.day === 'string') {
				ary = condition.day.match(/[1-6]?(mon|tue|wed|thu|fri|sat|sun)/g);
			}
			condition.day = ary? ary.join(): ''; // 値を上書き

			return condition;
		}
	}
};




/**
 * @classdesc 基本クラス。
 */
widget.Base = {
	/**
	 * コンストラクタ。
	 * @constuctor
	 * @param  {jQuery|Element|String} element 描写する要素。
	 * @return {Object}                クラスのインスタンス。
	 */
	new: function(element) {
		var instance = Object.create(widget.Base.prototype);
		instance.element = $(element);
		instance.element.data('widget', instance);
		return instance;
	},
	prototype: {}
};


/**
 * @classdesc サイドバーやポップアップの親クラス、openメソッドとcloseメソッドを追加する。
 * @extends {widget.Base}
 */
widget.Closeable = {
	/**
	 * コンストラクタ。
	 * @constuctor
	 * @param  {jQuery|Element|String} element 描写する要素。
	 * @return {Object}                クラスのインスタンス。
	 */
	new: function(element) {
		var instance = Object.create(widget.Closeable.prototype);
		Object.assign(instance, widget.Base.new(element));
		instance.element.data('widget', instance);

		// Property
		instance.options = {			
			closeDelay: 300,
		};
		instance._modal = $('<div class="wg-dismiss-closed"></div>').appendTo('body');

		instance._init();
		return instance;
	},

	prototype: {

		/**
		 * 初期化メソッド。
		 */
		_init: function() {
			var _this = this;
			this.element.addClass('wg-closed').wrapInner('<div class="wg-inner">');
			this._modal.on('tap', function(e) {
				_this.close();
				e.preventDefault();
			});
			setTimeout(function() {
				_this.element.addClass('wg-animate');
			}, 10);
		},

		/**
		 * 要素表示するメソッド。
		 * @return {[type]} [description]
		 */
		open: function() {
			this.element.trigger('beforeopen');
			this.element.removeClass('wg-closed').addClass('wg-open');
			this._modal.removeClass('wg-dismiss-closed').addClass('wg-dismiss-open');
			this.element.trigger('afteropen');
		},

		/**
		 * 要素を非表示にするメソッド。
		 * @param  {[type]} option [description]
		 * @return {[type]}        [description]
		 */
		close: function(option) {
			var _this = this;
			option = Object.assign({}, this.options, option);
			this.element.trigger('beforeclose');
			this.element.removeClass('wg-open');
			this._modal.removeClass('wg-dismiss-open');
			setTimeout(function() {
				_this.element.addClass('wg-closed');
				_this._modal.addClass('wg-dismiss-closed');
				_this.element.trigger('afterclose');
			}, option.closeDelay);
		}
	}
};
Object.setPrototypeOf(widget.Closeable.prototype, widget.Base.prototype);


/**
 * @classdesc サイドバークラス。
 * @extends {widget.Closeable}
 */
widget.Sidebar = {
	/**
	 * インスタンス生成メソッド。
	 * @constructor
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	new: function(element) {
		var instance = Object.create(widget.Sidebar.prototype);
		Object.assign(instance, widget.Closeable.new(element)); // プロパティを継承
		instance.element.data('widget', instance);
		instance._init();
		return instance;
	},
	prototype: {

		_init: function() {
			this.element.addClass('wg-sidebar');
			this._modal.addClass('wg-sidebar-dismiss');
		},

	}
};
// メソッドを継承
Object.setPrototypeOf(widget.Sidebar.prototype, widget.Closeable.prototype)


/**
 * @classdesc メニュークラス。
 * @extends {widget.Closeable}
 */
widget.Menu = {
	/**
	 * インスタンス生成メソッド。
	 * @constructor
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	new: function(element) {
		var instance = Object.create(widget.Menu.prototype);
		Object.assign(instance, widget.Closeable.new(element));
		instance.element.data('widget', instance);
		instance._init();
		return instance;
	},
	prototype: {

		_init: function() {
			this.element.addClass('wg-menu');
			this._modal.addClass('wg-menu-dismiss');
		},

	}
};
Object.setPrototypeOf(widget.Menu.prototype, widget.Closeable.prototype);

/**
 * @classdesc ポップアップクラス。
 * @extends {widget.Closeable}
 */
widget.Popup = {
	/**
	 * インスタンス生成メソッド。
	 * @constructor
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	new: function(element) {
		var instance = Object.create(widget.Popup.prototype);
		Object.assign(instance, widget.Closeable.new(element));
		instance.element.data('widget', instance);
		instance._init();
		return instance;
	},
	prototype: {

		_init: function() {
			this.element.addClass('wg-popup');
			this._modal.addClass('wg-popup-dismiss');
		},

		setContent: function(content) {
			this.element.children().remove();
			this.element.append('<div class="wg-popup-inner">' + content + '</div>');
		}

	}
};
Object.setPrototypeOf(widget.Popup.prototype, widget.Closeable.prototype);


/**
 * @classdesc カレンダークラス。
 * @extends {widget.Closeable}
 */
widget.Calendar = {

	/**
	 * インスタンス生成メソッド。
	 * @constructor
	 * @param  {[type]} element [description]
	 * @return {[type]}         [description]
	 */
	new: function(element) {
		var instance = Object.create(widget.Calendar.prototype);
		Object.assign(instance, widget.Base.new(element));
		instance.element.data('widget', instance);

		instance.options = {
			date: new Date(),
			dayLabel: '日,月,火,水,木,金,土',
			prevIcon: 'chevron_left',
			nextIcon: 'chevron_right',
		};

		instance._init();

		return instance;
	},

	prototype: {

		_init: function() {
			var _this = this,
				$control,
				$table,
				$row,
				$cell,
				row,
				cell;

			this.element.addClass('wg-calendar');

			// コントロールを作成
			$control = $('<div class="wg-calendar-control"></div>').appendTo(this.element);
			this._control = $control;
			$control.append(
				'<div class="wg-calendar-prev"><i class="material-icons">' +
				this.options.prevIcon + '</i></div>' +
				'<div class="wg-calendar-label">' +
				'<span class="wg-calendar-year"></span><span class="wg-calendar-month"></span>' +
				'</div>' +
				'<div class="wg-calendar-next"><i class="material-icons">' +
				this.options.nextIcon + '</i></div>'
			);
			// コントロールのイベントをセット
			$control.find('.wg-calendar-prev').on('tap', function(e) {
				_this.prev();
				e.preventDefault();
			});
			$control.find('.wg-calendar-next').on('tap', function(e) {
				_this.next();
				e.preventDefault();
			});

			// カレンダーのテーブルを作成
			$table = $('<table class="wg-calendar-table"></talbe>').appendTo(this.element);

			// ヘッダーを作成
			$row = $('<tr class="wg-calendar-header-row">').appendTo($table);
			for (cell = 0; cell < 7; cell++) {
				$cell = $('<th class="wg-calendar-header">').appendTo($row);
				// 日曜のクラスをセット
				if (cell === 0) {
					$cell.addClass('wg-calendar-sun');
				// 土曜のクラスをセット
				} else if (cell === 6) {
					$cell.addClass('wg-calendar-sat');
				}
			}
			$.each(this.options.dayLabel.split(','), function(i, d) {
				$row.children('th').eq(i).text(d);
			});

			// 日付セルを作成
			for (row = 0; row < 6; row++) {
				$row = $('<tr class="wg-calendar-week-row">').appendTo($table);
				for (cell = 0; cell < 7; cell++) {
					$cell = $(
						'<td class="wg-calendar-cell"><div class="wg-calendar-date"></div>' +
						'<div class="wg-calendar-icons"></div></td>'
					).appendTo($row);
					// 日曜のクラスをセット
					if (cell === 0) {
						$cell.addClass('wg-calendar-sun');
					// 土曜のクラスをセット
					} else if (cell === 6) {
						$cell.addClass('wg-calendar-sat');
					}
				}
			}
		},

		_displayRow: function(elm) {
			var $tr = $(elm);
			if (isNaN(parseInt($tr.children('td').first().text()))) {
				$tr.hide();
			} else {
				$tr.show();
			}
		},

		refresh: function() {
			var _this = this,
				date = new Date(this.options.date),
				today = new Date;
			date.setDate(1);

			// 年月ラベルを更新
			this._control.find('.wg-calendar-year').text(this.options.date.getFullYear() + '年');
			this._control.find('.wg-calendar-month').text((this.options.date.getMonth() + 1) + '月');

			// Todayクラスを除去
			this.element.find('.wg-calendar-today').removeClass('wg-calendar-today');

			// 日付セルを更新
			this.element.find('td').each(function(i, elm) {
				var $date = $(elm).children('.wg-calendar-date');
				if ($(elm).index() === date.getDay() && date.getMonth() === _this.options.date.getMonth()) {
					$date.text(date.getDate());
					// 今日のセルにクラスを追加
					if (date.toDateString() === today.toDateString()) {
						$date.parent().addClass('wg-calendar-today');
					}
					// 日付セルの更新イベントを実行
					_this.element.trigger('cellupdate', {date: new Date(date), element: elm});
					date.setDate(date.getDate() + 1);
				} else {
					$date.html('&nbsp;');
					// 日付セルの更新イベントを実行
					_this.element.trigger('cellupdate', {date: null, element: elm});
				}
			});

			// 5,6行目の表示判定
			this._displayRow(this.element.find('tr').eq(5));
			this._displayRow(this.element.find('tr').last());
		},

		next: function() {
			var $table = this.element.find('.wg-calendar-table'),
				_this = this;
			this.options.date.setMonth(this.options.date.getMonth() + 1);
			$table.fadeOut(200, function() {
				_this.refresh();
				$table.fadeIn(200);
			});
		},

		prev: function() {
			var $table = this.element.find('.wg-calendar-table'),
				_this = this;
			this.options.date.setMonth(this.options.date.getMonth() - 1);
			$table.fadeOut(200, function() {
				_this.refresh();
				$table.fadeIn(200);
			});
		}
	}
};
Object.setPrototypeOf(widget.Calendar.prototype, widget.Base.prototype)
