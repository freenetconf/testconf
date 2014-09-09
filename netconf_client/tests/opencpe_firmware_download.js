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

var client = netconf_client.create(function(error)
{
	if (error)
	{
		console.error(error)
		process.exit(1)
	}

	var xml = "<firmware-download xmlns='urn:opencpe:firmware-mgmt'>" +
			"<address>localhost</address>" +
			"<install-target>system</install-target>" +
			"<timeframe>0</timeframe>" +
			"<retry-count>3</retry-count>" +
			"<retry-interval>10</retry-interval>" +
			"<retry-interval-increment>10</retry-interval-increment>" +
		"</firmware-download>"

	client.send(xml, function(error, reply)
	{
		if (error)
		{
			console.error(error)
			process.exit(1)
		}

		client.send_close(function(error, reply)
		{
			if (error)
			{
				console.error(error)
				process.exit(1)
			}
			else
			{
				process.exit(0)
			}
		})
	})
})

client.on('rpc-reply', function(error)
{
})

client.on('error', function(error)
{
})

client.on('end', function(error)
{
})
