Components.utils.import("resource://cwh/ChaikaP2Login.js");

function PostP2(aThread, aBoard){
	this._thread = aThread;
	this._board = aBoard;
}

PostP2.prototype = {

	charset: 'Shift_JIS',

	submit: function PostP2_submit(aListener, additionalData){
		this._listener = aListener;
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var postURI = ioService.newURI(ChaikaCore.pref.getChar('login.p2.post_url'), null, null);

		this._httpRequest = new HttpRequest(postURI, null, this);

		//JBBS用に調整
		if(this._board.url.host.indexOf('jbbs.livedoor.jp') > -1){
			var bbs = this._board.url.directory.match(/\/([^\/]+)\/?$/)[1];
			var host = this._board.url.host + '%2F' + this._board.url.directory.match(/\/([^\/]+)\/?/)[1];
		}else{
			var bbs = this._board.url.directory.match(/\/([^\/]+)\/?$/)[1];
			var host = this._board.url.host;
		}

		//csrfidを書き込みページから取得する
		var csrfid = ChaikaP2Login.getCsrfid(host, bbs, this._thread.datID);
		if(!csrfid){
			return this._listener.onError(this, "P2 LOGIN ERROR", this.UNKNOWN);
		}

		var postData = [];
		postData.push("bbs="    + bbs);
		postData.push("key="    + this._thread.datID);
		postData.push("time="   + Math.ceil(new Date(this._thread.lastModified).getTime() / 1000));
		postData.push("MESSAGE=" + this._convert(this.message, this.charset, false, true));
		postData.push("FROM="    + this._convert(this.name, this.charset, false, true));
		postData.push("mail="    + this._convert(this.mail, this.charset, false, true));
		postData.push("host="    + host);
		postData.push("csrfid="  + csrfid);
		postData.push("detect_hint=%81%9D%81%9E");

		if(ChaikaBeLogin.isLoggdIn()){
			postData.push("submit_beres=" + this._convert("BEで書き込む", this.charset, false, true));
		}else{
			postData.push("submit=" + this._convert("書き込む", this.charset, false, true));
		}

		if(additionalData){
			postData = postData.concat(additionalData);
		}

		this._httpRequest.post(postData.join("&"));
	}
};
PostP2.prototype.__proto__ = Post.prototype;


function Post2chNewThreadP2(aBoard){
	this._thread = null;
	this._board = aBoard;
}

Post2chNewThreadP2.prototype = {
	submit: function Post2chNewThreadP2_submit(aListener, additionalData){
		this._listener = aListener;
		var ioService = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService);
		var postURI = ioService.newURI(ChaikaCore.pref.getChar('login.p2.post_url'), null, null);

		this._httpRequest = new HttpRequest(postURI, null, this);

		//JBBS用に調整
		if(this._board.url.host.indexOf('jbbs.livedoor.jp') > -1){
			var bbs = this._board.url.directory.match(/\/([^\/]+)\/?$/)[1];
			var host = this._board.url.host + '%2F' + this._board.url.directory.match(/\/([^\/]+)\/?/)[1];
		}else{
			var bbs = this._board.url.directory.match(/\/([^\/]+)\/?$/)[1];
			var host = this._board.url.host;
		}

		//csrfidを書き込みページから取得する
		var csrfid = ChaikaP2Login.getCsrfid(host, bbs, this._thread.datID);
		if(!csrfid){
			return this._listener.onError(this, "P2 LOGIN ERROR", this.UNKNOWN);
		}

		var postData = [];
		postData.push("bbs="    + bbs);
		postData.push("time="   + (Math.ceil(Date.now() / 1000) - 300));
		postData.push("subject=" + this._convert(this.title, this.charset, false, true));
		postData.push("MESSAGE=" + this._convert(this.message, this.charset, false, true));
		postData.push("FROM="    + this._convert(this.name, this.charset, false, true));
		postData.push("mail="    + this._convert(this.mail, this.charset, false, true));
		postData.push("host="    + host);
		postData.push("csrfid="  + csrfid);
		postData.push("detect_hint=%81%9D%81%9E");
		postData.push("newthread=1");

		if(ChaikaBeLogin.isLoggdIn()){
			postData.push("submit_beres=" + this._convert("BEで書き込む", this.charset, false, true));
		}else{
			postData.push("submit=" + this._convert("新規スレッド作成", this.charset, false, true));
		}

		if(additionalData){
			postData = postData.concat(additionalData);
		}

		this._httpRequest.post(postData.join("&"));
	}
};
Post2chNewThreadP2.prototype.__proto__ = Post2chNewThread.prototype;
