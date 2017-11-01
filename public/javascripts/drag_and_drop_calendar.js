const daysInWeek = 7;
const dayOfWeekMap = {'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6}
const fullDayHeadings = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mediumDayHeadings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const smallDayHeadings = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];

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

function dayHeadingsFull() {
  var flextableHeaderCells = $('#calendarTable').find('.flextable-cell-header');

  flextableHeaderCells.each(function(index) {
    $(this).text(fullDayHeadings[index]);

    $(this).removeClass('tab');
    $(this).removeClass('active');
  });
}

function dayHeadingsMedium() {
  var flextableHeaderCells = $('#calendarTable').find('.flextable-cell-header');

  flextableHeaderCells.each(function(index) {
    $(this).text(mediumDayHeadings[index]);

    $(this).addClass('tab');
  });
}

function dayHeadingsSmall() {
  var flextableHeaderCells = $('#calendarTable').find('.flextable-cell-header');

  flextableHeaderCells.each(function(index) {
    $(this).text(smallDayHeadings[index]);

    $(this).addClass('tab');
  });
}

function showFullCalendar() {
  var flextableCells = $('#calendarTable').find('.flextable-cell:not(.flextable-cell-header)');

  flextableCells.each(function() {
    $(this).show();
  });
}

function showSingleDay(dayToDisplay) {
  var flextableHeaderCells = $('#calendarTable').find('.flextable-cell-header');

  flextableHeaderCells.each(function(index) {
    if (index === dayToDisplay) {
      $(this).addClass('active');
    }
    else {
      $(this).removeClass('active');
    }
  });

  var flextableCells = $('#calendarTable').find('.flextable-cell:not(.flextable-cell-header)');

  flextableCells.each(function(index) {
    if (index === dayToDisplay) {
      $(this).show();

      dayToDisplay += daysInWeek;
    }
    else {
      $(this).hide();
    }
  });
}

$(document).ready(function() {
  if ((previousWidth <= 480)) {
    dayHeadingsSmall();
  }
  else if ((previousWidth <= 980)) {
    dayHeadingsMedium();
  }
  else {
    dayHeadingsFull();
  }

  if (previousWidth <= 980) {
    showSingleDay(new Date().getDay());
  }
  else if (previousWidth > 980) {
    showFullCalendar();
  }

  $("#sunday, #monday, #tuesday, #wednesday, #thursday, #friday, #saturday").on('click', function(e) {
    if (e.target.classList.contains('tab')) {
      showSingleDay(dayOfWeekMap[e.target.id]);
    }
  });
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
  if ((previousWidth <= 480)) {
    dayHeadingsSmall();
  }
  else if ((previousWidth <= 980)) {
    dayHeadingsMedium();
  }
  else {
    dayHeadingsFull();
  }

  if ((previousWidth <= 980) && ($(this).width() > 980)) {
    showFullCalendar();
  }
  else if ((previousWidth > 980) && ($(this).width() <= 980)) {
    showSingleDay(new Date().getDay());
  }

  previousWidth = $(this).width();
});