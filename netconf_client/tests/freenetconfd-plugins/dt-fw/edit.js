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

	// in uci section firmware-slot with name test_1 edit option version
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
			"<config>" +
			'<system-state xmlns="urn:ietf:params:xml:ns:yang:ietf-system-openwrt">' +
				'<firmware-slot>' +
					"<name    >test_1</name>" +
					"<version >3</version>" +
				'</firmware-slot>' +
			'</system-state>' +
			"</config>" +
		'</edit-config>'

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

	// in uci section firmware-slot with name test_2 edit option version
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
			"<config>" +
			'<system-state xmlns="urn:ietf:params:xml:ns:yang:ietf-system-openwrt">' +
				'<firmware-slot>' +
					"<name >test_2</name>" +
					"<version >5</version>" +
				'</firmware-slot>' +
			'</system-state>' +
			"</config>" +
		'</edit-config>'

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
