const MAX_TOKEN_AGE = 24 * 60 * 60 * 1000;
const MAX_BAN_DURATION = 24 * 60 * 60 * 1000;

const LOGIN_HTML = '<form action="" method="post" name="form1" target="_self" id="login"><label><br /><strong>User: &emsp;</strong><input name="user" type="text" id="user" /></label><br /><br /><label><strong>Password: &emsp;</strong>  <input name="password" type="password" id="password" /></label><br /><br /><label><input type="submit" name="Submit" value="Log In" /></label></form><hr />';

const LOGOUT_HTML = '<br /><form action="" method="post" name="formlogout" target="_self" id="formlogout"><label><input type="submit" name="logout" value="Log Out" /></label></form><hr />';

const BOTTOM_HTML = '';

var http = require('http');

var SecureMonitor = exports.SecureMonitor = {
	connectionTimes: {},
	connections: {},
	bannedIps: {},
	countIp: function (ip, name) {
		if (this.bannedIps[ip]) return false;
		var now = Date.now();
		if (!this.connectionTimes[ip]) {
			this.connections[ip] = 1;
			this.connectionTimes[ip] = now;
			return true;
		}
		var duration = now - this.connectionTimes[ip];
		name = (name ? ': ' + name : '');
		if (ip in this.connections && duration < 10 * 60 * 1000) {
			this.connections[ip]++;
			if (this.connections[ip] >= 500) {
				report('IP ' + ip + ' has been banned for connection flooding (' + this.connections[ip] + ' times in the last ' + duration.duration() + name + ')');
				this.bannedIps[ip] = {
					date: now
				};
				return false;
			}
		} else {
			this.connections[ip] = 1;
			this.connectionTimes[ip] = now;
		}
		return true;
	},
	tokens: {},
	update: function () {
		for (var i in this.tokens) {
			if (Date.now() - this.tokens[i].date > MAX_TOKEN_AGE) {
				report("Delete token: " + i);
				delete this.tokens[i];
			}
		}
		for (var ip in this.bannedIps) {
			if (Date.now() - this.bannedIps[ip].date > MAX_BAN_DURATION) {
				delete this.bannedIps[ip];
			}
		}
		return;
	},
	login: function (user, pass) {
		if (!user) return false;
		user = toId(user);
		var conf = Config.logServer || {};
		var users = conf.users || {};
		if (!users[user]) return 'invalid';
		if (users[user].pass !== pass) return 'invalid';
		var token;
		do {
			token = Tools.generateRandomNick(10);
		} while (this.tokens[token]);
		this.tokens[token] = {
			user: user,
			pass: pass,
			date: Date.now()
		};
		return token;
	},
	deleteToken: function (token) {
		if (this.tokens[token]) delete this.tokens[token];
	},
	checkToken: function (token, room) {
		var acs = {
			user: false,
			denied: false,
			rooms: {}
		};
		var conf = Config.logServer || {};
		var users = conf.users || {};
		var rooms = conf.rooms || {};
		for (var i in rooms) {
			if (!rooms[i].private) acs.rooms[i] = 1;
		}
		var userid = false;
		if (token && this.tokens[token] && conf.users[this.tokens[token].user] && conf.users[this.tokens[token].user].pass === this.tokens[token].pass) {
			userid = this.tokens[token].user;
			acs.user = conf.users[userid].name;
			for (var i in conf.users[this.tokens[token].user].access) {
				acs.rooms[i] = 1;
			}
		} else {
			acs.user = false;
		}
		if (!room || !rooms[room]) {
			acs.denied = true;
		} else {
			if (rooms[room].private) {
				if (userid) {
					if (conf.users[userid].access && conf.users[userid].access[room]) acs.denied = false;
					else acs.denied = true;
				} else {
					acs.denied = true;
				}
			} else {
				acs.denied = false;
			}
		}
		return acs;
	}
};

function getLog (room, file, head) {
	if (!fs.existsSync('./logs/' + room + "/" + file)) return false;
	return (fs.readFileSync('./logs/' + room + "/" + file).toString());
}

function getMonthString (n) {
	var table = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	return table[parseInt(n) - 1];
}

function getLogInfo(file) {
	var txt = '(';
	try {
		file = file.substr(0, file.length - 4);
		var parts = file.split('_');
		if (parts.length < 4) return '(Unknown)';
		txt += 'Room: ' + parts[0] + ', Date: ' + getMonthString(parts[2]) + " " + parts[3] + ", " + parts[1];
		txt += ')';
		return txt;
	} catch (e) {
		return '(Unknown)';
	}
}

function getLogList (room) {
	try {
		var logList = '';
		var files = fs.readdirSync('./logs/' + room + '/');
		for (var i = 0; i < files.length; i++) {
			if (files[i].substr(-4) !== ".log") continue;
			logList += '<a style="margin-left:10px;" target="_blank" href="./' + files[i].substr(0, files[i].length - 4) + '">' + files[i] + '</a>&emsp;' + getLogInfo(files[i]) + ' <br /><br />';
		}
		return logList;
	} catch (e) {
		return '(No logs Found)';
	}
}

function parseCookies (request) {
	var list = {}, rc = request.headers.cookie;
	if (rc) rc.split(';').forEach(function (cookie) {
		var parts = cookie.split('=');
		list[parts.shift().trim()] = decodeURI(parts.join('='));
	});
	return list;
}

function setCookie (response, name, value) {
	report("Cookie: " + name + " = " + value);
	response.writeHead(200, {
		'Set-Cookie': (name + '=' + value)
	});
}

var qs = require('querystring');

function report (txt, type) {
	debug("LOG FEATURE: " + txt);
}

function roomOptions () {
	var co = Config.logServer || {};
	return co.rooms || {};
}

var configOpts = Config.logServer || {};

var opts = {
	port: 5400
};

for (var i in configOpts) opts[i] = configOpts[i];

var serverHandle = function (request, response, secToken, setToken) {
	var roomConfig = roomOptions();
	var url = request.url;
	var ip = request.connection.remoteAddress;
	var acs = SecureMonitor.checkToken(secToken);
	var htmlHead = {'Content-Type': 'text/html; charset=utf-8'};
	if (setToken) htmlHead['Set-Cookie'] = 'accesstoken=' + secToken + "; Path=/";
	var logHead = {'Content-Type': 'text/plain; charset=utf-8'};
	if (setToken) logHead['Set-Cookie'] = 'accesstoken=' + secToken + "; Path=/";
	var roomArr = [];
	for (var i in acs.rooms) {
		roomArr.push('<a target="_self" href="/' + i + '/">' + i + '</a>');
	}
	var title = '<h2>Logs Server - Pokemon Showdown Bot</h2>\n<p><strong>Server: </strong><a target="_blank" href="http://' + Config.server + ':' + Config.port + '">' + Config.server + '</a>&nbsp;|&nbsp;<strong>Bot: </strong>' + Bot.status.nickName + '</p><p><strong>Rooms: </strong>' + (roomArr.join('&nbsp;|&nbsp;') || '<i>(none)</i>') + '</p><hr />\n';
	if (secToken && secToken === 'invalid') {
		var html = '';
		html += '<html><head><title>Logs Server - Pokemon Showdown Bot</title></head>\n';
		html += '<body>\n';
		html += title;
		html += '<p>' + LOGIN_HTML + '&nbsp;<font color="red">Invalid credentials</font></p>\n';
		html += BOTTOM_HTML + '</body>\n</html>\n';
		response.writeHead(200, {
			 'Content-Type': 'text/html; charset=utf-8',
			 'Set-Cookie': 'accesstoken=none'
		});
		response.write(html);
		response.end();
		return;
	}
	if (!url || url === "/") {
		var html = '';
		html += '<html><head><title>Logs Server - Pokemon Showdown Bot</title></head>\n';
		html += '<body>\n';
		html += title;
		html += '<p>' + (acs.user ? ('User: <strong>' + acs.user + '</strong>' + LOGOUT_HTML) : LOGIN_HTML) + '</p>\n';
		html += '</p>' + BOTTOM_HTML;
		html += '</body>\n</html>\n';
		response.writeHead(200, htmlHead);
		response.write(html);
	} else {
		var parts = url.split('/');
		var room = parts[0] || parts[1];
		var file = (parts[0] ? parts[1] : parts[2]);
		var acsRoom = SecureMonitor.checkToken(secToken, room);
		if (!roomConfig[room]) {
			var html = '<html><head><title>404 - Not found</title></head>\n';
			html += '<body>\n';
			html += title;
			html += '<p>' + (acsRoom.user ? ('User: <strong>' + acsRoom.user + '</strong>' + LOGOUT_HTML) : LOGIN_HTML) + '</p>\n';
			html += '<h3>Room not found</h3>';
			html += '</body>\n</html>\n';
			response.writeHead(200, htmlHead);
			response.write(html);
			response.end();
			return;
		}
		if (acsRoom.denied) {
			var html = '';
			html += '<html><head><title>Access denied</title></head>\n';
			html += '<body>\n';
			html += title;
			html += '<p>' + (acsRoom.user ? ('User: <strong>' + acsRoom.user + '</strong>' + LOGOUT_HTML) : LOGIN_HTML) + '</p>\n';
			html += '<h3>Access denied</h3>';
			html += BOTTOM_HTML + '</body>\n</html>\n';
			response.writeHead(200, htmlHead);
			response.write(html);
			response.end();
			return;
		}
		if (!file) {
			var html = '';
			html += '<html><head><title>Logs Server - Pokemon Showdown Bot</title></head>\n';
			html += '<body>\n';
			html += title;
			html += '<p>' + (acsRoom.user ? ('User: <strong>' + acsRoom.user + '</strong>' + LOGOUT_HTML) : LOGIN_HTML) + '</p>\n';
			html += '<h3>Room: ' + room + '</h3>';
			html += '<h4>Logs</h4><p>';
			html += getLogList(room);
			html += '</p>' + BOTTOM_HTML + '</body>\n</html>\n';
			response.writeHead(200, htmlHead);
			response.write(html);
		} else {
			var log = getLog(room, file + '.log');
			if (!log) {
				var html = '<html><head><title>404 - Not found</title></head>\n';
				html += '<body>\n';
				html += title;
				html += '<p>' + (acsRoom.user ? ('User: <strong>' + acsRoom.user + '</strong>' + LOGOUT_HTML) : LOGIN_HTML) + '</p>\n';
				html += '<h3>404 - File Not Found</h3>';
				html += BOTTOM_HTML + '</body>\n</html>\n';
				response.writeHead(200, htmlHead);
				response.write(html);
				response.end();
				return;
			} else {
				response.writeHead(200, logHead);
				response.write(log);
			}
		}
	}
	response.end();
};

var handleRequest = function (request, response) {
	var url = request.url;
	var ip = request.connection.remoteAddress;
	if (!SecureMonitor.countIp(ip)) return request.connection.destroy(); //Ignore Banned Ips
	report(request.connection.remoteAddress + " requested " + request.url + " (" + Tools.getDateString() + ")");
	var roomConfig = roomOptions();
	SecureMonitor.update();
	request.on('error', function () {
		return;
	});
	response.on('error', function () {
		return;
	});
	if (url === '/favicon.ico') {
		var img = fs.readFileSync('./features/chatlogger/favicon.ico');
		response.writeHead(200, {'Content-Type': 'image/ico'});
		response.end(img, 'binary');
		return;
	}
	var cookies = parseCookies(request);
	var secToken = cookies['accesstoken'];
	var acs = SecureMonitor.checkToken(secToken);
	if (request.method === 'POST') {
		var body = '';
		request.on('data', function (data) {
			body += data;
			if (body.length > 1e6) request.connection.destroy();
		});
		request.on('end', function () {
			var post = qs.parse(body);
			if (post.logout) {
				if (acs.user) {
					SecureMonitor.deleteToken(secToken);
					serverHandle(request, response, 'none', true);
				}
			} else {
				var token = SecureMonitor.login(post.user, post.password);
				if (token) {
					serverHandle(request, response, token, true);
				} else {
					serverHandle(request, response, token);
				}
			}
		});
		return;
	}
	serverHandle(request, response, secToken);
};

var server = http.createServer(handleRequest);

setTimeout(function () {
	try{
		server.listen(opts.port, opts.bindaddress);
		report("Log Server Listening at " + (opts.bindaddress || "localhost") + ":" + opts.port);
	} catch (e) {
		error("Has iniciado 2 bots. Acaba con uno para poder iniciar este.");
		process.exit(1);
	}
}, 1000);

exports.server = server;
