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

// create config section ext with name 1000
var xml_1000 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext  nc:operation='create'  >" +
					"<name     >1000</name>" +
					"<type     >generic</type>" +
					"<context  >ctx</context>" +
					"<target   >phone</target>" +
				"</ext>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// create config section ext with name 1234
var xml_1234 = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<extension  xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<ext  nc:operation='create'>" +
					"<name          >1234</name>" +
					"<type          >external</type>" +
					"<international >1</international>" +
					"<rings >" +
						"<ring  >10</ring>" +
						"<ring  >11</ring>" +
						"<ring  >12</ring>" +
					"</rings>" +
					"<trunk         >terastream</trunk>" +
				"</ext>" +
			"</extension>" +
		"</config>" +
	"</edit-config>"

// create config section general
var xml_general = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<general nc:operation='create' xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<name     >general</name>" +
				"<disabled >0</disabled>" +
				"<ami      >1</ami>" +
				"<amihost  >127.0.0.1</amihost>" +
				"<amiport  >100</amiport>" +
				"<amiuser  >user</amiunec>" +
				"<amipass  >pass</amipass>" +
			"</general>" +
		"</config>" +
	"</edit-config>"

// create config section trunk
var xml_trunk = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
		"<target><running/></target>" +
		"<config>" +
			"<trunk  nc:operation='create' xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
				"<name     >terastream</name>" +
				"<type     >terastream</type>" +
				"<server   >dot.org</server>" +
				"<username >1234</username>" +
				"<nr       >1234</nr>" +
				"<password >pass</password>" +
				"<codecs   >mp3</codecs>" +
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
		client.send_close()
	})

	client.send(xml_trunk).thenDefault(function(reply)
	{
		printDebug(reply)
		client.send_close().thenDefault()
	})
})
