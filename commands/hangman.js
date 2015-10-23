
/*
	Games
*/

if (global.Games) {
	for (var i in Games) {
		if (Games[i].game && typeof Games[i].game.destroy === "function") {
			try {
				Games[i].game.destroy();
			} catch (e) {}
		}
		delete Games[i]; //deallocate
	}
}

global.Games = {};

if (Settings.timeouts) {
	for (var i in Settings.timeouts) {
		Settings.timeouts[i].destroy();
		delete Settings.timeouts[i];
	}
}
Settings.timeouts = {};

function parseTime (str) {
	if (typeof str !== "string") return 0;
	str = str.trim().toLowerCase().replace(/[ ]/g, ',');
	strs = str.split(',');
	var num = 0, tempNumber = '', unt = 1000;
	var units = {'s': 1000, 'm': 60 * 1000, 'h': 60 * 60 * 1000, 'd': 24 * 60 * 60 * 1000};
	for (var i = 0; i < strs.length; i++) {
		strs[i] = strs[i].trim();
		if (!strs[i]) continue;
		tempNumber = '';
		unt = 1000;
		for (var c = 0; c < strs[i].length; c++) {
			if (strs[i].charAt(c) in units) {
				unt = units[strs[i].charAt(c)];
				break;
			} else {
				tempNumber += strs[i].charAt(c)
			}
		}
		num += parseFloat(tempNumber) * unt;
	}
	return num;
}

/*****************************************
*				Anagrams
******************************************/

function generateRandomWord () {
	var res = {word: '', clue: ''};
	try {
		var hangmanWords = require('./../hangman-data.js').hangmanWords;
	} catch (e) {
		return null
	}
	var Opts = Object.keys(hangmanWords);
	if (!Opts.length) {
		return null;
	}	
	var randClue = Opts[Math.floor(Math.random() * Opts.length)];
	var wordsF = hangmanWords[randClue];
	res.word = wordsF[Math.floor(Math.random() * wordsF.length)];
	res.clue = randClue;
	return res;
}

function generateRandomPokeWord () {
	var res = {word: '', clue: ''};
	var Opts = ['pokemon', 'pokemon', 'move', 'ability', 'nature', 'item'];
	var chosen = Opts[Math.floor(Math.random() * Opts.length)];
	switch (chosen) {
		case 'pokemon':
			try {
				var pokedex = require('./../data/pokedex.js').BattlePokedex;
			} catch (e) {
				return null;
			}
			var pokemon = Object.keys(pokedex);
			do {
				var rand = Math.floor(Math.random() * pokemon.length);
			} while (pokedex[pokemon[rand]].num <= 0);
			res.word = pokedex[pokemon[rand]].species.replace(/[-]/, " ");
			var randClue = Math.floor(Math.random() * 4);
			switch(randClue) {
				case 0:
					res.clue = pokedex[pokemon[rand]].types[0] + " type";
					break;
				case 1:
					res.clue =  pokedex[pokemon[rand]].types[1] ? (pokedex[pokemon[rand]].types[1] + " type") : (pokedex[pokemon[rand]].types[0] + " type");
					break;
				case 2:
					if (pokedex[pokemon[rand]].num <= 151) res.clue = 'Gen 1';
					else if (pokedex[pokemon[rand]].num <= 251) res.clue = 'Gen 2';
					else if (pokedex[pokemon[rand]].num <= 386) res.clue = 'Gen 3';
					else if (pokedex[pokemon[rand]].num <= 493) res.clue = 'Gen 4';
					else if (pokedex[pokemon[rand]].num <= 649) res.clue = 'Gen 5';
					else res.clue = 'Gen 6';
					break;
				default:
					var formatsData = require('./../data/formats-data.js').BattleFormatsData;
					if (formatsData[pokemon[rand]] && formatsData[pokemon[rand]].tier) {
						res.clue = "Tier " + formatsData[pokemon[rand]].tier;
					} else {
						res.clue = (pokedex[pokemon[rand]].types[1] ? pokedex[pokemon[rand]].types[1] : pokedex[pokemon[rand]].types[0]) + " type";																							
					}
			}
			res.clue = "Pokemon " + res.clue;
			break;
		case 'move':
			try {
				var movedex = require('./../data/moves.js').BattleMovedex;
			} catch (e) {
				return null;
			}
			var moves = Object.keys(movedex);
			var rand = moves[Math.floor(Math.random() * moves.length)];
			var moveChosen = movedex[rand];
			res.word = moveChosen.name.replace(/[-]/, " ");
			res.clue = "Move " + moveChosen.type + " type";
			break;
		case 'item':
			try {
				var items = require('./../data/items.js').BattleItems;
			} catch (e) {
				return null;
			}
			var itemArr = Object.keys(items);
			var rand = itemArr[Math.floor(Math.random() * itemArr.length)];
			var itChosen = items[rand];
			res.word = itChosen.name.replace(/[-]/, " ");
			res.clue = "Item gen " + itChosen.gen;
			break;
		case 'ability':
			try {
				var abilities = require('./../data/abilities.js').BattleAbilities;
			} catch (e) {
				return null;
			}
			var abilitiesArr = Object.keys(abilities);
			var rand = abilitiesArr[Math.floor(Math.random() * abilitiesArr.length)];
			var abChosen = abilities[rand];
			res.word = abChosen.name.replace(/[-]/, " ");
			res.clue = "Ability";
			break;
		case 'nature':
			var natures = ['Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'];
			res.word = natures[Math.floor(Math.random() * natures.length)].replace(/[-]/, " ");
			res.clue = "Nature";
			break;
	}
	return res;
}

var Anagrams = function () {
	var anagramObj = {
		room: '',
		word: '',
		wordId: '',
		clue: '',
		wordlist: [],
		actualWord: -1,
		gameTimer: null,
		timePerGame: 30000,
		timeBetween: 2000,
		guessAllow: false,
		points: {},
		names: {},
		toWord: function (word) {
			return word.toLowerCase().replace(/[^a-z0-9ñ]/g, '');
		},
		splitWord: function () {
			var arr = [];
			for (var i = 0; i < this.wordId.length; i++) {
				arr.push(this.wordId.charAt(i));
			}
			arr = arr.randomize();
			return arr.join(', ');
		},

		destroy: function () {
			if (this.gameTimer) {
				try {
					clearTimeout(this.gameTimer);
				} catch (e) {}
			}
		},
		startGame: function (room, wordList) {
			this.room = room;
			this.wordlist = wordList;
			this.actualWord = -1;
			this.points = {};
			this.lockGame();
			Bot.say(room, 'Se ha iniciado un juego de **Anagrams**. Este juego consiste en adivinar una palabra dadas sus letras desordenadas y una pista. Son **' + wordList.length + ' preguntas** y teneis **' + (this.timePerGame / 1000) + ' segundos** para responder cada una. Se juega con **,g [palabra]**');
			this.nextStep();
		},
		nextStep: function () {
			this.gameTimer = setTimeout(function () {
				this.gameTimer = null;
				this.nextWord();
			}.bind(this), this.timeBetween);
		},
		nextWord: function () {
			this.actualWord++;
			if (this.actualWord >= this.wordlist.length) {
				this.endGame();
				return;
			}
			var ind = this.actualWord;
			this.word = this.wordlist[ind].word;
			this.wordId = this.toWord(this.word);
			this.clue = this.wordlist[ind].clue;
			this.guessAllow = true;
			Bot.say(this.room, '**Anagrams: [' + this.clue + ']** ' + this.splitWord());
			this.gameTimer = setTimeout(function () {
				this.gameTimer = null;
				this.lockGame();
				Bot.say(this.room, '**Anagrams:** El tiempo se ha acabado! La respuesta era __' + this.word + '__');
				this.nextStep();
			}.bind(this), this.timePerGame);
		},
		lockGame: function () {
			this.guessAllow = false;
		},
		guessWord: function (by, word) {
			if (!this.guessAllow) return;
			word = this.toWord(word);
			var user = toId(by);
			if (this.wordId !== word) return;
			this.lockGame();
			try {
				clearTimeout(this.gameTimer);
				this.gameTimer = null;
			} catch (e) {}
			if (!this.points[user]) this.points[user] = 0;
			this.points[user]++;
			this.names[user] = by.substr(1);
			Bot.say(this.room, 'Felicidades a **' + by.substr(1) + '** por acertar. Puntuacion: **' + this.points[user] + ' puntos**. La palabra era __' + this.word + '__');
			this.nextStep();
		},
		endGame: function () {
			//parse Points
			var maxPoints = 0;
			for (var i in this.points) {
				if (maxPoints < this.points[i]) maxPoints = this.points[i];
			}
			if (!maxPoints) {
				Bot.say(this.room, 'El juego de **Anagrams** ha terminado! Lamentablemente nadie ha conseguido responder a ninguna de la preguntas (lol) por lo que no hay ningún ganador.');
			} else {
				var winners = [];
				for (var i in this.points) {
					if (maxPoints === this.points[i]) winners.push(this.names[i])
				}
				if (winners.length === 1) {
					Bot.say(this.room, 'El juego de **Anagrams** ha terminado! Felicidades a **' + winners[0] + '** por ganar el juego con ' + maxPoints + ' puntos!');
				} else {
					var lastWinner = winners.pop();
					Bot.say(this.room, 'El juego de **Anagrams** ha terminado! El resultado es un empate a ' + maxPoints + ' puntos entre **' + winners.join(', ') + ' y ' + lastWinner + '**!');
				}
			}
			//deallocate
			delete Games[this.room];
		}
	};
	return anagramObj;
};

/*****************************************
*				Hangman
******************************************/

var Hangman = function () {
	var hangmanObj = {
		word: {},
		wordStr: '',
		wordStrF: '',
		clue: '',
		saidKeys: {},
		failCount: 0,
		maxFail: false,
		ended: false,
	
		getStatus: function () {
			var str = '';
			var disabled = 0;
			var word = '';
			var saidKeys = Object.keys(this.saidKeys).sort().join(" ");
		
			for (var i = 0; i < this.word.length; i++) {
				if (this.word[i].space) {
					word += ' - ';
					continue;
				}
				if (this.word[i].enabled) {
					word += this.word[i].key;
				} else {
					disabled++;
					word += ' _ '
				}
			}
		
			if (!disabled) return {type: 'end', word: word};
			if (this.maxFail && this.failCount > this.maxFail) return {type: 'forceend', word: word};
			return {type: 'turn', word: word, saidKeys: saidKeys};
		},
		
		init: function (phrase) {
			//clear values
			this.ended = false;
			this.failCount = 0;
			this.maxFail = false;
			this.saidKeys = {};
			//init
			if (!phrase) return;
			var datas = phrase.split(" ");
			this.word = [];
			this.wordStr = phrase.toLowerCase().replace(/[^a-z0-9ñ]/g, '');
			this.wordStrF = '';
			var actWord;
			for (var i = 0; i < datas.length; i++) {
				actWord = datas[i].toLowerCase().replace(/[^a-z0-9ñ]/g, '');
				if (!actWord.length) continue;
				for (var j = 0; j < actWord.length; j++) {
					this.word.push(
						{key: actWord.charAt(j).toUpperCase(), enabled: false}
					);
					this.wordStrF += actWord.charAt(j).toUpperCase();
				}
				if (i !== (datas.length - 1)) {
					this.word.push({space: true});
					this.wordStrF += ' ';
				}
			}
			return this.getStatus();
		},
	
		guess: function (key) {
			key = key.toLowerCase().replace(/[^a-z0-9ñ]/g, '');
			if (!key.length || key.length > 1) return;
			if (this.saidKeys[key]) return;
			var keyCount = 0;
			this.saidKeys[key] = 1;
			key = key.toUpperCase();
			for (var i = 0; i < this.word.length; i++) {
				if (this.word[i].space) continue;
				if (!this.word[i].enabled && this.word[i].key === key) {
					this.word[i].enabled = true;
					keyCount++;
				}
			}
			if (!keyCount) {
				this.failCount++;
				return false;
			}
			return this.getStatus();
		},
	
		guessWord: function () {
			for (var i = 0; i < this.word.length; i++) {
				if (this.word[i].space) continue;
				if (!this.word[i].enabled) this.word[i].enabled = true;
			}
			return this.getStatus();
		}
	};
	return hangmanObj;
};

/*****************************************
*				AMBUSH
******************************************/

var Ambush = (function () {
	function Ambush (room) {
		this.room = room;
	}

	Ambush.prototype.init = function () {
		this.players = {};
		this.numPlayers = 0;
		this.started = false;
		Bot.say(this.room, "Se ha iniciado un juego de **Ambush**! Para inscribirse usad **/me in**. Consiste en eliminar a otros usuarios usando /me fires [usuario]. El juego termina cuando solo quede uno.");
	};
	Ambush.prototype.addPlayer = function (player, name) {
		if (this.players[player] || this.started) return false;
		this.players[player] = name;
		this.numPlayers++;
		return true;
	};
	Ambush.prototype.startGame = function () {
		if (this.numPlayers < 2 || this.started) return false;
		this.started = true;
		Bot.say(this.room, "**Fuego!** Para disparar usad **/me fires [usuario]**");
		return true;
	};
	Ambush.prototype.getPlayers = function () {
		var cmds = [];
		var actText = "**Ambush (" + Object.keys(this.players).length + " usuarios)**: " + Object.keys(this.players).join(', ');
		while (actText.length > 290) {
			cmds.push(actText.substr(0, 290));
			actText = actText.substr(290);
		}
		cmds.push(actText);
		for (var u = 0; u < cmds.length; u++) {
			cmds[u] = this.room + "|" + cmds[u];
		}
		Bot.send(cmds, 1500);
	}
	Ambush.prototype.fire = function (user, player) {
		if (!this.started) return false;
		if (!this.players[user] || !this.players[player]) return false;
		var text = "**Ambush:** __" + this.players[player].trim() + "__ recibe un disparo de __" + this.players[user] + "__ y queda eliminado!"
		delete this.players[player];
		this.numPlayers--;
		Bot.say(this.room, text);
		if (this.numPlayers <= 1) this.endGame();
		return true;
	};
	Ambush.prototype.endGame = function () {
		var players = Object.keys(this.players);
		if (players.length !== 1) return false;
		var winner = this.players[players[0]];
		Bot.say(this.room, "/announce ¡Felicidades a **" + winner + "** por ganar el juego de Ambush!");
		delete Games[this.room];
	};

	return Ambush;
})();

var Timer = (function () {
	function Timer (room, time, interv, announce) {
		this.room = room;
		this.now = Date.now();
		this.time = time;
		this.interv = interv;
		this.announce = announce;
		this.intervalPointer = null;
		this.timeoutPinter = null;
	}
	
	Timer.prototype.send = function (str) {
		Bot.say(this.room, str);
	};

	Timer.prototype.start = function () {
		if (typeof this.announce === "function") this.announce.call(this, 's');
		var self = this;
		this.timeoutPinter = setTimeout(function () {
			self.end();
		}, self.time);
		this.intervalPointer = setInterval(function () {
			self.remind();
		}, self.interv);		
	};
	
	Timer.prototype.remind = function () {
		if (typeof this.announce === "function") this.announce.call(this, 'a');
	};

	Timer.prototype.end = function () {
		this.destroy();
		if (typeof this.announce === "function") this.announce.call(this, 'e');
	};
	
	Timer.prototype.destroy = function () {
		if (this.timeoutPinter) {
			clearTimeout(this.timeoutPinter);
			this.timeoutPinter = null;
		}
		if (this.intervalPointer) {
			clearInterval(this.intervalPointer);
			this.intervalPointer = null;
		}
	};
	
	return Timer;
})();

/*****************
* Blackjack
******************/

function generateDeck () {
	var deck = [];
	var cards = ['\u2660', '\u2663', '\u2665', '\u2666'];
	var values = ['A', 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K'];
	for (var i = 0; i < cards.length; i++) {
		for (var j = 0; j < values.length; j++) {
			deck.push({card: cards[i], value: values[j]});
		}
	}
	return deck.randomize();
}

function joinArray (arr, str1) {
	if (!arr.length) return '';
	var txt = "**" + arr[0] + "**";
	if (arr.length > 1) {
		for (var i = 1; i < arr.length - 1; i++) txt += ", **" + arr[i] + "**";
		txt += " " + str1 + " " + "**" + arr[arr.length - 1] + "**";
	}
	return txt;
}

function formateHand (hand, total, str1) {
	var txt = "";
	for (var i = 0; i < hand.length; i++) {
		txt += "**[" + hand[i].card + hand[i].value + "]** ";
	}
	txt += " " + str1 + ": **" + total + "**";
	return txt;
}

var bjParser = function (type, data) {
	switch (type) {
		case 'singups':
			Bot.say(this.room, "Se ha iniciado un nuevo juego de **Blackjack**! Para incribirse usad **/me in**. Para comenzar el juego, se debe usar **.bj start**");
			break;
		case 'start':
			Bot.say(this.room, "**" + "El juego de Blackjack ha comenzado" + "** " + "Primera carta de la Banca" + ": **[" + this.dealerHand[0].card + this.dealerHand[0].value + "]**");
			break;
		case 'turn':
			Bot.say(this.room, "**" + "Blackjack" + ":** " + "Turno de" + " " + data.name + "!" + " " + "Usa **.hit** para pedir cartas y **.stand** para quedarse y terminar el turno (El tiempo máximo del turno son " + " " + Math.floor(this.turnTime / 1000).toString() + " " + "segundos)");
			Bot.say(this.room, "**" + "Blackjack" + ":** " + "Mano de" + " " + data.name + "" + ": " + formateHand(data.hand, this.getHandValue(data.hand), "Total"));
			break;
		case 'player':
			if (data.type === "stand") {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + this.currPlayer.name + " " + "se queda con lo que tiene" + "!");
			} else if (data.type === "hit") {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + this.currPlayer.name + " " + "recibe una carta! Mano" + ": " + formateHand(this.currPlayer.hand, this.getHandValue(this.currPlayer.hand), "Total"));
			}
			var handval = this.getHandValue(this.currPlayer.hand);
			if (handval === 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + this.currPlayer.name + " " + "ha conseguido un Blackjack, Felicidades" + "!");
			} else if (handval > 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + this.currPlayer.name + " " + "pierde por sobrepasar los 21 con" + " " + handval + "");
			}
			break;
		case 'timeout':
			Bot.say(this.room, "**" + "Blackjack" + ":** " + "El tiempo para el turno de" + " " + data.name + "" + " ha concluido!");
			var handval = this.getHandValue(data.hand);
			if (handval === 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + data.name + " " + "ha conseguido un Blackjack, Felicidades" + "!");
			} else if (handval > 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + data.name + " " + "pierde por sobrepasar los 21 con" + " " + handval + "");
			}
			break;
		case 'dealer':
			if (data.type === "stand") {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + "La Banca" + " " + "se queda con lo que tiene" + "!");
			} else if (data.type === "hit") {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + "La Banca" + " " + "recibe una carta! Mano" + ": " + formateHand(this.dealerHand, this.getHandValue(this.dealerHand), "Total"));
			} else if (data.type === "turn") {
				return Bot.say(this.room, "**" + "Blackjack" + ":** " + "Es el turno de la Banca! Mano" + ": " + formateHand(this.dealerHand, this.getHandValue(this.dealerHand), "Total"));
			}
			var handval = this.getHandValue(this.dealerHand);
			if (handval === 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + "La Banca tiene un Blackjack! Mas suerte la próxima!");
			} else if (handval > 21) {
				Bot.say(this.room, "**" + "Blackjack" + ":** " + "La Banca pierde por sobrepasar los 21 con" + " " + handval + ". Es vuestro día de suerte!");
			}
			break;
		case 'end':
			if (data.naturals.length) Bot.say(this.room, "Felicidades a" + " " + joinArray(data.naturals, "y") + " " + "por conseguir un Blackjack" + "!");
			var txt = "**" + "El juego de Blackjack ha terminado!" + "**";
			if (data.winners.length) {
				txt += " " + "Felicidades a" + " " + joinArray(data.winners, "y") + " " + "por ganar a la Banca" + "!";
			} else {
				txt += " " + "Lamentablemente nadie ha conseguido ganar a la Banca esta vez";
			}
			Bot.say(this.room, txt);
			break;
		case 'forceend':
			Bot.say(this.room, "El juego de Blackjack ha sido finalizado");
			break;
	}
	if (type in {win: 1, end: 1, forceend: 1}) {
		try {
			Games[this.room].game.destroy();
		} catch (e) {}
		delete Games[this.room]; //deallocate
	}
};

var BlackJack = exports.BlackJack = (function () {
	function BlackJack (opts, output) {
		this.output = output;
		this.timer = null;
		this.room = opts.room || '';
		this.title = opts.title || 'BlackJack';
		this.status = 0;
		this.deck = generateDeck();
		this.users = {};
		this.players = [];
		this.turn = -1;
		this.currPlayer = null;
		this.waitTime = opts.waitTime || 2000;
		this.turnTime = opts.turnTime || 30000;
		this.maxPlayers = opts.maxPlayers || 16;
		this.dealerHand = [];
	}

	BlackJack.prototype.getHandValue = function (hand) {
		var value = 0;
		var AS = 0;
		for (var i = 0; i < hand.length; i++) {
			if (typeof hand[i].value === "number") {
				value += hand[i].value;
			} else if (hand[i].value in {"J": 1, "Q": 1, "K": 1}) {
				value += 10;
			} else if (hand[i].value === "A") {
				value += 1;
				AS++;
			}
		}
		for (var j = 0; j < AS; j++) {
			if ((value + 10) <= 21) value += 10;
		}
		return value;
	};

	BlackJack.prototype.emit = function (type, data) {
		if (typeof this.output === "function") return this.output.call(this, type, data);
	};

	BlackJack.prototype.init = function () {
		this.singups();
	};

	BlackJack.prototype.singups = function () {
		this.users = {};
		this.status = 1;
		this.emit('singups', null);
	};

	BlackJack.prototype.userJoin = function (user) {
		if (this.status !== 1) return;
		var userid = toId(user);
		if (this.users[userid]) return false;
		this.users[userid] = user;
		if (Object.keys(this.users).length >= this.maxPlayers) this.start();
		return true;
	};

	BlackJack.prototype.userLeave = function (user) {
		if (this.status !== 1) return;
		var userid = toId(user);
		if (!this.users[userid]) return false;
		delete this.users[userid];
		return true;
	};

	BlackJack.prototype.getPlayers = function () {
		var players = [];
		for (var i in this.users) {
			players.push(this.users[i].substr(1));
		}
		return players;
	};

	BlackJack.prototype.start = function () {
		var players = [];
		for (var i in this.users) {
			players.push({id: i, name: this.users[i].substr(1), hand: []});
		}
		if (!players.length) return false;
		this.players = players.randomize();
		this.status = 2;
		this.turn = -1;
		this.dealerHand = [this.getCard(), this.getCard()];
		this.emit('start', null);
		this.wait();
		return true;
	};

	BlackJack.prototype.wait = function () {
		this.status = 2;
		this.timer = setTimeout(this.nextTurn.bind(this), this.waitTime);
	};

	BlackJack.prototype.timeout = function () {
		this.status = 2;
		this.emit('timeout', this.currPlayer);
		this.timer = null;
		this.wait();
	};

	BlackJack.prototype.getCard = function () {
		if (!this.deck.length) this.deck = generateDeck();
		return this.deck.pop();
	};

	BlackJack.prototype.nextTurn = function () {
		this.timer = null;
		this.turn++;
		this.currPlayer = this.players[this.turn];
		if (!this.currPlayer) return this.end();
		this.currPlayer.hand = [this.getCard(), this.getCard()];
		this.status = 3;
		this.emit('turn', this.currPlayer);
		this.timer = setTimeout(this.timeout.bind(this), this.turnTime);
	};

	BlackJack.prototype.stand = function (user) {
		if (this.status !== 3) return;
		user = toId(user);
		if (!this.currPlayer || this.currPlayer.id !== user) return;
		this.status = 2;
		this.clearTimers();
		this.emit('player', {type: 'stand'});
		this.wait();
	};
	BlackJack.prototype.hit = function (user) {
		if (this.status !== 3) return;
		user = toId(user);
		if (!this.currPlayer || this.currPlayer.id !== user) return;
		this.currPlayer.hand.push(this.getCard());
		if (this.getHandValue(this.currPlayer.hand) >= 21) {
			this.status = 2;
			this.clearTimers();
			this.wait();
		}
		this.emit('player', {type: 'hit'});
	};

	BlackJack.prototype.end = function (forced) {
		this.status = 0;
		this.clearTimers();
		if (forced) return this.emit('forceend', null);
		//dealer turn
		this.emit('dealer', {type: 'turn'});
		var dealerTotal = this.getHandValue(this.dealerHand);
		if (dealerTotal >= 17) {
			this.emit('dealer', {type: 'stand'});
		} else {
			this.dealerHand.push(this.getCard());
			this.emit('dealer', {type: 'hit'});
		}
		//winners
		var naturals = [], winners = [];
		dealerTotal = this.getHandValue(this.dealerHand);
		if (dealerTotal > 21) dealerTotal = 0;
		var value;
		for (var i = 0; i < this.players.length; i++) {
			value = this.getHandValue(this.players[i].hand);
			if (value > 21) continue;
			if (value === 21) naturals.push(this.players[i].name);
			if (value > dealerTotal) winners.push(this.players[i].name);
		}
		this.timer = setTimeout(function () {
			this.emit('end', {winners: winners, naturals: naturals});
		}.bind(this), this.waitTime);
	};

	BlackJack.prototype.clearTimers = function () {
		if (this.timer) {
			clearTimeout(this.timer);
			this.timer = null;
		}
	};

	BlackJack.prototype.destroy = function () {
		this.clearTimers();
	};

	return BlackJack;
})();

Settings.addPermissions(['games']);

exports.commands = {
	bj: 'blackjack',
	blackjack: function (arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (Games[room]) {
			if (Games[room].type === 'Blackjack' && toId(arg) === 'end') {
				this.reply("El juego de " + Games[room].type + " ha sido finalizado!");
				try {
					Games[room].game.destroy();
				} catch (e) {}
				delete Games[room]; //deallocate
				return;
			} else if (Games[room].type === 'Blackjack' && toId(arg) === 'start') {
				if (!Games[room].game.start()) this.reply("No hay participantes suficientes para que se pueda iniciar el juego");
				return;
			} else if (Games[room].type === 'Blackjack' && toId(arg) === 'players') {
				if (!Object.keys(Games[room].game.users).length) return this.restrictReply("No hay ningún jugador participando en el juego de Blackjack", "games");
				this.restrictReply("**" + "Jugadores" + " (" + Object.keys(Games[room].game.users).length + "):** " + Games[room].game.getPlayers().join(', '), 'games');
				return
			}
			return this.reply('Ya hay un juego de ' + Games[room].type + '. No se puede iniciar otro');
		}
		var args = arg.split(',');
		var opts = {room: room, title: 'Blackjack'};
		var players = (toId(args[1] || '')) ? parseInt(args[1]) : 16;
		if (toId(args[0]) !== 'new' || !players || players < 1) return this.reply("Usa el comando así: .bj new, (numero maximo de jugadores)");
		if (players < 2) return this.reply("El máximo no puede ser inferior a 2 jugadores");
		opts.maxPlayers = players;
		Games[room] = {
			type: 'Blackjack',
			game: new BlackJack(opts, bjParser)
		};
		Games[room].game.init();
	},
	hit: function (arg, by, room, cmd) {
		if (!Games[room] || Games[room].type !== 'Blackjack') return;
		Games[room].game.hit(by);
	},
	stand: function (arg, by, room, cmd) {
		if (!Games[room] || Games[room].type !== 'Blackjack') return;
		Games[room].game.stand(by);
	},
	timer: 'timeout',
	timeout: function (arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (Settings.timeouts[room]) return this.reply('Ya hay un timer iniciado. Para detenerlo usa ' + this.cmdToken + 'endtimer');
		var time, interv;
		var self = this;
		var args = arg.split('/');		
		time = parseTime(args[0]);
		interv = parseTime(args[1]);
		if (!time || isNaN(interv)) return this.reply('Uso correcto: ' + this.cmdToken + cmd + ' [tiempo] / [intervalo de aviso]. Los tiempos se especifican del modo [minutos]min,[segundos]sec, etc. Ejemplo: ' + this.cmdToken + this.cmd + ' 1min,30sec / 15sec');
		if (!interv) interv = (10 * 1000);
		if (interv < (10 * 1000) || interv > time) return this.reply('El intervalo de aviso no puede ser inferior a 10 segundos ni superior al tiempo total');
		if (time > (3 * 24 * 60 * 60 * 1000)) return this.reply('Más de 3 días es demasiado tiempo para un timer');
		var an = function (t) {
			switch (t) {
				case 's':
					this.send('**Se ha iniciado un Timer!** El tiempo termina en ' + Tools.getTimeAgo(Date.now() - this.time, 'spanish') + '!');
					break;
				case 'a':
					var timeToEnd = this.time - (Date.now() - this.now);
					if (timeToEnd < 1000) return;
					this.send('**Timer:** Quedan ' + Tools.getTimeAgo(Date.now() - timeToEnd, 'spanish') + '!');
					break;
				case 'e':
					this.send('**Timer:** El tiempo ha terminado!');
					delete Settings.timeouts[this.room];
					break;
			}
		};
		Settings.timeouts[room] = new Timer(room, time, interv, an);
		Settings.timeouts[room].start();
	},
	endtimer: 'endtimeout',
	endtimeout: function (arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (!Settings.timeouts[room]) return this.reply('No hay ningún timer iniciado en esta sala');
		Settings.timeouts[room].destroy();
		delete Settings.timeouts[room];
		this.reply("El timer ha sido detenido");
	},

	hangmanstatus: 'hangman',
	ahorcado: 'hangman',
	hangman: function(arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (Games[room]) {
			if (cmd === 'hangmanstatus' && Games[room].type === 'Hangman') {
				var res = Games[room].game.getStatus();
				return this.reply("**Hangman:** " + res.word + " | **" + Games[room].game.clue + "** | " + res.saidKeys + " | Se juega con **" + this.cmdToken + 'g** [letra/palabra]');
			}
			return this.reply('Ya hay un juego de ' + Games[room].type + '. No se puede iniciar otro')
		}

		/* Create game generator */
		var maxFail = false;
		if (arg) maxFail = parseInt(arg);
		Games[room] = {
			type: 'Hangman',
			game: new Hangman()
		};
		
		/* Get random phrase */
		var phrase = '';
		var clue = '';
		
		try {
			var hangmanWords = require('./../hangman-data.js').hangmanWords;
		} catch (e) {
			delete Games[room]; //deallocate
			return this.pmReply('Se ha encontrado un error: Vuelve a probar en unos segundos.');
		}
		
		var Opts = Object.keys(hangmanWords);
		
		if (!Opts.length) {
			delete Games[room]; //deallocate
			return this.reply("No hay ninguna palabra en la base de datos del juego de hangman. No se puede iniciar el juego.");
		}
		
		
		var randClue = Opts[Math.floor(Math.random() * Opts.length)];
		
		var wordsF = hangmanWords[randClue];
		
		phrase = wordsF[Math.floor(Math.random() * wordsF.length)];
		clue = randClue;
		
		/* Init game */
		var res = Games[room].game.init(phrase);
		Games[room].game.clue = clue;
		if (maxFail) {
			Games[room].game.maxFail = maxFail;
			this.reply("**Hangman:** " + res.word + " | Pista: " + Games[room].game.clue + " | Se permiten " + maxFail + " fallos | Se juega con **" + this.cmdToken + 'g** [letra/palabra]');
		} else {
			this.reply("**Hangman:** " + res.word + " | **" + Games[room].game.clue + "** | Se juega con **" + this.cmdToken + 'g** [letra/palabra]');
		}
	},
	
	ph: 'pokemonhangman',
	pokehangman: 'pokemonhangman',
	pokemonhangman: function(arg, by, room, con) {
		if (!this.can('games')) return false;
		if (Games[room]) return this.reply("Ya hay un juego en marcha, no se puede iniciar otro.");
		var maxFail = false;
		if (arg) maxFail = parseInt(arg);
		Games[room] = {
			type: 'Hangman',
			game: new Hangman()
		};
		var phrase = '';
		var Opts = ['pokemon', 'pokemon', 'move', 'ability', 'nature', 'item'];
		var chosen = Opts[Math.floor(Math.random() * Opts.length)];
		switch (chosen) {
			case 'pokemon':
				try {
					var pokedex = require('./../data/pokedex.js').BattlePokedex;
				} catch (e) {
					delete Games[room]; //deallocate
					return this.pmReply('Se ha encontrado un error: Vuelve a probar en unos segundos.');
				}
				var pokemon = Object.keys(pokedex);
				do {
					var rand = Math.floor(Math.random() * pokemon.length);
				} while (pokedex[pokemon[rand]].num <= 0);
				phrase = pokedex[pokemon[rand]].species.replace(/[-]/, " ");
				var res = Games[room].game.init(phrase);
				var randClue = Math.floor(Math.random() * 4);
				switch(randClue) {
					case 0:
						Games[room].game.clue = pokedex[pokemon[rand]].types[0] + " type";
						break;
					case 1:
						Games[room].game.clue =  pokedex[pokemon[rand]].types[1] ? (pokedex[pokemon[rand]].types[1] + " type") : (pokedex[pokemon[rand]].types[0] + " type");
						break;
					case 2:
						if (pokedex[pokemon[rand]].num <= 151) Games[room].game.clue = 'Gen 1';
						else if (pokedex[pokemon[rand]].num <= 251) Games[room].game.clue = 'Gen 2';
						else if (pokedex[pokemon[rand]].num <= 386) Games[room].game.clue = 'Gen 3';
						else if (pokedex[pokemon[rand]].num <= 493) Games[room].game.clue = 'Gen 4';
						else if (pokedex[pokemon[rand]].num <= 649) Games[room].game.clue = 'Gen 5';
						else Games[room].game.clue = 'Gen 6';
						break;
					default:
						var formatsData = require('./../data/formats-data.js').BattleFormatsData;
						if (formatsData[pokemon[rand]].tier) {
							Games[room].game.clue = "Tier " + formatsData[pokemon[rand]].tier;
						} else {
							Games[room].game.clue =  pokedex[pokemon[rand]].types[1] ? (pokedex[pokemon[rand]].types[1] + " type") : (pokedex[pokemon[rand]].types[0] + " type");
						}
				}
				Games[room].game.clue = "Pokemon " + Games[room].game.clue;
				break;
			case 'move':
				try {
					var movedex = require('./../data/moves.js').BattleMovedex;
				} catch (e) {
					delete Games[room]; //deallocate
					return this.pmReply('Se ha encontrado un error: Vuelve a probar en unos segundos.');
				}
				var moves = Object.keys(movedex);
				var rand = moves[Math.floor(Math.random() * moves.length)];
				var moveChosen = movedex[rand];
				phrase = moveChosen.name.replace(/[-]/, " ");
				var res = Games[room].game.init(phrase);
				Games[room].game.clue = "Move " + moveChosen.type + " type";
				break;
			case 'item':
				try {
					var items = require('./../data/items.js').BattleItems;
				} catch (e) {
					delete Games[room]; //deallocate
					return this.pmReply('Se ha encontrado un error: Vuelve a probar en unos segundos.');
				}
				var itemArr = Object.keys(items);
				var rand = itemArr[Math.floor(Math.random() * itemArr.length)];
				var itChosen = items[rand];
				phrase = itChosen.name.replace(/[-]/, " ");
				var res = Games[room].game.init(phrase);
				Games[room].game.clue = "Item gen " + itChosen.gen;
				break;
			case 'ability':
				try {
					var abilities = require('./../data/abilities.js').BattleAbilities;
				} catch (e) {
					delete Games[room]; //deallocate
					return this.pmReply('Se ha encontrado un error: Vuelve a probar en unos segundos.');
				}
				var abilitiesArr = Object.keys(abilities);
				var rand = abilitiesArr[Math.floor(Math.random() * abilitiesArr.length)];
				var abChosen = abilities[rand];
				phrase = abChosen.name.replace(/[-]/, " ");
				var res = Games[room].game.init(phrase);
				Games[room].game.clue = "Ability";
				break;
			case 'nature':
				var natures = ['Adamant', 'Bashful', 'Bold', 'Brave', 'Calm', 'Careful', 'Docile', 'Gentle', 'Hardy', 'Hasty', 'Impish', 'Jolly', 'Lax', 'Lonely', 'Mild', 'Modest', 'Naive', 'Naughty', 'Quiet', 'Quirky', 'Rash', 'Relaxed', 'Sassy', 'Serious', 'Timid'];
				phrase = natures[Math.floor(Math.random() * natures.length)].replace(/[-]/, " ");
				var res = Games[room].game.init(phrase);
				Games[room].game.clue = "Nature";
				break;
		}
		
		if (maxFail) {
			Games[room].game.maxFail = maxFail;
			this.reply("**Hangman:** " + res.word + " | Pista: " + Games[room].game.clue + " | Se permiten " + maxFail + " fallos | Se juega con **" + this.cmdToken + 'g** [letra/palabra]');
		} else {
			this.reply("**Hangman:** " + res.word + " | **" + Games[room].game.clue + "** | Se juega con **" + this.cmdToken + 'g** [letra/palabra]');
		}
	},
	
	g: 'guess',
	guess: function(arg, by, room, con) {
		if (!Games[room] || !Games[room].type) return;
		switch (Games[room].type) {
			case 'Hangman':
				if (arg.length > 1) {
					if (arg.toLowerCase().replace(/[^a-z0-9ñ]/g, '') === Games[room].game.wordStr) {
						var winner = by.substr(1);
						this.reply("Felicidades a **" + winner + "** por ganar el juego de hangman! La palabra era **" + Games[room].game.wordStrF + "**");
						delete Games[room]; //deallocate
						break;
					} else {
						Games[room].game.failCount++;
					}
				}
				var res = Games[room].game.guess(arg);
				if (Games[room].game.maxFail && Games[room].game.failCount > Games[room].game.maxFail) {
					var losser = by.substr(1);
					this.reply("Se ha excedido el numero maximo de errores y **" + losser + "** ha sido ahorcado! La palabra era **" + Games[room].game.wordStrF + "**");
					delete Games[room]; //deallocate
					break;
				}
				if (!res) break;
				if (res.type === 'end') {
					var winner = by.substr(1);
					this.reply("Felicidades a **" + winner + "** por ganar el juego de hangman! La palabra era **" + Games[room].game.wordStrF + "**");
					delete Games[room]; //deallocate
					break;

				}
				this.reply("**Hangman:** " + res.word + " | **" + Games[room].game.clue + "** | " +  res.saidKeys);
				break;
			case 'Anagrams':
				Games[room].game.guessWord(by, arg);
				break;
		}
	},
	
	endhangman: function(arg, by, room, con) {
		if (!this.can('games')) return false;
		if (!Games[room] || Games[room].type !== 'Hangman') return this.reply("No hay ningun juego de hangman en marcha.");
		this.reply("El juego de " + Games[room].type + " ha terminado! La palabra era " + Games[room].game.wordStrF);
		delete Games[room]; //deallocate
	},

	anagrams: function(arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (Games[room]) return this.reply("Ya hay un juego en marcha, no se puede iniciar otro.");
		var words = [];
		var time = 30000;
		var num = 5;
		var act = null;
		var args = arg.split(',');
		if (args[0]) {
			num = parseInt(args[0]);
			if (!num || num < 1) {
				return this.reply("En numero de juegos especificado no es un numero valido.");
			}
		}
		if (args[1]) {
			time = parseInt(args[1]);
			if (!time || time < 10) {
				return this.reply("El tiempo no puede ser inferior a 10 segundos.");
			}
			time *= 1000;
		}
		var wordArr = [];
		var safe = 0;
		for (var i = 0; i < num; i++) {
			act = generateRandomWord();
			if (!act) {
				return this.reply('Se ha producido un error y no se ha podido iniciar el juego.');
			}
			if (wordArr.indexOf(act.word) >= 0) {
				if (safe > 10) 	return this.reply('Se ha producido un error y no se ha podido iniciar el juego.');
				i--;
				safe++;
				continue;
			}
			words.push(act);
			wordArr.push(act.word);
		}
		Games[room] = {
			type: 'Anagrams',
			game: new Anagrams()
		};
		Games[room].game.timePerGame = time;
		Games[room].game.startGame(room, words);
	},

	pa: 'pokeanagrams',
	anagramspoke: 'pokeanagrams',
	pokeanagrams: function(arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (Games[room]) return this.reply("Ya hay un juego en marcha, no se puede iniciar otro.");
		var words = [];
		var time = 30000;
		var num = 5;
		var act = null;
		var args = arg.split(',');
		if (args[0]) {
			num = parseInt(args[0]);
			if (!num || num < 1) {
				return this.reply("En numero de juegos especificado no es un numero valido.");
			}
		}
		if (args[1]) {
			time = parseInt(args[1]);
			if (!time || time < 10) {
				return this.reply("El tiempo no puede ser inferior a 10 segundos.");
			}
			time *= 1000;
		}
		var wordArr = [];
		var safe = 0;
		for (var i = 0; i < num; i++) {
			act = generateRandomPokeWord();
			if (!act) {
				return this.reply('Se ha producido un error, intentalo de nuevo más tarde');
			}
			if (wordArr.indexOf(act.word) >= 0) {
				if (safe > 10) 	return this.reply('Se ha producido un error y no se ha podido iniciar el juego.');
				i--;
				safe++;
				continue;
			}
			words.push(act);
			wordArr.push(act.word);
		}
		Games[room] = {
			type: 'Anagrams',
			game: new Anagrams()
		};
		Games[room].game.timePerGame = time;
		Games[room].game.startGame(room, words);
	},

	endanagrams: function(arg, by, room, con) {
		if (!this.can('games')) return false;
		if (!Games[room] || Games[room].type !== 'Anagrams') return this.reply("No hay ningun juego de Anagrams en marcha.");
		this.reply("El juego de " + Games[room].type + " ha sido suspendido! La palabra era " + Games[room].game.word);
		Games[room].game.destroy();
		delete Games[room]; //deallocate
	},

	ambush: function (arg, by, room, cmd) {
		if (!this.can('games')) return false;
		arg = toId(arg);
		switch (arg) {
			case 'begin':
			case 'start':
				if (!Games[room] || Games[room].type !== 'Ambush') return this.reply("No hay ningun juego de Ambush en marcha.");
				if (!Games[room].game.startGame()) return this.reply("No hay suficientes jugadores para poder iniciar el juego."); 
				break;
			case 'getplayers':
			case 'players':
			case 'getusers':
			case 'users':
				if (!Games[room] || Games[room].type !== 'Ambush') return this.reply("No hay ningun juego de Ambush en marcha.");
				Games[room].game.getPlayers();
				break;
			case 'end':
				return this.parse(this.cmdToken + "endambush");
				break;
			default:
				if (Games[room]) return this.reply("Ya hay un juego en marcha, no se puede iniciar otro.");
				Games[room] = {
					type: 'Ambush',
					game: new Ambush(room)
				};
				Games[room].game.init();
		}
	},

	me: function (arg, by, room, cmd) {
		if (!Games[room]) return;
		arg = arg.trim();
		if (Games[room] && Games[room].type === 'Ambush') {
			var args = arg.split(' ');
			if (args.length > 1 && (toId(args[0]) in {'fires': 1, 'kills': 1})) {
				var user = arg.substr(args[0].length);
				Games[room].game.fire(toId(by), toId(user));
			} else if (toId(arg) === 'in') {
				Games[room].game.addPlayer(toId(by), by.substr(1));
			}
		}
		if (Games[room] && Games[room].type === 'Blackjack') {
			var args = arg.split(' ');
			if (toId(arg) === 'in') {
				Games[room].game.userJoin(by);
			} else if (toId(arg) === 'out') {
				Games[room].game.userLeave(by);
			}
		}
	},
	
	endambush: function (arg, by, room, cmd) {
		if (!this.can('games')) return false;
		if (!Games[room] || Games[room].type !== 'Ambush') return this.reply("No hay ningun juego de Ambush en marcha.");
		this.reply("El juego de " + Games[room].type + " ha sido suspendido!");
		delete Games[room]; //deallocate
	},

	endgame: function(arg, by, room, con) {
		if (!this.can('games')) return false;
		if (!Games[room]) return this.reply("No hay ningun juego en marcha.");
		this.reply("El juego de " + Games[room].type + " ha terminado!");
		try {
			Games[room].game.destroy();
		} catch (e) {}
		delete Games[room]; //deallocate
	}
};
