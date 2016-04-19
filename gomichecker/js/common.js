

/**
 * スクロールアニメーション。
 * 
 * @param  {[type]} value   [description]
 * @param  {[type]} duration [description]
 * @return {[type]}          [description]
 */
$.fn.animateScrolling = function(value, duration, interval) {
	var $elm = this,
		startValue = this.scrollTop(),
		changeAmount = value - startValue,
		interval = parseInt(interval) || 16,
		frameCount = Math.ceil((duration || 200) / interval),
		currentFrame = 0,
		intervalId;
	intervalId = setInterval(function(){
		$elm.scrollTop(function(i, currentScroll) {
			var change;
			if (currentFrame < frameCount) {
				change = $.easing.swing(currentFrame / frameCount) * changeAmount;
				currentFrame++;
				return change + startValue;
			} else {
				clearInterval(intervalId);
				return value;
			}
		});
	}, interval);
};


/**
 * ページコンテンツの高さ調整メソッド。
 * 
 * @return {[type]} [description]
 */
$.fixContentHeight = function() {
	$('.page-body').height($(window).height() - $('.page-header').outerHeight());
};


$(function() {

	var sidebar = widget.Sidebar.new('#sidebar');


	// ##########################################
	// 
	//  Message for IE
	// 
	// ##########################################
	if (navigator.userAgent.match(/msie|trident/i)) {
		alert('このページは Internet Explorer では正常に動作しません。\n他のブラウザーでご覧ください。');
	}

	// ##########################################
	// 
	//  サイドバー
	// 
	// ##########################################
	$('.open-sidebar').on('tap', function(e) {
		sidebar.open();
		e.preventDefault();
	});

	sidebar.element.find('.close-sidebar').on('tap', function(e) {
		sidebar.close();
		e.preventDefault();
	});


});