var Schedule = function() {
	this.matchConditions = [];
	this.exceptConditions = [];
	this.dayTexts = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
};


/*

Condition object

year	2016-2021
month	5-10
date	15, 20
day		mon, thu
week	1,3

'-' 範囲を表す
',' 複数の値を区切る

 */



Schedule.prototype.loadQuery = function(query) {
	var me = this,
		hasError = false;
		conditionTexts = query.replace(/\s+|\,\s*$/g, '').toLowerCase().split('|');
	if (conditionTexts.length === 0) {
		return false;
	}
	hasError = conditionTexts.some(function(text) {
		var type,
			condition = {};
		if (text.indexOf('not') != 0) {
			type = 'match';
		} else {
			type = 'except';
			text = text.substring(3);
		}
		if (text.match(/[\d\*\-]*\/[\d\*\-]*\/[\d\*\-]*(?:\([\w]\,\))?/) === null) {
			return true;
		}
		text.split(/[\/\(]/).forEach(function(str, i) {
			var w, d;
			switch (i) {
				case 0: // year
					if (str != '*') {
						condition['year'] = str;
					}
					break;
				case 1: // month
					if (str != '*') {
						condition['month'] = str;
					}
					break;
				case 2: // date
					if (str != '*') {
						condition['date'] = str;
					}
					break;
				case 3: // day, week
					w = str.match(/^\d(?=,)/);
					if (w) {
						condition['week'] = w[0];
					}
					d = str.match(/[a-z]{3}/g);
					if (d) {
						condition['day'] = d.join();
					}
					break;
			}
		});
		if (Object.keys(condition) != 0) {
			return !me.addCondition(type, condition);
		} else {
			return true;
		}
	});
	return !hasError;
};


/**
 * コンディションを追加するメソッド。
 * 
 * @param {[type]} type      [description]
 * @param {[type]} condition [description]
 */
Schedule.prototype.addCondition = function(type, condition) {
	// コンディションの値をチェック
	if (!this._checkCondition(condition)) {
		return false;
	}
	// コンディションの追加
	if (type.toLowerCase() === 'match') {
		this.matchConditions.push(condition);
	} else if (type.toLowerCase() === 'except') {
		this.exceptConditions.push(condition);
	} else {
		return false;
	}
	return true;
}


Schedule.prototype.hasDate = function(date) {
	var me = this,
		matchResult;
	if (!(date instanceof Date)) {
		return false;
	}
	matchResult = this.matchConditions.some(function(condition) {
		return me._dateMatchCondition(date, condition);
	});
	if (!matchResult) {
		return false;
	}
	return !this.exceptConditions.some(function(condition) {
		return me._dateMatchCondition(date, condition);
	});
}


/**
 * 日付がコンディションに含まれるか判定するメソッド。
 * 
 * @param  {[type]} date      [description]
 * @param  {[type]} condition [description]
 * @return {[type]}           [description]
 */
Schedule.prototype._dateMatchCondition = function(date, condition) {
	var compared = {
			year: date.getFullYear(),
			month: date.getMonth() + 1,
			date: date.getDate(),
			day: this._getDayText(date),
			week: this._getWeekCount(date)
		},
		numReg = new RegExp('\\d+\\-\\d+|\\d+', 'g'),
		mismatch;

	// 年、月、日付、週カウントを比較
	mismatch = ['year', 'month', 'date', 'week'].some(function(prop) {
		if (condition.hasOwnProperty(prop)) {
			return !condition[prop].match(numReg).some(function(ptn) {
				var i = ptn.indexOf('-');
				if (i > -1) {
					return (compared[prop] >= parseInt(ptn)) && (compared[prop] <= parseInt(ptn.substring(i + 1)));
				} else {
					return compared[prop] == ptn;
				}
			});
		}
	});

	// 曜日を比較
	if (!mismatch && condition.hasOwnProperty('day')) {
		mismatch = (condition['day'].indexOf(compared['day']) === -1)
	}

	return !mismatch;
};


Schedule.prototype._getDayText = function(date) {
	return this.dayTexts[date.getDay()];
};

/**
 * 日付の曜日の週目カウントを取得するメソッド。
 * 
 * @param  {[type]} date [description]
 * @return {[type]}      [description]
 */
Schedule.prototype._getWeekCount = function(date) {
	return Math.floor((date.getDate() - 1) / 7) + 1;
}

/**
 * コンディションオブジェクトをチェックし校正するメソッド。
 * 
 * @param  {[type]} condition [description]
 * @return {[type]}           校正したコンディションオブジェクト。
 */
Schedule.prototype._checkCondition = function(condition) {
	var me = this,
		trimReg = new RegExp('[　\\s]+|,[　\\s]*$', 'g'),
		hasError; // 引数にエラーがあればtrue
	hasError = ['year', 'month', 'date', 'week'].some(function(prop) {
		var ptns;
		switch (typeof condition[prop]) {
			case 'number':
				break;
			case 'string':
				if ((ptns = condition[prop].match(/^(?:\d+|\d+\-\d+)(?:,(?:\d+|\d+\-\d+))*$/)) === null) {
					return true;
				} else {
					return ptns.some(function(ptn) {
						var i = ptn.indexOf('-');
						if (i > -1) {
							return parseInt(ptn.substring(0, i)) > parseInt(ptn.substring(i + 1));
						}
					});
				}
				break;
		}
	});
	if (hasError) {
		return false;
	}
	switch (typeof condition['day']) {
		case 'string':
			condition['day'] = condition['day'].replace(trimReg, '');
			if (condition.day.match(/^(?:mon|tue|wed|thu|fri|sat|sun)(?:,(?:mon|tue|wed|thu|fri|sat|sun))*$/) === null) {
				return false;
			}
			break;
	}
	return true;
}




/* ###################################

	TEST

################################### */
$(document).on('pageinit', '#calendar', function() {



});