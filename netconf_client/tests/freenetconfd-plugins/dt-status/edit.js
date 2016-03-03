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
var util = require('util');

var xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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

netconf_client.create().then(function(client)
{
	client.send(xml).thenDefault(function(reply)
	{
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
		client.send_close().thenDefault()
	})
})
