/*
 * Copyright (C) 2015 Deutsche Telekom AG.
 *
 * Author: Mislav Novakovic <mislav.novakovic@sartura.hr>
 *
 * testconf is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * You should have received a copy of the GNU General Public License
 * along with testconf. If not, see <http://www.gnu.org/licenses/>.
 */

var netconf_client = require('../../../netconf_client')

var client = netconf_client.create(function(error)
{
	if (error)
	{
		console.error(error)
		process.exit(1)
	}

	var xml

	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
			"<target><running/></target>" +
			"<config>" +
				"<status xmlns='urn:ietf:params:xml:ns:yang:status'>" +
					"<wifi>" +
						"<wifi-iface>" +
							"<name>wifi0</name>"+
							"<ssid>new_openwrt</ssid>"+
							"<maclist>10:bf:48:1c:33:79</maclist>"+
						"</wifi-iface>" +
					"</wifi>" +
				"</status>" +
			"</config>" +
		"</edit-config>"


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

client.on('rpc-reply', function(reply)
{
	var util = require('util');
	console.log(reply.data)
	console.log(util.inspect(reply.data, {showHidden: false, depth: null}));
})

client.on('error', function(error)
{
	console.error(error)
	process.exit(1)
})

client.on('end', function(error)
{
})
