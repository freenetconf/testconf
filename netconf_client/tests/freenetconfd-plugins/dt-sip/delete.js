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

// delete config section ext with name 1000
var xml_1000 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext  nc:operation='delete'>" +
					"<name>1000</name>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// delete config section ext with name 1234
var xml_1234 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext nc:operation='delete'>" +
					"<name>1234</name>" +
				"</ext>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// delete config section general
var xml_general = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<general nc:operation='delete' xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
			"</general>" +
		"</config>" +
	"</edit-config>"

// delete config section trunk
var xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<trunk nc:operation='delete' xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
			"</trunk>" +
		"</config>" +
	"</edit-config>"

var printDebug = function(reply)
{
	console.log(reply)
	console.log(util.inspect(reply, {showHidden: false, depth: null}));
}

netconf_client.create().then(function(client)
{
	client.send(xml_1000).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close().thenDefault()
	})


	client.send(xml_1234).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close().thenDefault()
	})

	client.send(xml_general).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close().thenDefault()
	})


	client.send(xml).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close().thenDefault()
	})
})
