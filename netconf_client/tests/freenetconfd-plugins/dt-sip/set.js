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

	// create config section ext with name 1000
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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

	// create config section ext with name 1234
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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

	// create config section general
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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

	// create config section trunk
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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
