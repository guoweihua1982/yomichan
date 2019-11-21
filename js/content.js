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
					var checkSelection = ymcContent.getSelection();
					if (ymcContent.enabled && checkSelection != null
							&& checkSelection.selectionText != "") {
						ymcContent.showPopup(selection, response);
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
		var popup = document.createElement('div');
		popup.classList.add('yomichan-popup');
		popup.innerHTML = html;
		if (selection.selectionText.split(/\r\n|\r|\n/).length > 1) {
			// 複数行の場合、幅は選択区域と同じにする
			popup.style.width = selection.width + "px";
		} else {
			popup.style.maxWidth = "50%";
		}

		document.body.appendChild(popup);

		var x = selection.left
		var y = selection.top - popup.clientHeight - 10;
		if (x < 0) {
			x = 0;
		}
		if (y < 0) {
			y = 0;
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
			if (selectionText != "") {
				let selectionRect = selection.getRangeAt(0)
						.getBoundingClientRect();
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
					height : selectionRect.height
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
