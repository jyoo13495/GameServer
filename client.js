// JavaScript source code
class Client{

	constructor( ws ) {

    	this.id = ws.id;
    	this.state = "idle";
    	this.team = "";
    	this.clientSocket = ws;
    	this.LobbyArr = new Array();

    	console.log( "Client State:" + this.state + " id:" + this.id );

    };

    changeState( newState ) {
        this.state = newState;
    };

    addLobby( lobbyId ) {
        this.LobbyArr.push( lobbyId );
        this.lobbyAssigned = lobbyId;
    };

    addTeam( team ) {
        this.team = team;
    };

};

module.exports = Client;