var ymcContent = {
	enabled : false,
	oldSelectionText : "",
	expand : false,
	// 有効にする
	enable : function() {
		if (ymcContent.enabled) {
			return;
		}
		ymcContent.enabled = true;

		chrome.storage.local.get("showYomichanPopup", function(value) {
			ymcContent.expand = value.showYomichanPopup;
		});
		window.addEventListener('mousedown', this.onMouseDown, false);
		window.addEventListener('mouseup', this.onMouseUp, false);
		document.addEventListener('selectionchange', this.onSelectionchange,
				false);
	},
	// 無効にする
	disable : function() {
		if (!ymcContent.enabled) {
			return;
		}
		ymcContent.enabled = false;
		ymcContent.closePopup();
		window.removeEventListener('mousedown', this.onMouseDown, false);
		window.removeEventListener('mouseup', this.onMouseUp, false);
		window.removeEventListener('selectionchange', this.onSelectionchange,
				false);
	},
	// マウスアップ
	onMouseUp : function(e) {
		var selection = ymcContent.getSelection();
		if (selection == null
				|| (ymcContent.oldSelectionText == selection.selectionText && document
						.querySelectorAll('.yomichan-popup').length > 0)) {
			return;
		}
		if (selection != null && selection.selectionText != "") {
			try {
				chrome.runtime.sendMessage({
					type : "getFurigana",
					data : selection.selectionText
				}, function(response) {
					if (response) {
						var checkSelection = ymcContent.getSelection();
						if (ymcContent.enabled && checkSelection != null
								&& checkSelection.selectionText != "") {
							ymcContent.closePopup();
							ymcContent.showPopup(selection, response);
							ymcContent.oldSelectionText = (selection != null) ? selection.selectionText
									: "";
						}
					}
				});
			} catch (e) {
				// do nothing
			}
		}
	},
	// マウスダウン
	onMouseDown : function(e) {
		// ymcContent.closePopup();
	},
	// 選択内容が変わるイベント
	onSelectionchange : function(e) {
		ymcContent.closePopup();
	},
	// ひらがなを付けるテキストのポップアップを表示
	showPopup : function(selection, html) {
		var popup = document.createElement('div');
		popup.classList.add('yomichan-popup');

		// 縮小ボタン
		var yomichanPopupToggleButton = document.createElement('button');
		yomichanPopupToggleButton.classList.add('yomichan-popup-toggle-button');
		popup.appendChild(yomichanPopupToggleButton);

		// コンテンツを表示するエリア
		var yomichanContent = document.createElement('div');
		yomichanContent.classList.add('yomichan-content');
		yomichanContent.innerHTML = html;
		popup.appendChild(yomichanContent);

		// bodyに追加
		document.body.appendChild(popup);

		// 表示する幅を再計算
		var _style = window.getComputedStyle(popup, null);
		let maxWidth = Math.max(selection.maxWidth, selection.width)
				- parseFloat(_style.paddingLeft)
				- parseFloat(_style.paddingRight);
		popup.style.maxWidth = maxWidth + "px";

		// 表示する内容の幅を取得し、ポップアップに設定する
		var range = document.createRange();
		range.selectNodeContents(yomichanContent);
		let width = Math.min(maxWidth, range.getBoundingClientRect().width);
		popup.style.width = width + "px";
		window.getSelection().removeRange(range);

		// 表示する位置を計算
		popup.style.right = (document.documentElement.clientWidth
				- (selection.right + document.documentElement.scrollLeft))
				+ "px";

		if ((selection.top - popup.clientHeight - 5) < 0) {
			let y = selection.bottom + document.documentElement.scrollTop + 5;
			popup.classList.add('yomichan-popup-bottom');
			popup.style.top = y + "px";
		} else {
			let y = (document.documentElement.clientHeight
					- (selection.top + document.documentElement.scrollTop) + 5)
			popup.classList.add('yomichan-popup-top');
			popup.style.bottom = y + "px";
		}

		// 展開する場合のサイズを記憶
		var _clientH = popup.clientHeight - parseFloat(_style.paddingTop)
				- parseFloat(_style.paddingBottom);
		var _clientW = popup.clientWidth;

		// 拡大縮小ボタンの押下イベント
		yomichanPopupToggleButton.addEventListener('click', function() {
			var isHidden = popup.classList.contains('yomichan-popup-hidden');
			togglePopup(isHidden);
		}, false);

		togglePopup(ymcContent.expand, true);

		// ポップアップの展開・縮小を設定
		function togglePopup(expand, isInit) {
			// 展開状態を記憶
			chrome.storage.local.set({
				'showYomichanPopup' : expand
			}, function() {
			});
			ymcContent.expand = expand;

			if (!isInit) {
				if (!popup.classList.contains('yomichan-popup-transition')) {
					popup.classList.add('yomichan-popup-transition');
				}
			}
			popup.style.height = expand ? _clientH + 'px' : '0px';
			popup.style.width = expand ? _clientW + 'px' : '0px';
			if (expand) {
				popup.classList.remove('yomichan-popup-hidden');
			} else {
				popup.classList.add('yomichan-popup-hidden');
			}

		}
	},
	// ポップアップを閉じる
	closePopup : function() {
		ymcContent.oldSelectionText = "";
		document.querySelectorAll('.yomichan-popup').forEach(function(popup) {
			popup.parentNode.removeChild(popup);
		});
	},
	// 選択したテキストを抽出
	getSelection : function() {
		if (window.getSelection) {
			let selection = window.getSelection();
			let selectionText = selection.toString();
			if (selection.rangeCount && selectionText != "") {
				let range = selection.getRangeAt(0);
				let selectionRect = range.getBoundingClientRect();
				let maxWidth = document.body.clientWidth;
				let parentEl = range.commonAncestorContainer;
				while (parentEl != null
						&& (parentEl.nodeType != Node.ELEMENT_NODE || parentEl.clientWidth == 0)) {
					// ELEMENT_NODEではない場合、上層のノードを取得する
					parentEl = parentEl.parentNode;
				}
				if (parentEl != null && parentEl.nodeType == Node.ELEMENT_NODE) {
					maxWidth = parentEl.clientWidth
							- (selectionRect.left - parentEl
									.getBoundingClientRect().left);
				}
				return {
					selectionText : selectionText,
					left : selectionRect.left,
					right : selectionRect.right,
					top : selectionRect.top,
					bottom : selectionRect.bottom,
					width : selectionRect.width,
					height : selectionRect.height,
					maxWidth : maxWidth
				};
			}
		}

		return null;
	}
}

// backgroundからのメッセージを受け
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.type) {
	case 'enableYomichan':
		ymcContent.enable();
		break;
	case 'disableYomichan':
		ymcContent.disable();
		break;
	default:
	}
});

// ページをロードする際に有効／無効の状態をチェックする
chrome.extension.sendMessage({
	type : "checkEnabled"
});
