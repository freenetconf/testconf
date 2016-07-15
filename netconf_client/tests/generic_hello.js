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

// netconf_client.create().then(function(client)
// {
// 	client.send_close().then()
// })
// .catch(function(ex) {
// 	console.log('exc:')
// 	console.log(ex)
// })

netconf_client.create()
	.close(function() {
		console.log('ac1')
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
