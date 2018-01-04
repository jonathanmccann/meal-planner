const daysInWeek = 7;
const dayOfWeekMap = {'sunday': 0, 'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4, 'friday': 5, 'saturday': 6};
const fullDayHeadings = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const mediumDayHeadings = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const smallDayHeadings = ['S', 'M', 'T', 'W', 'Th', 'F', 'S'];

var containerIds = ['00', '01', '02', '10', '11', '12', '20', '21', '22', '30', '31', '32', '40', '41', '42', '50', '51', '52', '60', '61', '62' ];
var previousWidth = $(window).width();

var modal = new tingle.modal({
  footer: true,
  stickyFooter: true,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: "Close"
});

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

function displayRecipeModal(e) {
  var recipeId = e.target.title;

  var recipeName = recipes[recipeId][0];
  var recipeIngredients = recipes[recipeId][1];
  var recipeDirections = recipes[recipeId][2];

  if ((recipeDirections === null) || (recipeDirections === "")) {
    recipeDirections = "There are no directions for this recipe.";
  }

  modal.setContent(
    '<h2>' + recipeName + '</h2>' +
    '<h3>Ingredients</h3>' + 
    '<pre>' + recipeIngredients.replace(/,/g, "\r\n") + '</pre>' +
    '<h3 class="padding-top">Directions</h3>' + 
    '<pre>' + recipeDirections + '</pre>'
  );

  modal.addFooterBtn('Close', 'close', 'delete-button tingle-btn--pull-right', function() {
    modal.close();
  });
  
  modal.addFooterBtn('Edit Recipe', 'edit-recipe', 'tingle-btn--pull-right', function() {
    window.open("/edit-recipe/" + recipeId, '_blank');
  });
  
  modal.open();
}

function showFullCalendar() {
  var flextableCells = $('#calendarTable').find('.flextable-cell:not(.flextable-cell-header)');

  flextableCells.each(function() {
    $(this).show();
  });
}

function showSingleDay(dayToDisplay) {
  var calendarTable = $('#calendarTable')
  var flextableHeaderCells = calendarTable.find('.flextable-cell-header');

  flextableHeaderCells.each(function(index) {
    if (index === dayToDisplay) {
      $(this).addClass('active');
    }
    else {
      $(this).removeClass('active');
    }
  });

  var flextableCells = calendarTable.find('.flextable-cell:not(.flextable-cell-header)');

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

  $(document).on('click', 'label', function (e) {
    displayRecipeModal(e);
  });

  var deleteMealPlanButton = $('#deleteMealPlan');
  var newMealPlanNameTextBox = $('#newMealPlanName');

  $('#mealPlanId').change(function() {
    var selectedOption = $('option:selected', this);

    if (selectedOption.attr('id') === "createNew") {
      deleteMealPlanButton.hide();

      newMealPlanNameTextBox.prop('required', true);

      newMealPlanNameTextBox.show();

      for (var i = 0; i < containerIds.length; i++) {
        var mealKey = containerIds[i];

        var recipeContainer = $('#' + mealKey).find("div");

        recipeContainer.empty();
      }
    }
    else {
      deleteMealPlanButton.show();

      newMealPlanNameTextBox.prop('required', false);

      newMealPlanNameTextBox.hide();

      var error = $("#error");
  
      var data = {};
    
      data.mealPlanId = $("#mealPlanId").val();

      $.ajax({
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        url: 'meal-plan',
        success: function(data) {
          if (data.calendarDayAndRecipeMap) {
            for (var i = 0; i < containerIds.length; i++) {
              var mealKey = containerIds[i];

              var recipeContainer = $('#' + mealKey).find("div");

              recipeContainer.empty();

              if (data.calendarDayAndRecipeMap[mealKey] !== undefined) {
                var calendarDayAndRecipe = data.calendarDayAndRecipeMap[mealKey];

                for (var j = 0; j < calendarDayAndRecipe.length; j++) {
                  recipeContainer.append('<label class="draggable padding-top" title=' + calendarDayAndRecipe[j][0] + '>' + calendarDayAndRecipe[j][1] + '</label>');
                }
              }
            }
          }
          else if (data.error) {
            console.error(data.error);

            error.html(data.error);
  
            error.show();
          }
        },
        error: function(err) {
          console.error(err);
  
          error.html("An unexpected error has occurred.");
  
          error.show();
        }
      });
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
    var explicitOriginalTarget = e.originalEvent.explicitOriginalTarget;

    var buttonClicked;

    if (explicitOriginalTarget) {
      buttonClicked = explicitOriginalTarget.value;
    }
    else {
      buttonClicked = $(this).find("input[type=submit]:focus").val();
    }

  	if ((buttonClicked === "Submit Calendar") || (buttonClicked === "Save Meal Plan")) {
			e.preventDefault();

      $('#action').val(buttonClicked);

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