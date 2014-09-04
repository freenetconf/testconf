/*
 * Copyright (C) 2014 Cisco Systems, Inc.
 *
 * Author: Petar Koretic <petar.koretic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var net = require('net');

var socket = net.connect({ path: '/tmp/testconf.sock' });

socket.on('error', function(e) {
	socket.end();
});

exports.write = function(msg, console_on) {
	if (!msg)
		return

	if (console_on)
		console.log(msg)

	socket.write(msg + '\n')
}

exports.end = function() {
	socket.end();
}
