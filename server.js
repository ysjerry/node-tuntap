var tuntap = require('./index.js');

try {
	var tt = tuntap({
		type: 'tap',
		name: 'tun12',
		mtu: 1350,
		addr: '192.168.100.2',
		dest: '192.168.100.3',
		mask: '255.255.255.254',
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

var clinet_id="THIS_IS_RANDOM";

var net = require('net');
var client = net.connect({port: 18881, host:"netsave.cn"},
    function(v) { //'connect' listener
  console.log('connected to server!' );
  client.write(clinet_id);
  var seq = 1;
  client.on('data', function(data) {
  		console.log(data.toString());
  		//client.write("DATA FOR " + clinet_id  + " seq " + (seq++) );
	});
});

client.on('end', function() {
  console.log('disconnected from server');
});

var enc = new tuntap.muxer(1500);
var dec = new tuntap.demuxer(1500);

tt.pipe(enc).pipe(dec).pipe(tt);

tt.on('data', function() {
	console.log("tt length= ", arguments.length);
	console.log("tt buffer length= ", arguments[0].length);
});

enc.on('data', function() {
	console.log("enc length= ", arguments.length);
	console.log("enc buffer length= ", arguments[0].length);
});


dec.on('data', function() {
	console.log("dec length= ", arguments.length);
	console.log("dec buffer length= ", arguments[0].length);
});

