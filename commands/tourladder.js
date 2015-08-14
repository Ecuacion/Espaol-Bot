exports.commands = {
	updateladder: function () {
		if (!this.isExcepted) return;
		var tarRoom = toRoomid(this.arg) || this.room;
		if (!Config.tourLadder.rooms.indexOf(tarRoom) < 0) return;
		Features['tourladder'].update_table(tarRoom);
		this.reply("La tabla de puntuaciones para la sala " + tarRoom + " se actualizará en unos segundos");
	}
};