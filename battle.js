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

//IMAGES
fire1 = new Image();
fire2 = new Image();
fire3 = new Image();
fire4 = new Image();
fire5 = new Image();
fire6 = new Image();
fire7 = new Image();
fire8 = new Image();
fire9 = new Image();
fire10 = new Image();
fire11 = new Image();
fire12 = new Image();
fire13 = new Image();
fire14 = new Image();

fire1.src = "anim/fire/1.png";
fire2.src = "anim/fire/2.png";
fire3.src = "anim/fire/3.png";
fire4.src = "anim/fire/4.png";
fire5.src = "anim/fire/5.png";
fire6.src = "anim/fire/6.png";
fire7.src = "anim/fire/7.png";
fire8.src = "anim/fire/8.png";
fire9.src = "anim/fire/9.png";
fire10.src = "anim/fire/10.png";
fire11.src = "anim/fire/11.png";
fire12.src = "anim/fire/12.png";
fire13.src = "anim/fire/13.png";
fire14.src = "anim/fire/14.png";

lightning1 = new Image();
lightning2 = new Image();
lightning3 = new Image();
lightning4 = new Image();
lightning5 = new Image();
lightning6 = new Image();
lightning7 = new Image();
lightning8 = new Image();
lightning9 = new Image();
lightning10 = new Image();
lightning11 = new Image();
lightning12 = new Image();
lightning13 = new Image();
lightning14 = new Image();

lightning1.src = "anim/lightning/1.png";
lightning2.src = "anim/lightning/2.png";
lightning3.src = "anim/lightning/3.png";
lightning4.src = "anim/lightning/4.png";
lightning5.src = "anim/lightning/5.png";
lightning6.src = "anim/lightning/6.png";
lightning7.src = "anim/lightning/7.png";
lightning8.src = "anim/lightning/8.png";
lightning9.src = "anim/lightning/9.png";
lightning10.src = "anim/lightning/10.png";
lightning11.src = "anim/lightning/11.png";
lightning12.src = "anim/lightning/12.png";
lightning13.src = "anim/lightning/13.png";
lightning14.src = "anim/lightning/14.png";

tide1 = new Image();
tide2 = new Image();
tide3 = new Image();
tide4 = new Image();
tide5 = new Image();
tide6 = new Image();
tide7 = new Image();
tide8 = new Image();
tide9 = new Image();
tide10 = new Image();
tide11 = new Image();
tide12 = new Image();
tide13 = new Image();
tide14 = new Image();

tide1.src = "anim/tide/1.png";
tide2.src = "anim/tide/2.png";
tide3.src = "anim/tide/3.png";
tide4.src = "anim/tide/4.png";
tide5.src = "anim/tide/5.png";
tide6.src = "anim/tide/6.png";
tide7.src = "anim/tide/7.png";
tide8.src = "anim/tide/8.png";
tide9.src = "anim/tide/9.png";
tide10.src = "anim/tide/10.png";
tide11.src = "anim/tide/11.png";
tide12.src = "anim/tide/12.png";
tide13.src = "anim/tide/13.png";
tide14.src = "anim/tide/14.png";

fan1 = new Image();
fan2 = new Image();
fan3 = new Image();
fan4 = new Image();
fan5 = new Image();
fan6 = new Image();
fan7 = new Image();
fan8 = new Image();
fan9 = new Image();
fan10 = new Image();
fan11 = new Image();
fan12 = new Image();
fan13 = new Image();
fan14 = new Image();

fan1.src = "anim/fan/1.png";
fan2.src = "anim/fan/2.png";
fan3.src = "anim/fan/3.png";
fan4.src = "anim/fan/4.png";
fan5.src = "anim/fan/5.png";
fan6.src = "anim/fan/6.png";
fan7.src = "anim/fan/7.png";
fan8.src = "anim/fan/8.png";
fan9.src = "anim/fan/9.png";
fan10.src = "anim/fan/10.png";
fan11.src = "anim/fan/11.png";
fan12.src = "anim/fan/12.png";
fan13.src = "anim/fan/13.png";
fan14.src = "anim/fan/14.png";

plants1 = new Image();
plants2 = new Image();
plants3 = new Image();
plants4 = new Image();
plants5 = new Image();
plants6 = new Image();
plants7 = new Image();
plants8 = new Image();
plants9 = new Image();
plants10 = new Image();
plants11 = new Image();
plants12 = new Image();
plants13 = new Image();
plants14 = new Image();

plants1.src = "anim/plants/1.png";
plants2.src = "anim/plants/2.png";
plants3.src = "anim/plants/3.png";
plants4.src = "anim/plants/4.png";
plants5.src = "anim/plants/5.png";
plants6.src = "anim/plants/6.png";
plants7.src = "anim/plants/7.png";
plants8.src = "anim/plants/8.png";
plants9.src = "anim/plants/9.png";
plants10.src = "anim/plants/10.png";
plants11.src = "anim/plants/11.png";
plants12.src = "anim/plants/12.png";
plants13.src = "anim/plants/13.png";
plants14.src = "anim/plants/14.png";

slash1 = new Image();
slash2 = new Image();
slash3 = new Image();
slash4 = new Image();
slash5 = new Image();
slash6 = new Image();
slash7 = new Image();
slash8 = new Image();
slash9 = new Image();
slash10 = new Image();
slash11 = new Image();
slash12 = new Image();
slash13 = new Image();
slash14 = new Image();

slash1.src = "anim/slash/1.png";
slash2.src = "anim/slash/2.png";
slash3.src = "anim/slash/3.png";
slash4.src = "anim/slash/4.png";
slash5.src = "anim/slash/5.png";
slash6.src = "anim/slash/6.png";
slash7.src = "anim/slash/7.png";
slash8.src = "anim/slash/8.png";
slash9.src = "anim/slash/9.png";
slash10.src = "anim/slash/10.png";
slash11.src = "anim/slash/11.png";
slash12.src = "anim/slash/12.png";
slash13.src = "anim/slash/13.png";
slash14.src = "anim/slash/14.png";

slice1 = new Image();
slice2 = new Image();
slice3 = new Image();
slice4 = new Image();
slice5 = new Image();
slice6 = new Image();
slice7 = new Image();
slice8 = new Image();
slice9 = new Image();
slice10 = new Image();
slice11 = new Image();
slice12 = new Image();
slice13 = new Image();
slice14 = new Image();

slice1.src = "anim/slice/1.png";
slice2.src = "anim/slice/2.png";
slice3.src = "anim/slice/3.png";
slice4.src = "anim/slice/4.png";
slice5.src = "anim/slice/5.png";
slice6.src = "anim/slice/6.png";
slice7.src = "anim/slice/7.png";
slice8.src = "anim/slice/8.png";
slice9.src = "anim/slice/9.png";
slice10.src = "anim/slice/10.png";
slice11.src = "anim/slice/11.png";
slice12.src = "anim/slice/12.png";
slice13.src = "anim/slice/13.png";
slice14.src = "anim/slice/14.png";

fever1 = new Image();
fever2 = new Image();
fever3 = new Image();
fever4 = new Image();
fever5 = new Image();
fever6 = new Image();
fever7 = new Image();
fever8 = new Image();
fever9 = new Image();
fever10 = new Image();
fever11 = new Image();
fever12 = new Image();
fever13 = new Image();
fever14 = new Image();

fever1.src = "anim/fever/1.png";
fever2.src = "anim/fever/2.png";
fever3.src = "anim/fever/3.png";
fever4.src = "anim/fever/4.png";
fever5.src = "anim/fever/5.png";
fever6.src = "anim/fever/6.png";
fever7.src = "anim/fever/7.png";
fever8.src = "anim/fever/8.png";
fever9.src = "anim/fever/9.png";
fever10.src = "anim/fever/10.png";
fever11.src = "anim/fever/11.png";
fever12.src = "anim/fever/12.png";
fever13.src = "anim/fever/13.png";
fever14.src = "anim/fever/14.png";

grenade1 = new Image();
grenade2 = new Image();
grenade3 = new Image();
grenade4 = new Image();
grenade5 = new Image();
grenade6 = new Image();
grenade7 = new Image();
grenade8 = new Image();
grenade9 = new Image();
grenade10 = new Image();
grenade11 = new Image();
grenade12 = new Image();
grenade13 = new Image();
grenade14 = new Image();

grenade1.src = "anim/grenade/1.png";
grenade2.src = "anim/grenade/2.png";
grenade3.src = "anim/grenade/3.png";
grenade4.src = "anim/grenade/4.png";
grenade5.src = "anim/grenade/5.png";
grenade6.src = "anim/grenade/6.png";
grenade7.src = "anim/grenade/7.png";
grenade8.src = "anim/grenade/8.png";
grenade9.src = "anim/grenade/9.png";
grenade10.src = "anim/grenade/10.png";
grenade11.src = "anim/grenade/11.png";
grenade12.src = "anim/grenade/12.png";
grenade13.src = "anim/grenade/13.png";
grenade14.src = "anim/grenade/14.png";

ice1 = new Image();
ice2 = new Image();
ice3 = new Image();
ice4 = new Image();
ice5 = new Image();
ice6 = new Image();
ice7 = new Image();
ice8 = new Image();
ice9 = new Image();
ice10 = new Image();
ice11 = new Image();
ice12 = new Image();
ice13 = new Image();
ice14 = new Image();

ice1.src = "anim/ice/1.png";
ice2.src = "anim/ice/2.png";
ice3.src = "anim/ice/3.png";
ice4.src = "anim/ice/4.png";
ice5.src = "anim/ice/5.png";
ice6.src = "anim/ice/6.png";
ice7.src = "anim/ice/7.png";
ice8.src = "anim/ice/8.png";
ice9.src = "anim/ice/9.png";
ice10.src = "anim/ice/10.png";
ice11.src = "anim/ice/11.png";
ice12.src = "anim/ice/12.png";
ice13.src = "anim/ice/13.png";
ice14.src = "anim/ice/14.png";
//IMAGES END

var timeoutMS = 750;
var animNames = ["fire", "fan", "plants", "tide", "lightning", "fever", "slash", "slice", "grenade", "ice"];
var anims = { "fire": [fire1, fire2, fire3, fire4, fire5, fire6, fire7, fire8, fire9, fire10, fire11, fire12, fire13, fire14], 
			  "fan": [fan1, fan2, fan3, fan4, fan5, fan6, fan7, fan8, fan9, fan10, fan11, fan12, fan13, fan14],
			  "plants": [plants1, plants2, plants3, plants4, plants5, plants6, plants7, plants8, plants9, plants10, plants11, plants12, plants13, plants14],
			  "tide": [tide1, tide2, tide3, tide4, tide5, tide6, tide7, tide8, tide9, tide10, tide11, tide12, tide13, tide14],
			  "lightning": [lightning1, lightning2, lightning3, lightning4, lightning5, lightning6, lightning7, lightning8, lightning9, lightning10, lightning11, lightning12, lightning13, lightning14],
			  "fever": [fever1, fever2, fever3, fever4, fever5, fever6, fever7, fever8, fever9, fever10, fever11, fever12, fever13, fever14],
			  "slash": [slash1, slash2, slash3, slash4, slash5, slash6, slash7, slash8, slash9, slash10, slash11, slash12, slash13, slash14],
			  "slice": [slice1, slice2, slice3, slice4, slice5, slice6, slice7, slice8, slice9, slice10, slice11, slice12, slice13, slice14],
			  "grenade": [grenade1, grenade2, grenade3, grenade4, grenade5, grenade6, grenade7, grenade8, grenade9, grenade10, grenade11, grenade12, grenade13, grenade14],
			  "ice": [ice1, ice2, ice3, ice4, ice5, ice6, ice7, ice8, ice9, ice10, ice11, ice12, ice13, ice14] };

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

