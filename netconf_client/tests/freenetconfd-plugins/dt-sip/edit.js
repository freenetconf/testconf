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

var xmls = []
// in uci section ext with name 1000 edit context
var xml_1000 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext>" +
					"<name>1000</name>" +
					"<context>new_ctx</context>" +
				"</ext>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// in uci section ext 1234 add new element 5000 to list ring
var xml_1234 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext>" +
					"<name>1234</name>" +
					"<rings>" +
						"<ring>5000</ring>" +
					"</rings>" +
				"</ext>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// in uci section general set disable to 0 and amihost to 127.0.0.2
var xml_general = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<general xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<disabled>1</disabled>" +
				"<amihost>127.0.0.2</amihost>" +
			"</general>" +
		"</config>" +
	"</edit-config>"

// in uci section trunk set option password to new_pass
var xml_trunk = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<trunk xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<password>new_pass</password>" +
			"</trunk>" +
		"</config>" +
	"</edit-config>"

// in uci section trunk delete option nc
var xml_trunk2 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<trunk xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<nr nc:operation='delete' />" +
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

	client.send(xml_trunk).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close()
	})

	client.send(xml_trunk2).thenDefault(function(reply)
	{
		client.send_close().thenDefault()
	})
})
