var playerColour = 'rgb(170, 255, 90)';
var friendColour = 'rgb(150, 166, 64)';
var enemyColour = 'rgb(230, 100, 100)';
var flankRadius = 80; // how far apart friends will try to space themselves

var tankBodyImage = new Image();
var tankTurretImage = new Image();
var tankBodyImageEnemy = new Image();
var tankTurretImageEnemy = new Image();

tankBodyImage.src = 'body.png'; // 26 * 43
tankTurretImage.src = 'turret.png'; // 17 * 49
tankBodyImageEnemy.src = 'bodyEnemy.png';
tankTurretImageEnemy.src = 'turretEnemy.png';

function getThetaFromPoints(x0, y0, x1, y1) {
  return Math.atan((y1 - y0) / (x1 - x0)) + (x1 < x0 ? Math.PI : 0);
}

//function getFlank(x0, y0, t, s) {
function getFlank(x0, y0, t, s, r) {
  // t = theta, s = side: L/R = 0/1
  var x = Math.cos(t) * r;
  var y = Math.sin(t) * r;

  // // calculate left or right flank
  // var x1 = s == 0 ? y + x0 : -y + x0;
  // var y1 = s == 0 ? -x + y0 : x + y0;

  x1 = x * Math.cos(s) - y * Math.sin(s) + x0;
  y1 = x * Math.sin(s) + y * Math.cos(s) + y0;

  return [Math.floor(x1), Math.floor(y1)];
}

function drawPuff(x, y, ctx) {
  x += Math.floor(Math.random() * 3);
  y += Math.floor(Math.random() * 2);
  var radius = Math.floor(Math.random() * 3 + 2);
  ctx.beginPath();
  ctx.arc(Math.floor(x), Math.floor(y), radius, 0, Math.PI * 2);
  var colour = 'rgba(255,255,0,' + (Math.random() / 4 + 0.05) + ')';

  ctx.fillStyle = colour;
  ctx.fill();
}

function drawBurst(x, y, ctx, age) {
  for (var i = 0; i < age / 8 + 1; i++) {
    x += Math.floor(Math.random() * 20) - 5;
    y += Math.floor(Math.random() * 20) - 5;
    var radius = Math.floor(Math.random() * 50 + 10);
    var colour =
      'rgba(' +
      Math.floor(Math.random() * 125 + 130) +
      ',' +
      Math.floor(Math.random() * 125) +
      ',0, 0.3)';
    ctx.beginPath();
    ctx.arc(Math.floor(x), Math.floor(y), radius, 0, Math.PI * 2);
    ctx.fillStyle = colour;
    ctx.fill();
  }
}

function drawTarget(x, y, r, colour, ctx) {
  return new Promise((resolve) => {
    ctx.save();
    ctx.translate(Math.floor(x), Math.floor(y));

    // Draw the target arc circle
    ctx.beginPath();
    //    ctx.strokeStyle = '#F00'; // Border color
    ctx.arc(0, 0, r, 0, 2 * Math.PI);
    //    ctx.stroke();
    ctx.fillStyle = colour;
    ctx.fill();
    ctx.closePath();

    ctx.restore();
    resolve();
  });
} // end draw target

function drawLine(x0, y0, x1, y1, colour, ctx) {
  return new Promise((resolve) => {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = colour;
    ctx.moveTo(Math.floor(x0), Math.floor(y0));
    ctx.lineTo(Math.floor(x1), Math.floor(y1));
    ctx.stroke();
    resolve();
  });
}

function drawTank(x, y, r, theta, c, ctx, xM, yM) {
  return new Promise((resolve) => {
    // EXPERIMENTAL use real tank image
    if (c != 0) {
      var x1 = xM - x;
      var y1 = yM - y;
      var t = Math.atan(y1 / x1);
      if ((x > xM && y > yM) || (xM < x && yM > y)) t += Math.PI;

      ctx.save();
      ctx.translate(Math.floor(x), Math.floor(y)); // Translate to the center of the rectangle before rotating
      ctx.rotate(theta + Math.PI / 2);

      //      ctx.save();
      // ctx.translate(me.x, me.y);
      // ctx.rotate(me.theta + Math.PI / 2);
      ctx.drawImage(tankBodyImageEnemy, -13, -23);

      // Make enemy tanks aim at player
      ctx.rotate(t - theta);

      ctx.drawImage(tankTurretImageEnemy, -8, -40);
      ctx.restore();
      if (c == 2) {drawTarget(x, y, 4,'rgba(255,0,0,0.5)', ctx)};
      // // Draw the rectangle - body of tank
      // ctx.beginPath();
      // ctx.strokeStyle = '#000'; // Border color
      // if (c == 0) {
      //   ctx.fillStyle = playerColour;
      // } else if (c == 1) {
      //   ctx.fillStyle = friendColour;
      // } else if (c == 2) {
      //   ctx.fillStyle = enemyColour;
      // }

      // ctx.lineWidth = 3;
      // //    ctx.rect(-18, -12, 36, 24); // Rectangle centered at (0,0) after translation
      // ctx.rect(-12, -8, 24, 16); // Rectangle centered at (0,0) after translation
      // ctx.fill();
      // ctx.stroke(); // Stroke after fill to ensure border appears
      // ctx.closePath();

      // // Make enemy tanks aim at player
      // // if (c == 2) ctx.rotate(getThetaFromPoints(x, y, me.x, me.y) - theta);
      // if (c == 2) ctx.rotate(getThetaFromPoints(x, y, xM, yM) - theta);
      // // // Draw the arc (circle) - tank turret
      // else if (c != 0) ctx.rotate(t - theta);

      // ctx.beginPath();
      // ctx.strokeStyle = '#000';
      // ctx.arc(0, 0, r, 0, 2 * Math.PI); // Draw the circle
      // ctx.stroke();
      // ctx.closePath();

      // // Draw the line connected to the circle
      // ctx.beginPath();
      // ctx.moveTo(0, 0); // Start point at the center of the circle
      // ctx.lineTo(17, 0); // End point of the line (adjust coordinates as needed)
      // ctx.strokeStyle = '#000'; // Set color for the line
      // ctx.lineWidth = 4;
      // ctx.stroke();
      // ctx.closePath();

      // ctx.restore();
      // resolve();
    } else {
      ctx.save();
      ctx.translate(me.x, me.y);
      ctx.rotate(me.theta + Math.PI / 2);
      ctx.drawImage(tankBodyImage, -13, -23);
      ctx.drawImage(tankTurretImage, -8, -40);
      ctx.restore();
    }
  });
} // end drawTank
