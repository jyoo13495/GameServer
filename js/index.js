class Game{

	constructor(){
		this.canvas = document.getElementById( 'canvas' );
		this.context = this.canvas.getContext( '2d' );
		this.w = 1000;
		this.h = 600;
		this.canvas.width = this.w;
		this.canvas.height = this.h;
		this.canvas.style.zIndex = "10";

		this.playerNum = 22;
		this.players = new Array();

		let options = {
			mass: 1,
			maxSpeed: 5,
			maxForce: 1,
			edgeBehavior: 'bounce',
			maxDistance: 400,
			minDistance: 20,
			radius: 8
		};

		this.cursorOpacity = 1;
		this.cursorTrue = false;
		this.cursorMinDest = 25;
		this.then = Date.now();

		this.goalPosTop = 262.5;
		this.goalHeight = 80;
		this.boardRight = 950;
		this.boardleft = 50;
		this.teams = {};
		this.teams.homeScore = 0;
		this.teams.awayScore = 0;

	};

	static getRandomInt( min, max ){

		return Math.random() * ( max - min ) + min;
	};

	loop(){

		RAF = requestAnimationFrame( this.loop.bind(this) );
		let now = Date.now();
		let delta = now - this.then;
		deltaTime = delta / 30; // adjust here to have a good looking speed
		this.then = now;

		this.context.clearRect( 0, 0, this.canvas.width, this.canvas.height );

		for( let t = 0; t < this.players.length; t++ ) {

			let player = this.players[t];
			player.state.update();
			this.context.beginPath();
			this.context.fillStyle = player.color;
			this.context.arc( player.boid.position.x, player.boid.position.y, player.radius, Math.PI * 2, false );
			this.context.fill();

			//direction 
			let angle = Math.atan2( player.boid.velocity.y, player.boid.velocity.x );
			let x = player.boid.position.x + player.radius * Math.cos( angle );
			let y = player.boid.position.y + player.radius * Math.sin( angle );

			this.context.fillStyle = '#f00';
			this.context.beginPath();
			this.context.arc( x, y, 3, 0, 2 * Math.PI, false );
			this.context.fill();

		};

	};

	init( team, lobby ) {

		this.team = team;

		for( let i = 0; i < this.playerNum; i++ ) {

			this.players.push( new Object() );

			this.players[i].boid = new Boid();
			this.players[i].boid.destination = new Vec2();
			this.players[i].radius = 8;
			this.players[i].index = i;
			this.players[i].lobby = lobby;
			this.players[i].state = new State( this.players[i], this.players, this.team );
			this.players[i].rotate = 0;

			if ( i < 11 ){

				this.players[i].boid.destination.x = Math.random() * canvas.width;
				this.players[i].boid.destination.y = Math.random() * canvas.height;
				this.players[i].boid.position.x = Math.random() * canvas.width;
				this.players[i].boid.position.y = Math.random() * canvas.height;
				this.players[i].boid.velocity.x = Game.getRandomInt( -5, 5 ); 
				this.players[i].boid.velocity.y = Game.getRandomInt( -5, 5 );
				this.players[i].color = this.team == "red" ? "#ff0000" : "#0000ff";
				this.players[i].team = this.team;
				this.players[i].state.pushState( "arrive" );	


				socket.send( JSON.stringify( {		
				
					player: {
						index: this.players[i].index,
						destination: {
							x: this.players[i].boid.destination.x,
							y: this.players[i].boid.destination.y
						},
						position: {
							x: this.players[i].boid.position.x,
							y: this.players[i].boid.position.y
						},
						velocity: {
							x: this.players[i].boid.velocity.x,
							y: this.players[i].boid.velocity.y
						},
						rotate: this.players[i].rotate,
						team: this.players[i].team,
						state: "arrive",
						lobby: lobby
					},
					state: "update"

				}));

			} else {

				this.players[i].state.pushState( "wait" );
				this.players[i].color = this.team == "red" ? "#0000ff" : "#ff0000";
				this.players[i].team = this.team == "red" ? "blue" : "red";

			};

		};

		this.loop();

	};

	updateOpponent( obj ) {

		this.players[ obj.player.index + 11 ].boid.destination.x = obj.player.destination.x;
		this.players[ obj.player.index + 11 ].boid.destination.y = obj.player.destination.y;
		this.players[ obj.player.index + 11 ].boid.position.x = obj.player.position.x;
		this.players[ obj.player.index + 11 ].boid.position.y = obj.player.position.y;
		this.players[ obj.player.index + 11 ].boid.velocity.x = obj.player.velocity.x; 
		this.players[ obj.player.index + 11 ].boid.velocity.y = obj.player.velocity.y;
		this.players[ obj.player.index + 11 ].boid.rotate = obj.player.rotate;
		this.players[ obj.player.index + 11 ].state.popState();// remove wait
		this.players[ obj.player.index + 11 ].state.pushState( obj.player.state );// add arrive

	};

};


document.getElementById( "home" ).addEventListener( "click", function(){

	for ( let i = 0; i < game.playerNum; i++ ){
		var distribute = function( val, max, min ) { return ( val - min ) / ( max - min ); }; //normalize
		var value = distribute( i, game.playerNum, 0 ) * 18;
		var row = parseInt( value / 6 );
		var column = value % 6;      
		game.players[i].boid.destination.x = column * 150 + game.getRandomInt( 60,90 ); 
		game.players[i].boid.destination.y = row * 187.5 + game.getRandomInt( 90, 120 );
	};

});

document.getElementById( "random" ).addEventListener( "click", function(){

	for ( var i = 0; i < game.playerNum; i++ ){
		game.players[i].boid.destination.x = game.getRandomInt( 60, 960 );
		game.players[i].boid.destination.y = game.getRandomInt( 40, 580 );
	};

});

document.getElementById( "formation" ).addEventListener( "click", function(){
  
  var formation = [
    [ 5, 4, 1 ],
    [ 4, 5, 1 ],
    [ 4, 4, 2 ],
    [ 4, 4, 1, 1 ],
    [ 4, 3, 3 ],
    [ 4, 3, 2 ],
    [ 4, 2, 3, 1 ],
    [ 4, 2, 2, 2 ],
    [ 4, 2, 1, 3 ],
    [ 4, 2, 4, 1 ],
    [ 4, 1, 3, 2 ],
    [ 4, 1, 2, 3 ],
    [ 3, 5, 2, 2 ],
    [ 3, 5, 1, 1 ],
    [ 3, 4, 1, 2 ],
    [ 3, 4, 3 ],
    [ 3, 4, 2, 1 ]
  ];

  let index = 1;
  let width = 1000;
  let height = 600;
  let pointerFormation = 15;
  let	stepX = 0;
  let stepY = 0;

  for ( let c = 0; c < formation[ pointerFormation ].length; c++ ) {
    stepX += ( width / 2 ) / formation[ pointerFormation ].length;
    for ( let i = 0; i < formation[ pointerFormation ][ c ]; i++ ){
      let step = height / formation[ pointerFormation ][ c ]; 
      stepY = step * ( i + 1 ) - step / 2;
      game.players[index].boid.destination.x = stepX - 50;
      game.players[index].boid.destination.y = stepY;
      index++;
    };
    stepY = 0;
  };

  pointerFormation = 4;

  for ( let c = 0; c < formation[ pointerFormation ].length; c++ ) {
    stepX += ( width / 2 ) / formation[ pointerFormation ].length;
    for ( let i = 0; i < formation[ pointerFormation ][ c ]; i++ ){
      var step = height / formation[ pointerFormation ][ c ]; 
      stepY = step * ( i + 1 ) - step / 2;
      game.players[ index ].boid.destination.x = stepX - 115;
      game.players[ index ].boid.destination.y = stepY;
      index++;
    };
    stepY = 0;
  };

  //goalkeeper
  game.players[ 0 ].boid.destination.x = 30;
  game.players[ 0 ].boid.destination.y = 300;
  game.players[ 21 ].boid.destination.x = 950;
  game.players[ 21 ].boid.destination.y = 300;

});