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

// netconf base 1.0 and base 1.1 ending
var netconf_ending = [ "]]>]]>", "\n##\n" ]

var xml_prologue = '<?xml version="1.0" encoding="UTF-8"?>'

var netconf_hello_header =
	xml_prologue + '<hello xmlns="urn:ietf:params:xml:ns:netconf:base:1.0">'

var netconf_capabilities =
	'<capabilities>' +
		'<capability>urn:ietf:params:netconf:base:1.0</capability>' +
		'<capability>urn:ietf:params:netconf:base:1.1</capability>' +
		'<capability>urn:ietf:params:netconf:capability:notification:1.0</capability>' +
		'<capability>urn:ietf:params:netconf:capability:writable-running:1.0</capability>' +
		'<capability>urn:ietf:params:netconf:capability:candidate:1.0</capability>' +
		'<capability>urn:ietf:params:netconf:capability:validate:1.0</capability>' +
		'<capability>urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring?module=ietf-netconf-monitoring&amp;revision=2010-10-04</capability>' +
	'</capabilities>'

var netconf_hello_ending = '</hello>' + netconf_ending[0]

var netconf_rpc_end = '</rpc>'
var netconf_rpc_reply_end = '</rpc-reply>'

exports.hello = function(capabilities, session_id)
{
	capabilities = capabilities || ''

	var session_id_xml = session_id ? "<session-id>" + session_id + "</session-id>" : ""

	return netconf_hello_header +
		"<capabilities>" +
			netconf_capabilities +
			capabilities +
		"</capabilities>" +
		session_id_xml +
		netconf_hello_ending
}

exports.get = function(filter)
{
	return "<get />"
}

exports.get_config = function(filter)
{
	return "<get-config />"
}

exports.kill = function(session_id)
{
	var session_id_xml = session-id ? "<session-id>" + session_id + "</session-id>" : ""

	return "<kill-session>" + session_id_xml + "</kill-session>"
}

exports.close = function()
{
	return "<close-session />"
}

var netconf_rpc_header = exports.rpc_header = function(base, message_id)
{
	base = base || 0
	message_id = message_id || 0

	return '<rpc xmlns="urn:ietf:params:xml:ns:netconf:base:1.' + base + '" message-id="'+ message_id + '">'
}

var netconf_rpc_reply_header = exports.rpc_reply_header = function(base, message_id)
{
	base = base || 0
	message_id = message_id || 0

	return '<rpc-reply xmlns="urn:ietf:params:xml:ns:netconf:base:1.'+ base + '" message-id="'+ message_id + '">'
}

exports.get_schema = function(schema)
{
	var schema_xml = '<get-schema xmlns="urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring">'

	schema_xml += "<identifier>" + schema.identifier + "</identifier>"
	schema_xml += "<format>" + (("format" in schema) ? schema.format : "yang") + "</format>"
	schema_xml += ("version" in schema) ? "<version>" + schema.version + "</version>" : ""

	schema_xml += '</get-schema>'

	return schema_xml
}

exports.rpc_end = netconf_rpc_end
exports.rpc_reply_end = netconf_rpc_reply_end
exports.ending = netconf_ending

exports.process_message = function(connection, callback)
{
	var request = null
	while (connection.buffer.indexOf(netconf_ending[connection.netconf_base]) !== -1) {

		// get message without ending
		var end = connection.buffer.indexOf(netconf_ending[connection.netconf_base])
		var request = connection.buffer.substr(0, end)

		// and remove it from buffer
		connection.buffer = connection.buffer.substr(end + netconf_ending[connection.netconf_base].length)

		// get message length
		if (connection.netconf_base == 1)
		{
			var framing_chunk = request.match(/[0-9]+/)
			request = request.replace(/\n.*#[0-9]+\n/, '')
		}

		// callback with message
		request && callback && callback(request)
	}
}

var create_framing_chunk = exports.create_framing_chunk = function(message_length)
{
	message_length = message_length || 0

	return "\n#" + message_length + "\n"
}
exports.create_rpc_message = function(message, base, message_id)
{
	if (!message)
		return

	base = base || 0

	var r_message = netconf_rpc_header(base, message_id) + message + netconf_rpc_end + netconf_ending[base]

	return (base == 1 ? create_framing_chunk(message.length) + r_message : r_message)
}

exports.create_rpc_reply_message = function(message, base, message_id)
{
	if (!message)
		return

	base = base || 0

	var r_message = netconf_rpc_reply_header(base, message_id) + message + netconf_rpc_reply_end + netconf_ending[base]

	return (base == 1 ? create_framing_chunk(message.length) + r_message : r_message)
}
