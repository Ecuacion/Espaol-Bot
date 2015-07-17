const REQUIRED_TIME_DIFF = 2 * 60 * 1000;
const AUTOCONFIRMED_AGE_REQUIRED = 7 * 24 * 60 * 60 * 1000;

var lastHelpUsage = {};

function canUseHelpCommand (user) {
	if (!lastHelpUsage[user]) return true;
	var diff = Date.now() - lastHelpUsage[user];
	if (diff >= REQUIRED_TIME_DIFF) return true;
	return false;
}

function sweepUsage () {
	for (var i in lastHelpUsage) {
		if (canUseHelpCommand(i)) delete lastHelpUsage[i];
	}
}

function checkAutoconfirmed (regtime) {
	regtime = regtime * 1000;
	var diff = Date.now() - regtime;
	if (diff >= AUTOCONFIRMED_AGE_REQUIRED) return true;
	return false;
}

function getDiffAutoconfirmed (regtime) {
	regtime = regtime * 1000;
	var diff = new Date(AUTOCONFIRMED_AGE_REQUIRED - (Date.now() - regtime));
	
	var dates = [];

	var days = diff.getDate() - 1;
	if (days > 0) dates.push(days.toString() + " Día" + (days > 1 ? 's': ''));

	var hours = diff.getHours();
	if (hours > 0) dates.push(hours.toString() + " Hora" + (hours > 1 ? 's': ''));

	var minutes = diff.getMinutes();
	if (minutes > 0) dates.push(minutes.toString() + " Minuto" + (minutes > 1 ? 's': ''));

	var seconds = diff.getSeconds();
	if (seconds > 0) dates.push(seconds.toString() + " Segundo" + (seconds > 1 ? 's': ''));

	return dates.join(', ');
}

function isEmpty (obj) {
	var n = 0;
	for (var i in obj) n++;
	if (!n) return true;
	return false;
}

exports.commands = {
	ayudamodchat: 'achelp',
	achelp: function (arg, by, room, cmd) {
		var user = toId(by);
		if (!this.isExcepted && !canUseHelpCommand(user)) return this.pmReply('Debido al ancho de banda que consume, este comando solo puede ser usado con una fecuencia máxima de un comando cada 2 minutos');
		if (this.isExcepted && arg) {
			user = toId(arg);
		}
		this.pmReply('Un momento, por favor. Estoy comprobado el estado de tu cuenta...');
		lastHelpUsage[toId(by)] = Date.now();
		sweepUsage();
		var http = require('http');
		http.get('http://pokemonshowdown.com/users/' + user + '.json', function (res) {
			var data = "";
			res.on('data', function (part) {
				data += part;
			}.bind(this));
			res.on('end', function (end) {
				try {
					var regData = JSON.parse(data);
					var regName = regData.username;
					var regtime = parseInt(regData.registertime);
					if (!regtime) {
						return this.pmReply("La cuenta \"" + regName + "\" **no esta registrada**. Para poder ser autoconfirmed primero registra la cuenta en el boton de opciones (arriba a la derecha). Tras registrala deberás esperar una semana y ganar una batalla en ladder para ser autoconfirmed");
					}
					if (!checkAutoconfirmed(regtime)) {
						return this.pmReply("A la cuenta \"" + regName + "\" la quedan **" + getDiffAutoconfirmed(regtime) + "** para ser autoconfirmed. Para hablar por el chat moderado debes esperar ese tiempo o unar otra cuenta que sí sea autoconfirmed");
					}
					if (!regData.ratings || isEmpty(regData.ratings)) {
						return this.pmReply("La cuenta \"" + regName + "\" **no tiene ninguna batalla de ladder** registrada. Para ser autoconfirmed pulsa \"Look for a battle\" y, tras ganar una batalla, haz /logout y vuelve a iniciar sesion");
					}
					return this.pmReply("La cuenta \"" + regName + "\" **es autoconfirmed**. Si no puedes hablar por el chat moderado prueba a hacer /logout y vuelve a iniciar sesion. Si no funciona se trata probablemente de un error del servidor.");
				} catch (e) {
					this.pmReply('Error en la conexion, no he podido obtener los datos de la cuenta. Puedes comprobar si eres autoconfirmed mirando esta pagina http://pokemonshowdown.com/users/' + user);
				}
			}.bind(this));
			res.on('error', function (end) {
				this.pmReply('Error en la conexion, no he podido obtener los datos de la cuenta. Puedes comprobar si eres autoconfirmed mirando esta pagina http://pokemonshowdown.com/users/' + user);
			}.bind(this));
		}.bind(this)).on('error', function (e) {
			this.pmReply('Error en la conexion, no he podido obtener los datos de la cuenta. Puedes comprobar si eres autoconfirmed mirando esta pagina http://pokemonshowdown.com/users/' + user);
		}.bind(this));
	}
};

