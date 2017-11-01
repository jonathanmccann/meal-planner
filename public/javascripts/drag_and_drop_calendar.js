const daysInWeek = 7;

var containerIds = ['00', '01', '02', '10', '11', '12', '20', '21', '22', '30', '31', '32', '40', '41', '42', '50', '51', '52', '60', '61', '62' ];
var previousWidth = $(window).width();

function appendToForm(form) {
  for (var i = 0; i < containerIds.length; i++) {
    var recipeContainer = document.getElementById(containerIds[i]);

    if (recipeContainer) {
      var recipes = recipeContainer.getElementsByClassName("padding-top");

      for (var j = 0; j < recipes.length; j++) {
        $('<input />').attr('type', 'hidden')
          .attr('name', recipes[j].title + "_" + containerIds[i])
          .attr('value', recipes[j].textContent)
          .appendTo(form);
      }
    }
  }
}

function showFullCalendar() {
  var flextableCells = $('#calendarTable').find('.flextable-cell');

  flextableCells.each(function() {
    $(this).show();
  })
}

function showSingleDay(dayToDisplay) {
  var flextableCells = $('#calendarTable').find('.flextable-cell');

  flextableCells.each(function(index) {
    if (index === dayToDisplay) {
      $(this).show();

      dayToDisplay += daysInWeek;
    }
    else {
      $(this).hide();
    }
  })
}

$(document).ready(function() {
  if (previousWidth <= 980) {
    showSingleDay(new Date().getDay());
  }
  else if (previousWidth > 980) {
    showFullCalendar();
  }
});

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
				if (!children[i].classList.contains('gu-transit') && children[i].title === el.title) {
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
  }).on('cloned', function(clone) {
  	clone.classList.remove('indent');
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

$(window).resize(function() {
  if ((previousWidth <= 980) && ($(this).width() > 980)) {
    showFullCalendar();
  }
  else if ((previousWidth > 980) && ($(this).width() <= 980)) {
    showSingleDay(new Date().getDay());
  }

  previousWidth = $(this).width();
});