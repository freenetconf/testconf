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

var ssh2 = require('ssh2')
var xml2js = require('xml2js')
var builder = new xml2js.Builder();
var events = require("events")
var util = require('util')

var netconf = require('../core/netconf')
var debug = require('../core/debug')
var config = require('../core/config')

var client = function(options, callback)
{
	var opts = options || {}
	this.name = opts.name || 'unknown'
	this.host = opts.host || config.netconf.host
	this.port = opts.port || config.netconf.port
	this.user = opts.user || config.netconf.user
	this.pass = opts.pass || config.netconf.pass
	this.capabilities = opts.capabilities || []
	this.ssh_key = opts.ssh_key || null
	this.send_hello_message = opts.send_hello_message || true

	var self = this
	debug.write('. executing test named "' + this.name + '"', true);

	this.buffer = ''
	this.netconf_base = 0

	var message_id = 1
	var messages_queue = []

	events.EventEmitter.call(this);

	var netconf_ready = false;

	var ssh = new ssh2();
	var ssh_opts = {}
	var con = null

	ssh_opts.host = self.host
	ssh_opts.port = self.port

	if (self.ssh_key)
	{
		ssh_opts.ssh_key = self.ssh_key
	}
	else
	{
		ssh_opts.username = self.user
		ssh_opts.password = self.pass
	}

	ssh.connect(ssh_opts);

	ssh.on('ready', function()
	{
		debug.write('.. ssh connection ready', true);

		ssh.subsys('netconf', function(error, stream)
		{
			if (error)
			{
				ssh.end()
				callback && callback(error)

				return
			}

			con = stream

			debug.write('... netconf subsystem acquired', true);

			if (self.send_hello_message)
			{
				debug.write('.... sending client hello', true);
				debug.write('>>>> msg netconf hello >>>>', false);
				debug.write(netconf.hello(self.capabilities), false);
				debug.write('---- msg netconf hello ----', false);

				stream.write(netconf.hello(self.capabilities));
			}

			stream.on('data', function(data, extended)
			{
				debug.write('.... received (partial) msg, len: ' + data.toString().length, false);
				debug.write('<<<< partial msg <<<<', false);
				debug.write(data.toString(), false);
				debug.write('---- partial msg ----', false);

				self.buffer += data.toString();

				debug.write('.... processing incoming request', true);
				netconf.process_message(self, process_request)

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
							if (netconf_ready)
							{
								debug.write('..... hello received at the wrong stage', true);
								return self.emit('error', 'hello received at the wrong stage')
							}

							debug.write('..... hello', true);
							netconf_ready = 1

							var capabilities = data["hello"]["capabilities"][0].capability;

							for (var i in capabilities)
							{
								debug.write('...... capability - ' + capabilities[i], true);

								if (capabilities[i] == 'urn:ietf:params:netconf:base:1.1')
								{
									self.netconf_base = 1;
								}
							}

							callback && callback()

							return
						}

						if (data["rpc-reply"])
						{
							var msg_id = data["rpc-reply"].$["message-id"]
							if (typeof messages_queue[msg_id] === 'undefined')
							{
								debug.write('..... rpc-reply with incorrect message id', true);
								return self.emit('error', "rpc-reply with incorrect message id")
							}

							debug.write('..... rpc-reply', true);
							self.emit('rpc-reply', data['rpc-reply'])

							messages_queue[msg_id](null, request)
							delete messages_queue[msg_id]
						}
					})
				}
			})

			stream.on('close', function()
			{
				debug.write('.. ssh stream close', true);
				ssh.end();
				self.emit('end')
			});

			stream.on('error', function(error)
			{
				debug.write('.. ssh stream close', true);
				ssh.end()
				self.emit('error', error)
			})

		});
	});

	ssh.on('error', function(error)
	{
		if (!netconf_ready)
		{
			callback && callback(error)

			return
		}

		debug.write('.. ssh connection closed due to error', true);
		debug.write(error, false)
		debug.end();
		self.emit('error', error)
	})

	ssh.on('close', function(had_error)
	{
		debug.write('.. ssh connection closed', true);
		debug.end();
	});


	this.send = function(message, callback)
	{
		if (!con)
		{
			debug.write('... ssh stream has not been established', true);
			return self.emit('error', 'ssh stream has not been established')
		}

		if (!netconf_ready)
		{
			debug.write('... netconf not ready, hello message has not been exchanged', true);
			return self.emit('error', 'netconf not ready, hello message has not been exchanged')
		}

		// create netconf message
		var xml_message = netconf.create_rpc_message(message, self.netconf_base, message_id)

		// add message to global queue
		messages_queue[message_id++] = callback

		// send message via ssh
		con.write(xml_message);

		debug.write('>>>> msg netconf >>>>', false);
		debug.write(xml_message, false);
		debug.write('---- msg netconf ----', false);
	}

	// standard netconf rpcs
	this.send_get = function(filter, callback)
	{
		if (!callback && typeof filter == 'function')
			callback = filter

		self.send(netconf.get(filter), callback)

		debug.write('.... sending msg (get)', true);
	}

	this.send_get_config = function(filter)
	{
		if (!callback && typeof filter == 'function')
			callback = filter

		self.send(netconf.get_config(filter), callback)

		debug.write('.... sending msg (get-config)', true);
	}

	this.send_close = function(callback)
	{
		self.send(netconf.close(), callback)

		debug.write('.... sending msg (close-session)', true);
	}

	this.send_kill = function(session_id, callback)
	{
		if (!callback && typeof session_id == 'function')
			callback = session_id

		self.send(netconf.kill(session_id), callback)

		debug.write('.... sending msg (kill-session)', true);
	}

	this.send_get_schema = function(schema, callback)
	{
		if (!schema || !("identifier" in schema)) {
			return callback('missing mandatory argument "identifier" in schema')
		}

		if (!filter && typeof schema == 'function')
			callback = schema

		self.send(netconf.get_schema(schema), callback)

		debug.write('.... sending msg (get-schema)', true);
	}
}

util.inherits(client, events.EventEmitter);

exports.create = function(opts, callback)
{
	if (!arguments.length)
		return

	if (typeof callback === 'undefined' && opts !== 'undefined')
		callback = opts

	if (typeof callback != 'function')
		return

	return new client(opts, callback);
}
