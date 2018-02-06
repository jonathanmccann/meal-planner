var modal = new tingle.modal({
  footer: true,
  stickyFooter: true,
  closeMethods: ['overlay', 'button', 'escape'],
  closeLabel: "Close",
  onOpen: function() {
    $('.owl-carousel').owlCarousel({
      autoHeight: true,
      loop: false,
      items: 1,
      nav: true,
      onInitialized: function(event) {
        if (event.item.count <= 1) {
          this.settings.mouseDrag = false;
          this.settings.touchDrag = false;
          this.settings.pullDrag = false;
        }

        modal.checkOverflow();
      },
      onTranslated : function() {
        modal.checkOverflow();
      }
    });
  }
});

$(document).ready(function() {
  var breakfastContainer = $('#breakfastContainer');
  var lunchContainer = $('#lunchContainer');
  var dinnerContainer = $('#dinnerContainer');

  if (typeof calendarDayAndRecipeMap !== 'undefined') {
    var currentDay = String(new Date().getDay());

    if (calendarDayAndRecipeMap[currentDay + "0"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[currentDay + "0"].length; i += 3) {
        breakfastContainer.append(calendarDayAndRecipeMap[currentDay + "0"][i] + "<br>");
      }
    }
    else {
      breakfastContainer.toggleClass('home-calendar-container')
    }

    if (calendarDayAndRecipeMap[currentDay + "1"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[currentDay + "1"].length; i += 3) {
        lunchContainer.append(calendarDayAndRecipeMap[currentDay + "1"][i] + "<br>");
      }
    }
    else {
      lunchContainer.toggleClass('home-calendar-container')
    }

    if (calendarDayAndRecipeMap[currentDay + "2"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[currentDay + "2"].length; i += 3) {
        dinnerContainer.append(calendarDayAndRecipeMap[currentDay + "2"][i] + "<br>");
      }
    }
    else {
      dinnerContainer.toggleClass('home-calendar-container')
    }
  }

  $("#breakfastContainer, #lunchContainer, #dinnerContainer").click(function(e) {
    var clickedId = e.target.id;

    var timeOfDay;

    if (clickedId.includes("breakfast")) {
      timeOfDay = "0";

      if (!calendarDayAndRecipeMap[currentDay + "0"]) {
        return;
      }
    }
    else if (clickedId.includes("lunch")) {
      timeOfDay = "1";
    }
    else if (clickedId.includes("dinner")) {
      timeOfDay = "2";
    }
    else {
      return;
    }

    var modalContent = "<div class=\"owl-carousel owl-theme\">";

    for (var i = 0; i < calendarDayAndRecipeMap[currentDay + timeOfDay].length; i++) {
      modalContent += '<div class="item">' +
        '<h2>' + calendarDayAndRecipeMap[currentDay + timeOfDay][i] + '</h2>' +
        '<h3>Ingredients</h3>' + 
        '<pre>' + calendarDayAndRecipeMap[currentDay + timeOfDay][++i].replace(/,/g, "\r\n") + '</pre>' +
        '<h3 class="padding-top">Directions</h3>' + 
        '<pre>' + calendarDayAndRecipeMap[currentDay + timeOfDay][++i] + '</pre>' +
        '</div>';
    }

    modalContent += "</div>";

    modal.setContent(modalContent);

    modal.addFooterBtn('Close', 'close', 'delete-button tingle-btn--pull-right', function() {
      modal.close();
    });
    
    modal.open();
  });
});