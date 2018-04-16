const express = require( 'express' );
const app = express();
const http = require( 'http' );
const uuidv4 = require('uuid/v4');

//https://github.com/websockets/ws
const WebSocket = require( 'ws' );
const server = http.createServer( app );
const wss = new WebSocket.Server( { server } );

app.use( express.static( __dirname + '/' ) );

app.get( '/', function ( req, res ) {
    res.sendFile( __dirname + 'index.html' );
});

//loading server side modules
const Client = require( './client.js' );

//Gets all of the connected clients
let allConnectedClients = new Map();
let webSockets = new Object();

wss.on( 'connection', function ( ws, req ){
	
	ws.id = uuidv4();
	let connectedUser = new Client( ws );
	allConnectedClients.set( ws.id, connectedUser );

	webSockets[ ws.id ] = ws;
	webSockets[ ws.id ].send( JSON.stringify( {		
						message: "Connected w/ ID:" + ws.id + "...waiting opponent ",
					}));

	for ( let user of allConnectedClients.values() ) {

		if ( connectedUser.id != user.id && user.state == "idle" ){

			user.changeState( "busy" );
			connectedUser.changeState( "busy" );

			let lobby = new Object(); 
			lobby = {
				redTeamID: user.id,
				blueTeamID: connectedUser.id
			};
			
			user.addLobby( lobby );
			connectedUser.addLobby( lobby );
			
			user.addTeam( "red" );
			webSockets[ user.id ].send( JSON.stringify( {		
						message: "Opponent found, i'm the red team.",
						team: "red",
						state: "start",
						lobby: lobby
					}));

			connectedUser.addTeam( "blue" );
			webSockets[ connectedUser.id ].send( JSON.stringify( {		
						message: "Opponent found, i'm the blue team.",
						team: "blue",
						state: "start",
						lobby: lobby
					}));

			break;

		};

	};

	ws.on( 'message', function ( message ) {

		let obj = JSON.parse( message );
		let state = null;
		let target = null;

		if ( obj.player.team == "red" ){

			target = obj.player.lobby.blueTeamID;

		} else {

			target = obj.player.lobby.redTeamID;

		};

		if( webSockets[ target ] != undefined ){

			webSockets[ target ].send( JSON.stringify( { 
				player: obj.player,
				state: obj.state
			}));

		};

	});

	ws.on( 'close', function () {
		delete webSockets[ ws.id ]
		allConnectedClients.delete( ws.id );
		console.log( 'deleted: ' + ws.id );
	});	

} );

const PORT = process.env.PORT || 4000;

server.listen( PORT, function listening() {
	console.log( 'Listening on %d', server.address().port );
});
