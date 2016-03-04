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

var netconf_client = require('../../../netconf_client')
var util = require('util')

var xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<black-book xmlns='urn:ietf:params:xml:ns:yang:black-book'>" +
				 "<count>5</count>" +
				 "<person>" +
					"<name>Jennifer</name>" +
					"<phone>09176547</phone>" +
				 "</person>" +
				 "<person>" +
					"<name>Scarlet</name>" +
					"<phone>0912346456</phone>" +
				 "</person>" +
			"</black-book>" +
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
