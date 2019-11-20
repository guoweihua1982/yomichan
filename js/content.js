window.onmouseup = function(e) {
	var selectionText = getSelectionText();
	if (selectionText) {
		try {
			chrome.runtime.sendMessage({
				selectionText : selectionText
			}, function(response) {
				var x = 15;
				var y = 15;
				var tooltip = "<div class='yomi-tooltip'>" + response
						+ "</div>";
				$("body").append(tooltip);
				$(".yomi-tooltip").css({
					"top" : (e.pageY + y) + "px",
					"left" : (e.pageX + x) + "px",
					"position" : "absolute"
				}).show("fast");
			});
		} catch (e) {
			// do nothing
		}
	}
};
window.onmousedown = function(e) {
	$('.yomi-tooltip').remove();
}
function getSelectionText() {
	var selectionText = "";
	if (document.selection) {
		selectionText = document.selection.createRange().text;
	} else {
		selectionText = document.getSelection();
	}

	return $.trim(selectionText.toString());
}
