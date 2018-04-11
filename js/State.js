class State {

	constructor( player, players, team ) {
		this.stack = new Array();
		this.action = new Action( this, player, players, team );
	};

	update(){
		let currentStateFunction = this.getCurrentState();
		if ( currentStateFunction != null ) {
			this.action[ currentStateFunction ]();
		};
	};

	popState() {
		return this.stack.pop();
	};

	pushState( state ) {
		if ( this.getCurrentState() != state ) {
			this.stack.push( state );
		};
		return this;
	};

	getCurrentState() {
		return this.stack.length > 0 ? this.stack[ this.stack.length - 1 ] : null;
	};

};


class Action {
  
	constructor ( state, player, players, team ) {

		this.state = state;
		this.player = player;
		this.players = players;
		this.team = team;
		this.actions = {
			arrive:		"arrive",
			setRotate:	"setRotate",
			rotate:		"rotate",
			wait:		"wait" 
		};
	};

	/**
	* wait 
	*
	*/
	wait(){
		return true;
	};

	/**
	* Arrive
	*
	*/
	arrive(){

		this.player.boid.arrive( this.player.boid.destination ).update();
		var dx = this.player.boid.destination.x - this.player.boid.position.x;
		var dy = this.player.boid.destination.y - this.player.boid.position.y;
		var distSq = dx * dx + dy * dy;

		if ( distSq < this.player.boid.arriveThreshold ){

			if ( this.player.team == this.team ){

				this.player.boid.destination.x = Game.getRandomInt ( 10, canvas.width-10 );
				this.player.boid.destination.y = Game.getRandomInt ( 10, canvas.height-10 );
				const angle = Math.atan2( this.player.boid.velocity.y, this.player.boid.velocity.x );  
				const angleDest = Math.atan2( this.player.boid.destination.y - this.player.boid.position.y, this.player.boid.destination.x - this.player.boid.position.x );
				this.player.boid.rotate = { start: angle, end: angleDest, duration: Game.getRandomInt( 1500, 2000 ) };

				this.state.popState();
				this.state.pushState( this.actions.setRotate );

				//send info to other team
				socket.send( JSON.stringify( {		
			
					player: {
						index: this.player.index,
						destination: {
							x: this.player.boid.destination.x,
							y: this.player.boid.destination.y
						},
						position: {
							x: this.player.boid.position.x,
							y: this.player.boid.position.y
						},
						velocity: {
							x: this.player.boid.velocity.x,
							y: this.player.boid.velocity.y
						},
						rotate: this.player.boid.rotate,
						team: this.player.team,
						state: this.state.getCurrentState(),
						lobby: this.player.lobby
					},
					state: "update"

				}));

			} else {

				this.state.popState();
				this.state.pushState( this.actions.wait );
			};

		};
	};

	/**
	* The "setRotate" state.
	* It makes the player set rotate by value.
	*/
	setRotate() {

		this.duration = this.player.boid.rotate.duration || 1000;
		this.start = this.player.boid.rotate.start;
		this.end = this.player.boid.rotate.end;
		this.next = null;

		// https://stackoverflow.com/questions/1878907/the-smallest-difference-between-2-angles
		this.shortest = Math.atan2( Math.sin( this.end - this.start ), Math.cos( this.end - this.start ) );    

		this.timeStart = Date.now();

		this.state.popState();
		this.state.pushState( this.actions.rotate );

	};

	/**
	* The "rotate" state.
	* It makes the player rotate by value.
	*/	
	rotate() {

		let currentTime = Date.now();
		if ( !this.timeStart ) this.timeStart = currentTime;

		this.timeNormalized = ( currentTime - this.timeStart ) / this.duration ;

		this.step = this.shortest * this.timeNormalized;
		this.next = this.start + this.step;

		if ( this.timeNormalized < 1 ) {

			this.player.boid.velocity.x = Math.cos( this.next );
			this.player.boid.velocity.y = Math.sin( this.next );
			
		} else {

			this.player.boid.velocity.x = Math.cos( this.end );
			this.player.boid.velocity.y = Math.sin( this.end );

			this.state.popState();
			this.state.pushState( this.actions.arrive );	
		};

	};

};