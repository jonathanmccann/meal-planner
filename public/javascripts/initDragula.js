var containerIds = ['00', '01', '02', '10', '11', '12', '20', '21', '22', '30', '31', '32', '40', '41', '42', '50', '51', '52', '60', '61', '62' ];

function appendToForm(form) {
  for (var i = 0; i < containerIds.length; i++) {
    var recipes = document.getElementById(containerIds[i]).getElementsByClassName("padding-top");

    if (recipes) {
      for (var j = 0; j < recipes.length; j++) {
        $('<input />').attr('type', 'hidden')
          .attr('name', recipes[j].id + "_" + containerIds[i])
          .attr('value', recipes[j].textContent)
          .appendTo(form);
      }
    }
  }
}

window.onload = function() {
  dragula([
    document.getElementById('recipes'),
    document.getElementById('00'),
    document.getElementById('01'),
    document.getElementById('02'),
    document.getElementById('10'),
    document.getElementById('11'),
    document.getElementById('12'),
    document.getElementById('20'),
    document.getElementById('21'),
    document.getElementById('22'),
    document.getElementById('30'),
    document.getElementById('31'),
    document.getElementById('32'),
    document.getElementById('40'),
    document.getElementById('41'),
    document.getElementById('42'),
    document.getElementById('50'),
    document.getElementById('51'),
    document.getElementById('52'),
    document.getElementById('60'),
    document.getElementById('61'),
    document.getElementById('62')
  ], {
  	accepts: function (el, target) {
      return (target !== document.getElementById('recipes')) && target.classList.contains('accept')
    },
    copy: function (el, source) {
      return source === document.getElementById('recipes')
    },
		moves: function (el) {
    	return el.classList.contains('draggable')
		},
    removeOnSpill: true
  }).on('drop', function(el, target, source) {
  	el.classList.toggle('indent');
    target.classList.toggle('accept');
    source.classList.toggle('accept');
  }).on('remove', function(el, target, source) {
    source.classList.toggle('accept');
  });

  $("#calendar-form").submit(function(e) {
  	var buttonClicked = $(this).find("input[type=submit]:focus").val();

  	if (buttonClicked === "Submit Calendar") {
			e.preventDefault();

			appendToForm(this);

			this.submit();
		}
  });
};

window.addEventListener('touchmove', function() {});