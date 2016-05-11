(function($) {

	var areaData,
		scheduleData,
		sortData,
		areaMenu,
		$areaList,
		$activeItem,
		calendar;

	/**
	 * 地区リストの初期化メソッド。
	 * 
	 */
	function initAreaList() {
		var $areaList = $('#area-list');
		areaData.forEach(function(area) {
			$('<li data-area-id="' + area.id + '" data-schedule="' + area.schedule + '">' +
				'<a href="#">' + area.name + '</a></li>')
			.appendTo($areaList);
		});
	}


	/**
	 * カレンダーに収集日を表示する処理をセット。
	 * 
	 */
	function setSchedules(queries) {
		var schedules = {};
		$.each(queries, function(key, query) {
			schedules[key] = new utility.DateMatcher();
			schedules[key].loadQuery(query);
		});
		
		DM = schedules;

		calendar.element.on('cellupdate', function(e, ui) {
			// 現在の表示を削除
			$(ui.element).find('.wg-calendar-icons').children().remove();
			// 新しい表示を追加
			if (ui.date) {
				$.each(schedules, function(key, dm) {
					if (dm.hasDate(ui.date)) {
						$(ui.element).find('.wg-calendar-icons').append(
							'<span class="sort-label ' + key + '">' + sortData[key].shortText + '</span>');
					}
				});
			}
		});
	}


	/**
	 * 地区を選択するメソッド。
	 * 
	 */
	 function selectArea($item) {
		if ($activeItem != null) {
			$activeItem.removeClass('md-active');
		}
		$activeItem = $item.addClass('md-active');
		$('#area-select .md-select-value').text($item.text());
		localStorage.setItem('gc_area_id', $item.data('areaId'));
	};


	// jQuery ready
	$(function() {
		// 変数をセット
		calendar = new widget.Calendar('#schedule-calendar');
		areaMenu = new widget.Menu('#area-menu');
		$areaList = $('#area-list');

		// データの読み込み
		$.when(
			$.ajax({url: 'data/areas.json', dataType: 'json'}),
			$.ajax({url: 'data/schedules.json', dataType: 'json'}),
			$.ajax({url: 'data/sorts.json', dataType: 'json'})
		)
		.done(function(areaResuls, scheduleRsults, sortResults) {
			// データを変数に保存
			areaData = areaResuls[0];
			scheduleData = scheduleRsults[0];
			sortData = sortResults[0];

			// 地区リストを初期化
			initAreaList();

			// cookieから選択済みの地区を取得
			if (localStorage.hasOwnProperty('gc_area_id')) {
				$activeItem = $areaList.find('li[data-area-id=' + localStorage.getItem('gc_area_id') + ']');
			} else {
				$activeItem = $areaList.find('li[data-area-id=35]');
			}

			// 地区の選択状態を変更
			$activeItem.trigger('tap');
		});

		// コンテンツの高さを調整
		$.fixContentHeight();

		// 地区選択ボタンのイベント
		$('#area-select').on('tap', function(e) {
			areaMenu.open();
			e.preventDefault();
		});

		// 地区選択メニューのイベント
		areaMenu.element.on('beforeopen', function(e) {
			var h = $(window).height();

			// 地区リストメニューの高さ調整
			h -= $('.page-header').outerHeight(true);
			h -= 48; // 画面下端からの距離
			$areaList.height(h);
			// $(this).css('top', $('#area-select').offset().top - 8);
			$(this).css('top', $('#area-select').offset().top);
		})
		.on('afteropen', function() {
			$areaList.scrollTop($activeItem.index() * $activeItem.outerHeight());
		});

		// 地区リストのイベント
		$areaList.on('tap', 'li', function(e) {
			selectArea($(this));
			setSchedules(scheduleData[$(this).data('schedule')]);
			calendar.refresh();
			setTimeout(function() {
				areaMenu.close();
			}, 150);
			e.preventDefault();
		});
	});
})(jQuery);
