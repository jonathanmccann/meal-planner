var containerIds = ['00', '01', '02', '10', '11', '12', '20', '21', '22', '30', '31', '32', '40', '41', '42', '50', '51', '52', '60', '61', '62' ];

function appendToForm(form) {
  for (var i = 0; i < containerIds.length; i++) {
    var recipeContainer = document.getElementById(containerIds[i]);

    if (recipeContainer) {
      var recipes = recipeContainer.getElementsByClassName("padding-top");

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
	var containers = $('.accept-container').toArray();

	containers = containers.concat($('.source-container').toArray());

  dragula(containers, {
		accepts: function (el, target) {
			if (target.classList.contains('source-container')) {
				return false;
			}

			var children = target.children;

			for (var i = 0; i < children.length; i++) {
				if (!children[i].classList.contains('gu-transit') && children[i].id === el.id) {
					return false;
				}
			}

			return true;
		},
		copy: function (el, source) {
			return source.classList.contains('source-container');
		},
		moves: function (el) {
			return el.classList.contains('draggable')
		},
		removeOnSpill: true
  }).on('drop', function(el, target, source) {
  	el.classList.remove('indent');
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