/*
	Basic Commands
*/

function setPermission(room, perm, rank) {
	if (!Settings.settings.commands) Settings.settings.commands = {};
	if (!Settings.settings.commands[room]) Settings.settings.commands[room] = {};
	Settings.settings.commands[room][perm] = rank;
	Settings.save();
}

Settings.addPermissions(['say']);

exports.commands = {
	credits: 'about',
	bot: 'about',
	about: function () {
		this.restrictReply("Soy " + this.botName + ", el Bot de la sala Española, programado en Javascript para Node por Ecuacion y xJoelituh. (https://github.com/Ecuacion/Espaol-Bot)", 'info');
	},

	bottime: 'time',
	hora: 'time',
	time: function () {
		var f = new Date();
		this.restrictReply("**" + this.trad('time') + ":** __" + f.toString() + "__", 'info');
	},

	uptime: function () {
		var text = '';
		text += '**Uptime:** ';
		var divisors = [52, 7, 24, 60, 60];
		var units = [this.trad('week'), this.trad('day'), this.trad('hour'), this.trad('minute'), this.trad('second')];
		var buffer = [];
		var uptime = ~~(process.uptime());
		do {
			var divisor = divisors.pop();
			var unit = uptime % divisor;
			if (!unit) {
				units.pop();
				uptime = ~~(uptime / divisor);
				continue;
			}
			buffer.push(unit > 1 ? unit + ' ' + units.pop() + 's' : unit + ' ' + units.pop());
			uptime = ~~(uptime / divisor);
		} while (uptime);

		switch (buffer.length) {
		case 5:
			text += buffer[4] + ', ';
			text += buffer[3] + ', ';
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 4:
			text += buffer[3] + ', ';
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 3:
			text += buffer[2] + ', ' + buffer[1] + ', ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 2:
			text += buffer[1] + ' ' + this.trad('and') + ' ' + buffer[0];
			break;
		case 1:
			text += buffer[0];
			break;
		}
		this.restrictReply(text, 'info');
	},

	seen: function (arg, by, room, cmd) {
		var text = '';
		arg = toId(arg);
		if (!arg || arg.length > 18) return this.pmReply(this.trad('inv'));
		if (arg === toId(Bot.status.nickName)) return this.pmReply(this.trad('bot'));
		if (arg === toId(by)) return this.pmReply(this.trad('self'));
		var dSeen = Settings.userManager.getSeen(arg);
		if (dSeen) {
			text += '**' + (dSeen.name || arg).trim() + '** ' + this.trad('s1') + ' __' + Tools.getTimeAgo(dSeen.time, this.language).trim() + (this.trad('s2') ? ('__ ' + this.trad('s2')) : '__');
			if (dSeen.room) {
				switch (dSeen.action) {
					case 'j':
						text += ', ' + this.trad('j') + ' <<' + dSeen.room + '>>';
						break;
					case 'l':
						text += ', ' + this.trad('l') + ' <<' + dSeen.room + '>>';
						break;
					case 'c':
						text += ', ' + this.trad('c') + ' <<' + dSeen.room + '>>';
						break;
					case 'n':
						text += ', ' + this.trad('n') + ' **' + dSeen.args[0] + '**';
						break;
				}
			}
		} else {
			text += this.trad('n1') + ' ' + arg + ' ' + this.trad('n2');
		}
		this.pmReply(text);
	},

	publicalts: 'alts',
	alts: function (arg) {
		var text = '';
		arg = toId(arg);
		if (!arg || arg.length > 18) return this.pmReply(this.trad('inv'));
		var alts = Settings.userManager.getAlts(arg);
		if (alts && alts.length) {
			if (this.can("alts")) {
				var cmds = [];
				var toAdd;
				text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": ";
				for (var i = 0; i < alts.length; i++) {
					toAdd = alts[i] + (i < alts.length - 1 ? ", " : "");
					if ((text + toAdd).length > 300) {
						cmds.push(text);
						text = "";
					}
					text += toAdd;
				}
				if (text.length) cmds.push(text);
				this.pmReply(cmds);
				return;
			} else {
				if (alts.length <= 10) {
					text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": " + alts.join(", ");
				} else {
					var fAlts = [];
					for (var i = alts.length - 1; i >= 0 && i > alts.length - 10; i--) {
						fAlts.push(alts[i]);
					}
					text += this.trad('alts') + " " + Settings.userManager.getName(arg) + ": " + fAlts.join(", ") + ", (" + (alts.length - 10) + this.trad('more') + ")";
				}
			}
		} else {
			text += this.trad('n') + ' ' +  Settings.userManager.getName(arg);
		}
		this.pmReply(text);
	},

	say: function (arg) {
		if (!arg) return;
		if (!this.can('say')) return;
		if (!this.isExcepted) return this.reply(Tools.stripCommands(arg));
		return this.reply(arg);
	},

	lang: 'language',
	language: function (arg, by, room, cmd) {
		if (!this.isRanked('#')) return false;
		if (this.roomType !== 'chat') return this.reply(this.trad('notchat'));
		var lang = toId(arg);
		if (!lang.length) return this.reply(this.trad('nolang'));
		if (!Tools.translations[lang]) return this.reply(this.trad('v') + ': ' + Object.keys(Tools.translations).join(', '));
		if (!Settings.settings['language']) Settings.settings['language'] = {};
		Settings.settings['language'][room] = lang;
		Settings.save();
		this.language = lang;
		this.reply(this.trad('l'));
	},

	settings: 'set',
	set: function (arg, by, room, cmd) {
		if (!this.isRanked('#')) return false;
		if (this.roomType !== 'chat') return this.reply(this.trad('notchat'));
		var args = arg.split(",");
		if (args.length < 2) return this.reply(this.trad('u1') + ": " + this.cmdToken + cmd + " " + this.trad('u2'));
		var perm = toId(args[0]);
		var rank = args[1].trim();
		if (!(perm in Settings.permissions)) {
			return this.reply(this.trad('ps') + ": " + Object.keys(Settings.permissions).sort().join(", "));
		}
		if (rank in {'off': 1, 'disable': 1}) {
			if (!this.canSet(perm, true)) return this.reply(this.trad('denied'));
			setPermission(room, perm, true);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('d'));
		}
		if (rank in {'on': 1, 'all': 1, 'enable': 1}) {
			if (!this.canSet(perm, ' ')) return this.reply(this.trad('denied'));
			setPermission(room, perm, ' ');
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('a'));
		}
		if (Config.ranks.indexOf(rank) >= 0) {
			if (!this.canSet(perm, rank)) return this.reply(this.trad('denied'));
			setPermission(room, perm, rank);
			return this.reply(this.trad('p') + " **" + perm + "** " + this.trad('r') + ' ' + rank + " " + this.trad('r2'));
		} else {
			return this.reply(this.trad('not1') + " " + rank + " " + this.trad('not2'));
		}
	}
};
