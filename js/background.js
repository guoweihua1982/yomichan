// 初期化
ymcMain.init();

// ブラウザの上部のアイコンをクリックするイベント：有効／無効状態を設定
chrome.browserAction.onClicked.addListener(ymcMain.onClicked);
// タブ切り替えイベント:有効／無効状態をチェックし、contentに送信
chrome.tabs.onSelectionChanged.addListener(ymcMain.onSelectionChanged);

// contentからのメッセージを受ける
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	switch (request.type) {
	case 'checkEnabled':
		// 有効／無効の状態をcontentに送信する
		ymcMain.sendEnabled(sender.tab.id);
		break;
	case 'getFurigana':
		// ふりがなを表示する要求
		ymcMain.getFurigana(request.data, sendResponse);
		break;
	default:
		console.log("認識できないタイプ.request=" + request);
	}
});