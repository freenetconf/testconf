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

var fs = require('fs');
var xml2js = require('xml2js')
var util = require('util')
var events = require("events")
var path = require("path")

var libssh = require('./node_modules/ssh')
var netconf = require('./netconf')
var debug = require('./debug')

var builder = new xml2js.Builder();

var session_id_counter = 0

var server = function(options, callback)
{
	var opts = options || {}

	this.name = opts.name || 'unknown'
	this.host = opts.host || '::'
	this.port = opts.port || 830
	this.user = opts.user || 'admin'
	this.pass = opts.pass || 'admin'
	this.ssh_key = opts.ssh_key || null
	this.send_hello_message = opts.send_hello_message || true
	this.rpc_methods = {}

	var self = this
	debug.write('. executing test named "' + this.name + '"', true);

	events.EventEmitter.call(this);

	debug.write('.. reading yang directory', true);

	var files = fs.readdirSync("./yang")
	var capabilities = ''
	files.forEach(function(file)
	{
		debug.write('... ' + file, true);

		var capability = '<capability>urn:ietf:params:xml:ns:yang:'
		file = path.basename(file, '.yang')

		var parts = file.split("@")
		if (!parts.length)
			return

		capability += parts[0] + "?module=" + parts[0]
		if (typeof parts[1] !== 'undefined')
			capability += "&amp;revision=" + parts[1]

		capability += "</capability>"

		capabilities += capability
	})

	var ssh_channel = null
	var ssh = libssh.createServer
	({
		hostRsaKeyFile : './keys/ssh_host_rsa_key',
		hostDsaKeyFile : './keys/ssh_host_dsa_key'
	})

	ssh.listen(self.port)

	ssh.on('ready', function()
	{
		debug.write('.. listening on ' + self.host + ":" + self.port, true)

		ssh.on('connection', function(session)
		{
			var connection = {}
			connection.buffer = ''
			connection.netconf_base = 0
			connection.netconf_ready = 0
			connection.session_id = ++session_id_counter

			debug.write('.. received connection', true)

			session.on('auth', function(message)
			{
				if (message.subtype == 'publickey' &&
					message.authUser == self.user &&
					message.comparePublicKey(fs.readFileSync('./keys/admin_rsa.pub')))
				{
					debug.write('... authenticated "' + self.user + '" using public key', true)
					return message.replyAuthSuccess()
				}

				if (message.subtype == 'password' &&
					message.authUser == self.user &&
					message.authPassword == self.pass)
				{
					debug.write('... authenticated "' + self.user + '" using password', true)
					return message.replyAuthSuccess()
				}

				message.replyDefault()
				debug.write('... authentication failed', true)
				callback('error', 'authentication failed for "' + self.user + '"')
			})

			session.on('channel', function(channel)
			{
				ssh_channel = channel


				channel.on('subsystem', function(message)
				{
					if (message.subsystem != 'netconf')
					{
						message.replyDefault()
						debug.write('... tried to request non-netconf subsytem: "' + message.subsystem + '"', true)
						return callback('error', 'tried to request non-netconf subsytem: "' + message.subsystem + '"')
					}

					debug.write('... acquired netconf subsytem', true)

					message.replySuccess()

					if (self.send_hello_message)
					{
						debug.write('.... sending hello message', true)
						channel.write(netconf.hello(capabilities, connection.session_id));
					}
				})

				channel.on('data', function(data)
				{
					debug.write('.... received (partial) msg, len: ' + data.toString().length, false);
					debug.write('<<<< partial msg <<<<', false);
					debug.write(data.toString(), false);
					debug.write('---- partial msg ----', false);

					connection.buffer += data;

					debug.write('.... processing incoming request', true);
					netconf.process_message(connection, process_request)

					function process_request(request)
					{
						debug.write('<<<< msg netconf <<<<', false);
						debug.write(request, false);
						debug.write('---- msg netconf ----', false);

						xml2js.parseString(request, function(error, data)
						{
							if (error)
							{
								debug.write('.... xml parsing failed', true);
								debug.write(error, false);

								return self.emit('error', error)
							}

							if (data["hello"])
							{
								if (connection.netconf_ready)
								{
									debug.write('..... hello received at the wrong stage', true);
									return self.emit('error', 'hello received at the wrong stage')
								}

								debug.write('..... hello', true);
								connection.netconf_ready = 1

								var capabilities = data["hello"]["capabilities"][0].capability;

								for (var i in capabilities)
								{
									debug.write('...... capability - ' + capabilities[i], true);

									if (capabilities[i] == 'urn:ietf:params:netconf:base:1.1')
									{
										connection.netconf_base = 1
									}
								}

								callback(null, self.rpc_methods)

								return
							}

							if (data["rpc"])
							{

								var rpc_reply = {}
								var xml_message = ''

								for (var method in self.rpc_methods)
								{
									if (method in data["rpc"])
									{
										self.rpc_methods[method](data["rpc"][method][0], rpc_method_call)
										break
									}
								}

								function rpc_method_call(resp)
								{

									if (!resp)
									{
										resp = {"rpc-error" : ''}
									}

									if (typeof resp === 'string')
									{
										// TODO: extract arguments
										xml_message = netconf.create_framing.chunkg(resp.length) + netconf.rpc_reply_header(connection.netconf_base) + resp + netconf.rpc_reply_end + netconf.ending[connection.netconf_base]
									}

									else
									{
										rpc_reply = {"rpc-reply": resp}
										rpc_reply["rpc-reply"].$ = data.rpc.$

										xml_message = builder.buildObject(rpc_reply)
										if (connection.netconf_base == 1)
											xml_message = netconf.create_framing_chunk(xml_message.length) + xml_message

										xml_message += netconf.ending[connection.netconf_base]
									}

									self.emit('rpc', data['rpc'])

									debug.write('..... sending rpc', true);

									channel.write(xml_message)

									debug.write('>>>> msg netconf >>>>', false);
									debug.write(xml_message, false);
									debug.write('---- msg netconf ----', false);
								}
							}
						})
					}
				})

				channel.on('end', function()
				{
					debug.write('.. ssh connection closed', true);
					debug.end();
				})

				channel.on('error', function(error)
				{
					debug.write('.. ssh connection closed due to error', true);
					debug.end();
				})
			})
		})
	})

	this.rpc_methods["get"] = function(oin, res)
	{
		res({"data" : ''})
	}

	this.rpc_methods["get-config"] = function(oin, res)
	{
		res({"data" : ''})
	}

	this.rpc_methods["edit-config"] = function(oin, res)
	{
		res({"ok" : ''})
	}

	this.rpc_methods["kill-session"] = function(oin, res)
	{
		res({"ok" : ''})
	}

	this.rpc_methods["close-session"] = function(oin, res)
	{
		res({"ok" : ''})
	}

	this.rpc_methods["get-schema"] = function(oin, response)
	{
		if (typeof oin.identifier === 'undefined')
			return self.emit('error', 'schema identifier missing')

		var file_name = "./yang/" + oin.identifier
		var format = 'yang'

		if (typeof oin.version !== 'undefined')
			file_name += "@" + oin.version

		if (typeof oin.format !== 'undefined')
		{
			if (oin.format != 'yang')
				return self.emit('error', 'get-schema: only "yang" format supported')
		}

		file_name += "." + format

		fs.readFile(file_name, 'utf8', function(error, file) {
		if (error)
			return self.emit('error', error)

			var o_data = {"data" : {}}
			o_data.data['_'] = file
			o_data.data['$'] = { "xmlns": "urn:ietf:params:xml:ns:yang:ietf-netconf-monitoring"}

			response(o_data)
		});
	}
}

util.inherits(server, events.EventEmitter);

exports.create = function(opts, callback)
{
	if (!arguments.length)
		return

	if (typeof callback === 'undefined' && opts !== 'undefined')
		callback = opts

	if (typeof callback != 'function')
		return

	return new server(opts, callback);
}
