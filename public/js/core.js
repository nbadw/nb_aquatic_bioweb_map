// for those without a console
if (typeof(console) == 'undefined') console = {
  log: function() { }
}

/* String Inflections */
String.prototype.capitalize = function() {
  if(this.length == 0) {
    return '';
  } else {
    return this.substr(0, 1).toUpperCase() + this.substr(1);
  }
}

String.prototype.titleize = function() {
  if(this.length == 0) {
    return '';
  } else {
    var words = this.split(' ');
    for(var i=0, len=words.length; i < len; i++) {
      words[i] = words[i].capitalize();
    }
    return words.join(' ');
  }
}

Number.prototype.formatHuman = function() {
  var numStr   = '' + this;
  var numParts = numStr.split('.');
  var whole    = numParts[0];
  var decimal  = numParts[1] || '';

  var re = /(\d+)(\d{3})/;
  while (re.test(whole)) {
    whole = whole.replace(re, '$1' + ',' + '$2');
  }

  return decimal.length === 0 ? whole : whole + '.' + decimal;
}