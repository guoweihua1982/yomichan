var ymcContent = {
	popupSpacing : 5,
	enabled : false,
	oldSelectionText : "",
	expand : false,
	settingExpand : false,
	clickSettingPopup : false, 
	minFontSize : 10,
	maxFontSize : 20,
	noteFontSizeDiff: 4,
	setting: {
		backgroundColor: "#1C1C1C",
		textColor: "#4CEE4C",
		wordColor: "#FFFFFF",
		textFontSize: 12,
		wordFontSize: 14,
	},
	// 有効にする
	enable : function() {
		chrome.storage.local.get("showYomichanPopup", function(value) {
			ymcContent.expand = value.showYomichanPopup;
			if (ymcContent.expand === undefined) {
				ymcContent.expand=true;
			}
		});
		if (ymcContent.enabled) {
			return;
		}
		ymcContent.enabled = true;

		// Local Storageからポップアップの設定情報を取得
		chrome.storage.local.get("yomichanSetting", function(value) {
			let setting = value.yomichanSetting;
			if (setting === undefined) {
				chrome.storage.local.set({
					"yomichanSetting": ymcContent.setting
				}, function() {
				});
			} else {
				ymcContent.setting = setting;
			}
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
	onMouseUp : function(event) {
		if (ymcContent.clickSettingPopup) {
			return;
		}
		var selection = ymcContent.getSelection();
		if (selection == null
				|| (ymcContent.oldSelectionText == selection.selectionText && document
						.querySelectorAll('.yomichan-popup').length > 0)) {
			return;
		}
		if (selection != null && selection.selectionText != "") {
			try {
				chrome.runtime
						.sendMessage(
								{
									type : "getFurigana",
									data : selection.selectionText
								},
								function(response) {
									if (response) {
										var checkSelection = ymcContent
												.getSelection();
										if (ymcContent.enabled
												&& checkSelection != null
												&& checkSelection.selectionText != "") {
											ymcContent.closePopup();
											ymcContent.showPopup(selection,
													response);
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
	onMouseDown : function(event) {
		var settingPopup = document.querySelector(".yomichan-setting-popup")
		if (settingPopup) {
			var clickedElem = event.target.closest(".yomichan-setting-popup");
			if (clickedElem == settingPopup) {
				ymcContent.clickSettingPopup = true;
				return;
			}
		}
		ymcContent.clickSettingPopup = false;
	},
	// 選択内容が変わるイベント
	onSelectionchange : function(event) {
		if (ymcContent.clickSettingPopup) {
			return;
		}
		ymcContent.closePopup();
	},
	// ひらがなを付けるテキストのポップアップを表示
	showPopup : function(selection, html) {
		var popup = document.createElement('div');
		popup.style.backgroundColor = ymcContent.setting.backgroundColor;
		popup.classList.add('yomichan-popup');

		// 縮小ボタン
		var yomichanPopupToggleButton = document.createElement('button');
		yomichanPopupToggleButton.classList.add('yomichan-popup-toggle-button');
		popup.appendChild(yomichanPopupToggleButton);

		// 設定ボタン
		var yomichanSettingButton = document.createElement('button');
		yomichanSettingButton.classList.add('yomichan-setting-button');
		popup.appendChild(yomichanSettingButton);

		// コンテンツを表示するエリア
		var yomichanContent = document.createElement('div');
		yomichanContent.style.color = ymcContent.setting.textColor;
		yomichanContent.style.fontSize = ymcContent.setting.textFontSize + "px";
		yomichanContent.classList.add('yomichan-content');
		yomichanContent.innerHTML = html;
		popup.appendChild(yomichanContent);

		// bodyに追加
		document.body.appendChild(popup);

		// rubyのstyleを設定
		document.querySelectorAll('.yomichan-content>ruby').forEach(function(word) {
			word.style.color = ymcContent.setting.wordColor;
			word.style.fontSize = ymcContent.setting.wordFontSize + "px";
		});
		document.querySelectorAll('.yomichan-content>ruby>rt').forEach(function(word) {
			word.style.color = ymcContent.setting.wordColor;
			word.style.fontSize = ymcContent.setting.wordFontSize - ymcContent.noteFontSizeDiff + "px";
		});

		// 表示する幅を再計算
		var _style = window.getComputedStyle(popup, null);
		let horizontalPadding = parseFloat(_style.paddingLeft)
				+ parseFloat(_style.paddingRight);
		let verticalPadding = parseFloat(_style.paddingTop)
				+ parseFloat(_style.paddingBottom)
		let maxWidth = Math.max(selection.maxWidth, selection.width)
				- horizontalPadding;
		popup.style.maxWidth = Math.ceil(maxWidth) + "px";

		// 表示する内容の幅を取得し、ポップアップに設定する
		var range = document.createRange();
		range.selectNodeContents(yomichanContent);
		let width = Math.ceil(Math.min(maxWidth,
				range.getBoundingClientRect().width));
		popup.style.width = Math.ceil(width) + "px";
		window.getSelection().removeRange(range);

		// 表示する位置を計算
		let right = document.documentElement.clientWidth
				- (selection.right + document.documentElement.scrollLeft);
		right = Math.min(right, document.documentElement.clientWidth - width
				- horizontalPadding);
		right = Math.max(right, yomichanPopupToggleButton.clientWidth);
		popup.style.right = right + "px";
		if ((selection.top - popup.clientHeight - ymcContent.popupSpacing) < 0) {
			let y = selection.bottom + document.documentElement.scrollTop
					+ ymcContent.popupSpacing;
			popup.classList.add('yomichan-popup-bottom');
			popup.style.top = y + "px";
		} else {
			let y = document.documentElement.clientHeight
					- (selection.top + document.documentElement.scrollTop)
					+ ymcContent.popupSpacing;
			if ("relative" == window.getComputedStyle(document.body, null).position) {
				y += (document.documentElement.scrollHeight - document.documentElement.clientHeight);
			}
			popup.classList.add('yomichan-popup-top');
			popup.style.bottom = y + "px";
		}

		// 展開する場合のサイズを記憶
		var _clientH = popup.clientHeight - verticalPadding;
		var _clientW = popup.clientWidth - horizontalPadding;

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

			let settingButton = document.querySelector('.yomichan-setting-button');
			settingButton.style.display = expand ? 'block' : 'none';

			let settingPopup = document.querySelector('.yomichan-setting-popup');
			if (!expand && settingPopup) {
				settingPopup.remove();
				ymcContent.settingExpand = false;
			}

			if (expand) {
				popup.classList.remove('yomichan-popup-hidden');
			} else {
				popup.classList.add('yomichan-popup-hidden');
			}
		}

		// 設定ボタンの押下イベント
		yomichanSettingButton.addEventListener('click', function() {
			if (ymcContent.settingExpand == false) {
				showSettingPopup();
				ymcContent.settingExpand = true;
			} else {
				closeSettingPopup();
				ymcContent.settingExpand = false
			}
		}, false);

		// 設定ポップアップを表示
		function showSettingPopup() {
			var settingPopup = document.createElement('div');
			settingPopup.classList.add('yomichan-setting-popup');

			// 背景
			var bkgdDiv = document.createElement('div');

			var bkgdLabel = document.createElement('span');
			bkgdLabel.textContent = "背景：";
			bkgdDiv.appendChild(bkgdLabel);

			var bkgdColorPicker = document.createElement('input');
			bkgdColorPicker.type = 'color';
			bkgdColorPicker.value = ymcContent.setting.backgroundColor;
			bkgdColorPicker.classList.add('popup-setting');
			bkgdColorPicker.id = 'background-color';
			bkgdDiv.appendChild(bkgdColorPicker);

			settingPopup.appendChild(bkgdDiv);

			// 対象単語
			var wordDiv = document.createElement('div');

			var wordColorLabel = document.createElement('span');
			wordColorLabel.textContent = "漢字・ふりがな：";
			wordDiv.appendChild(wordColorLabel);

			var wordColorPicker = document.createElement('input');
			wordColorPicker.type = 'color';
			wordColorPicker.value = ymcContent.setting.wordColor;
			wordColorPicker.classList.add('popup-setting');
			wordColorPicker.id = 'word-color';
			wordDiv.appendChild(wordColorPicker);

			var wordFontSizeInput = document.createElement('input');
			wordFontSizeInput.type = 'range';
			wordFontSizeInput.value = ymcContent.setting.wordFontSize;
			wordFontSizeInput.min = ymcContent.minFontSize;
			wordFontSizeInput.max = ymcContent.maxFontSize;
			wordFontSizeInput.classList.add('popup-setting');
			wordFontSizeInput.id = 'word-font-size';
			wordDiv.appendChild(wordFontSizeInput);

			settingPopup.appendChild(wordDiv);
			
			// 漢字以外のテキスト
			var textDiv = document.createElement('div');

			var textLabel = document.createElement('span');
			textLabel.textContent = "漢字以外のテキスト：";
			textDiv.appendChild(textLabel);

			var textColorPicker = document.createElement('input');
			textColorPicker.type = 'color';
			textColorPicker.value = ymcContent.setting.textColor;
			textColorPicker.classList.add('popup-setting');
			textColorPicker.id = 'text-color';
			textDiv.appendChild(textColorPicker);

			var textFontSizeInput = document.createElement('input');
			textFontSizeInput.type = 'range';
			textFontSizeInput.value = ymcContent.setting.textFontSize;
			textFontSizeInput.min = ymcContent.minFontSize;
			textFontSizeInput.max = ymcContent.maxFontSize;
			textFontSizeInput.classList.add('popup-setting');
			textFontSizeInput.id = 'text-font-size';
			textDiv.appendChild(textFontSizeInput);

			settingPopup.appendChild(textDiv);

			// bodyに追加
			popup.appendChild(settingPopup);

			listenSettingChangeEvent();
		}

		// 設定項目を変更するイベント：該当項目を設定
		function listenSettingChangeEvent() {
			document.querySelectorAll(".popup-setting").forEach(function(elem) {
				elem.addEventListener("input", function(event) {
					let value = event.target.value;
					switch (elem.id) {
					case "background-color":
						// 背景色
						document.querySelector('.yomichan-popup').style.backgroundColor = value;
						ymcContent.setting.backgroundColor = value;
						break;
					case "text-color":
						// 漢字以外のテキストの色
						document.querySelector('.yomichan-content').style.color = value;
						ymcContent.setting.textColor = value;
						break;
					case "word-color":
						// 対象単語の色
						document.querySelectorAll(
							'.yomichan-content>ruby, .yomichan-content>ruby>rt'
						).forEach(function(word) {
							word.style.color = value;
						});
						ymcContent.setting.wordColor = value;
						break;
					case "text-font-size":
						// 漢字以外のテキストのフォントサイズ
						document.querySelector('.yomichan-content').style.fontSize = value + "px";
						resetPopupStyle();
						ymcContent.setting.textFontSize = value;
						break;
					case "word-font-size":
						// 対象単語のフォントサイズ
						document.querySelectorAll('.yomichan-content>ruby').forEach(function(word) {
							word.style.fontSize = value + "px";
						});
						document.querySelectorAll('.yomichan-content>ruby>rt').forEach(function(word) {
							word.style.fontSize = value - ymcContent.noteFontSizeDiff + "px";
						});
						resetPopupStyle();
						ymcContent.setting.wordFontSize = value;
						break;
					}
					// Local Storageに保存
					chrome.storage.local.set({
						'yomichanSetting' : ymcContent.setting
					}, function() {
					});
				}, false);
			});
		}

		function resetPopupStyle() {
			// 表示する内容の幅を取得し、ポップアップに設定する
			popup.style.width = maxWidth + "px";
			let yomichanContent = document.querySelector(".yomichan-content");
			let range = document.createRange();
			range.selectNodeContents(yomichanContent);
			popup.style.width = Math.ceil(Math.min(maxWidth,
					range.getBoundingClientRect().width)) + "px";
			popup.style.height = 'auto';
			window.getSelection().removeRange(range);
		}

		// 設定ポップアップを閉じる
		function closeSettingPopup() {
			document.querySelectorAll('.yomichan-setting-popup').forEach(function(popup) {
				popup.parentNode.removeChild(popup);
			});
		}
	},
	// ポップアップを閉じる
	closePopup : function() {
		let settingPopup = document.querySelector('.yomichan-setting-popup');
		if (settingPopup) {
			settingPopup.remove();
			ymcContent.settingExpand = false;
		}
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
chrome.runtime.sendMessage({
	type : "checkEnabled"
});
