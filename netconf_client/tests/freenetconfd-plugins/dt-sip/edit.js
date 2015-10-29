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


	// in uci section ext with name 1000 edit context
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
			"<target><running/></target>" +
			"<config>" +
				"<extension  xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
					"<ext>" +
						"<name    >1000</name>" +
						"<context >new_ctx</context>" +
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

	// in uci section ext 1234 add new element 5000 to list ring
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
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

	// in uci section general set disable to 0 and amihost to 127.0.0.2
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
			"<target><running/></target>" +
			"<config>" +
				"<general xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
					"<disabled >1</disabled>" +
					"<amihost  >127.0.0.2</amihost>" +
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

	// in uci section trunk set option password to new_pass
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
			"<target><running/></target>" +
			"<config>" +
				"<trunk xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
					"<password >new_pass</password>" +
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

	// in uci section trunk delete option nc
	xml = "<edit-config xmlns:nc='urn:ietf:params:xml:ns:netconf:base:1.0'>" +
			"<target><running/></target>" +
			"<config>" +
				"<trunk xmlns='urn:ietf:params:xml:ns:yang:sip'>" +
					"<nr nc:operation='delete' />" +
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
})

client.on('error', function(error)
{
	console.error(error)
	process.exit(1)
})

client.on('end', function(error)
{
})
