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
	this.log_name = opts.log_name || config.client.log_name
	this.capabilities = opts.capabilities || []
	this.ssh_key = opts.ssh_key || null
	this.send_hello_message = opts.send_hello_message || true

	var self = this

	this.buffer = ''
	this.netconf_base = 0

	var message_id = 1
	var messages_queue = []

	var netconf_ready = false;

	events.EventEmitter.call(this);

	self.log_file = fs.openSync(self.log_name, "a+")

	if (!self.log_file)
	{
		var err_msg = "unable to create log file: '" + self.log_name + "'"
		console.error(err_msg)

		return callback(err_msg)
	}

	debug.write('. executing test named "' + this.name + '"', true, self.log_file)

	try
	{
		self.rpc_methods = require(config.server_methods_dir + "core.js")
	}
	catch(e)
	{
		debug.write(e, true, self.log_file)
	}

	var ssh = new ssh2();
	var ssh_opts = {}
	var con = null

	var log_file = null

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
		debug.write('.. ssh connection ready', true, self.log_file)

		ssh.subsys('netconf', function(error, stream)
		{
			if (error)
			{
				ssh.end()
				callback && callback(error)

				return
			}

			con = stream

			debug.write('... netconf subsystem acquired', true, self.log_file)

			if (self.send_hello_message)
			{
				debug.write('.... sending client hello', true, self.log_file)
				debug.write('>>>> msg netconf hello >>>>', false, self.log_file)
				debug.write(netconf.hello(self.capabilities), false, self.log_file)
				debug.write('---- msg netconf hello ----', false, self.log_file)

				stream.write(netconf.hello(self.capabilities));
			}

			stream.on('data', function(data, extended)
			{
				debug.write('.... received (partial) msg, len: ' + data.toString().length, false, self.log_file)
				debug.write('<<<< partial msg <<<<', false, self.log_file)
				debug.write(data.toString(), false, self.log_file)
				debug.write('---- partial msg ----', false, self.log_file)

				self.buffer += data.toString();

				debug.write('.... processing incoming request', true, self.log_file)
				netconf.process_message(self, process_request)

				function process_request(request)
				{
					debug.write('<<<< msg netconf <<<<', false, self.log_file)
					debug.write(request, false, self.log_file)
					debug.write('---- msg netconf ----', false, self.log_file)

					xml2js.parseString(request, function(error, data)
					{
						if (error)
						{
							debug.write('.... xml parsing failed', true, self.log_file)
							debug.write(error, false, self.log_file)

							return self.emit('error', error)
						}

						if (data["hello"])
						{
							if (netconf_ready)
							{
								debug.write('..... hello received at the wrong stage', true, self.log_file)
								return self.emit('error', 'hello received at the wrong stage')
							}

							debug.write('..... hello', true, self.log_file)
							netconf_ready = 1

							var capabilities = data["hello"]["capabilities"][0].capability;

							for (var i in capabilities)
							{
								debug.write('...... capability - ' + capabilities[i], true, self.log_file)

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
								debug.write('..... rpc-reply with incorrect message id', true, self.log_file)
								return self.emit('error', "rpc-reply with incorrect message id")
							}

							debug.write('..... rpc-reply', true, self.log_file)
							self.emit('rpc-reply', data['rpc-reply'])

							messages_queue[msg_id](null, request)
							delete messages_queue[msg_id]
						}
					})
				}
			})

			stream.on('close', function()
			{
				debug.write('.. ssh stream close', true, self.log_file)
				ssh.end();
				self.emit('end')
			});

			stream.on('error', function(error)
			{
				debug.write('.. ssh stream close', true, self.log_file)
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

		debug.write('.. ssh connection closed due to error', true, self.log_file)
		debug.write(error, false, self.log_file)
		fs.closeSync(self.log_file);
		self.emit('error', error)
	})

	ssh.on('close', function(had_error)
	{
		debug.write('.. ssh connection closed', true, self.log_file)
		fs.closeSync(self.log_file);
	});


	this.send = function(message, callback)
	{
		if (!con)
		{
			debug.write('... ssh stream has not been established', true, self.log_file)
			return self.emit('error', 'ssh stream has not been established')
		}

		if (!netconf_ready)
		{
			debug.write('... netconf not ready, hello message has not been exchanged', true, self.log_file)
			return self.emit('error', 'netconf not ready, hello message has not been exchanged')
		}

		// create netconf message
		var xml_message = netconf.create_rpc_message(message, self.netconf_base, message_id)

		// add message to global queue
		messages_queue[message_id++] = callback

		// send message via ssh
		con.write(xml_message);

		debug.write('>>>> msg netconf >>>>', false, self.log_file)
		debug.write(xml_message, false, self.log_file)
		debug.write('---- msg netconf ----', false, self.log_file)
	}

	// standard netconf rpcs
	this.send_get = function(filter, callback)
	{
		if (!callback && typeof filter == 'function')
			callback = filter

		self.send(netconf.get(filter), callback)

		debug.write('.... sending msg (get)', true, self.log_file)
	}

	this.send_get_config = function(filter)
	{
		if (!callback && typeof filter == 'function')
			callback = filter

		self.send(netconf.get_config(filter), callback)

		debug.write('.... sending msg (get-config)', true, self.log_file)
	}

	this.send_close = function(callback)
	{
		self.send(netconf.close(), callback)

		debug.write('.... sending msg (close-session)', true, self.log_file)
	}

	this.send_kill = function(session_id, callback)
	{
		if (!callback && typeof session_id == 'function')
			callback = session_id

		self.send(netconf.kill(session_id), callback)

		debug.write('.... sending msg (kill-session)', true, self.log_file)
	}

	this.send_get_schema = function(schema, callback)
	{
		if (!schema || !("identifier" in schema)) {
			return callback('missing mandatory argument "identifier" in schema')
		}

		if (!filter && typeof schema == 'function')
			callback = schema

		self.send(netconf.get_schema(schema), callback)

		debug.write('.... sending msg (get-schema)', true, self.log_file)
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
