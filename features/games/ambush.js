/*
	Ambush
*/

var Ambush = require('./constructors.js').Ambush;

function send (room, str) {
	Bot.say(room, str);
}

function sendML (room, str) {
	var cmds = [];
	while (str.length > 300) {
		cmds.push(str.substr(0, 300));
		str = str.substr(300);
	}
	cmds.push(str);
	Bot.sendRoom(room, cmds, 1500);
}

function trans (data, room) {
	var lang = Config.language || 'english';
	if (Settings.settings['language'] && Settings.settings['language'][room]) lang = Settings.settings['language'][room];
	return Tools.translateGlobal('games', 'ambush', lang)[data];
}

exports.id = 'ambush';

exports.title = 'Ambush';

exports.aliases = [];

var parser = function (type, data) {
	if (type in {end: 1, forceend: 1}) {
		Features.games.deleteGame(this.room);
	}
};

exports.newGame = function (room, opts) {
	var generatorOpts = {
		room: room,
		title: exports.title,
		roundTime: 9500
	};
	var game = new Ambush(generatorOpts, parser);
	if (!game) return null;
	game.generator = exports.id;
	return game;
};

exports.commands = {
	j: 'join',
	"in": 'join',
	join: function (arg, by, room, cmd, game) {
		game.addPlayer(toId(by), by.substr(1));
	},
	players: function (arg, by, room, cmd, game) {
		if (!this.can('games')) return;
		game.getPlayers();
	},
	start: function (arg, by, room, cmd, game) {
		if (!this.can('games')) return;
		if (!game.startGame()) this.reply("No hay suficientes jugadores para poder iniciar el juego.");
	},
	fire: function (arg, by, room, cmd, game) {
		game.fire(toId(by), toId(arg));
	},
	end: 'endambush',
	endambush: function (arg, by, room, cmd, game) {
		if (!this.can('games')) return;
		game.forceend();
		this.reply("El juego de Ambush ha sido interrumpido");
	},
	me: function (arg, by, room, cmd, game) {
		var args = arg.split(" ");
		if (toId(args[0]) === "fires" && args.length > 1) {
			args.shift();
			game.fire(toId(by), toId(args.join(" ")));
		} else if (toId(args[0]) === "in") {
			game.addPlayer(toId(by), by.substr(1));
		}
	}
};
