var ymcContent = {
	enabled : false,
	// 有効にする
	enable : function() {
		if (ymcContent.enabled) {
			return;
		}
		ymcContent.enabled = true;
		window.addEventListener('mousedown', this.onMouseDown, false);
		window.addEventListener('mouseup', this.onMouseUp, false);
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
	},
	// マウスアップ
	onMouseUp : function(e) {
		var selection = ymcContent.getSelection();
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
							ymcContent.showPopup(selection, response);
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
		ymcContent.closePopup();
	},
	// ひらがなを付けるテキストのポップアップを表示
	showPopup : function(selection, html) {
		let maxWidth = Math.max(selection.maxWidth, selection.width);
		var popup = document.createElement('div');
		popup.classList.add('yomichan-popup');
		popup.style.maxWidth = maxWidth + "px";
		popup.innerHTML = html;

		document.body.appendChild(popup);

		// 表示する内容の幅を取得し、ポップアップに設定する
		var range = document.createRange();
		range.selectNodeContents(popup);
		popup.style.width = Math.min(maxWidth,
				range.getBoundingClientRect().width)
				+ "px";
		window.getSelection().removeRange(range);

		var x = selection.left
		var y = selection.top - popup.clientHeight - 5;
		if (x < 0) {
			x = 0;
		}
		if ((y - document.documentElement.scrollTop) < 0) {
			y = selection.bottom + 5;
		}
		popup.style.left = x + "px";
		popup.style.top = y + "px";

	},
	// ポップアップを閉じる
	closePopup : function() {
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
					left : selectionRect.left
							+ document.documentElement.scrollLeft,
					right : selectionRect.right
							+ document.documentElement.scrollLeft,
					top : selectionRect.top
							+ document.documentElement.scrollTop,
					bottom : selectionRect.bottom
							+ document.documentElement.scrollTop,
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
