EXPORTED_SYMBOLS = ["ChaikaP2Login"];
Components.utils.import("resource://chaika-modules/ChaikaCore.js");

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

/** @ignore */
function makeException(aResult, aMessage){
	var stack = Components.stack.caller.caller;
	return new Components.Exception(aMessage || "exception", aResult, stack);
}

/**
 * p2.2ch.net ログインオブジェクト
 * @class
 */
var ChaikaP2Login = {

	//p2にログインしているかどうか
	_loggedIn: false,

	//p2経由で書き込むかどうか
	enabled: false,

	//再送信フラグ
	resubmit: false,

	get cookieManager(){
		if(!this._cookieManager)
			this._cookieManager = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager2);

		return this._cookieManager;
	},

	get os(){
		if(!this._os)
			this._os = Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);

		return this._os;
	},

	isLoggedIn: function ChaikaP2Login_isLoggedIn(){
		var psExists = this.cookieManager.cookieExists({
			host: ChaikaCore.pref.getChar("login.p2.cookie_domain"),
			path: '/',
			name: 'PS'
		});

		var cidExists = this.cookieManager.cookieExists({
			host: ChaikaCore.pref.getChar("login.p2.cookie_domain"),
			path: '/',
			name: 'cid'
		});

		ChaikaCore.logger.debug('ps exists:' + psExists + '; cid exists:' + cidExists);

		//クッキーがあればログイン済みである
		this._loggedIn = psExists && cidExists;

		return this._loggedIn;
	},

	login: function ChaikaP2Login_login(){
		this._loggedIn = false;

		var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
		req.addEventListener('load', this, false);

		var formStr = Cc["@mozilla.org/supports-string;1"].createInstance(Ci.nsISupportsString);
		var mail = "form_login_id=" + encodeURIComponent(ChaikaCore.pref.getChar("login.p2.id"));
		var pass = "form_login_pass=" + encodeURIComponent(ChaikaCore.pref.getChar("login.p2.password"));
		var extra = "ctl_register_cookie=1&register_cookie=1&submit_userlogin=%83%86%81%5B%83U%83%8D%83O%83C%83%93";
		formStr.data = [mail, pass, extra].join("&");

		req.open("POST", ChaikaCore.pref.getChar("login.p2.login_url"), true);
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.send(formStr);
	},

	logout: function ChaikaP2Login_logout(){
		//クッキーを削除する
		this.cookieManager.remove(ChaikaCore.pref.getChar("login.p2.cookie_domain"), 'PS', '/', false);
		this.cookieManager.remove(ChaikaCore.pref.getChar("login.p2.cookie_domain"), 'cid', '/', false);
		this._loggedIn = false;

		//ログアウトを通知
		this.os.notifyObservers(null, "ChaikaP2Login:Logout", "OK");
	},

	handleEvent: function(event){
		if(event.type === 'load'){
			if(this.isLoggedIn()){
				this.os.notifyObservers(null, "ChaikaP2Login:Login", "OK");
			}else{
				this.logout();
				this.os.notifyObservers(null, "ChaikaP2Login:Login", "NG");
			}
		}
	},

	getCsrfid: function(host, bbs, datID){
		var req = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
		var csrfid_url = ChaikaCore.pref.getChar('login.p2.csrfid_url');

		req.open('GET', csrfid_url + '?host=' + host + '&bbs=' + bbs + '&key=' + datID, false);
		req.send(null);

		var csrfid = req.responseText.match(/csrfid" value="([a-zA-Z0-9]+)"/);

		if(csrfid){
			ChaikaCore.logger.debug('csrfid: ' + csrfid[1]);
			return csrfid[1];
		}else{
			return null;
		}
	},

	QueryInterface : function(aIID) {
		if (aIID.equals(Ci.nsISupports) || aIID.equals(Ci.nsIObserver))
			return this;
		throw Cr.NS_NOINTERFACE;
	}
};
