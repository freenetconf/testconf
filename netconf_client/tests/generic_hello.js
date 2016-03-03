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

var client = netconf_client.create().then(function(client)
{
	client.send_close().then(function(success)
	{
		console.log(success)
		process.exit(0)
	},
	function(reject)
	{
		console.log(reject)
		process.exit(1)
	})
},
function(error)
{
	process.exit(1)
})
.finally(function()
{
})
