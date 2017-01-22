document.addEventListener("DOMContentLoaded", function (){
	
	document.getElementById("playerBarcode").addEventListener("change", function (){
		var barcodeImageFile = document.getElementById("playerBarcode").files[0];
		Quagga.decodeSingle({
			src: window.URL.createObjectURL(barcodeImageFile),
			decoder: {
			  readers: [
				'code_128_reader',
				'ean_reader',
				'ean_8_reader',
				'code_39_reader',
				'code_39_vin_reader',
				'codabar_reader',
				'upc_reader',
				'upc_e_reader',
				'i2of5_reader'
			  ]
			},
			debug: true
	    }, makePlayerIdolFromImage);
	});	
	
	document.getElementById("enemyBarcode").addEventListener("change", function (){
		var barcodeImageFile = document.getElementById("enemyBarcode").files[0];
		Quagga.decodeSingle({
			src: window.URL.createObjectURL(barcodeImageFile),
			decoder: {
			  readers: [
				'code_128_reader',
				'ean_reader',
				'ean_8_reader',
				'code_39_reader',
				'code_39_vin_reader',
				'codabar_reader',
				'upc_reader',
				'upc_e_reader',
				'i2of5_reader'
			  ]
			},
			debug: true
	    }, makeEnemyIdolFromImage);
	});	
});

function makePlayerIdolFromImage (data) {
	var idolData = addIdolFromImage(data);
	//console.log(idolData);
	player = new BattleIdol(
		(idolData.firstName +" " +idolData.lastName), 
		idolData.attack, 
		idolData.defense, 
		idolData.endurance, 
		idolData.speed, 
		[new Ability("Heal", 0, true, "fever"), 
		 new Ability("Sword", 2, false, "slash"), 
		 new Ability("Fire", 3, false, "fire"),
		 new Ability("Water", 1, false, "tide")]
		);
	
}

function makeEnemyIdolFromImage (data) {
	var idolData = addIdolFromImage(data);
	//console.log(idolData);
	enemy = new BattleIdol((idolData.firstName +" " +idolData.lastName), idolData.attack, idolData.defense, idolData.endurance, idolData.speed);
	
}

var player;
var enemy;

function Ability (name, strength, healing, animation) {
	var self = this;
	self.name = name;
	self.strength = strength;
	self.healing = healing;
	self.animation = animation;
	
}

function BattleIdol (name, attack, defense, endurance, speed, abilities) {
	var self = this;
	
	attack = Math.abs(attack);
	defense = Math.abs(defense);
	endurance = Math.abs(endurance);
	speed = Math.abs(speed);
	
	self.name = name;
	self.attack = Math.ceil(attack * 400);
	self.defense = Math.ceil(defense * 1);
	self.endurance = Math.ceil(endurance * 10);
	self.mana = Math.ceil(speed * 10);
	self.maxMana = Math.ceil(speed * 10);
	self.hp = Math.ceil(self.endurance * 10);
	self.maxHp = Math.ceil(self.endurance * 10);
	
	self.hpPercent = 100;
	self.abilities = abilities;

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

fire1.src = "fire/1.png";
fire2.src = "fire/2.png";
fire3.src = "fire/3.png";
fire4.src = "fire/4.png";
fire5.src = "fire/5.png";
fire6.src = "fire/6.png";
fire7.src = "fire/7.png";
fire8.src = "fire/8.png";
fire9.src = "fire/9.png";
fire10.src = "fire/10.png";
fire11.src = "fire/11.png";
fire12.src = "fire/12.png";
fire13.src = "fire/13.png";
fire14.src = "fire/14.png";

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

lightning1.src = "lightning/1.png";
lightning2.src = "lightning/2.png";
lightning3.src = "lightning/3.png";
lightning4.src = "lightning/4.png";
lightning5.src = "lightning/5.png";
lightning6.src = "lightning/6.png";
lightning7.src = "lightning/7.png";
lightning8.src = "lightning/8.png";
lightning9.src = "lightning/9.png";
lightning10.src = "lightning/10.png";
lightning11.src = "lightning/11.png";
lightning12.src = "lightning/12.png";
lightning13.src = "lightning/13.png";
lightning14.src = "lightning/14.png";

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

tide1.src = "tide/1.png";
tide2.src = "tide/2.png";
tide3.src = "tide/3.png";
tide4.src = "tide/4.png";
tide5.src = "tide/5.png";
tide6.src = "tide/6.png";
tide7.src = "tide/7.png";
tide8.src = "tide/8.png";
tide9.src = "tide/9.png";
tide10.src = "tide/10.png";
tide11.src = "tide/11.png";
tide12.src = "tide/12.png";
tide13.src = "tide/13.png";
tide14.src = "tide/14.png";

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

fan1.src = "fan/1.png";
fan2.src = "fan/2.png";
fan3.src = "fan/3.png";
fan4.src = "fan/4.png";
fan5.src = "fan/5.png";
fan6.src = "fan/6.png";
fan7.src = "fan/7.png";
fan8.src = "fan/8.png";
fan9.src = "fan/9.png";
fan10.src = "fan/10.png";
fan11.src = "fan/11.png";
fan12.src = "fan/12.png";
fan13.src = "fan/13.png";
fan14.src = "fan/14.png";

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

plants1.src = "plants/1.png";
plants2.src = "plants/2.png";
plants3.src = "plants/3.png";
plants4.src = "plants/4.png";
plants5.src = "plants/5.png";
plants6.src = "plants/6.png";
plants7.src = "plants/7.png";
plants8.src = "plants/8.png";
plants9.src = "plants/9.png";
plants10.src = "plants/10.png";
plants11.src = "plants/11.png";
plants12.src = "plants/12.png";
plants13.src = "plants/13.png";
plants14.src = "plants/14.png";

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

slash1.src = "slash/1.png";
slash2.src = "slash/2.png";
slash3.src = "slash/3.png";
slash4.src = "slash/4.png";
slash5.src = "slash/5.png";
slash6.src = "slash/6.png";
slash7.src = "slash/7.png";
slash8.src = "slash/8.png";
slash9.src = "slash/9.png";
slash10.src = "slash/10.png";
slash11.src = "slash/11.png";
slash12.src = "slash/12.png";
slash13.src = "slash/13.png";
slash14.src = "slash/14.png";

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

slice1.src = "slice/1.png";
slice2.src = "slice/2.png";
slice3.src = "slice/3.png";
slice4.src = "slice/4.png";
slice5.src = "slice/5.png";
slice6.src = "slice/6.png";
slice7.src = "slice/7.png";
slice8.src = "slice/8.png";
slice9.src = "slice/9.png";
slice10.src = "slice/10.png";
slice11.src = "slice/11.png";
slice12.src = "slice/12.png";
slice13.src = "slice/13.png";
slice14.src = "slice/14.png";

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

fever1.src = "fever/1.png";
fever2.src = "fever/2.png";
fever3.src = "fever/3.png";
fever4.src = "fever/4.png";
fever5.src = "fever/5.png";
fever6.src = "fever/6.png";
fever7.src = "fever/7.png";
fever8.src = "fever/8.png";
fever9.src = "fever/9.png";
fever10.src = "fever/10.png";
fever11.src = "fever/11.png";
fever12.src = "fever/12.png";
fever13.src = "fever/13.png";
fever14.src = "fever/14.png";

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

grenade1.src = "grenade/1.png";
grenade2.src = "grenade/2.png";
grenade3.src = "grenade/3.png";
grenade4.src = "grenade/4.png";
grenade5.src = "grenade/5.png";
grenade6.src = "grenade/6.png";
grenade7.src = "grenade/7.png";
grenade8.src = "grenade/8.png";
grenade9.src = "grenade/9.png";
grenade10.src = "grenade/10.png";
grenade11.src = "grenade/11.png";
grenade12.src = "grenade/12.png";
grenade13.src = "grenade/13.png";
grenade14.src = "grenade/14.png";

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

ice1.src = "ice/1.png";
ice2.src = "ice/2.png";
ice3.src = "ice/3.png";
ice4.src = "ice/4.png";
ice5.src = "ice/5.png";
ice6.src = "ice/6.png";
ice7.src = "ice/7.png";
ice8.src = "ice/8.png";
ice9.src = "ice/9.png";
ice10.src = "ice/10.png";
ice11.src = "ice/11.png";
ice12.src = "ice/12.png";
ice13.src = "ice/13.png";
ice14.src = "ice/14.png";
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

function startBattle () {
	//console.log(player);
	//console.log(enemy);
	
	if(typeof(player) !== "undefined" && typeof(enemy) !== "undefined") { init(); }
	else { alert("Scan barcodes!"); }
}	

function restartBattle () {
	player.hp = player.maxHp;
	player.mana = player.maxMana;
	player.hpPercent = 100;
	enemy.hp = enemy.maxHp;
	enemy.hpPercent = 100;
	
	init();
}


function init () {
	
	document.getElementById("promptText").innerText = "Player's turn";
	refreshHealthBars();
	showCommandList();
	document.getElementById("startButton").style.display = "none";
	document.getElementById("restartButton").style.display = "none";
	
	
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

function playerAttack0 () {
	if(player.abilities[0].healing == false) {
		//if(player.mana < (player.abilities[0].strength)) { alert("You need " +(player.abilities[0].strength) +" mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (player.abilities[0].strength);
			var dmg = getRandomInt((1*player.attack*player.abilities[0].strength), (2*player.attack*player.abilities[0].strength));
			var i = getRandomInt(0, animNames.length)
			playAnimationCanvas(player.abilities[0].animation, timeoutMS, "enemyAnimationDiv");	
			enemyDamaged(dmg);
			setTimeout(function() {
				var battleResult = checkHealth();		
				if (battleResult == 0) { enemyTurn(); }	
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
			playAnimationCanvas(player.abilities[0].animation, timeoutMS, "playerAnimationDiv");
			setTimeout(function() {
				enemyTurn();	
			}, timeoutMS);
		//}
	}
}

function playerAttack1 () {
	if(player.abilities[1].healing == false) {
		//if(player.mana < (player.abilities[1].strength)) {alert("You need " +(player.abilities[1].strength) +" mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (player.abilities[1].strength);
			var dmg = getRandomInt((1*player.attack*player.abilities[1].strength), (2*player.attack*player.abilities[1].strength));
			var i = getRandomInt(0, animNames.length)
			playAnimationCanvas(player.abilities[1].animation, timeoutMS, "enemyAnimationDiv");	
			enemyDamaged(dmg);
			setTimeout(function() {
				var battleResult = checkHealth();		
				if (battleResult == 0) { enemyTurn(); }	
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
			playAnimationCanvas(player.abilities[1].animation, timeoutMS, "playerAnimationDiv");
			setTimeout(function() {
				enemyTurn();	
			}, timeoutMS);
		//}
	}
}

function playerAttack2 () {
	if(player.abilities[2].healing == false) {
		//if(player.mana < (player.abilities[2].strength)) { alert("You need " +(player.abilities[2].strength) +" mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (player.abilities[2].strength);
			var dmg = getRandomInt((1*player.attack*player.abilities[2].strength), (2*player.attack*player.abilities[2].strength));
			var i = getRandomInt(0, animNames.length)
			playAnimationCanvas(player.abilities[2].animation, timeoutMS, "enemyAnimationDiv");	
			enemyDamaged(dmg);
			setTimeout(function() {
				var battleResult = checkHealth();		
				if (battleResult == 0) { enemyTurn(); }	
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
			playAnimationCanvas(player.abilities[2].animation, timeoutMS, "playerAnimationDiv");
			setTimeout(function() {
				enemyTurn();	
			}, timeoutMS);
		//}
	}
}

function playerAttack3 () {
	if(player.abilities[3].healing == false) {
		//if(player.mana < (player.abilities[3].strength)) { alert("You need " +(player.abilities[3].strength) +" mana!"); return; }
		//else {
			hideCommandList();
			//player.mana -= (player.abilities[3].strength);
			var dmg = getRandomInt((1*player.attack*player.abilities[3].strength), (2*player.attack*player.abilities[3].strength));
			var i = getRandomInt(0, animNames.length)
			playAnimationCanvas(player.abilities[3].animation, timeoutMS, "enemyAnimationDiv");	
			enemyDamaged(dmg);
			setTimeout(function() {
				var battleResult = checkHealth();		
				if (battleResult == 0) { enemyTurn(); }	
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
			playAnimationCanvas(player.abilities[3].animation, timeoutMS, "playerAnimationDiv");
			setTimeout(function() {
				enemyTurn();	
			}, timeoutMS);
		//}
	}
}

function enemyTurn () {
	document.getElementById("promptText").innerText = "Enemy's turn";
	refreshHealthBars();
	var i = getRandomInt(0, animNames.length)
	playAnimationCanvas(animNames[i], timeoutMS, "playerAnimationDiv");
	setTimeout(function() {
		var dmg = getRandomInt((1*enemy.attack), (4*enemy.attack));
		playerDamaged(dmg);
		var battleResult = checkHealth();
		if (battleResult == 0) { playerTurn(); }
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
		document.getElementById("promptText").innerText = "PLAYER WON";
		document.getElementById("restartButton").style.display = "block";
		return 1;
	}
	if(player.hp <= 0) { 
		player.hp = 0;
		document.getElementById("promptText").innerText = "PLAYER LOST";
		document.getElementById("restartButton").style.display = "block";
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

