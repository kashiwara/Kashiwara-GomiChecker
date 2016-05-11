(function($) {

	var itemData,
		sortData,
		detailPopup,
		$list,
		$search,
		$kanaScroll;


	/**
	 * 五十音の先頭の文字を取得するメソッド。
	 * @param  {string} kana ひらがなの文字。
	 * @return {string}      五十音の先頭文字。
	 */
	function　getKanaHead(kana) {
		var heads = [
				{head: 'あ', pattern: new RegExp('^[あ-お]')},
				{head: 'か', pattern: new RegExp('^[か-ご]')},
				{head: 'さ', pattern: new RegExp('^[さ-ぞ]')},
				{head: 'た', pattern: new RegExp('^[た-ど]')},
				{head: 'な', pattern: new RegExp('^[な-の]')},
				{head: 'は', pattern: new RegExp('^[は-ぽ]')},
				{head: 'ま', pattern: new RegExp('^[ま-も]')},
				{head: 'や', pattern: new RegExp('^[や-よ]')},
				{head: 'ら', pattern: new RegExp('^[ら-ろ]')},
				{head: 'わ', pattern: new RegExp('^[わ-ん]')}
			],
			i;
		for (i = 0; i < heads.length; i++) {
			if (kana.match(heads[i].pattern) != null) {
				return heads[i].head;
			}
		}
		return '';
	};


	/**
	 * 検索語配列が対象語配列に含まれるか判定するメソッド。
	 * 
	 * @param  {[type]} sourceArray [description]
	 * @param  {[type]} searchArray [description]
	 * @return {Boolean}            全ての検索語が含まれる場合はtrueを返す
	 */
	function matchArray(sourceArray, searchArray) {
		return !searchArray.some(function(search) {
			return !sourceArray.some(function(source) {
				return source.indexOf(search) > -1;
			});
		});
	};

	/**
	 * 分別データのテキストと一致するキーを取得するメソッド。
	 * 
	 */
	function getSrotKey(text) {
		var key = "";
		$.each(sortData ,function(k, obj) {
			if (key) {
				return false;
			}
			$.each(obj, function(_k, t) {
				if (text === t) {
					key = k;
					return false;
				}
			});
		});
		return key;
	}


	/**
	 * 分別リストの初期化メソッド。
	 */
	function initSortingList() {
		itemData.forEach(function(item, i) {
			var sortKey = getSrotKey(item.sort),
				sortText = sortData[sortKey].shortText;
			$(
				'<li><a>' +
				'<span class="sort-icon ' + sortKey + '">' + sortText + '</span>' +
				'<h2 class="name">' + item.name + '</h2>' +
				'<p class="description">' + (item.description || '') + '</p>' +
				'</a></li>'
			)
			.data({
				index: i,
				kana: item.kana,
				filtertexts: $.merge([item.kana, item.name, sortText], item.keywords)
			})
			.appendTo($list);
		});
	}

	/**
	 * リストのフィルターメソッド。
	 * @param  {String} inputStr フィルターをかける文字列。
	 */
	function filterSortingList(inputStr) {
		var strs = [];
		// 引数が空の場合はフィルターを解除
		if (!inputStr || (inputStr = inputStr.trim()) === '') {
			$list.find('li.md-hidden').removeClass('md-hidden');
			return;
		}
		// 引数をスペース区切りの配列に変換
		inputStr.toLowerCase().split(/\s+/).forEach(function(str) {
			strs.push(str);
		});
		// リストの一致しないものを隠す
		$list.find('li').each(function(i, elm) {
			var texts = $(elm).data('filtertexts');
			if (matchArray(texts, strs)) {
				$(elm).removeClass('md-hidden');
			} else {
				$(elm).addClass('md-hidden');
			}
		});
	}

	/**
	 * 五十音スクロールの状態更新メソッド。
	 * リストの非表示項目の五十音インデックスをグレーアウトする。
	 */
	function refreshKanaScrollEnabled() {
		$kanaScroll.find('a').removeClass('md-active');
		$list.find('li:visible').each(function(i, elm) {
			var head = getKanaHead($(elm).data('kana'));
			if (head) {
				$kanaScroll.find('a[data-head=' + head + ']').addClass('md-active');
			}
		});
	};

	/**
	 * 画面に表示されている項目の五十音インデックスを強調表示するメソッド。
	 */
	function refreshKanaScrollPosition() {
		var $b = $('.page-body'),
			elm = document.elementFromPoint(72, 150),
			$currentHead = $kanaScroll.find('.md-current'),
			$elm,　head;

		// 画面の一番上に表示されているリスト項目を取得
		elm = document.elementFromPoint($b.offset().left, $b.offset().top + 70);
		if (elm.tagName.toLowerCase() === 'li') {
			$elm = $(elm);
		} else {
			$elm = $(elm).parents('li').first();
		}

		// リスト項目のかなに対応する五十音インデックスを強調表示
		if ($elm.length > 0) {
			head = getKanaHead($elm.data('kana'));
			if ($currentHead.data('head') != head) {
				$currentHead.removeClass('md-current');
				$kanaScroll.find('a[data-head=' + head + ']').addClass('md-current');
			}
		}
	}


	/**
	 * 検索ボックスの初期化メソッド。
	 */
	function initSearchBox() {
		var $label = $search.find('label'),
			$input = $search.find('input'),
			$clear = $search.find('.clear-input');
		$input.on('keyup change', function(e) {
			if (this.value != '') {
				$clear.removeClass('md-hidden');
			} else {
				$clear.addClass('md-hidden');
			}
			filterSortingList(this.value);
			refreshKanaScrollEnabled();
			refreshKanaScrollPosition();
		});
		$clear.on('tap', function(e) {
			$input.val('').change();
			e.preventDefault();
		});
		$label.add($input).on('tap', function(e) {
			$input.focus();
			e.preventDefault();
		});
	}

	/**
	 * 詳細ポップアップのコンテンツをセットするメソッド。
	 * @param {Integer} itemIndex 分別リストのインデックス。
	 */
	function setPopupContent(itemIndex) {
		var item = itemData[itemIndex],
			sortKey = getSrotKey(item.sort),
			content;
		// Header
		content = '<div class="md-header md-shadow-1 ' + sortKey + '"><h1>' + item.name + '</h1>'
		content += '<span class="close-popup md-btn-icon"><i class="material-icons">close</i></span></div>';
		// Body
		content += '<div class="md-body"><h2 class="sort">' + sortData[getSrotKey(item.sort)].text + '</h2>';
		if (item.description) {
			content += '<p>' + item.description + '</p>';
		}
		if (item.recycle) {
			content += '<h2 class="recycle">拠点回収</h2>';
			content += '<p class="recycle-description">' + item.recycle + '</p>';
		}
		if (item.links.length > 0) {
			content += '<ul class="md-list md-dense">';
			item.links.forEach(function(link) {
				content += '<li><a href="' + link.url + '">' + link.title + '</a></li>';
			});
			content += '</ul>';
		}
		content += '</div>';
		detailPopup.setContent(content);
	};

	// jQuery Ready
	$(function() {
		
		detailPopup = new widget.Popup('#detail-popup');

		$list = $('#sorting-list');
		$search = $('#list-filter');
		$kanaScroll = $('#kana-scroll');
		$detail = detailPopup.element;


		// 分別リストを初期化
		$.when(
			$.ajax({url: 'data/items.json', dataType: 'json'}),
			$.ajax({url: 'data/sorts.json', dataType: 'json'})
		)
		.done(function(itemResults, sortResults) {
			itemData = itemResults[0];
			sortData = sortResults[0];
			initSortingList();
			refreshKanaScrollEnabled();
			$list.find('li').on('tap', function(e) {
				setPopupContent($(this).data('index'));
				detailPopup.open();
				e.preventDefault();
			});
		});

		// ページコンテンツの高さを調整
		$(window).on('resize', function() {
			$.fixContentHeight();
		}).trigger('resize');


		// 検索ボックスの初期化
		initSearchBox();

		// 50音インデックスのタップイベント
		$kanaScroll.find('a').on('tap', function(e) {
			var head = $(this).data('head'),
				$scroll = $('.page-body');
			if ($(this).hasClass('md-active')) {
				$list.find('li:visible').each(function(i, elm) {
					if (getKanaHead($(elm).data('kana')) === head) {
						$scroll.animateScrolling($scroll.scrollTop() + $(elm).position().top - 4);
						return false;
					}
				});
			}
			e.preventDefault();
		});


		// リストのスクロールイベント
		$('.page-body').on('scroll', function() {
			// かなスクロールの選択状態を更新
			refreshKanaScrollPosition();
		});


		// 詳細ポップアップ
		detailPopup.element.on('tap', '.close-popup', function(e) {
			detailPopup.close();
			e.preventDefault();
		});
		// 表示位置とサイズを調整
		$detail.on('beforeopen', function() {
			var h = $(window).height() * 0.8,
				$c = $('.page-content'),
				$inner = $(this).find('.wg-popup-inner');
			h -= $(this).find('.md-header').outerHeight();
			$(this).find('.md-body').css('max-height', h);
			$(this).css({
				top: ($(window).height() - $inner.outerHeight()) / 2 + 'px',
				left: ($c.width() - $(this).outerWidth()) / 2 + $c.offset().left + 'px' 
			})
		});

	});

})(jQuery);
