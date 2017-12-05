$(document).ready(function() {
  if (typeof calendarDayAndRecipeMap !== 'undefined') {
    var currentDay = new Date().getDay();

    if (calendarDayAndRecipeMap[String(currentDay) + "0"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[String(currentDay) + "0"].length; i++) {
        $('#breakfast').append(calendarDayAndRecipeMap[String(currentDay) + "0"][i] + "<br>");
      }
    }

    if (calendarDayAndRecipeMap[String(currentDay) + "1"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[String(currentDay) + "1"].length; i++) {
        $('#lunch').append(calendarDayAndRecipeMap[String(currentDay) + "1"][i] + "<br>");
      }
    }

    if (calendarDayAndRecipeMap[String(currentDay) + "2"]) {
      for (var i = 0; i < calendarDayAndRecipeMap[String(currentDay) + "2"].length; i++) {
        $('#dinner').append(calendarDayAndRecipeMap[String(currentDay) + "2"][i] + "<br>");
      }
    }
  }
});