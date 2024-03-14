// TODO: add game state. if enemy reaches target zone, game is over
// TODO: progressively increase difficulty
// TODO: add reward, sound effects, music
document.addEventListener('DOMContentLoaded', function () {
  const canvas = document.getElementById('myCanvas');
  const ctx = canvas.getContext('2d');
  var score = 0;
  var running = true;
  var displayWidth = window.innerWidth - 60;
  var displayHeight = window.innerHeight - 60;
  //var backgroundColour = 'rgb(67, 67, 52, 0.2)'; // REM: last parameter is translucency
  var backgroundColour = 'rgb(128, 128, 100, 1.0)'; // REM: last parameter is translucency
  // var backgroundColour = 'rgb(40,40,40  )'; // REM: last parameter is translucency
  var friendSpacing = 20; // 32;
  var maxSpeed = 3;
  var numFriends = 6;
  var numEnemies = 4;
  var missileRangeThreshold = 200;
  me = new player(displayWidth / 2, displayHeight - 100);
  var flankAngle = 1.5;
  var flankRadius = 200;
  var Friends = [];
  var Enemies = [];
  var Explosions = [];
  var Missiles = [];

  // mouse coordinates
  var xM = displayWidth / 2;
  var yM = displayHeight * 0.8;

  // Create buddy instances (friends) and push them into the Friends array
  for (var i = 0; i < numFriends; i++) {
    var x = Math.random() * displayWidth; // initial location
    var y = displayHeight; // REM: Math.random()
    var newBuddy = new buddy(x, y, 1); // friends have c value of 1
    Friends.push(newBuddy);
  }

  // Create enemy instances
  for (var i = 0; i < numEnemies; i++) {
    var newEnemy = new buddy(Math.random() * displayWidth, 0, 2); // enemies have c value of 2
    Enemies.push(newEnemy);
  }

  var thetaDerivative = 0.0;
  let p2x = 0.0; // right flank position
  let p2y = 0.0;
  let p3x = 0.0; // left flank position
  let p3y = 0.0;

  // Add mouse click listener which will be useful later on
  document.addEventListener('click', function (event) {
    // Update x and y variables with mouse click coordinates
    xM = event.clientX;
    yM = event.clientY;
    console.log('Mouse clicked at:', xM, yM);
  });

  window.addEventListener(
    'keydown',
    function (event) {
      if (event.defaultPrevented) {
        return;
      }
      switch (event.key) {
        case 'ArrowLeft':
          // thetaDerivative -= thetaDerivative > -0.1 ? 0.1 : 0;
          thetaDerivative = -0.1;
          break;
        case 'ArrowRight':
          // thetaDerivative += thetaDerivative < 0.1 ? 0.1 : 0;
          thetaDerivative = 0.1;
          break;
        case 'ArrowUp':
          me.radius += 0.5;
          break;
        case 'ArrowDown':
          me.radius -= 0.5;
          break;
        case 'c':
          flankAngle = 1.5;
          flankRadius = 60;
          break;
        case 'r':
          flankAngle = 0.0;
          flankRadius = 600;
          break;
        case 'f':
          Missiles.push(new missile(me.x, me.y, me.theta, 0)); // 0 denotes player
          console.log('missile fired, array length: ' + Missiles.length);
        default:
          return;
      }

      // limit radius (speed) between -1 and maxSpeed
      me.radius =
        me.radius > maxSpeed + 2
          ? maxSpeed + 2
          : me.radius < -2
          ? -2
          : me.radius;
      me.theta = me.theta % (2 * Math.PI);
      event.preventDefault();
    },
    true
  ); // end add event listener

  function startGame() {
    myGameArea.start();
  }

  var myGameArea = {
    canvas: document.getElementById('myCanvas'),
    canvas1: document.getElementById('myCanvas1'),
    start: function () {
      this.canvas.width = displayWidth;
      this.canvas.height = window.innerHeight;
      this.context = this.canvas.getContext('2d');
      //      document.body.insertBefore(this.canvas, document.body.childNodes[0]);
      this.frameNo = 0;
      this.interval = setInterval(updateGameArea, 80);
    },
    clear: function () {},
  };

  function player(x, y) {
    this.x = x;
    this.y = y;
    this.theta = Math.PI * 1.5;
    this.radius = 2;

    this.update = function () {
      // this line causes player steering to drift to center
      this.theta += thetaDerivative;
      if (thetaDerivative < 0) thetaDerivative += 0.03;
      else if (thetaDerivative >= 0) thetaDerivative -= 0.03;

      this.theta =
        this.x > displayWidth || this.x < 0
          ? Math.PI - (this.theta % (2 * Math.PI))
          : this.y > window.innerHeight || this.y < 0
          ? (2 * Math.PI - this.theta) % (2 * Math.PI)
          : this.theta;
      this.x += this.radius * Math.cos(this.theta);
      this.y += this.radius * Math.sin(this.theta);
      this.x = this.x > displayWidth ? displayWidth : this.x < 0 ? 0 : this.x;
      this.y = this.y > displayHeight ? displayHeight : this.y < 0 ? 0 : this.y;
      // draw player
      var p = getClosestOpp(this.x, this.y, 1);
      drawTank(this.x, this.y, 8, this.theta, 0, ctx, p[0], p[1]); // magic 6 is radius of tank turret
    };
  } // end function player

  function explosion(x, y) {
    this.x = x;
    this.y = y;
    this.age = 20;
    this.colour = 'rgb(0, 0, 0, 0.3)';
    this.update = function () {
      drawBurst(this.x, this.y, ctx, this.age);
      this.age--;
    };
  }

  function missile(x, y, t, missileType) {
    this.x = x;
    this.y = y;
    this.oldx = x;
    this.oldy = y;
    this.age = 100;
    this.r = 12;
    this.type = missileType;
    this.update = function () {
      this.x += this.r * Math.cos(t);
      this.y += this.r * Math.sin(t);
      if (
        this.x > displayWidth ||
        this.x < 0 ||
        this.y > displayHeight ||
        this.y < 0
      )
        this.age = 1;
      if (this.age < 99) {
        drawPuff(this.oldx, this.oldy, ctx);
        drawTarget(this.x, this.y, 1, 'rgb(0, 0, 0)', ctx);
        drawLine(
          this.x,
          this.y,
          this.oldx,
          this.oldy,
          'rgba(255, 0, 0, 0.2)',
          ctx
        );
      }
      this.oldx = this.x;
      this.oldy = this.y;
      this.age--;
    };
  }

  function buddy(x, y, c) {
    this.x = x;
    this.y = y;
    this.theta = 0.0;
    this.oldTheta = 0.0;
    this.radius = 2 + Math.random() * 2; // speed
    this.max = c == 2 ? maxSpeed : maxSpeed + 1;
    this.compareNext = function (f) {
      if (
        Math.sqrt(Math.pow(this.x - f.x, 2) + Math.pow(this.y - f.y, 2)) <
        friendSpacing
      ) {
        this.radius = f.radius -= 0.12; //f.radius * 0.9;
      } else {
        this.radius += this.radius < this.max ? 0.1 : 0.01;
      }
    };

    this.update = function (a, b) {
      // a and b are target or desired direction coordinates
      this.theta = getThetaFromPoints(this.x, this.y, a, b);

      // calculate distance to followed object
      if (
        Math.sqrt(Math.pow(a - this.x, 2) + Math.pow(b - this.y, 2)) <
        friendSpacing
      ) {
        this.radius -= this.radius > -2 ? 0.1 : 0;
      } else {
        this.radius += this.radius < this.max ? 0.15 : 0;
      }

      this.x += this.radius * Math.cos(this.theta);
      this.y += this.radius * Math.sin(this.theta);
      this.x = this.x > displayWidth ? displayWidth : this.x < 0 ? 0 : this.x;
      this.y = this.y > displayHeight ? displayHeight : this.y < 0 ? 0 : this.y;
      var p = getClosestOpp(this.x, this.y, c);
      drawTank(this.x, this.y, 8, this.theta, c, ctx, p[0], p[1]); // magic 6 is radius of tank turret
    };
  } // end function enemy

  function getClosestOpp(x, y, t) {
    // get closest opp by type
    var min = 1000;
    var pos = [0, 0];
    if (t == 1) {
      // is friend so look for closest enemy tank
      for (i = 0; i < Enemies.length; ++i) {
        var d = Math.sqrt(
          Math.pow(Enemies[i].x - x, 2) + Math.pow(Enemies[i].y - y, 2)
        );
        if (d < min) {
          pos[0] = Enemies[i].x;
          pos[1] = Enemies[i].y;
          min = d;
        }
      }
    } else if (t == 2) {
      // is enemy so look for closest friend tank
      for (i = 0; i < Friends.length; ++i) {
        var d = Math.sqrt(
          Math.pow(Friends[i].x - x, 2) + Math.pow(Friends[i].y - y, 2)
        );
        if (d < min) {
          pos[0] = Friends[i].x;
          pos[1] = Friends[i].y;
          min = d;
        }
      }
    }
    return pos;
  }

  function updateGameArea() {
    // withholding just to increase speed, trying to decide if is ok aesthetically...
    //    myGameArea.clear();
    ctx.fillStyle = backgroundColour;
    ctx.fillRect(0, 0, displayWidth, window.innerHeight);
    me.update();

    drawTarget(xM, yM, 60, 'rgb(0, 255, 0, 0.2)', ctx);
    drawTarget(p2x, p2y, 30, 'rgba(255, 165, 0, 0.2)', ctx);
    drawTarget(p3x, p3y, 30, 'rgba(255, 165, 0, 0.2)', ctx);

    // left leader follows player left flank
    Friends[0].update(p2x, p2y);
    // right leader follows player right flank
    Friends[numFriends - 1].update(p3x, p3y);

    // make left side friends follow left flank leader
    var i = 1;
    for (; i < numFriends / 2; i++) {
      // make friends spread out on battlefield
      Friends[i].compareNext(Friends[i - 1]);
      var tgt = getFlank(
        Friends[i - 1].x,
        Friends[i - 1].y,
        Friends[i - 1].theta,
        // 1
        flankAngle,
        flankRadius
      );
      Friends[i].update(tgt[0], tgt[1]);
    }
    // make right side friends follow right flank leader
    for (i = numFriends - 2; i >= numFriends / 2; i--) {
      Friends[i].compareNext(Friends[i + 1]);
      var tgt = getFlank(
        Friends[i + 1].x,
        Friends[i + 1].y,
        Friends[i + 1].theta,
        // 0
        -flankAngle,
        flankRadius
      );
      Friends[i].update(tgt[0], tgt[1]);
    }

    // draw enemies
    Enemies[0].update(xM, yM);
    for (i = 1; i < Enemies.length; i++) {
      // Enemies[i].compareNext(Enemies[i - 1]);
      // Enemies[i].update(Enemies[i - 1].x, Enemies[i - 1].y);
      Enemies[i].compareNext(Enemies[i - 1]);
      Enemies[i].update(xM, yM);
    }

    for (var j = Friends.length - 1; j >= 0; j--) {
      for (i = Enemies.length - 1; i >= 0; i--) {
        // check for collisions
        if (
          Math.abs(Enemies[i].x - Friends[j].x) < 20 &&
          Math.abs(Enemies[i].y - Friends[j].y) < 20
        ) {
          Explosions.push(new explosion(Enemies[i].x, Enemies[i].y));
          Enemies.splice(i, 1);
          Enemies.push(
            new buddy(
              (Math.random() * displayWidth) / 2 + displayWidth / 4,
              0,
              2
            )
          );
        }
      } // end inner for
    } // end outer for

    // update missiles
    // really need to take a good look at this part
    for (i = Missiles.length - 1; i >= 0; i--) {
      Missiles[i].update();
      for (var j = Enemies.length - 1; j >= 0 && Missiles[i].type < 2; j--) {
        if (
          Math.sqrt(
            Math.pow(Missiles[i].x - Enemies[j].x, 2) +
              Math.pow(Missiles[i].y - Enemies[j].y, 2)
          ) < 20
        ) {
          // push explosion here
          Explosions.push(new explosion(Missiles[i].x, Missiles[i].y));
          Enemies.splice(j, 1);
          Missiles.splice(i, 1);
          score++;
          Enemies.push(
            new buddy(
              (Math.random() * displayWidth) / 2 + displayWidth / 4,
              0,
              2
            )
          );
        }
      }
    }
    for (i = 0; i < Missiles.length; i++)
      if (Missiles[i].age < 0) Missiles.splice(i, 1);

    if (flankAngle < 0.3) flankAngle += 0.01;
    else if (flankAngle < 1.5) flankAngle += 0.1;
    if (flankRadius > 30) flankRadius -= 1;
    var p2 = getFlank(me.x, me.y, me.theta, flankAngle, flankRadius);
    var p3 = getFlank(me.x, me.y, me.theta, -flankAngle, flankRadius);

    p2x = p2[0];
    p2y = p2[1];
    p3x = p3[0];
    p3y = p3[1];

    // draw attack target
    for (i = Explosions.length - 1; i >= 0; i--) {
      Explosions[i].update();
      if (Explosions[i].age < 1) Explosions.splice(i, 1);
    }

    for (i = 0; i < Enemies.length; i++) {
      if (
        Math.sqrt(
          Math.pow(Enemies[i].x - xM, 2) + Math.pow(Enemies[i].y - yM, 2)
        ) < 20
      )
        running = false;
    }

    // update score
    // Fill text
    ctx.font = '30px Courier';
    ctx.fillStyle = 'black';
    ctx.fillText(score, 50, 50);
    ctx.font = '40px Courier';
    ctx.fillText('戦車戦', 50, displayHeight - 50);

    if (running == false) {
      // ctx.font = '100px Courier';
      // ctx.fillText('敗者', 50, displayHeight / 2); // Haisha Loser
      drawTarget(xM, yM, 400, 'rgba(255, 0, 0, 0.4)', ctx);
      clearInterval(myGameArea.interval);
    } else if (score >= 64) {
      // ctx.font = '100px Courier';
      // ctx.fillText('勝者', 50, displayHeight / 2); // Shosha Winner
      drawTarget(xM, yM, 400, 'rgba(0, 255, 0, 0.4)', ctx);
      clearInterval(myGameArea.interval);
    }
  } // end function updateGameArea()

  startGame();
});
