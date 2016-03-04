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

var netconf_client = require('../../netconf_client')
var util = require('util')

var xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<system xmlns='urn:ietf:params:xml:ns:yang:ietf-system'>" +
				"<timezone-location>UTC-new</timezone-location>" +
			"</system>" +
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
