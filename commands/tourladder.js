exports.commands = {
	updateranking: 'updateladder',
	updateladder: function () {
		if (!this.isExcepted) return;
		var tarRoom = toRoomid(this.arg) || this.room;
		if (Config.tourLadder.rooms.indexOf(tarRoom) < 0) return;
		Tools.uploadToHastebin(Features['tourladder'].get_table(tarRoom), function (r, link) {
			if (r) return this.pmReply('Ladder de la sala ' + tarRoom + ': ' + link);
			else this.pmReply("Error: no se pudieron subir los datos a hastebin");
		}.bind(this));
	},
	rank: 'ranking',
	ranking: function () {
		var args = this.arg.split(',');
		var user = this.by, room = this.room;
		if (args.length === 1) {
			if (Config.tourLadder.rooms.indexOf(toRoomid(args[0])) >= 0) {
				room = toRoomid(args[0]);
			} else {
				room = 'espaol';
				user = toId(args[0]);
			}
			if (!user) user = this.by;
		} else {
			user = toId(args[1]);
			room = toRoomid(args[0]);
			if (!room || !user) return this.restrictReply("Debes especificar una sala. Uso correcto: " + this.cmdToken + this.cmd + " [sala], (usuario)", 'info');
		}
		user = toId(user);
		if (Config.tourLadder.rooms.indexOf(room) < 0) return this.pmReply("La sala <<" + room + ">> no está en el ranking de torneos de este bot");
		var name = user, points = 0, wins = 0, finals = 0, tours = 0;
		if (Features['tourladder'].ladder[room] && Features['tourladder'].ladder[room][user]) {
			name = Features['tourladder'].ladder[room][user].name;
			points = Features['tourladder'].ladder[room][user].points;
			wins = Features['tourladder'].ladder[room][user].wins;
			finals = Features['tourladder'].ladder[room][user].finals;
			tours = Features['tourladder'].ladder[room][user].tours;
		}
		return this.restrictReply("Ranking de **" + name + "** en <<" + room + ">>: " + wins + " torneos ganados, " + finals + " finales, " + tours + " jugados en total. Puntos: " + points, "info");
	}
};