var KANA = [
  'a', 'i', 'u', 'e', 'o',
  'ka', 'ki', 'ku', 'ke', 'ko',
  'sa', 'shi', 'su', 'se', 'so',
  'ta', 'chi', 'tsu', 'te', 'to',
  'na', 'ni', 'nu', 'ne', 'no',
  'ha', 'hi', 'fu', 'he', 'ho',
  'ma', 'mi', 'mu', 'me', 'mo',
  'ya', 'yu', 'yo',
  'ra', 'ri', 'ru', 're', 'ro',
  'ga', 'gi', 'gu', 'ge', 'go',
  'za', 'ji', 'zu', 'ze', 'zo',
  'da', 'ji', 'zu', 'de', 'do',
  'ba', 'bi', 'bu', 'be', 'bo',
  'pa', 'pi', 'pu', 'pe', 'po',
  // 'kya', 'kyu', 'kyo',
  // 'sha', 'shu', 'sho',
  // 'cha', 'chu', 'cho',
  // 'nya', 'nyu', 'nyo',
  // 'hya', 'hyu', 'hyo',
  // 'mya', 'myu', 'myo',
  // 'rya', 'ryu', 'ryo',
  // 'gya', 'gyu', 'gyo',
  // 'bya', 'byu', 'byo',
  // 'pya', 'pyu', 'pyo'
  'ja', 'ju', 'jo'
];
var N = 'n';

var LAYERS = [
    'hbe',
    'hb',
    'bd',
    'cb',
    'ct',
    'hd',
    'hf',
    'hfe',
    'ah',
    'mt',
    'ns',
    'ey',
    'eb'
];

var barcodeImage = document.getElementById('barcode-image');
var spriteTemplate = Handlebars.compile(document.getElementById('sprite-template').innerHTML);
var catalogTemplate = Handlebars.compile(document.getElementById('catalog-template').innerHTML);

function choice(list, slice) {
  var result = list[Math.floor(slice * list.length)];
  return result;
}

function seededRandom(seed) {
  function rand(max, min) {
    max = max || 1;
    min = min || 0;

    seed = (seed * 9301 + 49297) % 233280;
    var rnd = seed / 233280;

    return min + rnd * (max - min);
  }

  return rand;
}

function Idol(seed) {
  this.rand = seededRandom(seed);
  this.xp = 0;
  this.level = 0;

  this.endurance = this.rand(1, -1);
  this.attack = this.rand(1, -1);
  this.speed = this.rand(1, -1);
  this.defense = this.rand(1, -1);

  this.firstName = this.generateName();
  this.lastName = this.generateName();
  this.name = [this.firstName, this.lastName].join(' ');

  var partsMissing = true;
  while (partsMissing) {
    this.parts = [];
    partsMissing = false;
    var poseParts = PARTS[choice(Object.keys(PARTS), this.rand())];
    var skinColourParts = poseParts[choice(Object.keys(poseParts), this.rand())];
    var hairColourParts = skinColourParts[choice(Object.keys(skinColourParts), this.rand())];
    for(var i = 0, n = LAYERS.length; i < n; i++) {
      var options = hairColourParts[LAYERS[i]];
      if (options.length === 0) {
        partsMissing = true;
      }
      this.parts.push(choice(options, this.rand()));
    }
  }

  console.log('generated ' + this.name);
}
Idol.prototype.generateName = function() {
  var name = '';
  var kanaCount = Math.floor(this.rand(4, 2));
  while (kanaCount > 0) {
    name += choice(KANA, this.rand());
    kanaCount--;
  }
  name = name[0].toUpperCase() + name.slice(1);
  if (this.rand() > 0.8) {
    name += N;
  }
  return name;
};
Idol.prototype.spriteHTML = function() {
  return spriteTemplate(this);
};

function Agency() {
  this.talent = [];
}
Agency.prototype.renderCatalog = function() {
  document.getElementById('catalog').innerHTML = catalogTemplate(this);
};

function numFromString(str) {
  var total = 0;
  for(var i = 0, n = str.length; i < n; i++) {
      var c = str.charCodeAt(i);
      total += ((255 * Math.pow(2, i)) * c);
  }
  return total;
}

function addIdolFromImage(data) {
  if (!data.codeResult) {
    alert('sorry, could not read barcode, please try a clearer photo');
    return;
  }
  idol = new Idol(numFromString(data.codeResult.code));
  return idol;
}

barcodeImage.addEventListener('change', function(e) {
  Quagga.decodeSingle({
    src: window.URL.createObjectURL(barcodeImage.files[0]),
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
  }, addIdolFromImage);
});

var agency = new Agency();
agency.talent.push(new Idol(214321100));
agency.talent.push(new Idol(29143112));
agency.talent.push(new Idol(112341433));
agency.talent.push(new Idol(2));
agency.talent.push(new Idol(19));
agency.renderCatalog();
