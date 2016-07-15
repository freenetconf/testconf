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

var netconf_client = require('../netconf_client')
var util = require('util');

//netconf_client.create().then(function(client)
//{
//	client.send_get().thenDefault(function(reply)
//	{
//		console.log(reply)
//		console.log(util.inspect(reply, {showHidden: false, depth: null}));
//		client.send_close().thenDefault()
//	})
//})

netconf_client.create()
	.get(null, function(reply) {
		console.log("Reply")
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
	})
	.get(null, function(reply) {
		console.log("Reply")
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
	})
	.get(null, function(reply) {
		console.log("Reply")
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
	})
	.get(null, function(reply) {
		console.log("Reply")
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
	})
	.run()
	.then(function(s) {
		console.log("Success")
		//console.log(s)
	}, function(e) {
		console.log("error")
		console.log(e)
	})
	.catch(function(ex) {
		console.log('exception')
		console.log(ex)
	})
	.finally(function() {
		process.exit(0)
	})
