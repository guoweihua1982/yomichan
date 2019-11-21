var ymcContent = {
	enabled : false,
	enable : function() {
		enabled = true;
		window.addEventListener('mousedown', this.onMouseDown, false);
		window.addEventListener('mouseup', this.onMouseUp, false);
	},
	disable : function() {
		enabled = false;
		ymcContent.closeTooltip();
		window.removeEventListener('mousedown', this.onMouseDown, false);
		window.removeEventListener('mouseup', this.onMouseUp, false);
	},
	onMouseUp : function(e) {
		var selectionText = ymcContent.getSelectionText();
		if (selectionText != "") {
			try {
				chrome.runtime.sendMessage({
					type : "getFurigana",
					data : selectionText
				}, function(response) {
					if (enabled && ymcContent.getSelectionText() != "") {
						ymcContent.showTooltip(e, response);
					}
				});
			} catch (e) {
				// do nothing
			}
		}
	},
	onMouseDown : function(e) {
		ymcContent.closeTooltip();
	},

	showTooltip : function(e, html) {
		var x = 15;
		var y = 15;
		var tooltip = "<div class='yomichan-tooltip'>" + html + "</div>";
		$("body").append(tooltip);
		$(".yomichan-tooltip").css({
			"top" : (e.pageY + y) + "px",
			"left" : (e.pageX + x) + "px"
		}).show("fast");
	},

	closeTooltip : function() {
		$('.yomichan-tooltip').remove();
	},
	// 選択したテキストを抽出
	getSelectionText : function() {
		var selectionText = "";
		if (document.selection) {
			selectionText = document.selection.createRange().text;
		} else {
			selectionText = document.getSelection();
		}

		return $.trim(selectionText.toString());
	},
}

// backgroundからのメッセージを受け
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	console.log("onMessage");
	console.log(request, sender, sendResponse);
	switch (request.type) {
	case 'enableYomichan':
		ymcContent.enable(request.config);
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
