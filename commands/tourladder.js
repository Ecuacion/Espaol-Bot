exports.commands = {
	updateranking: 'updateladder',
	updateladder: function () {
		if (!this.isExcepted) return;
		var tarRoom = toRoomid(this.arg) || this.room;
		if (!Config.tourLadder.rooms.indexOf(tarRoom) < 0) return;
		Features['tourladder'].update_table(tarRoom);
		this.reply("La tabla de puntuaciones para la sala " + tarRoom + " se actualizará en unos segundos");
	},
	tourladder: 'ranking',
	rank: 'ranking',
	ranking: function () {
		if (this.cmd === 'tourladder') return this.restrictReply("Ranking de torneos: https://gist.github.com/Ecuacion/01d357e2fec0413a09d4", "info");
		var args = this.arg.split(',');
		var user = toId(args[1] || this.by);
		var room = toRoomid(args[0]);
		if (!room) {
			if (this.roomType === 'pm') return this.pmReply("Debes especificar una sala. Uso correcto: " + this.cmdToken + this.cmd + " [sala], (usuario)");
			room = this.room;
		}
		var name = user, points = 0, wins = 0, finals = 0, tours = 0;
		if (Features['tourladder'].ladder[room] && Features['tourladder'].ladder[room][user]) {
			name = Features['tourladder'].ladder[room][user].name;
			points = Features['tourladder'].ladder[room][user].points;
			wins = Features['tourladder'].ladder[room][user].wins;
			finals = Features['tourladder'].ladder[room][user].finals;
			tours = Features['tourladder'].ladder[room][user].tours;
		}
		return this.restrictReply("Ranking de **" + name + "** en <<" + room + ">>: " + points + " puntos, " + tours + " torneos jugados, " + wins + " ganados, " + finals + " finales", "info");
	}
};