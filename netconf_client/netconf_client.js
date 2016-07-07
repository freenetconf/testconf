/*
 * Copyright (C) 2014 Cisco Systems, Inc.
 *
 * Author: Petar Koretic <petar.koretic@sartura.hr>
 * Author: Luka Perkov <luka.perkov@sartura.hr>
 * Author: Mak Krnic <mak.krnic@sartura.hr>
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
var events = require("events")
var util = require('util')
var path = require('path')
var Promise = require('promise')
var vasync = require('vasync')
var xml2js = require('xml2js')

var netconf = require('../core/netconf')
var debug = require('../core/debug')
var config = require('../core/config')

var client = function(options)
{
	var opts = options || {}
	this.name = opts.name || path.basename(module.parent.filename)
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
	var connection_open = false;

	events.EventEmitter.call(this);

	self.log_file = fs.openSync(self.log_name, "a+")

	if (!self.log_file)
	{
		var err_msg = "unable to create log file: '" + self.log_name + "'"
		console.error(err_msg)

		return Promise.reject(err_msg)
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

	var methods_queue = []

	var global_resolve = null
	var global_reject  = null

	this.netconf = null

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

	var parseRequest = function(request, callback)
	{
	}

	var errorHandler = function(error) {
		ssh.end()
		return global_reject && global_reject(error)
	}

	var sendHello = function() {
		debug.write('.... sending client hello', true, self.log_file)
		debug.write('>>>> msg netconf hello >>>>', false, self.log_file)
		debug.write(netconf.hello(self.capabilities), false, self.log_file)
		debug.write('---- msg netconf hello ----', false, self.log_file)

		self.netconf.write(netconf.hello(self.capabilities));
	}

	var startSshClientSession = function(ssh_opts)
	{
		return new Promise(function(resolve, reject)
		{

			ssh.on('ready', function() {
				debug.write('.. ssh connection ready', true, self.log_file)
				vasync.waterfall([
					function(next) {
						ssh.subsys('netconf', next)
					},
					function(stream, next) {
						self.netconf = stream
						debug.write('... netconf subsystem acquired', true, self.log_file)
						sendHello()

						stream.on('error', function(error)
						{
							debug.write('.. ssh stream close error', true, self.log_file)
							connection_open = false
							errorHandler(error)
						})

						stream.on('close', function()
						{
							debug.write('.. ssh stream close', true, self.log_file)
							connection_open = false
							ssh.end();
						});

						stream.on('data', function processHello(data)
						{
							connection_open = true
							debug.write('.... received (partial) msg, len: ' + data.toString().length, false, self.log_file)
							debug.write('<<<< partial msg <<<<', false, self.log_file)
							debug.write(data.toString(), false, self.log_file)
							debug.write('---- partial msg ----', false, self.log_file)

							self.buffer += data.toString();

							debug.write('.... processing incoming request', true, self.log_file)
							netconf.process_message(self, function(request) {
								debug.write('<<<< msg netconf <<<<', false, self.log_file)
								debug.write(request, false, self.log_file)
								debug.write('---- msg netconf ----', false, self.log_file)

								xml2js.parseString(request, function(error, data)
								{
									if (error) {
										debug.write('.... xml parsing failed', true, self.log_file)
										debug.write(error, false, self.log_file)
										callback("xml parsing failed")
										return
									}

									if (data['hello']) {
										if (netconf_ready)
										{
											debug.write('..... hello received at the wrong stage', true, self.log_file)
											return next('hello received at the wrong stage')
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

										stream.removeListener('data', processHello)
										stream.on('data', self.processMessage)
										next(null)
										resolve()
										return
									}

								})
							})
						})
					}
				],
				function err(error) {
					if (error) {
						console.log("error")
						console.log(error)
					}
				})
			})
			.on('error', function(error)
			{
				connection_open = false
				if (!netconf_ready)
				{
					return reject && reject(error)
				}

				debug.write('.. ssh connection closed due to error', true, self.log_file)
				debug.write(error, false, self.log_file)
				//fs.closeSync(self.log_file);
				//throw 'error 1'
			})
			.on('close', function(had_error)
			{
				connection_open = false
				debug.write('.. ssh connection closed', true, self.log_file)
				//fs.closeSync(self.log_file);
			});

			ssh.connect(ssh_opts);
		})
	}

	this.processMessage = function (data) {
		debug.write('.... received (partial) msg, len: ' + data.toString().length, false, self.log_file)
		debug.write('<<<< partial msg <<<<', false, self.log_file)
		debug.write(data.toString(), false, self.log_file)
		debug.write('---- partial msg ----', false, self.log_file)

		self.buffer += data.toString();

		debug.write('.... processing incoming request', true, self.log_file)
		netconf.process_message(self, function(request) {
			debug.write('<<<< msg netconf <<<<', false, self.log_file)
			debug.write(request, false, self.log_file)
			debug.write('---- msg netconf ----', false, self.log_file)

			xml2js.parseString(request, function(error, data) {
				if (data["rpc-reply"])
				{
					var msg_id = data["rpc-reply"].$["message-id"]
					if (typeof messages_queue[msg_id] === 'undefined')
					{
						debug.write('..... rpc-reply with incorrect message id', true, self.log_file)
						return reject && reject("rpc-reply with incorrect message id")
					}

					debug.write('..... rpc-reply', true, self.log_file)

					messages_queue[msg_id](request)
					delete messages_queue[msg_id]
					self.runOne()
				}
			})
		})
	}

	this.send = function(message, callback)
	{
		var send_message = function() {
			// create netconf message
			var xml_message = netconf.create_rpc_message(message, self.netconf_base, message_id)

			// add message to global queue
			messages_queue[message_id++] = callback

			// send message via ssh
			self.netconf.write(xml_message);

			debug.write('>>>> msg netconf >>>>', false, self.log_file)
			debug.write(xml_message, false, self.log_file)
			debug.write('---- msg netconf ----', false, self.log_file)
		}

		if (!connection_open)
		{
			debug.write('... ssh stream has not been established', true, self.log_file)
			startSshClientSession(ssh_opts).then(function() {
				if (!netconf_ready)
				{
					debug.write('... netconf not ready, hello message has not been exchanged', true, self.log_file)
					errorHandler('netconf not ready, hello message has not been exchanged')
				}
				else {
					send_message()
				}
			})
		}
		else {
			send_message()
		}
	}

	// standard netconf rpcs
	this.get = function(filter, callback)
	{
		debug.write('.... scheduling msg (get)', true, self.log_file)
		methods_queue.push({method: self.send, args: netconf.get(filter), callback: callback})
		return self
	}

	this.get_config = function(filter, callback)
	{
		debug.write('.... scheduling msg (get-config)', true, self.log_file)
		methods_queue.push({method: self.send, args: netconf.get_config(filter), callback: callback})
		return self
	}

	this.kill = function(session_id, callback)
	{
		debug.write('.... scheduling msg (kill-session)', true, self.log_file)
		methods_queue.push({method: self.send, args: netconf.kill(session_id), callback: callback})
		return self
	}

	this.get_schema = function(schema, callback)
	{
		if (!schema || !("identifier" in schema)) {
			throw new Error('missing mandatory argument "identifier" in schema')
		}

		debug.write('.... scheduling msg (get-schema)', true, self.log_file)
		methods_queue.push({method: self.send, args: netconf.get_schema(schema), callback: callback})
		return self
	}

	this.close = function(callback) {
		debug.write('.... scheduling msg (close-session)', true, self.log_file)
		methods_queue.push({method: self.send, args: netconf.close(), callback: callback})
		return self
	}

	var run_resolve = null
	var run_reject = null

	this.runOne = function() {
		if (methods_queue.length) {
			global_resolve = self.runOne
			var method = methods_queue.shift()
			method.method(method.args, method.callback)
		}
		else {
			run_resolve && run_resolve()
		}
	}

	var index = 0;
	this.run = function() {
		return new Promise(function(resolve, reject) {
			global_resolve = run_resolve = resolve
			global_reject = run_reject = reject

			self.runOne()
		})
	}

	return this
}

util.inherits(client, events.EventEmitter);

exports.create = function(opts)
{
	return client(opts)
}
