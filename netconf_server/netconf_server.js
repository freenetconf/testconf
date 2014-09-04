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

var libssh = require('ssh')
var netconf = require('../core/netconf')
var debug = require('../core/debug')
var config = require('../core/config')

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

	try
	{
		self.rpc_methods = require(config.server_methods_dir + "core.js")
	}
	catch(e)
	{
		debug.write(e, true)
	}

	events.EventEmitter.call(this);

	debug.write('.. reading yang directory', true);

	var capabilities = netconf.capabilities_from_yang(config.yang_dir)

	var ssh_channel = null
	var ssh = libssh.createServer
	({
		hostRsaKeyFile : config.keys_dir + 'ssh_host_rsa_key',
		hostDsaKeyFile : config.keys_dir + 'ssh_host_dsa_key'
	})

	ssh.listen(self.port)

	ssh.on('ready', function()
	{
		debug.write('.. listening on ' + self.host + ":" + self.port, true)

		ssh.on('connection', function(session)
		{
			debug.write('.. received connection', true)

			session.on('auth', function(message)
			{
				if (message.subtype == 'publickey' &&
					message.authUser == self.user &&
					message.comparePublicKey(fs.readFileSync(config.keys_dir + 'admin_rsa.pub')))
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
				var connection = {}
				connection.buffer = ''
				connection.netconf_base = 0
				connection.netconf_ready = 0
				connection.session_id = ++session_id_counter

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
						var h = netconf.hello(capabilities, connection.session_id)
						debug.write('.... sending hello message', true)

						channel.write(h)

						debug.write('<<<< msg netconf (hello) <<<<', false);
						debug.write(h, false);
						debug.write('---- msg netconf (hello) ----', false);
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
					debug.write('.. ssh channel closed', true);
					debug.end();
				})

				channel.on('error', function(error)
				{
					debug.write('.. ssh channel closed due to error', true);
					debug.end();
				})
			})
		})
	})

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
