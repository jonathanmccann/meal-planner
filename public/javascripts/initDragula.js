function testForm(form) {
  form.preventDefault();

  var elements = document.getElementById('0-2').getElementsByClassName("padding-top");

  for (var i = 0; i < elements.length; i++) {
    //console.log(elements[i].textContent);
    //console.log(elements[i].id);
  }

  var testMap = {};

  testMap['myKey'] = ["first", "second"];

  console.log(testMap);

  return true;
}

window.onload = function() {
  dragula([
    document.getElementById('recipes'),
    document.getElementById('0-0'),
    document.getElementById('0-1'),
    document.getElementById('0-2'),
    document.getElementById('1-0'),
    document.getElementById('1-1'),
    document.getElementById('1-2'),
    document.getElementById('2-0'),
    document.getElementById('2-1'),
    document.getElementById('2-2'),
    document.getElementById('3-0'),
    document.getElementById('3-1'),
    document.getElementById('3-2'),
    document.getElementById('4-0'),
    document.getElementById('4-1'),
    document.getElementById('4-2'),
    document.getElementById('5-0'),
    document.getElementById('5-1'),
    document.getElementById('5-2'),
    document.getElementById('6-0'),
    document.getElementById('6-1'),
    document.getElementById('6-2')
  ], {
    copy: function (el, source) {
      return source === document.getElementById('recipes')
    },
    accepts: function (el, target) {
      return target !== document.getElementById('recipes')
    },
    removeOnSpill: true
  });

  var calendarForm = document.getElementById('calendar-form');

  calendarForm.addEventListener("submit", testForm);
};

window.addEventListener('touchmove', function() {});