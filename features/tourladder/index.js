/*
	Tournaments Manager Feature
*/

const ladderDataFile = './data/tourladder.json';

exports.id = 'tourladder';
exports.desc = 'Tournaments ladder';

var GitHubApi = require("github");
var GitHubObj = new GitHubApi({version: "3.0.0"});
GitHubObj.authenticate({type: 'oauth', token: Config.tourLadder.token});

var tourData = exports.tourData = {};
var ladder = exports.ladder = {};

if (!fs.existsSync(ladderDataFile))
	fs.writeFileSync(ladderDataFile, '{}');

try {
	ladder = exports.ladder = JSON.parse(fs.readFileSync(ladderDataFile).toString());
} catch (e) {
	errlog(e.stack);
	error("Could not import ladder data: " + sys.inspect(e));
}

function addPoints (room, user, adding, finalist, winner, name) {
	if (!ladder[room]) ladder[room] = {};
	if (!ladder[room][user]) ladder[room][user] = {
		tours: 0,
		points: 0,
		wins: 0,
		finals: 0,
		name: name
	};
	ladder[room][user].tours++;
	if (finalist) ladder[room][user].finals++;
	if (winner) {
		ladder[room][user].wins++;
		ladder[room][user].points += 3;
	}
	ladder[room][user].points += adding;
}

var writing = exports.writing = false;
var writePending = exports.writePending = false;
var save = exports.save =  function () {
	var data = JSON.stringify(ladder);
	var finishWriting = function () {
		writing = false;
		if (writePending) {
			writePending = false;
			save();
		}
	};
	if (writing) {
		writePending = true;
		return;
	}
	fs.writeFile(ladderDataFile + '.0', data, function () {
		// rename is atomic on POSIX, but will throw an error on Windows
		fs.rename(ladderDataFile + '.0', ladderDataFile, function (err) {
			if (err) {
				// This should only happen on Windows.
				fs.writeFile(ladderDataFile, data, finishWriting);
				return;
			}
			finishWriting();
		});
	});
};

var parseTourTree = function(tree) {
	var auxobj = {};
	var team = tree.team;
	var state = tree.state;
	var children = tree.children;
	if (!children) children = [];
	if (!auxobj[team]) auxobj[team] = 0;
	if (state && state === "finished") {
		auxobj[team] += 1;
	}
	var aux;
	for (var i = 0; i < children.length; i++) {
		aux = parseTourTree(children[i]);
		for (var j in aux) {
			if (!auxobj[j]) auxobj[j] = 0;
			auxobj[j] += aux[j];
		}
	}
	return auxobj;
};

function semiLowerCase (txt) {
	return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
}

function get_table (room) {
	var table = '';
	var dt = new Date();
	table += '# Ranking de Torneos' + (room === '-lb' ? ' - Leaderboards' : '') + '\n\n';
	table += 'A continuación aparecen los 100 primeros clasificados en el ' + (room === '-lb' ? '**Ranking del torneo LeaderBoards' : '**Ranking de Torneos Elimination de la Sala ' + semiLowerCase(room)) + '**. Están ordenados por puntuación (un punto por ronda ganada + 3 extra para el ganador del torneo) pero también se muestra el número total de victorias (numero de veces que ganó un torneo) y las veces que el usuario llegó a la final. Nota: Los datos tienen una antigüedad determinada por lo que podrían no ser representativos si el ranking fue reiniciado hace poco.\n\n';
	table += 'Actualizado en: __' + dt.toString() + '__\n\n';
	table += ' Nº | Nombre | Puntuación | Torneos Jugados | Ganados | Finales |' + '\n';
	table += ':------|:------------------------|:----------------|:------------------|:---------|:--------|' + '\n';
	var resultsTable = [];
	for (var i in ladder[room]) {
		resultsTable.push(ladder[room][i])
	}
	resultsTable.sort(function (a, b) {
		return b.points - a.points;
	});
	for (var i = 0; i < 100 && i < resultsTable.length; i++) {
		table += (i + 1).toString() + " | " + resultsTable[i].name + " | " + resultsTable[i].points + " | " + resultsTable[i].tours + " | " + resultsTable[i].wins + " | " + resultsTable[i].finals + " |" + '\n';
	}
	table += '\n';
	return table;
}

var update_table = exports.update_table = function (room) {
	if (!Config.tourLadder || !Config.tourLadder.id) return;
	var jsonData = {
		id: Config.tourLadder.id,
		description: 'Ranking de Torneos',
		files: {},
		public: true
	};
	var filename = (room === '-lb' ? 'leaderboards-tour' : room) + ".md";
	jsonData.files[filename] = {
		"content": get_table(room)
	};
	GitHubObj.gists.edit(jsonData, function (err, res) {
		if (err) {
			errlog(err.stack);
			error("Resquest error uploading ladder data for room " + room);
			return;
		}
		debug("Uploaded tournament data for room " + room);
	});
}

exports.init = function () {
	for (var i in tourData)
		delete tourData[i];
};

exports.parse = function (room, message, isIntro, spl) {
	if (!Config.tourLadder) return;
	if (spl[0] !== 'tournament') return;
	if (!tourData[room]) tourData[room] = {};
	switch (spl[1]) {
		case 'update':
			try {
				var data = JSON.parse(spl[2]);
				for (var i in data)
					tourData[room][i] = data[i];
			} catch (e){}
			break;
		case 'end':
			try {
				var data = JSON.parse(spl[2]);
				for (var i in data)
					tourData[room][i] = data[i];
			} catch (e){}
			if (isIntro || Config.tourLadder.rooms.indexOf(room) < 0) {
				delete tourData[room];
				break;
			}
			try {
				if (tourData[room].generator !== "Single Elimination") {
					delete tourData[room];
					break;
				}
				var results = parseTourTree(tourData[room].bracketData.rootNode);
				var winner = toId(tourData[room].results[0][0]);
				var finalists = [winner];
				var f = 0, second = '';
				for (var j in results) {
					if (toId(j) === winner) continue;
					if (results[j] > f) {
						second = toId(j);
						f = results[j];
					}
				}
				if (second) finalists.push(second);
				var tarRoom = room;
				for (var k in results) {
					addPoints(room, toId(k), results[k], !!(finalists.indexOf(toId(k)) >= 0), !!(winner === toId(k)), k);
				}
				save();
				update_table(room);
			} catch (e) {
				errlog(e.stack);
				error("Could not parse tournament results: " + sys.inspect(e));
			}
		case 'forceend':
			delete tourData[room];
			break;
	}
};

exports.destroy = function () {
	if (Features[exports.id]) delete Features[exports.id];
};
