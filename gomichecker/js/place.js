var initMap;

(function($) {
	var map,
		markers,
		infoWindow,
		placeData,
		categoryMenu,
		$categoryList,
		$activeItem,
		markerPopup,
		$markerList;

	initMap = function() {
		map = new google.maps.Map(document.getElementById('google-map'), {
			center: {lat: 34.579287, lng: 135.628469},
			zoom: 14
		});
	};


	function initCategoryList() {
		$.each(placeData, function(key, cat) {
			$categoryList.append(
				'<li data-category="' + key + '"><a>' + cat.name + '</a></li>'
			);
		});
	}


	function markerClickHandler() {
		var info = this.info,
			html = '<h2 class="iw-title">' + this.title + '</h2>';
		if (info.address) {
			html += '<div class="iw-address">' + info.address + '</div>';
		}
		if (info.tel) {
			html += '<a class="iw-tel" href="tel:' + info.tel + '">';
			html += '<i class="material-icons">phone</i>' + info.tel + '</a>';
		}
		if (info.description) {
			html += '<p class="iw-description">' + info.description + '</p>';
		}
		if (info.links.length > 0) {
			html += '<ul class="iw-links">';
			info.links.forEach(function(link) {
				html += '<li><a href="' + link.url + '">' + link.title + '</a></li>';
			});
			html += '</ul>';
		}

		this.setZIndex(1000);
		infoWindow.marker = this;
		infoWindow.setContent(html);
		infoWindow.open(map, this);
	}

	function initMarkers() {
		markers = [];
		infoWindow = new google.maps.InfoWindow;
		infoWindow.addListener('closeclick', function() {
			infoWindow.marker.setZIndex(null);
		});
		$.each(placeData, function(key, cat) {
			cat['places'].forEach(function(place) {
				var marker = new google.maps.Marker({
						position: {lat: place.lat, lng: place.lng},
						title: place.name,
						category: key,
						info: place
					});
				markers.push(marker);
				marker.addListener('click', markerClickHandler);
			});
		});
	}

	function showMarkers(category) {
		var activeMarkers = [],
			interval = 30,
			bounds = new google.maps.LatLngBounds;

		// マーカーポップアップのリストを削除
		$markerList.children().remove();

		// マーカーをパース
		// - 表示するマーカーをピックアップ
		// - 表示エリアのBoundsを設定
		// - マーカーリストに項目を追加(dataプロパティにmarkerオブジェクトの参照を持つ)
		markers.forEach(function(marker) {
			marker.setMap(null);
			if (marker.category === category) {
				activeMarkers.push(marker);
				bounds.extend(marker.getPosition());
				$('<li><a>' + marker.title + '</a></li>').data('marker', marker).appendTo($markerList);
			}
		});

		// マーカーを表示
		activeMarkers.forEach(function(marker, index) {
			setTimeout(function() {
				marker.setMap(map);
			}, index * interval);
		});

		// 表示エリアを調整
		map.fitBounds(bounds);
		

	}

	function selectCategory($item) {
		if ($activeItem != null) {
			$activeItem.removeClass('md-active');
		}
		$activeItem = $item.addClass('md-active');
		$('#category-select .md-select-value').text($item.text());
	}


	$(function() {
		// 変数をセット
		categoryMenu = widget.Menu.new('#category-menu');
		markerPopup = widget.Popup.new('#marker-popup');
		$categoryList = $('#category-list');
		$markerList = $('#marker-list');

		// データ取得
		$.ajax({url: 'data/places.json', dataType: 'json'})
		.done(function(data) {
			var intervalId;

			// データを変数に保存
			placeData = data;

			// カテゴリーリストを作成
			initCategoryList(data);

			// google maps API のロードを待つ
			intervalId = setInterval(function() {
				if (typeof google === 'object') {
					
					// マーカーを作成
					initMarkers(data);
					
					// マップのサイズ調整
					$(window).on('resize', function() {
						google.maps.event.trigger(map, 'resize');
					});

					// デフォルトカテゴリーを選択
					$categoryList.children().first().trigger('tap');

					clearInterval(intervalId);
				}
			}, 100);
		});


		// コンテンツのサイズ調整
		$(window).on('resize', function() {
			$.fixContentHeight();
		}).trigger('resize');


		// カテゴリー選択ボタンのイベント
		$('#category-select').on('tap', function(e) {
			categoryMenu.open();
			e.preventDefault();
		});

		// カテゴリーメニューのイベント
		categoryMenu.element.on('beforeopen', function(e) {
			$(this).css('top', $('#category-select').offset().top);
		});

		// カテゴリーリストの選択イベント
		$categoryList.on('tap', 'li', function(e) {
			selectCategory($(this));
			showMarkers($(this).data('category'));
			setTimeout(function() {
				categoryMenu.close();
			}, 150);
			e.preventDefault();
		});

		// マーカーメニューボタンのイベント
		$('.open-marker-popup').on('tap', function(e) {
			$(this).addClass('md-animate');
			markerPopup.open();
			e.preventDefault();
		});

		// マーカーポップアップのイベント
		markerPopup.element.on('beforeopen', function() {
			var h = $(window).height(),
				w = $(window).width() - 32,
				$c = $('.page-content'),
				$inner = $(this).children('.wg-inner');
			h -= $(this).find('.md-header').outerHeight();
			h -= $(this).find('.md-footer').outerHeight();
			h -= 32;
			$(this).find('.md-body').css('max-height', h + 'px');
			$(this).css({
				top: ($(window).height() - $inner.height()) / 2 + 'px',
				left: ($c.width() - $(this).outerWidth()) / 2 + $c.offset().left + 'px'
			});
		})
		.on('beforeclose', function() {
			$('.open-marker-popup').removeClass('md-animate');
		});
		markerPopup.element.find('.close-popup').on('tap', function(e) {
			markerPopup.close();
			e.preventDefault();
		});

		// マーカーリストのイベント
		$markerList.on('tap', 'li', function(e) {
			var marker = $(this).data('marker');
			markerPopup.close();
			setTimeout(function() {
				google.maps.event.trigger(marker, 'click');
			}, 200);
			e.preventDefault();
		});
	});

})(jQuery);

