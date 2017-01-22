var player;
var enemy;

function BattleIdol (idol) {
	var self = this;
	
	self.idol = idol;

  var statModifier = 1.01;
  function modStat(stat, mod) {
    return Math.ceil(100 * Math.pow(statModifier, stat));
  }

	self.attack = modStat(idol.attack, 100);
	self.defense = modStat(idol.defense, 50);
	self.endurance = modStat(idol.endurance, 100);
	self.speed = modStat(idol.speed, 20);
	self.maxMana = modStat(idol.speed, 20);

	self.maxHp = self.endurance;
	self.hp = self.maxHp;
	
	self.hpPercent = 100;
	self.abilities = idol.abilities;
}

var animNames = ["fire", "fan", "plants", "tide", "lightning", "fever", "slash", "slice", "grenade", "ice"];
var anims = {};

for(var i = 0; i < animNames.length; i++) {
  var frames = [];
  var name = animNames[i];
  for(var f = 1; f <= 14; f++) {
    var img = new Image();
    img.src = 'anim/' + name + '/' + f.toString(10) + '.png';
    frames.push(img);
  }
  anims[name] = frames;
}

var timeoutMS = 750;

function initBattle () {
  battleElement.classList.add('active');
	
	document.getElementById("promptText").innerText = "Player's turn";
	refreshHealthBars();
	showCommandList();
	
	
	//show attack name on buttons
	document.getElementById("playerAttack1").innerText = player.abilities[0].name;
	document.getElementById("playerAttack2").innerText = player.abilities[1].name;
	document.getElementById("playerAttack3").innerText = player.abilities[2].name;
	document.getElementById("playerAttack4").innerText = player.abilities[3].name;
	
}

function refreshHealthBars () {
	document.getElementById("playerHealth").innerText = player.hp;
	//document.getElementById("playerMana").innerText = player.mana;
	document.getElementById("enemyHealth").innerText = enemy.hp;
	
	
	document.getElementById("playerHealthbar").style.width = (player.hpPercent + "%");
	document.getElementById("playerHealthbar").innerText = (player.hpPercent + "%");
	document.getElementById("enemyHealthbar").style.width = (enemy.hpPercent + "%");
	document.getElementById("enemyHealthbar").innerText = (enemy.hpPercent + "%");
}

function playerAttack(ability) {
	if(ability.healing === false) {
		//if(player.mana < (ability.strength)) { alert("You need " +(ability.strength) +" mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (ability.strength);
			var dmg = getRandomInt((1*player.attack*ability.strength), (2*player.attack*ability.strength));
			var i = getRandomInt(0, animNames.length);
			playAnimationCanvas(ability.animation, timeoutMS, "enemyAnimationDiv");	
			enemyDamaged(dmg);
			setTimeout(function() {
				var battleResult = checkHealth();		
				if (battleResult === 0) { enemyTurn(); }	
			}, timeoutMS);
		//}
	}
	
	else {
		//if(player.mana < (3)) { alert("You need 3 mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (3);
			var heal = getRandomInt((1*player.attack+player.defense), (2*player.attack+player.defense));
			playerHealed(heal);
			playAnimationCanvas(ability.animation, timeoutMS, "playerAnimationDiv");
			setTimeout(function() {
				enemyTurn();	
			}, timeoutMS);
		//}
	}
}

function playerAttack0 () {playerAttack(player.abilities[0]);}
function playerAttack1 () {playerAttack(player.abilities[1]);}
function playerAttack2 () {playerAttack(player.abilities[2]);}
function playerAttack3 () {playerAttack(player.abilities[3]);}

function enemyTurn () {
	document.getElementById("promptText").innerText = "Enemy's turn";
	refreshHealthBars();
	var i = getRandomInt(0, animNames.length);
	playAnimationCanvas(animNames[i], timeoutMS, "playerAnimationDiv");
	setTimeout(function() {
		var dmg = getRandomInt((1*enemy.attack), (4*enemy.attack));
		playerDamaged(dmg);
		var battleResult = checkHealth();
		if (battleResult === 0) { playerTurn(); }
	}, timeoutMS);
}

function playerTurn () {
	document.getElementById("promptText").innerText = "Player's turn";
	showCommandList();
	
}

function checkHealth () {
	refreshHealthBars();
	
	if(enemy.hp <= 0) {  
		enemy.hp = 0;
		alert("You win!");
    battleElement.classList.remove('active');
		return 1;
	}
	if(player.hp <= 0) { 
		player.hp = 0;
		alert("You lose.");
    battleElement.classList.remove('active');
		return -1;
	}
	return 0;
}

function hideCommandList() {
	document.getElementById("commandList").style.display = "none";
	
}

function showCommandList() {
	document.getElementById("commandList").style.display = "block";		
}

function playerDamaged(dmg) {
	dmg -= player.defense;	
	if(dmg < 0) { dmg = 0; }
	
	player.hp -= dmg;	
	if(player.hp < 0) { player.hp = 0; player.hpPercent = 0; }
	else { player.hpPercent = ((player.hp / player.maxHp) * 100); }
	
	document.getElementById("playerDMG").style.display = "block";
	document.getElementById("playerDMG").innerText = dmg;
	
	refreshHealthBars();
	setTimeout(function() {
		document.getElementById("playerDMG").style.display = "none";
		document.getElementById("playerDMG").innerText = "";
	}, timeoutMS);
}

function playerHealed(heal) {
	player.hp += heal;	
	if(player.hp > player.maxHp) { player.hp = player.maxHp; player.hpPercent = 100; }
	else { player.hpPercent = ((player.hp / player.maxHp) * 100); }
	
	document.getElementById("playerHEAL").style.display = "block";
	document.getElementById("playerHEAL").innerText = heal;
	
	refreshHealthBars();
	setTimeout(function() {
		document.getElementById("playerHEAL").style.display = "none";
		document.getElementById("playerHEAL").innerText = "";
	}, timeoutMS);
}

function enemyDamaged(dmg) {
	dmg -= enemy.defense;	
	if(dmg < 0) { dmg = 0; }
	
	enemy.hp -= dmg;
	if(enemy.hp < 0) { enemy.hp = 0; enemy.hpPercent = 0;  }
	else { enemy.hpPercent = ((enemy.hp / enemy.maxHp) * 100); }
	
	document.getElementById("enemyDMG").style.display = "block";
	document.getElementById("enemyDMG").innerText = dmg;
	
	refreshHealthBars();
	setTimeout(function() {
		document.getElementById("enemyDMG").style.display = "none";
		document.getElementById("enemyDMG").innerText = "";
		
	}, timeoutMS);
	
}

function enemyHealed(heal) {
	enemy.hp += heal;	
	if(enemy.hp > enemy.maxHp) { enemy.hp = enemy.maxHp; enemy.hpPercent = 100; }
	else { enemy.hpPercent = ((enemy.hp / enemy.maxHp) * 100); }
	
	document.getElementById("enemyHEAL").style.display = "block";
	document.getElementById("enemyHEAL").innerText = heal;
	
	refreshHealthBars();
	setTimeout(function() {
		document.getElementById("enemyHEAL").style.display = "none";
		document.getElementById("enemyHEAL").innerText = "";
	}, timeoutMS);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function playAnimation(folderName, imagesCount, totalPlayTime, elemID) {
	var div = document.getElementById(elemID);
	
	var currentImage = 1;
	var animationID = setInterval(function () {
		div.innerHTML = ('<img src="' +folderName +'/' +currentImage +'.png" />');
		currentImage++;
	}, (totalPlayTime / imagesCount));
	
	setTimeout(function () {
		clearInterval(animationID);
		
		div.innerHTML = '';
	}, totalPlayTime);
}

function playAnimationCanvas(animationName, totalPlayTime, elemID) {
	var div = document.getElementById(elemID);
	
	var currentImage = 0;
	
	var animationCanvas = document.createElement('Canvas');
	animationCanvas.style.position = "absolute";
	animationCanvas.style.display = "inline";
	animationCanvas.style.left = 2;
	animationCanvas.style.zIndex = 2;
	
	// var staticCanvas = document.createElement('Canvas');
	// staticCanvas.style.position = "absolute";
	// staticCanvas.style.display = "inline";
	// staticCanvas.style.left = 2;
	// staticCanvas.style.zIndex = 1;
	
	
	var ctx = animationCanvas.getContext('2d');
	// var bg = staticCanvas.getContext('2d');
	// div.appendChild(staticCanvas);	
	div.appendChild(animationCanvas);
	
	// bg.canvas.width = 256;
	// bg.canvas.height = 256;	
	// bg.drawImage(anims["grenade"][10], 0, 0);
	
	ctx.canvas.width = 256;
	ctx.canvas.height = 256;
	
	var animationID = setInterval(function () {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		ctx.drawImage(anims[animationName][currentImage], 0, 0);
		currentImage++;
	}, (totalPlayTime / anims[animationName].length));
	
	setTimeout(function () {
		clearInterval(animationID);
		
		div.innerHTML = '';
	}, totalPlayTime);
}

