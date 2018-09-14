const touche_gauche = 37;
const touche_droite = 39;
const space = 32;

const largeur = 800;
const hauteur = 558;

const taille_joueur = 20;
const vitesse_joueur = 600.0;
const vitesse_obus = 300.0;
const v_obus = 0.5;

const ligne_enemie = 10;
const marge_ligne_enemie_horizontal= 80;
const marge_ligne_enemie_vertical = 70;
const espace_ligne_enemie = 80;
const v_enemie = 5.0;

const principal = {
  lastTime: Date.now(),
  gauche: false,
  droite: false,
  barre_espace: false,
  joueurX: 0,
  joueurY: 0,
  v_joueur: 0,
  obus: [],
  enemies: [],
  obus_enemie: [],
  gameOver: false
};

function rectsIntersect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function setPosition(el, x, y) {
  el.style.transform = `translate(${x}px, ${y}px)`;
}

function zone_de_guerre(v, min, max) {
  if (v < min) {
    return min;
  } else if (v > max) {
    return max;
  } else {
    return v;
  }
}

function rand(min, max) {
  if (min === undefined) min = 0;
  if (max === undefined) max = 1;
  return min + Math.random() * (max - min);
}
//Creation du joueur principal
function createPlayer($container) {
  principal.joueurX = largeur / 2;
  principal.joueurY = hauteur - 50;
  const $player = document.createElement("img");
  $player.src = "Images/joueur_principal_1.png";
  $player.className = "player";
  $container.appendChild($player);
  setPosition($player, principal.joueurX, principal.joueurY);
}
//Fin de la creation du joueur principal
//Lors ce que le joueur perd
function destroyPlayer($container, player) {
  $container.removeChild(player);
  principal.gameOver = true;
  const audio = new Audio("Audios/6.aac");
  audio.play();
}
//Fin
//fin
//Gestion du déplacement du joueur principal et limite au niveau des bords
function updatePlayer(dt, $container) {
  if (principal.gauche) {
    principal.joueurX -= dt * vitesse_joueur;
  }
  if (principal.droite) {
    principal.joueurX += dt * vitesse_joueur;
  }

  principal.joueurX = zone_de_guerre(
    principal.joueurX,
    taille_joueur,
    largeur - taille_joueur
  );

  if (principal.barre_espace && principal.v_joueur <= 0) {
    createLaser($container, principal.joueurX, principal.joueurY);
    principal.v_joueur = v_obus;
  }
  if (principal.v_joueur > 0) {
    principal.v_joueur -= dt;
  }

  const player = document.querySelector(".player");
  setPosition(player, principal.joueurX, principal.joueurY);
}
//Fin

//Creation des obus pour le joueur principal
function createLaser($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "Images/obus.png";
  $element.className = "laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  principal.obus.push(laser);
  const audio = new Audio("Audios/boom.mp3");
  audio.play();
  setPosition($element, x, y);
}
//Fin

//Gestion de la limite de l'obus sur les bords
function updateLasers(dt, $container) {
  const obus = principal.obus;
  for (let i = 0; i < obus.length; i++) {
    const laser = obus[i];
    laser.y -= dt * vitesse_obus;
    if (laser.y < 0) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const enemies = principal.enemies;
    for (let j = 0; j < enemies.length; j++) {
      const enemy = enemies[j];
      if (enemy.isDead) continue;
      const r2 = enemy.$element.getBoundingClientRect();
      if (rectsIntersect(r1, r2)) {
        // Enemy was hit
        destroyEnemy($container, enemy);
        destroyLaser($container, laser);
        break;
      }
    }
  }
  principal.obus = principal.obus.filter(e => !e.isDead);
}

function destroyLaser($container, laser) {
  $container.removeChild(laser.$element);
  laser.isDead = true;
}
//Fin

//Creation des cibles à éliminer
function createEnemy($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "Images/enemie_1.png";
  $element.className = "enemy";
  $container.appendChild($element);
  const enemy = {
    x,
    y,
    cooldown: rand(0.5, v_enemie),
    $element
  };
  principal.enemies.push(enemy);
  setPosition($element, x, y);
}
//Gestion de la limite des enemies sur les bords
function updateEnemies(dt, $container) {
  const dx = Math.sin(principal.lastTime / 1000.0) * 50;
  const dy = Math.cos(principal.lastTime / 1000.0) * 10;

  const enemies = principal.enemies;
  for (let i = 0; i < enemies.length; i++) {
    const enemy = enemies[i];
    const x = enemy.x + dx;
    const y = enemy.y + dy;
    setPosition(enemy.$element, x, y);
    enemy.cooldown -= dt;
    if (enemy.cooldown <= 0) {
      createEnemyLaser($container, x, y);
      enemy.cooldown = v_enemie;
    }
  }
  principal.enemies = principal.enemies.filter(e => !e.isDead);
}

function destroyEnemy($container, enemy) {
  $container.removeChild(enemy.$element);
  enemy.isDead = true;
}
//Fin

//Creation des obus enemies
function createEnemyLaser($container, x, y) {
  const $element = document.createElement("img");
  $element.src = "Images/obus.png";
  $element.className = "enemy-laser";
  $container.appendChild($element);
  const laser = { x, y, $element };
  principal.obus_enemie.push(laser);
  setPosition($element, x, y);
}

function updateEnemyLasers(dt, $container) {
  const obus = principal.obus_enemie;
  for (let i = 0; i < obus.length; i++) {
    const laser = obus[i];
    laser.y += dt * vitesse_obus;
    if (laser.y > hauteur) {
      destroyLaser($container, laser);
    }
    setPosition(laser.$element, laser.x, laser.y);
    const r1 = laser.$element.getBoundingClientRect();
    const player = document.querySelector(".player");
    const r2 = player.getBoundingClientRect();
    if (rectsIntersect(r1, r2)) {
      // Player was hit
      destroyPlayer($container, player);
      break;
    }
  }
  principal.obus_enemie = principal.obus_enemie.filter(e => !e.isDead);
}

function init() {
  const $container = document.querySelector(".game");
  createPlayer($container);

  const espace_enemie =
    (largeur - marge_ligne_enemie_horizontal* 2) / (ligne_enemie - 1);
  for (let j = 0; j < 3; j++) {
    const y = marge_ligne_enemie_vertical + j * espace_ligne_enemie;
    for (let i = 0; i < ligne_enemie; i++) {
      const x = i * espace_enemie + marge_ligne_enemie_horizontal;
      createEnemy($container, x, y);
    }
  }
}
// Boucle des victoires et défaites
function playerHasWon() {
  return principal.enemies.length === 0;
}

function update(e) {
  const currentTime = Date.now();
  const dt = (currentTime - principal.lastTime) / 1000.0;

  if (principal.gameOver) {
    document.querySelector(".game-over").style.display = "block";
    return;
  }

  if (playerHasWon()) {
    document.querySelector(".congratulations").style.display = "block";
    document.geElementById("audio").audio.play();
    return;

  }
  const $container = document.querySelector(".game");
  updatePlayer(dt, $container);
  updateLasers(dt, $container);
  updateEnemies(dt, $container);
  updateEnemyLasers(dt, $container);

  principal.lastTime = currentTime;
  window.requestAnimationFrame(update);
}
//Touche de deplacement vers la gauche et vers la droite
function onKeyDown(e) {
  if (e.keyCode === touche_gauche) {
    principal.gauche = true;
  } else if (e.keyCode === touche_droite) {
    principal.droite = true;
  } else if (e.keyCode === space) {
    principal.barre_espace = true;
  }
}

function onKeyUp(e) {
  if (e.keyCode === touche_gauche) {
    principal.gauche = false;
  } else if (e.keyCode === touche_droite) {
    principal.droite = false;
  } else if (e.keyCode === space) {
    principal.barre_espace = false;
  }
}
//Fin
//Valeur d'un id
var up = document.getElementById('level_up');
up.addEventListener('click',level_up);
function level_up()
{ document.location.href='level_up/index.html';

}
  //Fin
//Ajout des ecouteurs d'evenements
init();
window.addEventListener("keydown", onKeyDown);
window.addEventListener("keyup", onKeyUp);
window.requestAnimationFrame(update);
