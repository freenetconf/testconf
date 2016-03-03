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
var util = require('util')

// delete uci config section with name test_1
var xml_test1 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
	"<target><running/></target>" +
		"<config>" +
		'<system-state xmlns="urn:ietf:params:xml:ns:yang:ietf-system-openwrt">' +
			'<firmware-slot  nc:operation="delete" >' +
				"<name    >test_1</name>" +
			'</firmware-slot>' +
		'</system-state>' +
		"</config>" +
	'</edit-config>'

	
// delete uci config section with name test_2
var xml_test2 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
	"<target><running/></target>" +
		"<config>" +
		'<system-state xmlns="urn:ietf:params:xml:ns:yang:ietf-system-openwrt">' +
			'<firmware-slot  nc:operation="delete" >' +
				"<name    >test_2</name>" +
			'</firmware-slot>' +
		'</system-state>' +
		"</config>" +
	'</edit-config>'

netconf_client.create().then(function(client)
{
	client.send(xml_test1).thenDefault(function(reply)
	{
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
		client.send_close().thenDefault()
	})

	client.send(xml_test2).thenDefault(function(reply)
	{
		console.log(reply)
		console.log(util.inspect(reply, {showHidden: false, depth: null}));
		client.send_close().thenDefault()
	})
})
