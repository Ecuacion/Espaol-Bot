
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
				Bot.say(this.room, 'El juego de **Anagrams** ha terminado! Lamentablemente nadie ha conseguido responder a ninguna de la preguntas (lol) por lo que lo hay ningún ganador.');
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

Settings.addPermissions(['games']);

exports.commands = {
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
