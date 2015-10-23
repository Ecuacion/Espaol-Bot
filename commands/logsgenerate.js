/* Special logs */

const DATA_LOGS_PATH = "./logs/data-bot/";

function checkDir (dir) {
	try {
		if (!fs.existsSync(dir))
			fs.mkdirSync(dir);
	} catch (e) {}
}

function writeFile (file, data) {
	fs.writeFileSync(DATA_LOGS_PATH + file, data);
}

function getDynCmds () {
	var list = Object.keys(CommandParser.dynCommands).sort();
	if (!list.length) return "No hay comandos";
	var text = "Lista de comandos dinámicos" + ':\n\n';
	for (var i in CommandParser.dynCommands) {
		if (CommandParser.dynCommands[i].substr(0, 4) === "/ref") {
			text += i + ' ~ ' + toId(CommandParser.dynCommands[i].substr(5)) + '\n';
			continue;
		}
		text += i + ' -> "' + CommandParser.dynCommands[i] + '"' + '\n';
	}
	return text;
}

function getZeroTol () {
	var ztList = [];
	if (Settings.settings['zerotol']) {
		for (var i in Settings.settings['zerotol']) {
			var level = ztLevels[Settings.settings['zerotol'][i]] ? ztLevels[Settings.settings['zerotol'][i]].name : Settings.settings['zerotol'][i];
			ztList.push("Usuario" + ': ' + i + ' | ' + "Nivel" + ': ' + level);
		}
	}
	if (ztList.length) {
		return "Usuarios en la lista de toletancia 0" + ':\n\n' + ztList.join('\n');
	} else {
		return "La lista de tolerancia 0 esta vacía"
	}
}

function getAutoBan (tarRoom) {
	var nBans = 0;
	var text = "";
	if (Settings.settings['autoban'] && Settings.settings['autoban'][tarRoom]) {
		text += "Usuarios baneados permanentemente en" + ' ' + tarRoom + ':\n\n';
		for (var i in Settings.settings['autoban'][tarRoom]) {
			text += i + "\n";
			nBans++;
		}
	}
	if (Settings.settings['regexautoban'] && Settings.settings['regexautoban'][tarRoom]) {
		text += '\n' + "Expresiones regulares baneadas en" + ' ' + tarRoom + ':\n\n';
		for (var i in Settings.settings['regexautoban'][tarRoom]) {
			text += i + "\n";
			nBans++;
		}
	}
	if (nBans) {
		return text;
	} else {
		return "No hay usuarios en la lista negra de esta sala";
	}
}

function getBanWords (tarRoom) {
	if (!Settings.settings['bannedphrases']) return "(Empty list)";
	var bannedPhrases = Settings.settings['bannedphrases'][tarRoom];
	if (!bannedPhrases) return "(Empty list)";
	var banList = Object.keys(bannedPhrases);
	if (!banList.length) return "(Empty list)";
	return "Frases prohibidas en " + tarRoom + ":\n\n" + banList.join('\n');
}

exports.commands = {
	setlogslink: function (arg, by, room, cmd) {
		if (!this.isExcepted) return false;
		Settings.settings['prlogslink'] = arg;
		Settings.save();
		this.reply("Enlace para los logs del chat modificado: " + Settings.settings['prlogslink']);
	},
	logslink: 'getlogs',
	logs: 'getlogs',
	getlogs: function (arg, by, room, cmd) {
		if (!this.isExcepted && (room !== 'salastaff' || !this.isRanked('@'))) return false;
		this.reply("Logs del chat: " + Settings.settings['prlogslink']);
	},
	udl: 'updatedatalogs',
	updatedatalogs: function (arg, by, room, cmd) {
		if (!this.isRanked('~')) return false;
		checkDir(DATA_LOGS_PATH);
		writeFile("commands.log", getDynCmds());
		writeFile("zerotlerance.log", getZeroTol());
		writeFile("autoban-espaol.log", getAutoBan("espaol"));
		writeFile("autoban-eventos.log", getAutoBan("eventos"));
		writeFile("banwords-espaol.log", getBanWords("espaol"));
		writeFile("banwords-eventos.log", getBanWords("eventos"));
		this.reply("Archivos de datos actualizados");
	}
};
