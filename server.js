var tuntap = require('./index.js');

try {
	var tt = tuntap({
		type: 'tun',
		name: 'tun12',
		mtu: 1400,
		addr: '192.168.100.1',
		dest: '192.168.100.255',
		mask: '255.255.255.0',
		ethtype_comp: 'none',
		persist: false,
		//up: true,
		//running: true,
	});
}
catch(e) {
	console.log('Tuntap creation error: ', e);
	process.exit(0);
}


var enc = new tuntap.muxer(1410);
//var dec = new tuntap.demuxer(1500);

var net = require('net');

var clients = {}

var client_id = "";

function clientCallback(c) { //'connection' listener
	console.log('client connected');
	c.on('end', function() {
		console.log('client disconnected');
		delete clients[this.client_id][c.index];
	});
	c.dec =  new tuntap.demuxer(1410);
	c.dec.on('data', function (data) {
		tt.write(data);
	});
	c.on("data", function(data) {
		this.client_id = data.toString();
		client_id = this.client_id;
		clients[this.client_id] || (clients[this.client_id] = []);
		this.index = clients[this.client_id].length;
		clients[this.client_id].push(this);
		this.write("ACK REQ " + this.client_id);
		this.removeAllListeners(["data"]);
		this.on("data", function(data) {
			this.dec.write(data);
		});
	});
}
var server = net.createServer(clientCallback);

server.listen(18881, function() { //'listening' listener
	console.log('server bound');
});

var server2 = net.createServer(clientCallback);

server2.listen(18882, function() { //'listening' listener
	console.log('server bound');
});

var server3 = net.createServer(clientCallback);

server3.listen(18883, function() { //'listening' listener
	console.log('server bound');
});

var server4 = net.createServer(clientCallback);

server4.listen(18884, function() { //'listening' listener
	console.log('server bound');
});


tt.pipe(enc);
//dec.pipe(tt);

function getIdleSocket() {
	var minRemain = 0x7FFFFFFF;
	var socket = undefined;
	for( var i in clients[client_id]) {
		sock  = clients[client_id][i];
		if (sock.remainPackages == undefined || sock.remainPackages < minRemain) {
			sock.remainPackages ||(sock.remainPackages = 1);
			socket = sock;
			minRemain = socket.remainPackages;
		}
	}
	return socket;
}

enc.on('data', function() {

	sock = getIdleSocket();

	if(sock) {
		sock.remainPackages++;
		sock.write(arguments[0], function() {
			this.remainPackages--;
		});
	}
});


//dec.on('data', function() {
//	console.log("dec length= ", arguments.length);
//	console.log("dec buffer length= ", arguments[0].length);
//});

